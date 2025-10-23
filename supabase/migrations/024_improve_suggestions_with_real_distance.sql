-- =====================================================
-- Migration: Melhorar Sugestões com Distância Real
-- =====================================================
-- Adiciona suporte para usar distância real de rota
-- ao invés de distância em linha reta (Haversine)
-- =====================================================

-- =====================================================
-- 1. Adicionar latitude/longitude em event_projects
-- =====================================================

-- Verificar se colunas já existem antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'event_projects' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE event_projects ADD COLUMN latitude NUMERIC;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'event_projects' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE event_projects ADD COLUMN longitude NUMERIC;
    END IF;
END $$;

-- =====================================================
-- 2. Comentário na função existente
-- =====================================================

COMMENT ON FUNCTION get_suggested_professionals IS 'Retorna profissionais sugeridos usando Haversine. Para distâncias reais de rota, use Mapbox Matrix API no backend.';

-- =====================================================
-- VIEW: Profissionais Prontos para Geocoding
-- =====================================================

CREATE OR REPLACE VIEW professionals_pending_geocoding AS
SELECT
    id,
    full_name,
    street,
    number,
    neighborhood,
    city,
    state,
    cep,
    CONCAT(
        COALESCE(street || ', ', ''),
        COALESCE(number || ', ', ''),
        COALESCE(neighborhood || ', ', ''),
        city, ', ',
        state
    ) as full_address
FROM professionals
WHERE status = 'approved'
    AND latitude IS NULL
    AND city IS NOT NULL
    AND state IS NOT NULL
ORDER BY created_at DESC;

-- =====================================================
-- VIEW: Fornecedores Prontos para Geocoding
-- =====================================================

CREATE OR REPLACE VIEW suppliers_pending_geocoding AS
SELECT
    id,
    company_name,
    address,
    city,
    state,
    zip_code,
    CONCAT(
        COALESCE(address || ', ', ''),
        city, ', ',
        state
    ) as full_address
FROM equipment_suppliers
WHERE status = 'active'
    AND latitude IS NULL
    AND city IS NOT NULL
    AND state IS NOT NULL
ORDER BY created_at DESC;

-- =====================================================
-- VIEW: Eventos Prontos para Geocoding
-- =====================================================

CREATE OR REPLACE VIEW events_pending_geocoding AS
SELECT
    id,
    project_number,
    event_name,
    venue_name,
    venue_address,
    venue_city,
    venue_state,
    venue_zip,
    CONCAT(
        COALESCE(venue_name || ' - ', ''),
        COALESCE(venue_address || ', ', ''),
        venue_city, ', ',
        venue_state
    ) as full_address
FROM event_projects
WHERE latitude IS NULL
    AND venue_city IS NOT NULL
    AND venue_state IS NOT NULL
ORDER BY event_date ASC;

-- =====================================================
-- FUNÇÃO: Contar registros pendentes de geocoding
-- =====================================================

CREATE OR REPLACE FUNCTION get_geocoding_stats()
RETURNS TABLE (
    entity_type TEXT,
    total_records BIGINT,
    with_coordinates BIGINT,
    pending_geocoding BIGINT,
    percentage_complete NUMERIC
) AS $$
BEGIN
    RETURN QUERY

    -- Profissionais
    SELECT
        'professionals'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL)::BIGINT,
        COUNT(*) FILTER (WHERE latitude IS NULL)::BIGINT,
        ROUND(
            (COUNT(*) FILTER (WHERE latitude IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        )
    FROM professionals
    WHERE status = 'approved'

    UNION ALL

    -- Fornecedores
    SELECT
        'suppliers'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL)::BIGINT,
        COUNT(*) FILTER (WHERE latitude IS NULL)::BIGINT,
        ROUND(
            (COUNT(*) FILTER (WHERE latitude IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        )
    FROM equipment_suppliers
    WHERE status = 'active'

    UNION ALL

    -- Eventos
    SELECT
        'events'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL)::BIGINT,
        COUNT(*) FILTER (WHERE latitude IS NULL)::BIGINT,
        ROUND(
            (COUNT(*) FILTER (WHERE latitude IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        )
    FROM event_projects
    WHERE event_date >= NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON VIEW professionals_pending_geocoding IS 'Profissionais aprovados sem coordenadas geográficas';
COMMENT ON VIEW suppliers_pending_geocoding IS 'Fornecedores ativos sem coordenadas geográficas';
COMMENT ON VIEW events_pending_geocoding IS 'Eventos futuros sem coordenadas geográficas';
COMMENT ON FUNCTION get_geocoding_stats IS 'Retorna estatísticas de geocodificação por tipo de entidade';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
