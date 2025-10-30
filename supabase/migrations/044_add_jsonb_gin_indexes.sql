-- ============================================================================
-- Migration 044: Adicionar Índices GIN em Colunas JSONB
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Melhorar performance de queries que filtram por dados JSONB
--   (categorias, subcategorias, equipamentos, documentos, etc.)
--
-- Performance esperada: 5-10x mais rápido em queries JSONB
-- ============================================================================

-- ============================================================================
-- 1. ÍNDICES GIN PARA PROFESSIONALS
-- ============================================================================

-- Índice para categories (JSONB array)
CREATE INDEX IF NOT EXISTS idx_professionals_categories_gin
ON public.professionals USING GIN (categories);

-- Índice para subcategories (JSONB object)
CREATE INDEX IF NOT EXISTS idx_professionals_subcategories_gin
ON public.professionals USING GIN (subcategories);

-- Índice para certifications (JSONB object)
CREATE INDEX IF NOT EXISTS idx_professionals_certifications_gin
ON public.professionals USING GIN (certifications);

-- Índice para documents (JSONB object)
CREATE INDEX IF NOT EXISTS idx_professionals_documents_gin
ON public.professionals USING GIN (documents);

-- Índice para portfolio (JSONB array)
CREATE INDEX IF NOT EXISTS idx_professionals_portfolio_gin
ON public.professionals USING GIN (portfolio);

-- Índice para availability (JSONB array)
CREATE INDEX IF NOT EXISTS idx_professionals_availability_gin
ON public.professionals USING GIN (availability);

-- ============================================================================
-- 2. ÍNDICES GIN PARA EQUIPMENT_SUPPLIERS
-- ============================================================================

-- Índice para equipment_catalog (JSONB array)
CREATE INDEX IF NOT EXISTS idx_suppliers_catalog_gin
ON public.equipment_suppliers USING GIN (equipment_catalog);

-- Índice para pricing (JSONB object)
CREATE INDEX IF NOT EXISTS idx_suppliers_pricing_gin
ON public.equipment_suppliers USING GIN (pricing);

-- ============================================================================
-- 3. ÍNDICES GIN PARA EVENT_PROJECTS
-- ============================================================================

-- Índice para professionals_needed (JSONB array)
CREATE INDEX IF NOT EXISTS idx_event_projects_professionals_needed_gin
ON public.event_projects USING GIN (professionals_needed);

-- Índice para equipment_needed (JSONB array)
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_needed_gin
ON public.event_projects USING GIN (equipment_needed);

-- ============================================================================
-- 4. ÍNDICES GIN PARA PROJECT_EQUIPMENT
-- ============================================================================

-- Índice para specifications (JSONB object)
CREATE INDEX IF NOT EXISTS idx_project_equipment_specifications_gin
ON public.project_equipment USING GIN (specifications);

-- ============================================================================
-- 5. ÍNDICES GIN PARA SERVICE_ORDERS
-- ============================================================================

-- Índice para team_assignments (JSONB array)
CREATE INDEX IF NOT EXISTS idx_service_orders_team_gin
ON public.service_orders USING GIN (team_assignments);

-- Índice para equipment_list (JSONB array)
CREATE INDEX IF NOT EXISTS idx_service_orders_equipment_gin
ON public.service_orders USING GIN (equipment_list);

-- Índice para supplier_assignments (JSONB array)
CREATE INDEX IF NOT EXISTS idx_service_orders_suppliers_gin
ON public.service_orders USING GIN (supplier_assignments);

-- Índice para checklist (JSONB array)
CREATE INDEX IF NOT EXISTS idx_service_orders_checklist_gin
ON public.service_orders USING GIN (checklist);

-- Índice para timeline (JSONB array)
CREATE INDEX IF NOT EXISTS idx_service_orders_timeline_gin
ON public.service_orders USING GIN (timeline);

-- Índice para traffic_analysis (JSONB object)
CREATE INDEX IF NOT EXISTS idx_service_orders_traffic_gin
ON public.service_orders USING GIN (traffic_analysis);

-- Índice para route_details (JSONB object)
CREATE INDEX IF NOT EXISTS idx_service_orders_route_gin
ON public.service_orders USING GIN (route_details);

-- ============================================================================
-- 6. ÍNDICES GIN PARA NOTIFICATIONS
-- ============================================================================

-- Índice para metadata (JSONB object)
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin
ON public.notifications USING GIN (metadata);

-- ============================================================================
-- 7. ÍNDICES GIN PARA CONTRACTS
-- ============================================================================

