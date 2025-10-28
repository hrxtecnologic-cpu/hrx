-- =====================================================
-- OTIMIZAÇÕES DE PERFORMANCE - ÍNDICES
-- =====================================================
-- Data: 2025-10-28
-- Descrição: Adiciona índices para otimizar queries mais utilizadas
--
-- IMPACTO ESPERADO:
-- - Professional search: 8x mais rápido (2-3s → 300ms)
-- - Event projects list: 4x mais rápido (800ms → 200ms)
-- - Map data load: 4x mais rápido (4s → 1s)
-- =====================================================

-- =====================================================
-- 1. ÍNDICES GEOGRÁFICOS (CRITICAL - Alta prioridade)
-- =====================================================
-- Para queries de busca por localização (lat/lng bounding box)
-- Usado em: admin/professionals/search, admin/suppliers/search, admin/map-data

-- Professionals - Geographic search
CREATE INDEX IF NOT EXISTS idx_professionals_lat_lng
ON professionals(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Equipment Suppliers - Geographic search
CREATE INDEX IF NOT EXISTS idx_suppliers_lat_lng
ON equipment_suppliers(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Event Projects - Geographic search (for map)
CREATE INDEX IF NOT EXISTS idx_event_projects_lat_lng
ON event_projects(venue_latitude, venue_longitude)
WHERE venue_latitude IS NOT NULL AND venue_longitude IS NOT NULL;

COMMENT ON INDEX idx_professionals_lat_lng IS 'Otimiza busca geográfica de profissionais';
COMMENT ON INDEX idx_suppliers_lat_lng IS 'Otimiza busca geográfica de fornecedores';
COMMENT ON INDEX idx_event_projects_lat_lng IS 'Otimiza visualização de eventos no mapa';


-- =====================================================
-- 2. ÍNDICES DE STATUS (HIGH - Alta prioridade)
-- =====================================================
-- Para filtros por status (muito comum em dashboards e listagens)

-- Professionals status
CREATE INDEX IF NOT EXISTS idx_professionals_status
ON professionals(status);

-- Event Projects status
CREATE INDEX IF NOT EXISTS idx_event_projects_status
ON event_projects(status);

-- Project Team status + professional (composite para queries complexas)
CREATE INDEX IF NOT EXISTS idx_project_team_status_prof
ON project_team(professional_id, status);

-- Project Equipment status
CREATE INDEX IF NOT EXISTS idx_project_equipment_status
ON project_equipment(status);

COMMENT ON INDEX idx_professionals_status IS 'Otimiza filtros de status em listagens';
COMMENT ON INDEX idx_event_projects_status IS 'Otimiza dashboard e filtros de projetos';
COMMENT ON INDEX idx_project_team_status_prof IS 'Otimiza dashboard do profissional';


-- =====================================================
-- 3. ÍNDICES DE FOREIGN KEYS (MEDIUM - Verificação)
-- =====================================================
-- Garante que todas as FKs tenham índices para JOINs eficientes

-- Project Team
CREATE INDEX IF NOT EXISTS idx_project_team_project
ON project_team(project_id);

CREATE INDEX IF NOT EXISTS idx_project_team_professional
ON project_team(professional_id);

-- Project Equipment
CREATE INDEX IF NOT EXISTS idx_project_equipment_project
ON project_equipment(project_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_supplier
ON project_equipment(supplier_id);

-- Supplier Quotations
CREATE INDEX IF NOT EXISTS idx_quotations_project
ON supplier_quotations(project_id);

CREATE INDEX IF NOT EXISTS idx_quotations_supplier
ON supplier_quotations(supplier_id);

-- Project Emails
CREATE INDEX IF NOT EXISTS idx_project_emails_project
ON project_emails(project_id);

COMMENT ON INDEX idx_project_team_project IS 'Otimiza JOIN de equipe com projetos';
COMMENT ON INDEX idx_project_equipment_project IS 'Otimiza JOIN de equipamentos com projetos';
COMMENT ON INDEX idx_quotations_project IS 'Otimiza busca de cotações por projeto';


-- =====================================================
-- 4. ÍNDICES COMPOSTOS ESPECÍFICOS (MEDIUM)
-- =====================================================
-- Para queries que filtram por múltiplas colunas

-- Event Projects: status + data (dashboard com filtro de período)
CREATE INDEX IF NOT EXISTS idx_event_projects_status_date
ON event_projects(status, event_date DESC);

-- Project Team: projeto + status (contagem de membros por status)
CREATE INDEX IF NOT EXISTS idx_project_team_project_status
ON project_team(project_id, status);

-- Professionals: status + created_at (listagem ordenada)
CREATE INDEX IF NOT EXISTS idx_professionals_status_created
ON professionals(status, created_at DESC);

COMMENT ON INDEX idx_event_projects_status_date IS 'Otimiza dashboard com filtros de status e período';
COMMENT ON INDEX idx_project_team_project_status IS 'Otimiza contagem de membros por status';


-- =====================================================
-- 5. ÍNDICES PARA BUSCAS DE TEXTO (LOW - Futuro)
-- =====================================================
-- Usando GIN indexes para full-text search (se necessário no futuro)

-- Descomente se precisar de busca full-text otimizada:
-- CREATE INDEX IF NOT EXISTS idx_professionals_search
-- ON professionals USING GIN(to_tsvector('portuguese',
--   coalesce(full_name, '') || ' ' ||
--   coalesce(email, '') || ' ' ||
--   coalesce(phone, '')
-- ));

-- CREATE INDEX IF NOT EXISTS idx_event_projects_search
-- ON event_projects USING GIN(to_tsvector('portuguese',
--   coalesce(event_name, '') || ' ' ||
--   coalesce(client_name, '') || ' ' ||
--   coalesce(project_number, '')
-- ));


-- =====================================================
-- 6. ÍNDICES PARA JSONB (se aplicável)
-- =====================================================
-- Para queries em colunas JSONB (categories, documents, etc)

-- Categories array - usando GIN para contains queries
CREATE INDEX IF NOT EXISTS idx_professionals_categories
ON professionals USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_suppliers_categories
ON equipment_suppliers USING GIN(categories);

COMMENT ON INDEX idx_professionals_categories IS 'Otimiza filtro por categorias usando JSONB contains';
COMMENT ON INDEX idx_suppliers_categories IS 'Otimiza filtro por categorias de fornecedores';


-- =====================================================
-- 7. ANÁLISE E ESTATÍSTICAS
-- =====================================================
-- Atualiza estatísticas para o query planner usar os novos índices

ANALYZE professionals;
ANALYZE equipment_suppliers;
ANALYZE event_projects;
ANALYZE project_team;
ANALYZE project_equipment;
ANALYZE supplier_quotations;
ANALYZE project_emails;


-- =====================================================
-- 8. VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- =====================================================
-- Query para verificar os índices criados:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
--
-- Query para ver tamanho dos índices:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND indexrelname LIKE 'idx_%'
-- ORDER BY pg_relation_size(indexrelid) DESC;
