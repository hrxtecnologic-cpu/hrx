-- =====================================================
-- DEBUG: Testar função de sugestão de profissionais
-- =====================================================

-- 1. Verificar se a função existe
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_suggested_professionals'
  AND n.nspname = 'public';

-- 2. Verificar profissionais com coordenadas
SELECT
    COUNT(*) as total_professionals,
    COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as with_coordinates,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'approved' AND latitude IS NOT NULL AND longitude IS NOT NULL) as approved_with_coords
FROM professionals;

-- 3. Testar conversão de categories
SELECT
    id,
    full_name,
    categories,
    jsonb_typeof(categories) as type,
    CASE
        WHEN jsonb_typeof(categories) = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(categories))
        ELSE
            '{}'::TEXT[]
    END as categories_array
FROM professionals
LIMIT 5;

-- 4. Testar com coordenadas de São Paulo
-- Latitude: -23.5505, Longitude: -46.6333
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count
    FROM get_suggested_professionals(
        -23.5505::DECIMAL,  -- São Paulo latitude
        -46.6333::DECIMAL,  -- São Paulo longitude
        NOW(),              -- Data do evento
        NULL,               -- Sem filtro de categorias
        999999,             -- Max distance
        0,                  -- Min score
        100                 -- Limit
    );

    RAISE NOTICE 'Profissionais encontrados: %', result_count;

    IF result_count = 0 THEN
        RAISE NOTICE '⚠️  Nenhum profissional encontrado. Possíveis causas:';
        RAISE NOTICE '   1. Profissionais não têm coordenadas';
        RAISE NOTICE '   2. Profissionais não estão com status "approved"';
        RAISE NOTICE '   3. Erro na função';
    ELSE
        RAISE NOTICE '✅ Função funcionando! % profissionais retornados', result_count;
    END IF;
END $$;

-- 5. Testar com erro detalhado
SELECT
    id,
    full_name,
    categories,
    city,
    state,
    distance_km,
    total_score
FROM get_suggested_professionals(
    -23.5505::DECIMAL,
    -46.6333::DECIMAL,
    NOW(),
    NULL,
    999999,
    0,
    10
)
LIMIT 10;
