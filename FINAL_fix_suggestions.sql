-- =====================================================
-- FIX FINAL: Sugestões de Profissionais e Fornecedores
-- =====================================================
-- Remove funções antigas e cria novas
-- NÃO tenta criar calculate_distance (já existe)
-- =====================================================

-- =====================================================
-- PARTE 1: DROP FUNCTIONS ANTIGAS
-- =====================================================

-- Profissionais
DROP FUNCTION IF EXISTS get_nearby_professionals(numeric, numeric, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_professionals(double precision, double precision, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_professionals(decimal, decimal, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS calculate_professional_score(jsonb, text[], numeric, boolean, text, jsonb, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS calculate_professional_score(text[], text[], numeric, boolean, text, jsonb, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS get_suggested_professionals(double precision, double precision, timestamp with time zone, text[], integer, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS get_suggested_professionals(decimal, decimal, timestamp with time zone, text[], integer, numeric, integer) CASCADE;

-- Fornecedores
DROP FUNCTION IF EXISTS get_nearby_suppliers(numeric, numeric, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(double precision, double precision, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(decimal, decimal, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS calculate_supplier_score(text[], text[], numeric, integer, integer, numeric) CASCADE;
DROP FUNCTION IF EXISTS calculate_supplier_score(text[], text[], decimal, integer, integer, decimal) CASCADE;
DROP FUNCTION IF EXISTS get_suggested_suppliers(double precision, double precision, text[], integer, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS get_suggested_suppliers(decimal, decimal, text[], integer, numeric, integer) CASCADE;

-- =====================================================
-- PARTE 2: PROFISSIONAIS - calculate_professional_score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_professional_score(
    professional_categories TEXT[],
    required_categories TEXT[],
    distance_km DECIMAL,
    has_experience BOOLEAN,
    years_of_experience TEXT,
    availability JSONB,
    event_date TIMESTAMP WITH TIME ZONE
) RETURNS JSONB AS $$
DECLARE
    category_match_count INTEGER := 0;
    category_score DECIMAL := 0;
    distance_score DECIMAL := 0;
    experience_score DECIMAL := 0;
    availability_score DECIMAL := 0;
    performance_score DECIMAL := 50;
    total_score DECIMAL := 0;
    w_category DECIMAL := 0.35;
    w_distance DECIMAL := 0.25;
    w_experience DECIMAL := 0.15;
    w_availability DECIMAL := 0.15;
    w_performance DECIMAL := 0.10;
BEGIN
    -- Score de categoria
    IF required_categories IS NOT NULL AND array_length(required_categories, 1) > 0 THEN
        SELECT COUNT(*)
        INTO category_match_count
        FROM unnest(required_categories) req_cat
        WHERE req_cat = ANY(professional_categories);
        category_score := (category_match_count::DECIMAL / array_length(required_categories, 1)::DECIMAL) * 100;
    ELSE
        category_score := 50;
    END IF;

    -- Score de distância
    IF distance_km <= 10 THEN
        distance_score := 100;
    ELSIF distance_km <= 50 THEN
        distance_score := 100 - ((distance_km - 10) * 1.5);
    ELSIF distance_km <= 100 THEN
        distance_score := 40 - ((distance_km - 50) * 0.6);
    ELSE
        distance_score := 10;
    END IF;
    distance_score := GREATEST(distance_score, 0);

    -- Score de experiência
    IF has_experience THEN
        CASE years_of_experience
            WHEN 'menos_1_ano' THEN experience_score := 40;
            WHEN '1_2_anos' THEN experience_score := 60;
            WHEN '3_5_anos' THEN experience_score := 80;
            WHEN 'mais_5_anos' THEN experience_score := 100;
            ELSE experience_score := 50;
        END CASE;
    ELSE
        experience_score := 20;
    END IF;

    -- Score de disponibilidade
    IF availability IS NOT NULL THEN
        IF (availability->>'weekdays')::BOOLEAN OR
           (availability->>'weekends')::BOOLEAN OR
           (availability->>'holidays')::BOOLEAN THEN
            availability_score := 80;
        ELSE
            availability_score := 40;
        END IF;
        IF (availability->>'travel')::BOOLEAN THEN
            availability_score := availability_score + 20;
        END IF;
    ELSE
        availability_score := 50;
    END IF;
    availability_score := LEAST(availability_score, 100);

    -- Score total
    total_score :=
        (category_score * w_category) +
        (distance_score * w_distance) +
        (experience_score * w_experience) +
        (availability_score * w_availability) +
        (performance_score * w_performance);

    RETURN jsonb_build_object(
        'total_score', ROUND(total_score, 2),
        'category_score', ROUND(category_score, 2),
        'distance_score', ROUND(distance_score, 2),
        'experience_score', ROUND(experience_score, 2),
        'availability_score', ROUND(availability_score, 2),
        'performance_score', ROUND(performance_score, 2),
        'breakdown', jsonb_build_object(
            'distance_km', distance_km,
            'categories_match', category_match_count,
            'categories_required', COALESCE(array_length(required_categories, 1), 0),
            'has_availability', (availability IS NOT NULL),
            'weights', jsonb_build_object(
                'category', (w_category * 100) || '%',
                'distance', (w_distance * 100) || '%',
                'experience', (w_experience * 100) || '%',
                'availability', (w_availability * 100) || '%',
                'performance', (w_performance * 100) || '%'
            )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PARTE 3: PROFISSIONAIS - get_suggested_professionals
-- =====================================================

CREATE OR REPLACE FUNCTION get_suggested_professionals(
    p_event_lat DECIMAL,
    p_event_lon DECIMAL,
    p_event_date TIMESTAMP WITH TIME ZONE,
    p_required_categories TEXT[] DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 999999,
    p_min_score DECIMAL DEFAULT 0,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    categories TEXT[],
    city TEXT,
    state TEXT,
    distance_km DECIMAL,
    total_score DECIMAL,
    category_score DECIMAL,
    distance_score DECIMAL,
    experience_score DECIMAL,
    availability_score DECIMAL,
    performance_score DECIMAL,
    score_breakdown JSONB,
    has_experience BOOLEAN,
    years_of_experience TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH scored_professionals AS (
        SELECT
            p.id,
            p.full_name,
            p.email,
            p.phone,
            CASE
                WHEN jsonb_typeof(p.categories) = 'array' THEN
                    ARRAY(SELECT jsonb_array_elements_text(p.categories))
                ELSE
                    '{}'::TEXT[]
            END as cats,
            p.city,
            p.state,
            p.has_experience,
            p.years_of_experience,
            calculate_distance(p_event_lat, p_event_lon, p.latitude, p.longitude) as dist_km,
            calculate_professional_score(
                CASE
                    WHEN jsonb_typeof(p.categories) = 'array' THEN
                        ARRAY(SELECT jsonb_array_elements_text(p.categories))
                    ELSE
                        '{}'::TEXT[]
                END,
                p_required_categories,
                calculate_distance(p_event_lat, p_event_lon, p.latitude, p.longitude),
                p.has_experience,
                p.years_of_experience,
                p.availability,
                p_event_date
            ) as scores
        FROM professionals p
        WHERE p.status = 'approved'
          AND p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
          AND calculate_distance(p_event_lat, p_event_lon, p.latitude, p.longitude) <= p_max_distance_km
    )
    SELECT
        sp.id,
        sp.full_name,
        sp.email,
        sp.phone,
        sp.cats as categories,
        sp.city,
        sp.state,
        sp.dist_km as distance_km,
        (sp.scores->>'total_score')::DECIMAL as total_score,
        (sp.scores->>'category_score')::DECIMAL as category_score,
        (sp.scores->>'distance_score')::DECIMAL as distance_score,
        (sp.scores->>'experience_score')::DECIMAL as experience_score,
        (sp.scores->>'availability_score')::DECIMAL as availability_score,
        (sp.scores->>'performance_score')::DECIMAL as performance_score,
        sp.scores->'breakdown' as score_breakdown,
        sp.has_experience,
        sp.years_of_experience
    FROM scored_professionals sp
    WHERE (sp.scores->>'total_score')::DECIMAL >= p_min_score
    ORDER BY (sp.scores->>'total_score')::DECIMAL DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 4: FORNECEDORES - calculate_supplier_score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_supplier_score(
    supplier_equipment_types TEXT[],
    required_equipment_types TEXT[],
    distance_km DECIMAL,
    delivery_radius_km INTEGER,
    max_distance_km INTEGER,
    shipping_fee_per_km DECIMAL
) RETURNS JSONB AS $$
DECLARE
    equipment_match_count INTEGER := 0;
    equipment_score DECIMAL := 0;
    distance_score DECIMAL := 0;
    performance_score DECIMAL := 50;
    total_score DECIMAL := 0;
    w_equipment DECIMAL := 0.5;
    w_distance DECIMAL := 0.3;
    w_performance DECIMAL := 0.2;
BEGIN
    -- Score de equipamentos
    IF required_equipment_types IS NOT NULL AND array_length(required_equipment_types, 1) > 0 THEN
        SELECT COUNT(*)
        INTO equipment_match_count
        FROM unnest(required_equipment_types) req_type
        WHERE req_type = ANY(supplier_equipment_types);
        equipment_score := (equipment_match_count::DECIMAL / array_length(required_equipment_types, 1)::DECIMAL) * 100;
    ELSE
        equipment_score := 50;
    END IF;

    -- Score de distância
    IF distance_km <= delivery_radius_km THEN
        distance_score := 100;
    ELSIF distance_km <= max_distance_km THEN
        distance_score := 100 * (1 - ((distance_km - delivery_radius_km) / (max_distance_km - delivery_radius_km)));
    ELSE
        distance_score := 0;
    END IF;

    -- Score total
    total_score :=
        (equipment_score * w_equipment) +
        (distance_score * w_distance) +
        (performance_score * w_performance);

    RETURN jsonb_build_object(
        'total_score', ROUND(total_score, 2),
        'equipment_score', ROUND(equipment_score, 2),
        'distance_score', ROUND(distance_score, 2),
        'performance_score', ROUND(performance_score, 2),
        'breakdown', jsonb_build_object(
            'distance_km', distance_km,
            'equipment_match', equipment_match_count,
            'equipment_required', COALESCE(array_length(required_equipment_types, 1), 0),
            'weights', jsonb_build_object(
                'equipment', (w_equipment * 100) || '%',
                'distance', (w_distance * 100) || '%',
                'performance', (w_performance * 100) || '%'
            )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PARTE 5: FORNECEDORES - get_suggested_suppliers
-- =====================================================

CREATE OR REPLACE FUNCTION get_suggested_suppliers(
    p_event_lat DECIMAL,
    p_event_lon DECIMAL,
    p_required_equipment_types TEXT[] DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 999999,
    p_min_score DECIMAL DEFAULT 0,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    equipment_types TEXT[],
    city TEXT,
    state TEXT,
    distance_km DECIMAL,
    total_score DECIMAL,
    equipment_score DECIMAL,
    distance_score DECIMAL,
    performance_score DECIMAL,
    score_breakdown JSONB,
    delivery_radius_km INTEGER,
    shipping_fee_per_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH scored_suppliers AS (
        SELECT
            s.id,
            s.company_name,
            s.contact_name,
            s.email,
            s.phone,
            s.equipment_types,
            s.city,
            s.state,
            s.delivery_radius_km,
            s.shipping_fee_per_km,
            calculate_distance(p_event_lat, p_event_lon, s.latitude, s.longitude) as dist_km,
            calculate_supplier_score(
                s.equipment_types,
                p_required_equipment_types,
                calculate_distance(p_event_lat, p_event_lon, s.latitude, s.longitude),
                COALESCE(s.delivery_radius_km, 50),
                p_max_distance_km,
                COALESCE(s.shipping_fee_per_km, 0)
            ) as scores
        FROM equipment_suppliers s
        WHERE s.status = 'active'
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
          AND calculate_distance(p_event_lat, p_event_lon, s.latitude, s.longitude) <= p_max_distance_km
    )
    SELECT
        ss.id,
        ss.company_name,
        ss.contact_name,
        ss.email,
        ss.phone,
        ss.equipment_types,
        ss.city,
        ss.state,
        ss.dist_km as distance_km,
        (ss.scores->>'total_score')::DECIMAL as total_score,
        (ss.scores->>'equipment_score')::DECIMAL as equipment_score,
        (ss.scores->>'distance_score')::DECIMAL as distance_score,
        (ss.scores->>'performance_score')::DECIMAL as performance_score,
        ss.scores->'breakdown' as score_breakdown,
        ss.delivery_radius_km,
        ss.shipping_fee_per_km
    FROM scored_suppliers ss
    WHERE (ss.scores->>'total_score')::DECIMAL >= p_min_score
    ORDER BY (ss.scores->>'total_score')::DECIMAL DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION calculate_professional_score IS 'Calcula score de compatibilidade de profissional com evento';
COMMENT ON FUNCTION get_suggested_professionals IS 'Busca e ordena profissionais por score de compatibilidade';
COMMENT ON FUNCTION calculate_supplier_score IS 'Calcula score de compatibilidade de fornecedor com evento';
COMMENT ON FUNCTION get_suggested_suppliers IS 'Busca e ordena fornecedores por score de compatibilidade';

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ✅ ✅ SISTEMA DE SUGESTÕES CRIADO COM SUCESSO! ✅ ✅ ✅';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Funções criadas:';
    RAISE NOTICE '   🔹 calculate_professional_score()';
    RAISE NOTICE '   🔹 get_suggested_professionals()';
    RAISE NOTICE '   🔹 calculate_supplier_score()';
    RAISE NOTICE '   🔹 get_suggested_suppliers()';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Próximos passos:';
    RAISE NOTICE '   1. Recarregue o app no navegador';
    RAISE NOTICE '   2. Acesse um evento em /admin/projetos/[id]';
    RAISE NOTICE '   3. As sugestões devem funcionar!';
    RAISE NOTICE '';
    RAISE NOTICE '📍 Se não aparecerem sugestões:';
    RAISE NOTICE '   → Vá em /admin/mapa';
    RAISE NOTICE '   → Clique em "Geocodificar Pendentes"';
    RAISE NOTICE '';
END $$;
