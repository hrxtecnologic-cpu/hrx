-- =====================================================
-- Migration 037: Remover Tabelas Órfãs
-- Data: 2025-10-28
-- Descrição: Remove tabelas sem uso confirmado no código
-- =====================================================

-- ⚠️ IMPORTANTE: Criar backups antes de executar!
-- pg_dump -t contractor_requests_old -t old_categories hrx > backup_orphan_tables.sql

-- =====================================================
-- ANÁLISE DE USO (grep realizado em 2025-10-28)
-- =====================================================
-- ✅ contractor_requests_old: 0 referências (ÓRFÃ confirmada)
-- ✅ old_categories: 0 referências (ÓRFÃ confirmada)
-- ✅ event_allocations: 0 referências (ÓRFÃ confirmada)
-- ⚠️ notifications_old: 3 referências (verificar migrations)
-- ⚠️ delivery_trackings: 8 referências (EM USO - NÃO DROPAR)
-- ⚠️ delivery_location_history: 2 referências (EM USO - NÃO DROPAR)
-- ⚠️ equipment_allocations: 1 referência (verificar antes)

-- =====================================================
-- PARTE 1: Dropar Tabelas Órfãs Confirmadas
-- =====================================================

-- Tabela substituída por event_projects
DROP TABLE IF EXISTS contractor_requests_old CASCADE;

-- Tabela do sistema antigo de categorias
DROP TABLE IF EXISTS old_categories CASCADE;

-- Tabela de alocações sem uso
DROP TABLE IF EXISTS event_allocations CASCADE;

-- =====================================================
-- PARTE 2: Tabelas com Referências Mínimas (Revisar Manualmente)
-- =====================================================

-- ⚠️ notifications_old tem 3 referências
-- Verificar se são apenas migrations antigas antes de dropar
-- DROP TABLE IF EXISTS notifications_old;

-- ⚠️ equipment_allocations tem 1 referência
-- Verificar contexto antes de dropar
-- DROP TABLE IF EXISTS equipment_allocations;

-- =====================================================
-- PARTE 3: Tabelas EM USO (NÃO DROPAR)
-- =====================================================

-- ❌ delivery_trackings - 8 referências no código (APIs de delivery)
-- ❌ delivery_location_history - 2 referências no código
-- ❌ delivery_status_updates - Feature de tracking ativa

-- =====================================================
-- RESUMO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 037 executada com sucesso!';
  RAISE NOTICE '📊 Tabelas removidas: 3';
  RAISE NOTICE '  - contractor_requests_old (substituída)';
  RAISE NOTICE '  - old_categories (sistema antigo)';
  RAISE NOTICE '  - event_allocations (sem uso)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Tabelas mantidas para revisão: 2';
  RAISE NOTICE '  - notifications_old (3 refs - verificar)';
  RAISE NOTICE '  - equipment_allocations (1 ref - verificar)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabelas de delivery MANTIDAS (em uso)';
END $$;
