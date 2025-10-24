-- =====================================================
-- SCRIPT PARA CORRIGIR SUGESTÕES
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar se as funções existem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_suggested_professionals'
    ) THEN
        RAISE NOTICE '❌ Função get_suggested_professionals NÃO EXISTE';
        RAISE NOTICE '👉 Você precisa executar: 020_improve_professional_suggestions.sql';
    ELSE
        RAISE NOTICE '✅ Função get_suggested_professionals existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_suggested_suppliers'
    ) THEN
        RAISE NOTICE '❌ Função get_suggested_suppliers NÃO EXISTE';
        RAISE NOTICE '👉 Você precisa executar: 025_FINAL_supplier_suggestions.sql';
    ELSE
        RAISE NOTICE '✅ Função get_suggested_suppliers existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'calculate_distance'
    ) THEN
        RAISE NOTICE '❌ Função calculate_distance NÃO EXISTE';
        RAISE NOTICE '👉 Você precisa executar a migration que cria esta função';
    ELSE
        RAISE NOTICE '✅ Função calculate_distance existe';
    END IF;
END $$;

-- 2. Se não existir calculate_distance, criar agora
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

-- 3. Listar profissionais com/sem coordenadas
DO $$
DECLARE
  total_profs INTEGER;
  profs_with_coords INTEGER;
  profs_without_coords INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profs FROM professionals;
  SELECT COUNT(*) INTO profs_with_coords FROM professionals WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  SELECT COUNT(*) INTO profs_without_coords FROM professionals WHERE latitude IS NULL OR longitude IS NULL;

  RAISE NOTICE '📊 PROFISSIONAIS:';
  RAISE NOTICE '  Total: %', total_profs;
  RAISE NOTICE '  Com coordenadas: %', profs_with_coords;
  RAISE NOTICE '  Sem coordenadas: %', profs_without_coords;
END $$;

-- 4. Listar fornecedores com/sem coordenadas
DO $$
DECLARE
  total_supps INTEGER;
  supps_with_coords INTEGER;
  supps_without_coords INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_supps FROM equipment_suppliers;
  SELECT COUNT(*) INTO supps_with_coords FROM equipment_suppliers WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  SELECT COUNT(*) INTO supps_without_coords FROM equipment_suppliers WHERE latitude IS NULL OR longitude IS NULL;

  RAISE NOTICE '📊 FORNECEDORES:';
  RAISE NOTICE '  Total: %', total_supps;
  RAISE NOTICE '  Com coordenadas: %', supps_with_coords;
  RAISE NOTICE '  Sem coordenadas: %', supps_without_coords;
END $$;

-- 5. Verificar eventos com/sem coordenadas
DO $$
DECLARE
  total_events INTEGER;
  events_with_coords INTEGER;
  events_without_coords INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_events FROM event_projects;
  SELECT COUNT(*) INTO events_with_coords FROM event_projects WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  SELECT COUNT(*) INTO events_without_coords FROM event_projects WHERE latitude IS NULL OR longitude IS NULL;

  RAISE NOTICE '📊 EVENTOS:';
  RAISE NOTICE '  Total: %', total_events;
  RAISE NOTICE '  Com coordenadas: %', events_with_coords;
  RAISE NOTICE '  Sem coordenadas: %', events_without_coords;
END $$;

RAISE NOTICE '';
RAISE NOTICE '==============================================';
RAISE NOTICE 'DIAGNÓSTICO COMPLETO';
RAISE NOTICE '==============================================';
RAISE NOTICE '';
RAISE NOTICE 'Se as funções NÃO EXISTEM, execute as migrations:';
RAISE NOTICE '  1. supabase/migrations/020_improve_professional_suggestions.sql';
RAISE NOTICE '  2. supabase/migrations/025_FINAL_supplier_suggestions.sql';
RAISE NOTICE '';
RAISE NOTICE 'Se há registros SEM COORDENADAS, use o botão no admin:';
RAISE NOTICE '  /admin/mapa -> "Geocodificar Pendentes"';
RAISE NOTICE '';
