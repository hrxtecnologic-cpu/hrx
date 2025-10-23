-- =====================================================
-- Migration: Sistema Inteligente de Sugestões de Profissionais
-- Criado em: 2025-10-23
-- Descrição: Algoritmo de matching com scoring para sugerir melhores profissionais
-- =====================================================

-- =====================================================
-- FUNÇÃO: get_nearby_professionals
-- =====================================================
-- Busca profissionais próximos com cálculo de distância

CREATE OR REPLACE FUNCTION get_nearby_professionals(
    event_lat DOUBLE PRECISION,
    event_lon DOUBLE PRECISION,
    max_distance_km INTEGER DEFAULT 100,
    required_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    categories JSONB,
    city TEXT,
    state TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km NUMERIC,
    status TEXT,
    has_experience BOOLEAN,
    years_of_experience TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.email,
        p.phone,
        p.categories,
        p.city,
        p.state,
        p.latitude,
        p.longitude,
        calculate_distance(event_lat, event_lon, p.latitude, p.longitude) as distance_km,
        p.status,
        p.has_experience,
        p.years_of_experience
    FROM professionals p
    WHERE p.status = 'approved'
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND calculate_distance(event_lat, event_lon, p.latitude, p.longitude) <= max_distance_km
        -- Filtrar por categorias se fornecido
        AND (
            required_categories IS NULL
            OR p.categories ?| required_categories  -- Operador ?| verifica se algum elemento do array existe no JSONB
        )
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_professional_score
-- =====================================================
-- Calcula score de compatibilidade de um profissional para um evento
-- Score de 0-100 baseado em múltiplos critérios

CREATE OR REPLACE FUNCTION calculate_professional_score(
    p_professional_id UUID,
    p_event_lat DOUBLE PRECISION,
    p_event_lon DOUBLE PRECISION,
    p_event_date DATE,
    p_required_categories TEXT[]
)
RETURNS TABLE (
    professional_id UUID,
    total_score NUMERIC,
    distance_score NUMERIC,
    category_score NUMERIC,
    experience_score NUMERIC,
    availability_score NUMERIC,
    performance_score NUMERIC,
    breakdown JSONB
) AS $$
DECLARE
    v_distance_km NUMERIC;
    v_categories_match INTEGER := 0;
    v_categories_required INTEGER := 0;
    v_experience_years NUMERIC := 0;
    v_has_availability BOOLEAN := false;
    v_performance_rating NUMERIC := 0;
    v_distance_score NUMERIC := 0;
    v_category_score NUMERIC := 0;
    v_experience_score NUMERIC := 0;
    v_availability_score NUMERIC := 0;
    v_performance_score NUMERIC := 0;
    v_total_score NUMERIC := 0;
BEGIN
    -- Buscar dados do profissional
    SELECT
        CASE
            WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
                calculate_distance(p_event_lat, p_event_lon, p.latitude, p.longitude)
            ELSE 999999 -- Penalizar se não tem geolocalização
        END,
        p.has_experience
    INTO v_distance_km, v_has_availability
    FROM professionals p
    WHERE p.id = p_professional_id;

    -- 1. SCORE DE DISTÂNCIA (0-25 pontos)
    -- Quanto mais próximo, maior o score
    v_distance_score := CASE
        WHEN v_distance_km <= 10 THEN 25
        WHEN v_distance_km <= 25 THEN 20
        WHEN v_distance_km <= 50 THEN 15
        WHEN v_distance_km <= 100 THEN 10
        WHEN v_distance_km <= 200 THEN 5
        ELSE 0
    END;

    -- 2. SCORE DE CATEGORIA (0-30 pontos)
    -- Match de categorias requeridas
    IF p_required_categories IS NOT NULL THEN
        v_categories_required := array_length(p_required_categories, 1);

        SELECT COUNT(*)
        INTO v_categories_match
        FROM professionals p, unnest(p_required_categories) AS cat
        WHERE p.id = p_professional_id
            AND p.categories @> to_jsonb(ARRAY[cat]);

        IF v_categories_required > 0 THEN
            v_category_score := (v_categories_match::NUMERIC / v_categories_required::NUMERIC) * 30;
        END IF;
    ELSE
        -- Se não tem categorias requeridas, dar score médio
        v_category_score := 15;
    END IF;

    -- 3. SCORE DE EXPERIÊNCIA (0-20 pontos)
    SELECT
        CASE p.years_of_experience
            WHEN '10+' THEN 20
            WHEN '5-10' THEN 16
            WHEN '3-5' THEN 12
            WHEN '1-3' THEN 8
            WHEN '<1' THEN 4
            ELSE 0
        END
    INTO v_experience_score
    FROM professionals p
    WHERE p.id = p_professional_id;

    -- 4. SCORE DE DISPONIBILIDADE (0-15 pontos)
    -- Verifica se o profissional tem disponibilidade na data
    -- Por enquanto, dar score se não está em outro evento na mesma data
    SELECT COUNT(*) = 0
    INTO v_has_availability
    FROM project_team pt
    JOIN event_projects ep ON pt.project_id = ep.id
    WHERE pt.professional_id = p_professional_id
        AND pt.status IN ('confirmed', 'invited')
        AND ep.event_date = p_event_date;

    v_availability_score := CASE WHEN v_has_availability THEN 15 ELSE 0 END;

    -- 5. SCORE DE PERFORMANCE (0-10 pontos)
    -- Baseado em avaliações passadas (se existir a tabela de reviews)
    BEGIN
        SELECT COALESCE(AVG(rating), 0) * 2 -- Converte 0-5 para 0-10
        INTO v_performance_score
        FROM professional_reviews
        WHERE professional_id = p_professional_id
            AND is_visible = true;
    EXCEPTION
        WHEN OTHERS THEN
            -- Tabela não existe ainda, usar score padrão
            v_performance_score := 5;
    END;

    -- CALCULAR SCORE TOTAL (0-100)
    v_total_score := v_distance_score + v_category_score + v_experience_score + v_availability_score + v_performance_score;

    -- Retornar resultado
    RETURN QUERY SELECT
        p_professional_id,
        v_total_score,
        v_distance_score,
        v_category_score,
        v_experience_score,
        v_availability_score,
        v_performance_score,
        jsonb_build_object(
            'distance_km', v_distance_km,
            'categories_match', v_categories_match,
            'categories_required', v_categories_required,
            'has_availability', v_has_availability,
            'weights', jsonb_build_object(
                'distance', '25%',
                'category', '30%',
                'experience', '20%',
                'availability', '15%',
                'performance', '10%'
            )
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: get_suggested_professionals
-- =====================================================
-- Busca e ordena profissionais por score de compatibilidade

CREATE OR REPLACE FUNCTION get_suggested_professionals(
    p_event_lat DOUBLE PRECISION,
    p_event_lon DOUBLE PRECISION,
    p_event_date DATE,
    p_required_categories TEXT[] DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 100,
    p_min_score NUMERIC DEFAULT 40,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    categories JSONB,
    city TEXT,
    state TEXT,
    distance_km NUMERIC,
    total_score NUMERIC,
    distance_score NUMERIC,
    category_score NUMERIC,
    experience_score NUMERIC,
    availability_score NUMERIC,
    performance_score NUMERIC,
    score_breakdown JSONB,
    has_experience BOOLEAN,
    years_of_experience TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH nearby_profs AS (
        SELECT * FROM get_nearby_professionals(
            p_event_lat,
            p_event_lon,
            p_max_distance_km,
            p_required_categories
        )
    ),
    scored_profs AS (
        SELECT
            np.*,
            s.total_score,
            s.distance_score,
            s.category_score,
            s.experience_score,
            s.availability_score,
            s.performance_score,
            s.breakdown as score_breakdown
        FROM nearby_profs np
        CROSS JOIN LATERAL calculate_professional_score(
            np.id,
            p_event_lat,
            p_event_lon,
            p_event_date,
            p_required_categories
        ) s
    )
    SELECT
        sp.id,
        sp.full_name,
        sp.email,
        sp.phone,
        sp.categories,
        sp.city,
        sp.state,
        sp.distance_km,
        sp.total_score,
        sp.distance_score,
        sp.category_score,
        sp.experience_score,
        sp.availability_score,
        sp.performance_score,
        sp.score_breakdown,
        sp.has_experience,
        sp.years_of_experience
    FROM scored_profs sp
    WHERE sp.total_score >= p_min_score
    ORDER BY sp.total_score DESC, sp.distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION get_nearby_professionals IS 'Busca profissionais próximos ao local do evento com filtro de categorias';
COMMENT ON FUNCTION calculate_professional_score IS 'Calcula score de compatibilidade (0-100) baseado em distância, categoria, experiência, disponibilidade e performance';
COMMENT ON FUNCTION get_suggested_professionals IS 'Busca e ordena profissionais por score de compatibilidade - função principal de sugestão inteligente';

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

/*
-- Exemplo 1: Buscar profissionais próximos
SELECT * FROM get_nearby_professionals(
    -23.5505,  -- Latitude do evento (São Paulo)
    -46.6333,  -- Longitude do evento
    50,        -- Raio de 50km
    ARRAY['Fotografia', 'Videomaker']  -- Categorias requeridas
);

-- Exemplo 2: Calcular score de um profissional específico
SELECT * FROM calculate_professional_score(
    'uuid-do-profissional'::UUID,
    -23.5505,                          -- Lat evento
    -46.6333,                          -- Lon evento
    '2025-12-25'::DATE,                -- Data evento
    ARRAY['Fotografia']                -- Categorias
);

-- Exemplo 3: Buscar TOP 10 profissionais sugeridos
SELECT
    full_name,
    city,
    ROUND(distance_km::NUMERIC, 1) as distance,
    ROUND(total_score::NUMERIC, 1) as score,
    categories
FROM get_suggested_professionals(
    -23.5505,                          -- Lat evento
    -46.6333,                          -- Lon evento
    '2025-12-25'::DATE,                -- Data evento
    ARRAY['Fotografia', 'Videomaker'], -- Categorias
    100,                               -- Max 100km
    50,                                -- Score mínimo 50
    10                                 -- Top 10
);
*/

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
