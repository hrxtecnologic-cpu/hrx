-- ============================================================================
-- Migration 042: Remover Tabelas Não Utilizadas
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Limpar código legado removendo tabelas que não são mais utilizadas:
--   - requests (substituída por event_projects)
--   - notifications_old (substituída por notifications)
--   - equipment_allocations (uso questionável - verificar antes)
--
-- IMPORTANTE: Execute esta migração APENAS após confirmar que não há
-- dependências no código da aplicação!
-- ============================================================================

-- ============================================================================
-- 1. BACKUP DOS DADOS (OPCIONAL)
-- ============================================================================

-- Se quiser fazer backup antes de dropar, descomente as linhas abaixo:

-- CREATE TABLE IF NOT EXISTS _backup_requests AS SELECT * FROM public.requests;
-- CREATE TABLE IF NOT EXISTS _backup_notifications_old AS SELECT * FROM public.notifications_old;
-- CREATE TABLE IF NOT EXISTS _backup_equipment_allocations AS SELECT * FROM public.equipment_allocations;

-- ============================================================================
-- 2. VERIFICAR DADOS EXISTENTES
-- ============================================================================

-- Verificar se há dados nas tabelas antes de dropar
DO $$
DECLARE
  requests_count INTEGER;
  notifications_old_count INTEGER;
  equipment_allocations_count INTEGER;
BEGIN
  -- Contar registros em requests
  SELECT COUNT(*) INTO requests_count FROM public.requests;
  RAISE NOTICE 'Registros em requests: %', requests_count;

  -- Contar registros em notifications_old
  SELECT COUNT(*) INTO notifications_old_count FROM public.notifications_old;
  RAISE NOTICE 'Registros em notifications_old: %', notifications_old_count;

  -- Contar registros em equipment_allocations
  SELECT COUNT(*) INTO equipment_allocations_count FROM public.equipment_allocations;
  RAISE NOTICE 'Registros em equipment_allocations: %', equipment_allocations_count;
END $$;

-- ============================================================================
-- 3. DROPAR TABELA: requests
-- ============================================================================

-- Esta tabela foi substituída por event_projects na migration 011/012
-- Verificação no código: 0 referências encontradas

DO $$
BEGIN
  -- Verificar se tabela existe antes de tentar comentar
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests' AND table_schema = 'public') THEN
    COMMENT ON TABLE public.requests IS 'DEPRECATED: Esta tabela será removida. Use event_projects.';

    -- Dropar constraints e foreign keys primeiro
    ALTER TABLE IF EXISTS public.requests DROP CONSTRAINT IF EXISTS requests_contractor_id_fkey CASCADE;
    ALTER TABLE IF EXISTS public.requests DROP CONSTRAINT IF EXISTS requests_pkey CASCADE;

    -- Dropar a tabela
    DROP TABLE IF EXISTS public.requests CASCADE;

    RAISE NOTICE '✅ Tabela requests removida com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela requests já havia sido removida anteriormente';
  END IF;
END $$;

-- ============================================================================
-- 4. DROPAR TABELA: notifications_old
-- ============================================================================

-- Esta tabela foi substituída por notifications na migration 021
-- Verificação no código: 0 referências encontradas

DO $$
BEGIN
  -- Verificar se tabela existe antes de tentar comentar
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_old' AND table_schema = 'public') THEN
    COMMENT ON TABLE public.notifications_old IS 'DEPRECATED: Esta tabela será removida. Use notifications.';

    -- Dropar constraints primeiro
    ALTER TABLE IF EXISTS public.notifications_old DROP CONSTRAINT IF EXISTS notifications_old_pkey CASCADE;

    -- Dropar a tabela
    DROP TABLE IF EXISTS public.notifications_old CASCADE;

    RAISE NOTICE '✅ Tabela notifications_old removida com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela notifications_old já havia sido removida anteriormente';
  END IF;
END $$;

-- ============================================================================
-- 5. AVALIAR: equipment_allocations
-- ============================================================================

-- Esta tabela tem uso questionável (apenas 1 referência no código)
-- NÃO vamos dropar automaticamente - apenas marcar como deprecated

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_allocations' AND table_schema = 'public') THEN
    COMMENT ON TABLE public.equipment_allocations IS 'DEPRECATED: Avaliar se esta tabela ainda é necessária. Uso limitado encontrado no código.';
    RAISE NOTICE '⚠️ Tabela equipment_allocations marcada como DEPRECATED';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela equipment_allocations não existe';
  END IF;
END $$;

-- Se após análise for confirmado que não é necessária, execute:
-- DO $$
-- BEGIN
--   ALTER TABLE IF EXISTS public.equipment_allocations DROP CONSTRAINT IF EXISTS equipment_allocations_pkey CASCADE;
--   DROP TABLE IF EXISTS public.equipment_allocations CASCADE;
--   RAISE NOTICE '✅ Tabela equipment_allocations removida';
-- END $$;

-- ============================================================================
-- 6. LIMPAR VIEWS QUE REFERENCIAM AS TABELAS REMOVIDAS
-- ============================================================================

-- Verificar se há views que referenciam as tabelas removidas
-- (não encontramos nenhuma na auditoria, mas vamos verificar mesmo assim)

DO $$
DECLARE
  view_record RECORD;
BEGIN
  FOR view_record IN
    SELECT viewname FROM pg_views
    WHERE schemaname = 'public'
    AND definition LIKE '%requests%'
  LOOP
    RAISE NOTICE 'WARNING: View % pode referenciar tabela requests removida', view_record.viewname;
  END LOOP;
END $$;

-- ============================================================================
-- 7. LIMPAR TRIGGERS QUE REFERENCIAM AS TABELAS REMOVIDAS
-- ============================================================================

-- Triggers são dropados automaticamente com CASCADE, mas vamos verificar
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN
    SELECT tgname, tgrelid::regclass as table_name
    FROM pg_trigger
    WHERE tgrelid IN ('public.requests'::regclass, 'public.notifications_old'::regclass)
  LOOP
    RAISE NOTICE 'WARNING: Trigger % na tabela % será removido', trigger_record.tgname, trigger_record.table_name;
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '✅ Nenhum trigger encontrado nas tabelas removidas';
END $$;

-- ============================================================================
-- 8. ATUALIZAR ATUAL.SQL
-- ============================================================================

-- IMPORTANTE: Após executar esta migração, REMOVER as definições das tabelas
-- do arquivo atual.sql:
--   - Linhas 516-546: requests
--   - Linhas 334-346: notifications_old

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar que as tabelas foram realmente removidas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'ERRO: Tabela requests ainda existe!';
  ELSE
    RAISE NOTICE '✅ Tabela requests removida com sucesso';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_old' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'ERRO: Tabela notifications_old ainda existe!';
  ELSE
    RAISE NOTICE '✅ Tabela notifications_old removida com sucesso';
  END IF;
END $$;

-- ============================================================================
-- DOCUMENTAÇÃO
-- ============================================================================

-- Migration executada com sucesso!
-- Tabelas removidas:
--   ✅ requests
--   ✅ notifications_old
--
-- Tabelas marcadas como deprecated (avaliar futuramente):
--   ⚠️  equipment_allocations
--
-- Próximos passos:
--   1. Atualizar atual.sql removendo as definições das tabelas
--   2. Confirmar que aplicação funciona normalmente
--   3. Avaliar se equipment_allocations pode ser removida
