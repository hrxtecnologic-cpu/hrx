-- =====================================================
-- Migration: Add Geolocation Support to Professionals
-- Version: 006
-- Date: 2025-10-21
-- Description: Adds latitude/longitude fields and distance calculation function
-- =====================================================

-- Add geolocation columns to professionals table
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add indexes for geolocation queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_professionals_latitude ON professionals(latitude);
CREATE INDEX IF NOT EXISTS idx_professionals_longitude ON professionals(longitude);
CREATE INDEX IF NOT EXISTS idx_professionals_lat_lng ON professionals(latitude, longitude);

-- Add comments for documentation
COMMENT ON COLUMN professionals.latitude IS 'Latitude da localização do profissional (WGS84)';
COMMENT ON COLUMN professionals.longitude IS 'Longitude da localização do profissional (WGS84)';

-- =====================================================
-- Haversine Distance Calculation Function
-- =====================================================
-- Calculates the great-circle distance between two points on Earth
-- Returns distance in kilometers
-- Formula: https://en.wikipedia.org/wiki/Haversine_formula

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Raio da Terra em km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Verificar se algum parâmetro é NULL
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  -- Converter diferenças para radianos
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);

  -- Fórmula de Haversine
  a := SIN(dlat/2) * SIN(dlat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon/2) * SIN(dlon/2);

  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  -- Retornar distância em km
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment for function
COMMENT ON FUNCTION calculate_distance IS 'Calcula a distância em km entre dois pontos geográficos usando fórmula de Haversine';

-- =====================================================
-- Example Usage (commented out)
-- =====================================================
--
-- -- Buscar profissionais a até 50km de uma localização
-- SELECT
--   id,
--   full_name,
--   city,
--   state,
--   calculate_distance(
--     -23.5505,  -- Latitude do ponto de referência (São Paulo)
--     -46.6333,  -- Longitude do ponto de referência
--     latitude,
--     longitude
--   ) as distance_km
-- FROM professionals
-- WHERE latitude IS NOT NULL
--   AND longitude IS NOT NULL
--   AND calculate_distance(-23.5505, -46.6333, latitude, longitude) <= 50
-- ORDER BY distance_km ASC;
--
-- =====================================================
