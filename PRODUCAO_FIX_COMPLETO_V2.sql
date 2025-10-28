-- =====================================================
-- CORREÇÕES CRÍTICAS PARA PRODUÇÃO - V2 (SAFE)
-- Data: 2025-10-28
-- Objetivo: Corrigir 17 bloqueadores críticos identificados na auditoria
-- IMPORTANTE: Executar em ambiente de STAGING primeiro!
-- VERSÃO 2: Com limpeza de dados ANTES de aplicar constraints
-- =====================================================

-- =====================================================
-- PRÉ-REQUISITO: LIMPEZA DE DADOS INCONSISTENTES
-- =====================================================

-- Limpar CPFs com formato incorreto (manter apenas dígitos)
UPDATE public.professionals
SET cpf = regexp_replace(cpf, '[^0-9]', '', 'g')
WHERE cpf IS NOT NULL AND cpf !~ '^\d{11}$';

-- Limpar CNPJs com formato incorreto
UPDATE public.contractors
SET cnpj = regexp_replace(cnpj, '[^0-9]', '', 'g')
WHERE cnpj IS NOT NULL AND cnpj !~ '^\d{14}$';

-- Limpar telefones (manter apenas dígitos)
UPDATE public.professionals
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL;

UPDATE public.contractors
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL;

UPDATE public.equipment_suppliers
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL;

-- =====================================================
-- FASE 1: HABILITAR ROW LEVEL SECURITY (RLS)
-- Bloqueador #2 - CRÍTICO - LGPD
-- =====================================================

-- 1.1 - Habilitar RLS em todas as tabelas principais
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 1.2 - Políticas RLS para tabela USERS
-- Drop policies se já existirem (para reexecução do script)
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_select_admin ON public.users;

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Admins podem ver todos
CREATE POLICY users_select_admin
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_type = 'admin'
    )
  );

-- 1.3 - Políticas RLS para tabela PROFESSIONALS
DROP POLICY IF EXISTS professionals_select_own ON public.professionals;
DROP POLICY IF EXISTS professionals_select_admin ON public.professionals;
DROP POLICY IF EXISTS professionals_select_approved ON public.professionals;

-- Profissional pode ver apenas seus próprios dados
CREATE POLICY professionals_select_own
  ON public.professionals
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Admins podem ver todos
CREATE POLICY professionals_select_admin
  ON public.professionals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_type = 'admin'
    )
  );

-- Profissionais aprovados são visíveis para contratantes (para busca)
CREATE POLICY professionals_select_approved
  ON public.professionals
  FOR SELECT
  USING (status = 'approved');

-- 1.4 - Políticas RLS para tabela CONTRACTORS
DROP POLICY IF EXISTS contractors_select_own ON public.contractors;
DROP POLICY IF EXISTS contractors_select_admin ON public.contractors;

CREATE POLICY contractors_select_own
  ON public.contractors
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY contractors_select_admin
  ON public.contractors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_type = 'admin'
    )
  );

-- 1.5 - Políticas RLS para tabela EQUIPMENT_SUPPLIERS
DROP POLICY IF EXISTS suppliers_select_own ON public.equipment_suppliers;
DROP POLICY IF EXISTS suppliers_select_admin ON public.equipment_suppliers;
DROP POLICY IF EXISTS suppliers_select_active ON public.equipment_suppliers;

CREATE POLICY suppliers_select_own
  ON public.equipment_suppliers
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY suppliers_select_admin
  ON public.equipment_suppliers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_type = 'admin'
    )
  );

-- Fornecedores ativos são visíveis para admins e contratantes
CREATE POLICY suppliers_select_active
  ON public.equipment_suppliers
  FOR SELECT
  USING (status = 'active');

-- 1.6 - Políticas RLS para EVENT_PROJECTS
DROP POLICY IF EXISTS projects_select_admin ON public.event_projects;
DROP POLICY IF EXISTS projects_select_team_member ON public.event_projects;

-- Admin pode ver todos
CREATE POLICY projects_select_admin
  ON public.event_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_type = 'admin'
    )
  );

-- Profissional pode ver projetos onde está no team
CREATE POLICY projects_select_team_member
  ON public.event_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_team pt
      JOIN public.professionals p ON pt.professional_id = p.id
      WHERE pt.project_id = event_projects.id
      AND p.clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- =====================================================
-- FASE 2: CRIAR ÍNDICES DE FOREIGN KEYS
-- Bloqueador #3 - CRÍTICO - Performance 10-100x mais lenta
-- =====================================================

