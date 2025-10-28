-- =====================================================
-- ÍNDICES COMPLEMENTARES DE PERFORMANCE
-- =====================================================
-- Data: 2025-10-28
-- Descrição: Adiciona apenas os índices que faltam no schema atual
--
-- NOTA: Verificado contra atual.sql - esses índices NÃO existem ainda
-- =====================================================

-- =====================================================
-- 1. ÍNDICES GEOGRÁFICOS (CRITICAL - Faltando!)
-- =====================================================

-- Professionals - Geographic search (NÃO EXISTE)
CREATE INDEX IF NOT EXISTS idx_professionals_lat_lng
ON professionals(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Equipment Suppliers - Geographic search (NÃO EXISTE)
CREATE INDEX IF NOT EXISTS idx_suppliers_lat_lng
ON equipment_suppliers(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Event Projects - Geographic search for map (NÃO EXISTE)
-- Nota: atual.sql tem venue_latitude/venue_longitude mas precisa confirmar nome correto
CREATE INDEX IF NOT EXISTS idx_event_projects_venue_location
ON event_projects(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON INDEX idx_professionals_lat_lng IS 'Otimiza busca geográfica de profissionais (bounding box queries)';
COMMENT ON INDEX idx_suppliers_lat_lng IS 'Otimiza busca geográfica de fornecedores';
COMMENT ON INDEX idx_event_projects_venue_location IS 'Otimiza visualização de eventos no mapa';


-- =====================================================
-- 2. ÍNDICES DE STATUS (HIGH - Faltando!)
-- =====================================================

-- Professionals status (NÃO EXISTE)
CREATE INDEX IF NOT EXISTS idx_professionals_status
ON professionals(status)
WHERE status IS NOT NULL;

-- Event Projects status (NÃO EXISTE)
CREATE INDEX IF NOT EXISTS idx_event_projects_status
ON event_projects(status);

-- Project Team status + professional (NÃO EXISTE - composite importante)
CREATE INDEX IF NOT EXISTS idx_project_team_status_prof
ON project_team(professional_id, status)
WHERE professional_id IS NOT NULL;

-- Project Equipment status (NÃO EXISTE)
CREATE INDEX IF NOT EXISTS idx_project_equipment_status
ON project_equipment(status);

-- Equipment Suppliers status (NÃO EXISTE)
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_status
ON equipment_suppliers(status);

COMMENT ON INDEX idx_professionals_status IS 'Otimiza filtros de status em listagens de profissionais';
COMMENT ON INDEX idx_event_projects_status IS 'Otimiza dashboard e filtros de projetos por status';
COMMENT ON INDEX idx_project_team_status_prof IS 'Otimiza dashboard do profissional (meus projetos)';


-- =====================================================
-- 3. ÍNDICES DE FOREIGN KEYS (MEDIUM - Verificação)
-- =====================================================

-- Project Team - projeto e profissional
CREATE INDEX IF NOT EXISTS idx_project_team_project
ON project_team(project_id);

CREATE INDEX IF NOT EXISTS idx_project_team_professional
ON project_team(professional_id)
WHERE professional_id IS NOT NULL;

-- Project Equipment - projeto e fornecedor
CREATE INDEX IF NOT EXISTS idx_project_equipment_project
ON project_equipment(project_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_supplier
ON project_equipment(selected_supplier_id)
WHERE selected_supplier_id IS NOT NULL;

-- Supplier Quotations
CREATE INDEX IF NOT EXISTS idx_quotations_project
ON supplier_quotations(project_id);

CREATE INDEX IF NOT EXISTS idx_quotations_supplier
ON supplier_quotations(supplier_id);

-- Project Emails
CREATE INDEX IF NOT EXISTS idx_project_emails_project
ON project_emails(project_id);

-- Document Validations
CREATE INDEX IF NOT EXISTS idx_document_validations_professional
ON document_validations(professional_id);

CREATE INDEX IF NOT EXISTS idx_document_validations_status
ON document_validations(status);

-- Professional Reviews
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional
ON professional_reviews(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_reviews_project
ON professional_reviews(project_id);

-- Supplier Reviews
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier
ON supplier_reviews(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_reviews_project
ON supplier_reviews(project_id);

COMMENT ON INDEX idx_project_team_project IS 'Otimiza JOIN de equipe com projetos';
COMMENT ON INDEX idx_project_equipment_project IS 'Otimiza JOIN de equipamentos com projetos';
COMMENT ON INDEX idx_quotations_project IS 'Otimiza busca de cotações por projeto';


-- =====================================================
-- 4. ÍNDICES COMPOSTOS ESPECÍFICOS (MEDIUM)
-- =====================================================

-- Event Projects: status + data (dashboard com filtro de período)
CREATE INDEX IF NOT EXISTS idx_event_projects_status_date
ON event_projects(status, event_date DESC)
WHERE event_date IS NOT NULL;

-- Project Team: projeto + status (contagem de membros por status)
CREATE INDEX IF NOT EXISTS idx_project_team_project_status
ON project_team(project_id, status);

-- Professionals: status + created_at (listagem ordenada)
CREATE INDEX IF NOT EXISTS idx_professionals_status_created
ON professionals(status, created_at DESC);

-- Event Projects: created_at para ordenação de listagens
CREATE INDEX IF NOT EXISTS idx_event_projects_created_at
ON event_projects(created_at DESC);

COMMENT ON INDEX idx_event_projects_status_date IS 'Otimiza dashboard com filtros de status e período';
COMMENT ON INDEX idx_project_team_project_status IS 'Otimiza contagem de membros por status no projeto';


-- =====================================================
-- 5. ÍNDICES PARA JSONB (CRITICAL)
-- =====================================================

-- Categories array - usando GIN para contains queries
CREATE INDEX IF NOT EXISTS idx_professionals_categories
ON professionals USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_equipment_types
ON equipment_suppliers USING GIN(equipment_types);

-- Event Projects - professionals_needed e equipment_needed
CREATE INDEX IF NOT EXISTS idx_event_projects_professionals_needed
ON event_projects USING GIN(professionals_needed);

CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_needed
ON event_projects USING GIN(equipment_needed);

COMMENT ON INDEX idx_professionals_categories IS 'Otimiza filtro por categorias usando JSONB @> operator';
COMMENT ON INDEX idx_equipment_suppliers_equipment_types IS 'Otimiza busca por tipos de equipamento';


-- =====================================================
-- 6. ÍNDICES PARA CLERK_ID (Importante para autenticação)
-- =====================================================

-- Já existe UNIQUE em professionals, contractors, suppliers, users
-- Mas índice adicional para performance de lookup
CREATE INDEX IF NOT EXISTS idx_professionals_clerk_id
ON professionals(clerk_id)
WHERE clerk_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id
ON contractors(clerk_id)
WHERE clerk_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_clerk_id
ON equipment_suppliers(clerk_id)
WHERE clerk_id IS NOT NULL;

COMMENT ON INDEX idx_professionals_clerk_id IS 'Otimiza autenticação via Clerk';


-- =====================================================
-- 7. ÍNDICES PARA DATAS DE VALIDADE (Para notificações)
-- =====================================================

-- Professionals - validade de documentos
CREATE INDEX IF NOT EXISTS idx_professionals_cnh_validity
ON professionals(cnh_validity)
WHERE cnh_validity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professionals_nr10_validity
ON professionals(nr10_validity)
WHERE nr10_validity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professionals_nr35_validity
ON professionals(nr35_validity)
WHERE nr35_validity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professionals_drt_validity
ON professionals(drt_validity)
WHERE drt_validity IS NOT NULL;

COMMENT ON INDEX idx_professionals_cnh_validity IS 'Otimiza verificação de documentos expirando';


-- =====================================================
-- 8. ANÁLISE E ESTATÍSTICAS
-- =====================================================

ANALYZE professionals;
ANALYZE equipment_suppliers;
ANALYZE event_projects;
ANALYZE project_team;
ANALYZE project_equipment;
ANALYZE supplier_quotations;
ANALYZE project_emails;
ANALYZE document_validations;
ANALYZE professional_reviews;
ANALYZE supplier_reviews;


-- =====================================================
-- 9. VERIFICAÇÃO DOS NOVOS ÍNDICES
-- =====================================================

-- Query para listar todos os índices criados:
/*
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY tablename, indexrelname;
*/

-- Query para ver índices não utilizados (depois de alguns dias):
/*
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
*/

-- =====================================================
-- 10. ROLLBACK (se necessário)
-- =====================================================

/*
-- Para remover todos os índices criados:

DROP INDEX IF EXISTS idx_professionals_lat_lng;
DROP INDEX IF EXISTS idx_suppliers_lat_lng;
DROP INDEX IF EXISTS idx_event_projects_venue_location;
DROP INDEX IF EXISTS idx_professionals_status;
DROP INDEX IF EXISTS idx_event_projects_status;
DROP INDEX IF EXISTS idx_project_team_status_prof;
DROP INDEX IF EXISTS idx_project_equipment_status;
DROP INDEX IF EXISTS idx_equipment_suppliers_status;
DROP INDEX IF EXISTS idx_project_team_project;
DROP INDEX IF EXISTS idx_project_team_professional;
DROP INDEX IF EXISTS idx_project_equipment_project;
DROP INDEX IF EXISTS idx_project_equipment_supplier;
DROP INDEX IF EXISTS idx_quotations_project;
DROP INDEX IF EXISTS idx_quotations_supplier;
DROP INDEX IF EXISTS idx_project_emails_project;
DROP INDEX IF EXISTS idx_document_validations_professional;
DROP INDEX IF EXISTS idx_document_validations_status;
DROP INDEX IF EXISTS idx_professional_reviews_professional;
DROP INDEX IF EXISTS idx_professional_reviews_project;
DROP INDEX IF EXISTS idx_supplier_reviews_supplier;
DROP INDEX IF EXISTS idx_supplier_reviews_project;
DROP INDEX IF EXISTS idx_event_projects_status_date;
DROP INDEX IF EXISTS idx_project_team_project_status;
DROP INDEX IF EXISTS idx_professionals_status_created;
DROP INDEX IF EXISTS idx_event_projects_created_at;
DROP INDEX IF EXISTS idx_professionals_categories;
DROP INDEX IF EXISTS idx_equipment_suppliers_equipment_types;
DROP INDEX IF EXISTS idx_event_projects_professionals_needed;
DROP INDEX IF EXISTS idx_event_projects_equipment_needed;
DROP INDEX IF EXISTS idx_professionals_clerk_id;
DROP INDEX IF EXISTS idx_contractors_clerk_id;
DROP INDEX IF EXISTS idx_equipment_suppliers_clerk_id;
DROP INDEX IF EXISTS idx_professionals_cnh_validity;
DROP INDEX IF EXISTS idx_professionals_nr10_validity;
DROP INDEX IF EXISTS idx_professionals_nr35_validity;
DROP INDEX IF EXISTS idx_professionals_drt_validity;
*/