-- Índice para contract_data (JSONB object)
CREATE INDEX IF NOT EXISTS idx_contracts_data_gin
ON public.contracts USING GIN (contract_data);

-- ============================================================================
-- 8. ÍNDICES GIN PARA CATEGORY_SUBCATEGORIES
-- ============================================================================

-- Índice para required_documents (JSONB array)
CREATE INDEX IF NOT EXISTS idx_subcategories_required_docs_gin
ON public.category_subcategories USING GIN (required_documents);

-- Índice para optional_documents (JSONB array)
CREATE INDEX IF NOT EXISTS idx_subcategories_optional_docs_gin
ON public.category_subcategories USING GIN (optional_documents);

-- ============================================================================
-- 9. ÍNDICES GIN PARA SUPPLIER_QUOTATIONS
-- ============================================================================

-- Índice para requested_items (JSONB array)
CREATE INDEX IF NOT EXISTS idx_quotations_requested_items_gin
ON public.supplier_quotations USING GIN (requested_items);

-- ============================================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON INDEX public.idx_professionals_categories_gin IS
  'Índice GIN para queries rápidas em categories (ex: WHERE categories @> ''["Eletricista"]'')';

COMMENT ON INDEX public.idx_professionals_subcategories_gin IS
  'Índice GIN para queries rápidas em subcategories';

COMMENT ON INDEX public.idx_suppliers_catalog_gin IS
  'Índice GIN para busca rápida no catálogo de equipamentos';

COMMENT ON INDEX public.idx_event_projects_professionals_needed_gin IS
  'Índice GIN para busca de projetos por profissionais necessários';

COMMENT ON INDEX public.idx_service_orders_checklist_gin IS
  'Índice GIN para queries em checklist de ordens de serviço';

-- ============================================================================
-- 11. EXEMPLOS DE USO DOS ÍNDICES
-- ============================================================================

-- Exemplo 1: Buscar profissionais por categoria específica
-- SELECT * FROM professionals
-- WHERE categories @> '["Eletricista"]'::jsonb
-- AND status = 'approved';

-- Exemplo 2: Buscar profissionais com subcategoria específica
-- SELECT * FROM professionals
-- WHERE subcategories @> '{"eletricista": ["nr10", "nr35"]}'::jsonb;

-- Exemplo 3: Buscar fornecedores com equipamento específico no catálogo
-- SELECT * FROM equipment_suppliers
-- WHERE equipment_catalog @> '[{"type": "som"}]'::jsonb;

-- Exemplo 4: Buscar projetos que precisam de categoria específica
-- SELECT * FROM event_projects
-- WHERE professionals_needed @> '[{"category": "Eletricista"}]'::jsonb;

-- Exemplo 5: Buscar ordens de serviço com tarefa específica no checklist
-- SELECT * FROM service_orders
-- WHERE checklist @> '[{"task": "Testar equipamento"}]'::jsonb;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Contar índices GIN criados
DO $$
DECLARE
  gin_index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO gin_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexdef LIKE '%USING gin%'
    AND indexname LIKE 'idx_%_gin';

  RAISE NOTICE '✅ % índices GIN criados com sucesso', gin_index_count;
  RAISE NOTICE 'ℹ️ Índices GIN melhoram queries em colunas JSONB';
  RAISE NOTICE 'ℹ️ Use operadores @>, @<, ?, ?| e ?& para aproveitar os índices';
END $$;

-- Verificar tamanho dos índices
DO $$
DECLARE
  total_size TEXT;
BEGIN
  SELECT pg_size_pretty(SUM(pg_relation_size(indexrelid))::bigint)
  INTO total_size
  FROM pg_index
  JOIN pg_class ON pg_class.oid = pg_index.indexrelid
  WHERE pg_class.relname LIKE 'idx_%_gin';

  RAISE NOTICE 'ℹ️ Tamanho total dos índices GIN: %', total_size;
END $$;

-- ============================================================================
-- NOTAS DE PERFORMANCE
-- ============================================================================

-- GIN (Generalized Inverted Index) é ideal para:
-- - Arrays JSONB
-- - Objetos JSONB com muitas chaves
-- - Queries com operadores @>, @<, ?, ?| e ?&
--
-- Performance:
-- - SELECT: 5-10x mais rápido
-- - INSERT/UPDATE: ~10-20% mais lento (overhead do índice)
-- - Tamanho: Índices GIN podem ser grandes (30-50% do tamanho da tabela)
--
-- Manutenção:
-- - VACUUM ANALYZE após criar índices
-- - Monitorar uso com pg_stat_user_indexes
-- - Considerar REINDEX se performance degradar
