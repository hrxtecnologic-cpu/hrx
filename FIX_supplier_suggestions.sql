-- =====================================================
-- FIX: Sistema de Sugestões Inteligentes de Fornecedores
-- =====================================================
-- VERSÃO CORRIGIDA - Remove funções antigas e cria novas
-- =====================================================

-- =====================================================
-- 1. DROP FUNCTIONS (sem DEFAULT na assinatura)
-- =====================================================

-- Dropar todas as versões antigas
DROP FUNCTION IF EXISTS get_nearby_suppliers(numeric, numeric, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(double precision, double precision, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(numeric, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS get_nearby_suppliers(double precision, double precision) CASCADE;

DROP FUNCTION IF EXISTS calculate_supplier_score(text[], text[], numeric, integer, integer, numeric) CASCADE;

DROP FUNCTION IF EXISTS get_suggested_suppliers(double precision, double precision, text[], integer, numeric, integer) CASCADE;

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
-- 3. CRIAR FUNÇÃO: calculate_supplier_score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_supplier_score(
    supplier_equipment_types TEXT[],
    required_equipment_types TEXT[],
    distance_km NUMERIC,
    delivery_radius_km INTEGER,
    max_distance_km INTEGER,
    shipping_fee_per_km NUMERIC
) RETURNS JSONB AS $$
DECLARE
    equipment_match_count INTEGER := 0;
    equipment_score NUMERIC := 0;
    distance_score NUMERIC := 0;
    performance_score NUMERIC := 50; -- Placeholder (pode ser calculado com reviews)
    total_score NUMERIC := 0;

    -- Pesos dos critérios
    w_equipment NUMERIC := 0.5;
    w_distance NUMERIC := 0.3;
    w_performance NUMERIC := 0.2;
BEGIN
    -- =====================================================
    -- 1. SCORE DE EQUIPAMENTOS (0-100)
    -- =====================================================
    IF required_equipment_types IS NOT NULL AND array_length(required_equipment_types, 1) > 0 THEN
        -- Contar quantos tipos requeridos o fornecedor possui
        SELECT COUNT(*)
        INTO equipment_match_count
        FROM unnest(required_equipment_types) req_type
        WHERE req_type = ANY(supplier_equipment_types);

        -- Score proporcional
        equipment_score := (equipment_match_count::NUMERIC / array_length(required_equipment_types, 1)::NUMERIC) * 100;
    ELSE
        -- Sem filtro de equipamentos = score neutro
        equipment_score := 50;
    END IF;

    -- =====================================================
    -- 2. SCORE DE DISTÂNCIA (0-100)
    -- =====================================================
    IF distance_km <= delivery_radius_km THEN
        -- Dentro do raio de entrega gratuita = score máximo
        distance_score := 100;
    ELSIF distance_km <= max_distance_km THEN
        -- Fora do raio mas dentro do limite = score decrescente
        distance_score := 100 * (1 - ((distance_km - delivery_radius_km) / (max_distance_km - delivery_radius_km)));
    ELSE
        -- Fora do limite = score mínimo
        distance_score := 0;
    END IF;

    -- =====================================================
    -- 3. SCORE TOTAL PONDERADO
    -- =====================================================
    total_score :=
        (equipment_score * w_equipment) +
        (distance_score * w_distance) +
        (performance_score * w_performance);

    -- =====================================================
    -- 4. RETORNAR BREAKDOWN
    -- =====================================================
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
-- 4. CRIAR FUNÇÃO: get_suggested_suppliers
-- =====================================================

CREATE OR REPLACE FUNCTION get_suggested_suppliers(
    p_event_lat DOUBLE PRECISION,
    p_event_lon DOUBLE PRECISION,
    p_required_equipment_types TEXT[] DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 999999,
    p_min_score NUMERIC DEFAULT 0,
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
    distance_km NUMERIC,
    total_score NUMERIC,
    equipment_score NUMERIC,
    distance_score NUMERIC,
    performance_score NUMERIC,
    score_breakdown JSONB,
    delivery_radius_km INTEGER,
    shipping_fee_per_km NUMERIC
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
        (ss.scores->>'total_score')::NUMERIC as total_score,
        (ss.scores->>'equipment_score')::NUMERIC as equipment_score,
        (ss.scores->>'distance_score')::NUMERIC as distance_score,
        (ss.scores->>'performance_score')::NUMERIC as performance_score,
        ss.scores->'breakdown' as score_breakdown,
        ss.delivery_radius_km,
        ss.shipping_fee_per_km
    FROM scored_suppliers ss
    WHERE (ss.scores->>'total_score')::NUMERIC >= p_min_score
    ORDER BY (ss.scores->>'total_score')::NUMERIC DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION calculate_supplier_score IS 'Calcula score de compatibilidade de fornecedor com evento';
COMMENT ON FUNCTION get_suggested_suppliers IS 'Busca e ordena fornecedores por score de compatibilidade - função principal de sugestão inteligente';

-- =====================================================
-- 6. MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Funções de sugestão de fornecedores criadas com sucesso!';
    RAISE NOTICE '📝 Funções disponíveis:';
    RAISE NOTICE '   - calculate_distance()';
    RAISE NOTICE '   - calculate_supplier_score()';
    RAISE NOTICE '   - get_suggested_suppliers()';
END $$;
