-- =====================================================
-- FIX FINAL: Corrigir TODOS os tipos de retorno
-- =====================================================

DROP FUNCTION IF EXISTS get_suggested_professionals(decimal, decimal, timestamp with time zone, text[], integer, decimal, integer) CASCADE;

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
    full_name VARCHAR(255),      -- ✅ CORRIGIDO
    email VARCHAR(255),           -- ✅ CORRIGIDO
    phone VARCHAR(20),            -- ✅ CORRIGIDO
    categories TEXT[],
    city VARCHAR(100),            -- ✅ CORRIGIDO
    state VARCHAR(2),             -- ✅ CORRIGIDO
    distance_km DECIMAL,
    total_score DECIMAL,
    category_score DECIMAL,
    distance_score DECIMAL,
    experience_score DECIMAL,
    availability_score DECIMAL,
    performance_score DECIMAL,
    score_breakdown JSONB,
    has_experience BOOLEAN,
    years_of_experience VARCHAR(10)  -- ✅ CORRIGIDO
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

COMMENT ON FUNCTION get_suggested_professionals IS 'Busca e ordena profissionais por score de compatibilidade';

-- =====================================================
-- TESTE
-- =====================================================

DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM get_suggested_professionals(
        -23.5505::DECIMAL,
        -46.6333::DECIMAL,
        NOW(),
        NULL,
        999999,
        0,
        100
    );

    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    IF result_count > 0 THEN
        RAISE NOTICE '✅ ✅ ✅ SUCESSO! ✅ ✅ ✅';
        RAISE NOTICE '';
        RAISE NOTICE '% profissionais encontrados!', result_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Sugestões de profissionais funcionando!';
    ELSE
        RAISE NOTICE '⚠️  Nenhum profissional encontrado';
        RAISE NOTICE '';
        RAISE NOTICE 'Possíveis causas:';
        RAISE NOTICE '  1. Profissionais não têm coordenadas';
        RAISE NOTICE '  2. Profissionais não estão aprovados';
        RAISE NOTICE '';
        RAISE NOTICE 'Solução: Acesse /admin/mapa e clique em';
        RAISE NOTICE '         "Geocodificar Pendentes"';
    END IF;
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
END $$;
