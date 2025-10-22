-- =====================================================
-- Migration: Adicionar Índices de Performance
-- Data: 2025-10-21
-- Descrição: Otimizar queries mais comuns da aplicação
-- =====================================================

-- =====================================================
-- 0. HABILITAR EXTENSÃO pg_trgm (PRECISA SER PRIMEIRO!)
-- =====================================================

-- Necessário para índices GIN com gin_trgm_ops (full-text search)
-- IMPORTANTE: Precisa ser criado ANTES dos índices GIN
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 1. PROFESSIONALS - Tabela mais consultada
-- =====================================================

-- Índice para busca por clerk_id (usado em quase toda API)
-- Query: SELECT * FROM professionals WHERE clerk_id = 'user_xxx'
CREATE INDEX IF NOT EXISTS idx_professionals_clerk_id
ON professionals(clerk_id);

-- Índice para busca por user_id (usado após lookup de clerk_id)
-- Query: SELECT * FROM professionals WHERE user_id = 'uuid'
CREATE INDEX IF NOT EXISTS idx_professionals_user_id
ON professionals(user_id);

-- Índice para busca por CPF (validação de duplicados)
-- Query: SELECT * FROM professionals WHERE cpf = 'xxx.xxx.xxx-xx'
CREATE INDEX IF NOT EXISTS idx_professionals_cpf
ON professionals(cpf);

-- Índice para busca por email (login alternativo, validação)
-- Query: SELECT * FROM professionals WHERE email = 'xxx@example.com'
CREATE INDEX IF NOT EXISTS idx_professionals_email
ON professionals(email);

-- Índice para busca por status (filtro admin comum)
-- Query: SELECT * FROM professionals WHERE status = 'approved'
CREATE INDEX IF NOT EXISTS idx_professionals_status
ON professionals(status);

-- Índice para ordenação por nome (ordenação padrão)
-- Query: SELECT * FROM professionals ORDER BY full_name
CREATE INDEX IF NOT EXISTS idx_professionals_full_name
ON professionals(full_name);

-- Índice para busca por cidade/estado (filtros geográficos)
-- Query: SELECT * FROM professionals WHERE city = 'São Paulo' AND state = 'SP'
CREATE INDEX IF NOT EXISTS idx_professionals_location
ON professionals(state, city);

-- Índice GIN para busca full-text em nome
-- Query: SELECT * FROM professionals WHERE full_name ILIKE '%termo%'
CREATE INDEX IF NOT EXISTS idx_professionals_full_name_gin
ON professionals USING GIN (full_name gin_trgm_ops);

-- Índice GIN para array JSONB de categorias
-- Melhora performance de filtros de categoria
CREATE INDEX IF NOT EXISTS idx_professionals_categories_gin
ON professionals USING GIN (categories);

