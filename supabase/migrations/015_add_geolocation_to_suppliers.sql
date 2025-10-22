-- =====================================================
-- Migration: Add Geolocation Support to Equipment Suppliers
-- Version: 015
-- Date: 2025-10-22
-- Description: Adds latitude/longitude/address fields to suppliers for proximity search
-- =====================================================

-- Add geolocation and address columns to equipment_suppliers table
ALTER TABLE equipment_suppliers
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS delivery_radius_km INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS shipping_fee_per_km DECIMAL(10, 2) DEFAULT 0;

-- Add indexes for geolocation queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_suppliers_latitude ON equipment_suppliers(latitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_longitude ON equipment_suppliers(longitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_lat_lng ON equipment_suppliers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON equipment_suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_state ON equipment_suppliers(state);

-- Add comments for documentation
COMMENT ON COLUMN equipment_suppliers.latitude IS 'Latitude da localização do fornecedor (WGS84)';
COMMENT ON COLUMN equipment_suppliers.longitude IS 'Longitude da localização do fornecedor (WGS84)';
COMMENT ON COLUMN equipment_suppliers.address IS 'Endereço completo do fornecedor';
COMMENT ON COLUMN equipment_suppliers.city IS 'Cidade do fornecedor';
COMMENT ON COLUMN equipment_suppliers.state IS 'Estado (UF) do fornecedor';
COMMENT ON COLUMN equipment_suppliers.zip_code IS 'CEP do fornecedor';
COMMENT ON COLUMN equipment_suppliers.delivery_radius_km IS 'Raio de entrega sem frete adicional (em km)';
COMMENT ON COLUMN equipment_suppliers.shipping_fee_per_km IS 'Taxa de frete por km excedente';

-- =====================================================
-- View: Suppliers with Distance Calculation
-- =====================================================
-- Esta view facilita consultas de fornecedores próximos
-- Uso: Passar lat/lon como parâmetros na query

CREATE OR REPLACE FUNCTION get_nearby_suppliers(
  event_lat DECIMAL,
  event_lon DECIMAL,
  max_distance_km INTEGER DEFAULT 100
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
  distance_km DECIMAL,
  delivery_radius_km INTEGER,
  requires_shipping BOOLEAN,
  shipping_fee DECIMAL
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
    calculate_distance(event_lat, event_lon, s.latitude, s.longitude) as distance_km,
    s.delivery_radius_km,
    (calculate_distance(event_lat, event_lon, s.latitude, s.longitude) > s.delivery_radius_km) as requires_shipping,
    CASE
      WHEN calculate_distance(event_lat, event_lon, s.latitude, s.longitude) > s.delivery_radius_km
      THEN (calculate_distance(event_lat, event_lon, s.latitude, s.longitude) - s.delivery_radius_km) * s.shipping_fee_per_km
      ELSE 0
    END as shipping_fee
  FROM equipment_suppliers s
  WHERE s.status = 'active'
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND calculate_distance(event_lat, event_lon, s.latitude, s.longitude) <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_nearby_suppliers IS 'Retorna fornecedores próximos ordenados por distância, com cálculo de frete';

-- =====================================================
-- Example Usage (commented out)
-- =====================================================
--
-- -- Buscar fornecedores a até 100km do evento no Rio de Janeiro
-- SELECT * FROM get_nearby_suppliers(
--   -22.9068,  -- Latitude do evento (Rio de Janeiro)
--   -43.1729,  -- Longitude do evento
--   100        -- Raio máximo de busca (km)
-- );
--
-- -- Resultado inclui:
-- -- - distance_km: distância do evento
-- -- - requires_shipping: se precisa cobrar frete
-- -- - shipping_fee: valor do frete (se aplicável)
--
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Geolocation adicionada aos fornecedores com sucesso!';
    RAISE NOTICE '📍 Agora fornecedores podem ser filtrados por proximidade';
    RAISE NOTICE '🚚 Sistema de frete automático configurado';
END $$;
