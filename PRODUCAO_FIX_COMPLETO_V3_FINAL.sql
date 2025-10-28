-- =====================================================
-- CORREÇÕES CRÍTICAS PARA PRODUÇÃO - V3 FINAL (ULTRA SAFE)
-- Data: 2025-10-28
-- Objetivo: Corrigir 17 bloqueadores críticos identificados na auditoria
-- IMPORTANTE: Executar em ambiente de STAGING primeiro!
-- VERSÃO 3: Resolve duplicatas + Limpa dados + Aplica correções
-- =====================================================

-- =====================================================
-- PRÉ-REQUISITO 1: RESOLVER DUPLICATAS
-- =====================================================

-- 1.1 - Identificar e corrigir CPFs duplicados
-- Adicionar sufixo aos CPFs duplicados para torná-los únicos
WITH duplicates AS (
  SELECT id, cpf, ROW_NUMBER() OVER (PARTITION BY cpf ORDER BY created_at) as rn
  FROM public.professionals
  WHERE cpf IS NOT NULL
)
UPDATE public.professionals p
SET cpf = d.cpf || '_' || d.rn
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

-- 1.2 - Identificar e corrigir CNPJs duplicados
WITH duplicates AS (
  SELECT id, cnpj, ROW_NUMBER() OVER (PARTITION BY cnpj ORDER BY created_at) as rn
  FROM public.contractors
  WHERE cnpj IS NOT NULL
)
UPDATE public.contractors c
SET cnpj = d.cnpj || '_' || d.rn
FROM duplicates d
WHERE c.id = d.id
  AND d.rn > 1;

-- 1.3 - Identificar e corrigir clerk_id duplicados em contractors
WITH duplicates AS (
  SELECT id, clerk_id, ROW_NUMBER() OVER (PARTITION BY clerk_id ORDER BY created_at) as rn
  FROM public.contractors
  WHERE clerk_id IS NOT NULL
)
UPDATE public.contractors c
SET clerk_id = NULL  -- Remover clerk_id duplicado, será corrigido manualmente
FROM duplicates d
WHERE c.id = d.id
  AND d.rn > 1;

-- 1.4 - Identificar e corrigir clerk_id duplicados em professionals
WITH duplicates AS (
  SELECT id, clerk_id, ROW_NUMBER() OVER (PARTITION BY clerk_id ORDER BY created_at) as rn
  FROM public.professionals
  WHERE clerk_id IS NOT NULL
)
UPDATE public.professionals p
SET clerk_id = NULL
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

-- 1.5 - Identificar e corrigir clerk_id duplicados em equipment_suppliers
WITH duplicates AS (
  SELECT id, clerk_id, ROW_NUMBER() OVER (PARTITION BY clerk_id ORDER BY created_at) as rn
  FROM public.equipment_suppliers
  WHERE clerk_id IS NOT NULL
)
UPDATE public.equipment_suppliers s
SET clerk_id = NULL
FROM duplicates d
WHERE s.id = d.id
  AND d.rn > 1;

-- =====================================================
-- PRÉ-REQUISITO 2: LIMPEZA DE DADOS INCONSISTENTES
-- =====================================================

-- 2.1 - Limpar CPFs com formato incorreto (manter apenas dígitos)
-- Mas PRESERVAR os que foram marcados com _2, _3, etc (duplicatas)
UPDATE public.professionals
SET cpf = regexp_replace(cpf, '[^0-9_]', '', 'g')
WHERE cpf IS NOT NULL
  AND cpf !~ '^\d{11}(_\d+)?$';

-- 2.2 - Limpar CNPJs com formato incorreto
UPDATE public.contractors
SET cnpj = regexp_replace(cnpj, '[^0-9_]', '', 'g')
WHERE cnpj IS NOT NULL
  AND cnpj !~ '^\d{14}(_\d+)?$';

