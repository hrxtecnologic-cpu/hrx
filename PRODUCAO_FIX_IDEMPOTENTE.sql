-- =====================================================
-- CORREÇÕES PARA PRODUÇÃO - VERSÃO IDEMPOTENTE
-- Pode ser executado MÚLTIPLAS VEZES sem erro!
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR ÍNDICES (SEMPRE SEGURO)
-- =====================================================

-- Contractors
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id ON public.contractors(clerk_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON public.contractors(status);

-- Professionals
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_approved_by ON public.professionals(approved_by);
CREATE INDEX IF NOT EXISTS idx_professionals_clerk_id ON public.professionals(clerk_id);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON public.professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON public.professionals(email);

-- Equipment Suppliers
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_clerk_id ON public.equipment_suppliers(clerk_id);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_status ON public.equipment_suppliers(status);

-- Event Projects
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_supplier_id ON public.event_projects(equipment_supplier_id);
CREATE INDEX IF NOT EXISTS idx_event_projects_status ON public.event_projects(status);
CREATE INDEX IF NOT EXISTS idx_event_projects_event_date ON public.event_projects(event_date);
CREATE INDEX IF NOT EXISTS idx_event_projects_project_number ON public.event_projects(project_number);

-- Project Team
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON public.project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_professional_id ON public.project_team(professional_id);
CREATE INDEX IF NOT EXISTS idx_project_team_status ON public.project_team(status);
CREATE INDEX IF NOT EXISTS idx_project_team_invitation_token ON public.project_team(invitation_token);

-- Project Equipment
CREATE INDEX IF NOT EXISTS idx_project_equipment_project_id ON public.project_equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_supplier_id ON public.project_equipment(selected_supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_equipment_status ON public.project_equipment(status);

-- Supplier Quotations
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_project_id ON public.supplier_quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_supplier_id ON public.supplier_quotations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_token ON public.supplier_quotations(token);
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_status ON public.supplier_quotations(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_professional_id ON public.notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_supplier_id ON public.notifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Document Validations
CREATE INDEX IF NOT EXISTS idx_document_validations_professional_id ON public.document_validations(professional_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_reviewed_by ON public.document_validations(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON public.document_validations(status);

-- Professional History
CREATE INDEX IF NOT EXISTS idx_professional_history_professional_id ON public.professional_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_history_action_by ON public.professional_history(action_by);
CREATE INDEX IF NOT EXISTS idx_professional_history_created_at ON public.professional_history(created_at DESC);

-- Professional Reviews
CREATE INDEX IF NOT EXISTS idx_professional_reviews_project_id ON public.professional_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_team_member_id ON public.professional_reviews(team_member_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional_id ON public.professional_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewed_by ON public.professional_reviews(reviewed_by);

-- Supplier Reviews
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_project_id ON public.supplier_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_quotation_id ON public.supplier_reviews(quotation_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_id ON public.supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_reviewed_by ON public.supplier_reviews(reviewed_by);

-- Others
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_contractor_id ON public.requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_request_number ON public.requests(request_number);
CREATE INDEX IF NOT EXISTS idx_project_emails_project_id ON public.project_emails(project_id);
CREATE INDEX IF NOT EXISTS idx_project_emails_status ON public.project_emails(status);
CREATE INDEX IF NOT EXISTS idx_project_emails_sent_at ON public.project_emails(sent_at DESC);

-- =====================================================
-- PARTE 2: ÍNDICES GIN PARA JSONB
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
-- PARTE 3: ÍNDICES COMPOSTOS
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
-- PARTE 4: CHECK CONSTRAINTS (SEMPRE SEGUROS)
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
-- RESUMO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ÍNDICES E CONSTRAINTS APLICADOS!';
  RAISE NOTICE '📊 Total: ~55 índices + 4 constraints';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATENÇÃO: RLS NÃO FOI HABILITADO!';
  RAISE NOTICE '   Para habilitar RLS, execute manualmente:';
  RAISE NOTICE '   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;';
  RAISE NOTICE '   (e crie as políticas necessárias)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Este script pode ser executado múltiplas vezes.';
END $$;