-- Índice para busca por proximidade geográfica
-- Query: SELECT * FROM professionals WHERE latitude BETWEEN x AND y
CREATE INDEX IF NOT EXISTS idx_professionals_geolocation
ON professionals(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =====================================================
-- 2. USERS - Tabela de autenticação
-- =====================================================

-- Índice para busca por clerk_id (lookup principal)
-- Query: SELECT * FROM users WHERE clerk_id = 'user_xxx'
CREATE INDEX IF NOT EXISTS idx_users_clerk_id
ON users(clerk_id);

-- Índice para busca por email (login/verificação)
-- Query: SELECT * FROM users WHERE email = 'xxx@example.com'
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Índice para filtro por role (admin checks)
-- Query: SELECT * FROM users WHERE role = 'admin'
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- Índice para filtro por user_type
-- Query: SELECT * FROM users WHERE user_type = 'professional'
CREATE INDEX IF NOT EXISTS idx_users_user_type
ON users(user_type);

-- =====================================================
-- 3. DOCUMENT_VALIDATIONS - Histórico de documentos
-- =====================================================

-- Índice composto para busca de validações por profissional
-- Query: SELECT * FROM document_validations
--        WHERE professional_id = 'uuid' AND document_type = 'rg_front'
CREATE INDEX IF NOT EXISTS idx_document_validations_professional_type
ON document_validations(professional_id, document_type);

-- Índice para ordenação por versão (buscar última versão)
-- Query: SELECT * FROM document_validations
--        WHERE professional_id = 'uuid' ORDER BY version DESC
CREATE INDEX IF NOT EXISTS idx_document_validations_version
ON document_validations(professional_id, version DESC);

-- Índice para busca por status de validação
-- Query: SELECT * FROM document_validations WHERE status = 'rejected'
CREATE INDEX IF NOT EXISTS idx_document_validations_status
ON document_validations(status);

-- =====================================================
-- 4. CONTRACTORS - Contratantes
-- =====================================================

-- Índice para busca por CNPJ (validação de duplicados)
-- Query: SELECT * FROM contractors WHERE cnpj = 'xx.xxx.xxx/xxxx-xx'
CREATE INDEX IF NOT EXISTS idx_contractors_cnpj
ON contractors(cnpj);

-- Índice para busca por user_id (FK para users)
-- Query: SELECT * FROM contractors WHERE user_id = 'uuid'
CREATE INDEX IF NOT EXISTS idx_contractors_user_id
ON contractors(user_id);

-- Índice para busca por email
-- Query: SELECT * FROM contractors WHERE email = 'xxx@example.com'
CREATE INDEX IF NOT EXISTS idx_contractors_email
ON contractors(email);

-- =====================================================
-- 5. CONTRACTOR_REQUESTS - Solicitações
-- =====================================================

-- Índice para busca por clerk_id (filtrar solicitações de um usuário)
-- Query: SELECT * FROM contractor_requests WHERE clerk_id = 'user_xxx'
CREATE INDEX IF NOT EXISTS idx_contractor_requests_clerk_id
ON contractor_requests(clerk_id);

-- Índice para busca por status
-- Query: SELECT * FROM contractor_requests WHERE status = 'pending'
CREATE INDEX IF NOT EXISTS idx_contractor_requests_status
ON contractor_requests(status);

-- Índice para ordenação por data de início do evento
-- Query: SELECT * FROM contractor_requests ORDER BY start_date
CREATE INDEX IF NOT EXISTS idx_contractor_requests_start_date
ON contractor_requests(start_date);

-- =====================================================
-- 6. EVENT_ALLOCATIONS - Alocações de profissionais
-- =====================================================

-- Índice para busca por request_id (profissionais de uma solicitação)
-- Query: SELECT * FROM event_allocations WHERE request_id = 'uuid'
CREATE INDEX IF NOT EXISTS idx_event_allocations_request
ON event_allocations(request_id);

-- NOTA: professional_id não existe como coluna, está dentro do JSONB allocations
-- Para buscar por professional_id, seria necessário um índice GIN no JSONB:
-- CREATE INDEX idx_event_allocations_jsonb ON event_allocations USING GIN (allocations);

-- =====================================================
-- 7. CATEGORIES & EVENT_TYPES - Lookups
-- =====================================================

-- Índice para ordenação por nome
CREATE INDEX IF NOT EXISTS idx_categories_name
ON categories(name);

CREATE INDEX IF NOT EXISTS idx_event_types_name
ON event_types(name);

-- =====================================================
-- 8. EQUIPMENT_SUPPLIERS - Fornecedores
-- =====================================================

-- Índice para busca por email
-- Query: SELECT * FROM equipment_suppliers WHERE email = 'xxx@example.com'
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_email
ON equipment_suppliers(email);

-- Índice para busca por status
-- Query: SELECT * FROM equipment_suppliers WHERE status = 'active'
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_status
ON equipment_suppliers(status);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON INDEX idx_professionals_clerk_id IS 'Otimiza lookup por Clerk user ID';
COMMENT ON INDEX idx_professionals_user_id IS 'Otimiza lookup por Supabase user ID';
COMMENT ON INDEX idx_professionals_cpf IS 'Otimiza validação de CPF duplicado';
COMMENT ON INDEX idx_professionals_email IS 'Otimiza busca por email';
COMMENT ON INDEX idx_professionals_status IS 'Otimiza filtro por status (pending/approved/rejected)';
COMMENT ON INDEX idx_professionals_full_name IS 'Otimiza ordenação alfabética';
COMMENT ON INDEX idx_professionals_location IS 'Otimiza filtros por cidade/estado';
COMMENT ON INDEX idx_professionals_full_name_gin IS 'Otimiza busca full-text em nome (ILIKE)';
COMMENT ON INDEX idx_professionals_categories_gin IS 'Otimiza filtros de categoria (JSONB array)';
COMMENT ON INDEX idx_professionals_geolocation IS 'Otimiza busca por proximidade geográfica';

COMMENT ON INDEX idx_users_clerk_id IS 'Otimiza autenticação via Clerk';
COMMENT ON INDEX idx_users_email IS 'Otimiza login/verificação por email';
COMMENT ON INDEX idx_users_role IS 'Otimiza verificação de permissões admin';

COMMENT ON INDEX idx_document_validations_professional_type IS 'Otimiza busca de validações por profissional e tipo';
COMMENT ON INDEX idx_document_validations_version IS 'Otimiza busca da última versão de documento';

-- =====================================================
-- ANÁLISE DE PERFORMANCE
-- =====================================================

-- Após criar os índices, execute para atualizar estatísticas:
-- ANALYZE professionals;
-- ANALYZE users;
-- ANALYZE document_validations;
-- ANALYZE contractors;
-- ANALYZE contractor_requests;
-- ANALYZE event_allocations;