-- 2.3 - Limpar telefones (manter apenas dígitos)
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
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_select_admin ON public.users;

CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

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

CREATE POLICY professionals_select_own
  ON public.professionals
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

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

CREATE POLICY suppliers_select_active
  ON public.equipment_suppliers
  FOR SELECT
  USING (status = 'active');

-- 1.6 - Políticas RLS para EVENT_PROJECTS
DROP POLICY IF EXISTS projects_select_admin ON public.event_projects;
DROP POLICY IF EXISTS projects_select_team_member ON public.event_projects;

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

CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id ON public.contractors(clerk_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON public.contractors(status);

CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_approved_by ON public.professionals(approved_by);
CREATE INDEX IF NOT EXISTS idx_professionals_clerk_id ON public.professionals(clerk_id);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON public.professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON public.professionals(email);

CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_clerk_id ON public.equipment_suppliers(clerk_id);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_status ON public.equipment_suppliers(status);

CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_supplier_id ON public.event_projects(equipment_supplier_id);
CREATE INDEX IF NOT EXISTS idx_event_projects_status ON public.event_projects(status);
CREATE INDEX IF NOT EXISTS idx_event_projects_event_date ON public.event_projects(event_date);
CREATE INDEX IF NOT EXISTS idx_event_projects_project_number ON public.event_projects(project_number);

CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_professional_id ON public.project_team(professional_id);
CREATE INDEX IF NOT EXISTS idx_project_team_status ON public.project_team(status);
CREATE INDEX IF NOT EXISTS idx_project_team_invitation_token ON public.project_team(invitation_token);

CREATE INDEX IF NOT EXISTS idx_project_equipment_project_id ON public.project_equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_supplier_id ON public.project_equipment(selected_supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_status ON public.project_equipment(status);

CREATE INDEX IF NOT EXISTS idx_supplier_quotations_project_id ON public.supplier_quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_supplier_id ON public.supplier_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_token ON public.supplier_quotations(token);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_status ON public.supplier_quotations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_professional_id ON public.notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_supplier_id ON public.notifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_validations_professional_id ON public.document_validations(professional_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_reviewed_by ON public.document_validations(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON public.document_validations(status);

CREATE INDEX IF NOT EXISTS idx_professional_history_professional_id ON public.professional_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_history_action_by ON public.professional_history(action_by);
CREATE INDEX IF NOT EXISTS idx_professional_history_created_at ON public.professional_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_reviews_project_id ON public.professional_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_team_member_id ON public.professional_reviews(team_member_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional_id ON public.professional_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewed_by ON public.professional_reviews(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_supplier_reviews_project_id ON public.supplier_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_quotation_id ON public.supplier_reviews(quotation_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_id ON public.supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_reviewed_by ON public.supplier_reviews(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_requests_contractor_id ON public.requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_request_number ON public.requests(request_number);

CREATE INDEX IF NOT EXISTS idx_project_emails_project_id ON public.project_emails(project_id);
CREATE INDEX IF NOT EXISTS idx_project_emails_status ON public.project_emails(status);
CREATE INDEX IF NOT EXISTS idx_project_emails_sent_at ON public.project_emails(sent_at DESC);

-- =====================================================
-- FASE 3: CRIAR ÍNDICES GIN PARA CAMPOS JSONB
-- Bloqueador #4 - CRÍTICO - Queries em JSONB muito lentas
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_professionals_categories_gin ON public.professionals USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_professionals_subcategories_gin ON public.professionals USING gin(subcategories);
CREATE INDEX IF NOT EXISTS idx_professionals_certifications_gin ON public.professionals USING gin(certifications);
CREATE INDEX IF NOT EXISTS idx_professionals_availability_gin ON public.professionals USING gin(availability);
CREATE INDEX IF NOT EXISTS idx_professionals_documents_gin ON public.professionals USING gin(documents);

CREATE INDEX IF NOT EXISTS idx_event_projects_professionals_needed_gin ON public.event_projects USING gin(professionals_needed);
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_needed_gin ON public.event_projects USING gin(equipment_needed);

CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_equipment_catalog_gin ON public.equipment_suppliers USING gin(equipment_catalog);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_pricing_gin ON public.equipment_suppliers USING gin(pricing);

CREATE INDEX IF NOT EXISTS idx_project_equipment_specifications_gin ON public.project_equipment USING gin(specifications);

CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin ON public.notifications USING gin(metadata);

-- =====================================================
-- FASE 4: ÍNDICES COMPOSTOS PARA QUERIES COMUNS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_professionals_status_location
  ON public.professionals(status, latitude, longitude)
  WHERE status = 'approved' AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_projects_status_date
  ON public.event_projects(status, event_date)
  WHERE status IN ('new', 'analyzing', 'quoting', 'proposed', 'approved', 'in_execution');

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_project_team_project_status
  ON public.project_team(project_id, status);

-- =====================================================
-- FASE 5: CHECK CONSTRAINTS (APENAS OS SEGUROS)
-- =====================================================

ALTER TABLE public.event_projects DROP CONSTRAINT IF EXISTS check_total_cost_positive;
ALTER TABLE public.event_projects ADD CONSTRAINT check_total_cost_positive CHECK (total_cost >= 0);

ALTER TABLE public.event_projects DROP CONSTRAINT IF EXISTS check_total_client_price_positive;
ALTER TABLE public.event_projects ADD CONSTRAINT check_total_client_price_positive CHECK (total_client_price >= 0);

ALTER TABLE public.project_team DROP CONSTRAINT IF EXISTS check_daily_rate_positive;
ALTER TABLE public.project_team ADD CONSTRAINT check_daily_rate_positive CHECK (daily_rate IS NULL OR daily_rate >= 0);

ALTER TABLE public.project_equipment DROP CONSTRAINT IF EXISTS check_daily_rate_positive_equipment;
ALTER TABLE public.project_equipment ADD CONSTRAINT check_daily_rate_positive_equipment CHECK (daily_rate IS NULL OR daily_rate >= 0);

-- =====================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- =====================================================

-- Verificar RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'professionals', 'contractors', 'equipment_suppliers')
ORDER BY tablename;

-- Contar índices
SELECT tablename, COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY total_indexes DESC;

-- Verificar duplicatas resolvidas
SELECT
  'professionals' as tabela,
  COUNT(*) FILTER (WHERE cpf LIKE '%\_%') as cpfs_marcados_duplicados
FROM public.professionals
UNION ALL
SELECT
  'contractors',
  COUNT(*) FILTER (WHERE cnpj LIKE '%\_%')
FROM public.contractors;

-- =====================================================
-- RESUMO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SCRIPT V3 EXECUTADO COM SUCESSO!';
  RAISE NOTICE '📊 CORREÇÕES APLICADAS:';
  RAISE NOTICE '   ✅ Duplicatas resolvidas (CPF, CNPJ, clerk_id)';
  RAISE NOTICE '   ✅ Dados limpos (telefones, CPFs, CNPJs)';
  RAISE NOTICE '   ✅ RLS habilitado em 12 tabelas';
  RAISE NOTICE '   ✅ 40+ índices de FK criados';
  RAISE NOTICE '   ✅ 11 índices GIN para JSONB';
  RAISE NOTICE '   ✅ 4 índices compostos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATENÇÃO:';
  RAISE NOTICE '   - CPFs/CNPJs duplicados foram marcados com _2, _3, etc';
  RAISE NOTICE '   - clerk_id duplicados foram removidos (NULL)';
  RAISE NOTICE '   - Revise manualmente os registros duplicados';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Validar aplicação funciona';
  RAISE NOTICE '   2. Remover console.log das APIs';
  RAISE NOTICE '   3. Deploy em produção';
END $$;
