-- =====================================================
-- Migration: Sistema de Sugestões Inteligentes de Fornecedores
-- =====================================================
-- Similar ao sistema de profissionais, mas para fornecedores
-- Score baseado em: distância, match de equipamentos, performance
-- =====================================================

-- =====================================================
-- FUNÇÃO: get_nearby_suppliers
-- =====================================================
CREATE OR REPLACE FUNCTION get_nearby_suppliers(
    event_lat DOUBLE PRECISION,
    event_lon DOUBLE PRECISION,
    max_distance_km INTEGER DEFAULT 100,
    required_equipment_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    equipment_types TEXT[],
    city TEXT,
    state TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km NUMERIC,
    status TEXT,
    delivery_radius_km INTEGER,
    shipping_fee_per_km NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.company_name,
        s.contact_name,
        s.email,
        s.phone,
        s.equipment_types,
        s.city,
        s.state,
        s.latitude,
        s.longitude,
        calculate_distance(event_lat, event_lon, s.latitude, s.longitude) as distance_km,
        s.status,
        s.delivery_radius_km,
        s.shipping_fee_per_km
    FROM equipment_suppliers s
    WHERE s.status = 'active'
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
        AND calculate_distance(event_lat, event_lon, s.latitude, s.longitude) <= max_distance_km
        -- Filtrar por tipos de equipamento se fornecido
        AND (
            required_equipment_types IS NULL
            OR s.equipment_types && required_equipment_types  -- Operador && verifica se há interseção entre arrays
        )
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_supplier_score
-- =====================================================
-- Calcula score de compatibilidade de um fornecedor
-- Score de 0-100 baseado em múltiplos critérios

CREATE OR REPLACE FUNCTION calculate_supplier_score(
    p_supplier_id UUID,
    p_event_lat DOUBLE PRECISION,
    p_event_lon DOUBLE PRECISION,
    p_required_equipment_types TEXT[]
)
RETURNS TABLE (
    supplier_id UUID,
    total_score NUMERIC,
    distance_score NUMERIC,
    equipment_score NUMERIC,
    performance_score NUMERIC,
    breakdown JSONB
) AS $$
DECLARE
    v_distance_km NUMERIC;
    v_equipment_match INTEGER := 0;
    v_equipment_required INTEGER := 0;
    v_performance_rating NUMERIC := 0;
    v_distance_score NUMERIC := 0;
    v_equipment_score NUMERIC := 0;
    v_performance_score NUMERIC := 0;
    v_total_score NUMERIC := 0;
BEGIN
    -- Buscar dados do fornecedor
    SELECT
        CASE
            WHEN s.latitude IS NOT NULL AND s.longitude IS NOT NULL THEN
                calculate_distance(p_event_lat, p_event_lon, s.latitude, s.longitude)
            ELSE 999999 -- Penalizar se não tem geolocalização
        END
    INTO v_distance_km
    FROM equipment_suppliers s
    WHERE s.id = p_supplier_id;

    -- 1. SCORE DE DISTÂNCIA (0-40 pontos)
    -- Maior peso que profissionais pois equipamento tem custo de frete
    v_distance_score := CASE
        WHEN v_distance_km <= 10 THEN 40
        WHEN v_distance_km <= 25 THEN 32
        WHEN v_distance_km <= 50 THEN 24
        WHEN v_distance_km <= 100 THEN 16
        WHEN v_distance_km <= 200 THEN 8
        ELSE 0
    END;

    -- 2. SCORE DE EQUIPAMENTOS (0-50 pontos)
    -- Peso alto - mais importante que o fornecedor tenha os equipamentos
    IF p_required_equipment_types IS NOT NULL THEN
        v_equipment_required := array_length(p_required_equipment_types, 1);

        -- Contar quantos equipamentos requeridos o fornecedor tem
        SELECT COUNT(*)
        INTO v_equipment_match
        FROM equipment_suppliers s, unnest(p_required_equipment_types) AS eq
        WHERE s.id = p_supplier_id
            AND eq = ANY(s.equipment_types);

        IF v_equipment_required > 0 THEN
            v_equipment_score := (v_equipment_match::NUMERIC / v_equipment_required::NUMERIC) * 50;
        END IF;
    ELSE
        -- Se não tem tipos requeridos, dar score médio
        v_equipment_score := 25;
    END IF;

    -- 3. SCORE DE PERFORMANCE (0-10 pontos)
    -- Baseado em avaliações passadas (futuro)
    v_performance_score := 5; -- Score padrão por enquanto

    -- CALCULAR SCORE TOTAL (0-100)
    v_total_score := v_distance_score + v_equipment_score + v_performance_score;

    -- Retornar resultado
    RETURN QUERY SELECT
        p_supplier_id,
        v_total_score,
        v_distance_score,
        v_equipment_score,
        v_performance_score,
        jsonb_build_object(
            'distance_km', v_distance_km,
            'equipment_match', v_equipment_match,
            'equipment_required', v_equipment_required,
            'weights', jsonb_build_object(
                'distance', '40%',
                'equipment', '50%',
                'performance', '10%'
            )
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: get_suggested_suppliers
-- =====================================================
-- Busca e ordena fornecedores por score de compatibilidade

CREATE OR REPLACE FUNCTION get_suggested_suppliers(
    p_event_lat DOUBLE PRECISION,
    p_event_lon DOUBLE PRECISION,
    p_required_equipment_types TEXT[] DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 100,
    p_min_score NUMERIC DEFAULT 0,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
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
    distance_score NUMERIC,
    equipment_score NUMERIC,
    performance_score NUMERIC,
    score_breakdown JSONB,
    delivery_radius_km INTEGER,
    shipping_fee_per_km NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH nearby_suppliers AS (
        SELECT * FROM get_nearby_suppliers(
            p_event_lat,
            p_event_lon,
            p_max_distance_km,
            p_required_equipment_types
        )
    ),
    scored_suppliers AS (
        SELECT
            ns.*,
            s.total_score,
            s.distance_score,
            s.equipment_score,
            s.performance_score,
            s.breakdown as score_breakdown
        FROM nearby_suppliers ns
        CROSS JOIN LATERAL calculate_supplier_score(
            ns.id,
            p_event_lat,
            p_event_lon,
            p_required_equipment_types
        ) s
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
        ss.distance_km,
        ss.total_score,
        ss.distance_score,
        ss.equipment_score,
        ss.performance_score,
        ss.score_breakdown,
        ss.delivery_radius_km,
        ss.shipping_fee_per_km
    FROM scored_suppliers ss
    WHERE ss.total_score >= p_min_score
    ORDER BY ss.total_score DESC, ss.distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION get_nearby_suppliers IS 'Busca fornecedores próximos ao local do evento com filtro de equipamentos';
COMMENT ON FUNCTION calculate_supplier_score IS 'Calcula score de compatibilidade (0-100) baseado em distância (40%), equipamentos (50%) e performance (10%)';
COMMENT ON FUNCTION get_suggested_suppliers IS 'Busca e ordena fornecedores por score de compatibilidade - função principal de sugestão inteligente';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
