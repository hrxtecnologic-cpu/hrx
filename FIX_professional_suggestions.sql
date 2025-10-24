-- =====================================================
-- FIX: Sistema de Sugestões Inteligentes de Profissionais
-- =====================================================
-- VERSÃO CORRIGIDA - Remove funções antigas e cria novas
-- =====================================================

-- =====================================================
-- 1. DROP FUNCTIONS (sem DEFAULT na assinatura)
-- =====================================================

-- Dropar todas as versões antigas
DROP FUNCTION IF EXISTS get_nearby_professionals(numeric, numeric, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_professionals(double precision, double precision, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_professionals(numeric, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_professionals(double precision, double precision, integer) CASCADE;

DROP FUNCTION IF EXISTS calculate_professional_score(jsonb, text[], numeric, boolean, text, jsonb, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS calculate_professional_score(text[], text[], numeric, boolean, text, jsonb, timestamp with time zone) CASCADE;

DROP FUNCTION IF EXISTS get_suggested_professionals(double precision, double precision, timestamp with time zone, text[], integer, numeric, integer) CASCADE;

-- =====================================================
-- 2. CRIAR calculate_distance (se não existir)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS NUMERIC AS $$
DECLARE
  r CONSTANT NUMERIC := 6371; -- Raio da Terra em km
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Haversine formula
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);

  c := 2 * atan2(sqrt(a), sqrt(1 - a));

  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 3. CRIAR FUNÇÃO: calculate_professional_score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_professional_score(
    professional_categories TEXT[],
    required_categories TEXT[],
    distance_km NUMERIC,
    has_experience BOOLEAN,
    years_of_experience TEXT,
    availability JSONB,
    event_date TIMESTAMP WITH TIME ZONE
) RETURNS JSONB AS $$
DECLARE
    category_match_count INTEGER := 0;
    category_score NUMERIC := 0;
    distance_score NUMERIC := 0;
    experience_score NUMERIC := 0;
    availability_score NUMERIC := 0;
    performance_score NUMERIC := 50; -- Placeholder (pode ser calculado com reviews)
    total_score NUMERIC := 0;

    -- Pesos dos critérios
    w_category NUMERIC := 0.35;
    w_distance NUMERIC := 0.25;
    w_experience NUMERIC := 0.15;
    w_availability NUMERIC := 0.15;
    w_performance NUMERIC := 0.10;
BEGIN
    -- =====================================================
    -- 1. SCORE DE CATEGORIA (0-100)
    -- =====================================================
    IF required_categories IS NOT NULL AND array_length(required_categories, 1) > 0 THEN
        -- Converter categories para array se for JSONB
        SELECT COUNT(*)
        INTO category_match_count
        FROM unnest(required_categories) req_cat
        WHERE req_cat = ANY(professional_categories);

        -- Score proporcional
        category_score := (category_match_count::NUMERIC / array_length(required_categories, 1)::NUMERIC) * 100;
    ELSE
        -- Sem filtro de categoria = score neutro
        category_score := 50;
    END IF;

    -- =====================================================
    -- 2. SCORE DE DISTÂNCIA (0-100)
    -- =====================================================
    -- Quanto mais perto, melhor
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

    -- =====================================================
    -- 3. SCORE DE EXPERIÊNCIA (0-100)
    -- =====================================================
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

    -- =====================================================
    -- 4. SCORE DE DISPONIBILIDADE (0-100)
    -- =====================================================
    -- Verificar se tem disponibilidade para o tipo de evento
    IF availability IS NOT NULL THEN
        -- Se tem disponibilidade marcada = score alto
        IF (availability->>'weekdays')::BOOLEAN OR
           (availability->>'weekends')::BOOLEAN OR
           (availability->>'holidays')::BOOLEAN THEN
            availability_score := 80;
        ELSE
            availability_score := 40;
        END IF;

        -- Bonus se aceita viagem
        IF (availability->>'travel')::BOOLEAN THEN
            availability_score := availability_score + 20;
        END IF;
    ELSE
        availability_score := 50;
    END IF;

    availability_score := LEAST(availability_score, 100);

    -- =====================================================
    -- 5. SCORE TOTAL PONDERADO
    -- =====================================================
    total_score :=
        (category_score * w_category) +
        (distance_score * w_distance) +
        (experience_score * w_experience) +
        (availability_score * w_availability) +
        (performance_score * w_performance);

    -- =====================================================
    -- 6. RETORNAR BREAKDOWN
    -- =====================================================
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
-- 4. CRIAR FUNÇÃO: get_suggested_professionals
-- =====================================================

CREATE OR REPLACE FUNCTION get_suggested_professionals(
    p_event_lat DOUBLE PRECISION,
    p_event_lon DOUBLE PRECISION,
    p_event_date TIMESTAMP WITH TIME ZONE,
    p_required_categories TEXT[] DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 999999,
    p_min_score NUMERIC DEFAULT 0,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    categories TEXT[],
    city TEXT,
    state TEXT,
    distance_km NUMERIC,
    total_score NUMERIC,
    category_score NUMERIC,
    distance_score NUMERIC,
    experience_score NUMERIC,
    availability_score NUMERIC,
    performance_score NUMERIC,
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
            -- Converter categories de JSONB para TEXT[] se necessário
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
                -- Categories
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
        (sp.scores->>'total_score')::NUMERIC as total_score,
        (sp.scores->>'category_score')::NUMERIC as category_score,
        (sp.scores->>'distance_score')::NUMERIC as distance_score,
        (sp.scores->>'experience_score')::NUMERIC as experience_score,
        (sp.scores->>'availability_score')::NUMERIC as availability_score,
        (sp.scores->>'performance_score')::NUMERIC as performance_score,
        sp.scores->'breakdown' as score_breakdown,
        sp.has_experience,
        sp.years_of_experience
    FROM scored_professionals sp
    WHERE (sp.scores->>'total_score')::NUMERIC >= p_min_score
    ORDER BY (sp.scores->>'total_score')::NUMERIC DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION calculate_distance IS 'Calcula distância em km entre duas coordenadas usando Haversine';
COMMENT ON FUNCTION calculate_professional_score IS 'Calcula score de compatibilidade de profissional com evento';
COMMENT ON FUNCTION get_suggested_professionals IS 'Busca e ordena profissionais por score de compatibilidade - função principal de sugestão inteligente';

-- =====================================================
-- 6. MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Funções de sugestão de profissionais criadas com sucesso!';
    RAISE NOTICE '📝 Funções disponíveis:';
    RAISE NOTICE '   - calculate_distance()';
    RAISE NOTICE '   - calculate_professional_score()';
    RAISE NOTICE '   - get_suggested_professionals()';
END $$;