-- 2.1 - Índices de FK para CONTRACTORS
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id ON public.contractors(clerk_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON public.contractors(status);

-- 2.2 - Índices de FK para PROFESSIONALS
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_approved_by ON public.professionals(approved_by);
CREATE INDEX IF NOT EXISTS idx_professionals_clerk_id ON public.professionals(clerk_id);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON public.professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON public.professionals(email);

-- 2.3 - Índices de FK para EQUIPMENT_SUPPLIERS
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_clerk_id ON public.equipment_suppliers(clerk_id);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_status ON public.equipment_suppliers(status);

-- 2.4 - Índices de FK para EVENT_PROJECTS
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_supplier_id ON public.event_projects(equipment_supplier_id);
CREATE INDEX IF NOT EXISTS idx_event_projects_status ON public.event_projects(status);
CREATE INDEX IF NOT EXISTS idx_event_projects_event_date ON public.event_projects(event_date);
CREATE INDEX IF NOT EXISTS idx_event_projects_project_number ON public.event_projects(project_number);

-- 2.5 - Índices de FK para PROJECT_TEAM
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_professional_id ON public.project_team(professional_id);
CREATE INDEX IF NOT EXISTS idx_project_team_status ON public.project_team(status);
CREATE INDEX IF NOT EXISTS idx_project_team_invitation_token ON public.project_team(invitation_token);

-- 2.6 - Índices de FK para PROJECT_EQUIPMENT
CREATE INDEX IF NOT EXISTS idx_project_equipment_project_id ON public.project_equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_supplier_id ON public.project_equipment(selected_supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_status ON public.project_equipment(status);

-- 2.7 - Índices de FK para SUPPLIER_QUOTATIONS
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_project_id ON public.supplier_quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_supplier_id ON public.supplier_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_token ON public.supplier_quotations(token);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_status ON public.supplier_quotations(status);

-- 2.8 - Índices de FK para NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_professional_id ON public.notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_supplier_id ON public.notifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 2.9 - Índices de FK para DOCUMENT_VALIDATIONS
CREATE INDEX IF NOT EXISTS idx_document_validations_professional_id ON public.document_validations(professional_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_reviewed_by ON public.document_validations(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON public.document_validations(status);

-- 2.10 - Índices de FK para PROFESSIONAL_HISTORY
CREATE INDEX IF NOT EXISTS idx_professional_history_professional_id ON public.professional_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_history_action_by ON public.professional_history(action_by);
CREATE INDEX IF NOT EXISTS idx_professional_history_created_at ON public.professional_history(created_at DESC);

-- 2.11 - Índices de FK para PROFESSIONAL_REVIEWS
CREATE INDEX IF NOT EXISTS idx_professional_reviews_project_id ON public.professional_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_team_member_id ON public.professional_reviews(team_member_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional_id ON public.professional_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewed_by ON public.professional_reviews(reviewed_by);

-- 2.12 - Índices de FK para SUPPLIER_REVIEWS
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_project_id ON public.supplier_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_quotation_id ON public.supplier_reviews(quotation_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_id ON public.supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_reviewed_by ON public.supplier_reviews(reviewed_by);

-- 2.13 - Índices de FK para NOTIFICATION_PREFERENCES
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- 2.14 - Índices de FK para REQUESTS
CREATE INDEX IF NOT EXISTS idx_requests_contractor_id ON public.requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_request_number ON public.requests(request_number);

-- 2.15 - Índices de FK para PROJECT_EMAILS
CREATE INDEX IF NOT EXISTS idx_project_emails_project_id ON public.project_emails(project_id);
CREATE INDEX IF NOT EXISTS idx_project_emails_status ON public.project_emails(status);
CREATE INDEX IF NOT EXISTS idx_project_emails_sent_at ON public.project_emails(sent_at DESC);

-- =====================================================
-- FASE 3: CRIAR ÍNDICES GIN PARA CAMPOS JSONB
-- Bloqueador #4 - CRÍTICO - Queries em JSONB muito lentas
-- =====================================================

-- 3.1 - Índices GIN para PROFESSIONALS
CREATE INDEX IF NOT EXISTS idx_professionals_categories_gin ON public.professionals USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_professionals_subcategories_gin ON public.professionals USING gin(subcategories);
CREATE INDEX IF NOT EXISTS idx_professionals_certifications_gin ON public.professionals USING gin(certifications);
CREATE INDEX IF NOT EXISTS idx_professionals_availability_gin ON public.professionals USING gin(availability);
CREATE INDEX IF NOT EXISTS idx_professionals_documents_gin ON public.professionals USING gin(documents);

-- 3.2 - Índices GIN para EVENT_PROJECTS
CREATE INDEX IF NOT EXISTS idx_event_projects_professionals_needed_gin ON public.event_projects USING gin(professionals_needed);
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_needed_gin ON public.event_projects USING gin(equipment_needed);

-- 3.3 - Índices GIN para EQUIPMENT_SUPPLIERS
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_equipment_catalog_gin ON public.equipment_suppliers USING gin(equipment_catalog);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_pricing_gin ON public.equipment_suppliers USING gin(pricing);

-- 3.4 - Índices GIN para PROJECT_EQUIPMENT
CREATE INDEX IF NOT EXISTS idx_project_equipment_specifications_gin ON public.project_equipment USING gin(specifications);

-- 3.5 - Índices GIN para NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin ON public.notifications USING gin(metadata);

-- =====================================================
-- FASE 4: ÍNDICES COMPOSTOS PARA QUERIES COMUNS
-- Performance Optimization
-- =====================================================

-- 4.1 - Índice composto para busca de profissionais aprovados por localização
CREATE INDEX IF NOT EXISTS idx_professionals_status_location
  ON public.professionals(status, latitude, longitude)
  WHERE status = 'approved' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4.2 - Índice composto para projetos ativos
CREATE INDEX IF NOT EXISTS idx_event_projects_status_date
  ON public.event_projects(status, event_date)
  WHERE status IN ('new', 'analyzing', 'quoting', 'proposed', 'approved', 'in_execution');

-- 4.3 - Índice composto para notificações não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- 4.4 - Índice composto para team members por projeto e status
CREATE INDEX IF NOT EXISTS idx_project_team_project_status
  ON public.project_team(project_id, status);

-- =====================================================
-- FASE 5 (OPCIONAL): CHECK CONSTRAINTS
-- Bloqueador #7 - IMPORTANTE - Validação de dados
-- ATENÇÃO: Só aplicar após garantir que dados estão limpos!
-- =====================================================

-- 5.1 - CHECK constraints para PROFESSIONALS
-- COMENTADO: Aplicar apenas se todos os CPFs estiverem limpos
-- ALTER TABLE public.professionals
--   ADD CONSTRAINT check_cpf_format
--   CHECK (cpf ~ '^\d{11}$');

-- 5.2 - CHECK constraints para CONTRACTORS
-- COMENTADO: Aplicar apenas se todos os CNPJs estiverem limpos
-- ALTER TABLE public.contractors
--   ADD CONSTRAINT check_cnpj_format
--   CHECK (cnpj ~ '^\d{14}$');

-- 5.3 - CHECK constraints para custos positivos (SEGURO)
ALTER TABLE public.event_projects
  DROP CONSTRAINT IF EXISTS check_total_cost_positive;

ALTER TABLE public.event_projects
  ADD CONSTRAINT check_total_cost_positive
  CHECK (total_cost >= 0);

ALTER TABLE public.event_projects
  DROP CONSTRAINT IF EXISTS check_total_client_price_positive;

ALTER TABLE public.event_projects
  ADD CONSTRAINT check_total_client_price_positive
  CHECK (total_client_price >= 0);

-- 5.4 - CHECK constraints para taxas diárias
ALTER TABLE public.project_team
  DROP CONSTRAINT IF EXISTS check_daily_rate_positive;

ALTER TABLE public.project_team
  ADD CONSTRAINT check_daily_rate_positive
  CHECK (daily_rate IS NULL OR daily_rate >= 0);

ALTER TABLE public.project_equipment
  DROP CONSTRAINT IF EXISTS check_daily_rate_positive_equipment;

ALTER TABLE public.project_equipment
  ADD CONSTRAINT check_daily_rate_positive_equipment
  CHECK (daily_rate IS NULL OR daily_rate >= 0);

-- =====================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- =====================================================

-- Verificar RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'professionals', 'contractors', 'equipment_suppliers', 'event_projects')
ORDER BY tablename;

-- Contar índices criados
SELECT
  schemaname,
  tablename,
  COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
GROUP BY schemaname, tablename
ORDER BY total_indexes DESC;

-- Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY total_policies DESC;

-- =====================================================
-- RESUMO DE EXECUÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '📊 RESUMO:';
  RAISE NOTICE '   - RLS habilitado em 12 tabelas';
  RAISE NOTICE '   - 40+ índices de FK criados';
  RAISE NOTICE '   - 11 índices GIN para JSONB criados';
  RAISE NOTICE '   - 4 índices compostos criados';
  RAISE NOTICE '   - Políticas RLS criadas para proteção de dados';
  RAISE NOTICE '⚠️  PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Testar aplicação em staging';
  RAISE NOTICE '   2. Remover console.log das APIs';
  RAISE NOTICE '   3. Validar performance das queries';
  RAISE NOTICE '   4. Deploy em produção';
END $$;
