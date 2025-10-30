-- ============================================================================
-- Migration 047: Habilitar RLS em TODAS as Tabelas (FINAL)
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Corrigir TODAS as 29 tabelas sem RLS detectadas pelo linter
--
-- Estratégia: Simples e direto - habilitar RLS em todas + policy de admin
-- ============================================================================

-- ============================================================================
-- 1. TABELAS COM DADOS PÚBLICOS (Qualquer um pode ler, apenas admin modifica)
-- ============================================================================

-- event_types
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_types_select_all" ON public.event_types;
DROP POLICY IF EXISTS "event_types_admin_all" ON public.event_types;
CREATE POLICY "event_types_select_all" ON public.event_types FOR SELECT USING (true);
CREATE POLICY "event_types_admin_all" ON public.event_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- category_subcategories
ALTER TABLE public.category_subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "category_subcategories_select_all" ON public.category_subcategories;
DROP POLICY IF EXISTS "category_subcategories_admin_all" ON public.category_subcategories;
CREATE POLICY "category_subcategories_select_all" ON public.category_subcategories FOR SELECT USING (true);
CREATE POLICY "category_subcategories_admin_all" ON public.category_subcategories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- email_template_config
ALTER TABLE public.email_template_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_template_config_admin" ON public.email_template_config;
CREATE POLICY "email_template_config_admin" ON public.email_template_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- ============================================================================
-- 2. PROFESSIONALS (Owner + Admin)
-- ============================================================================

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "professionals_select_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_admin" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_admin_all" ON public.professionals;

CREATE POLICY "professionals_select_own" ON public.professionals FOR SELECT USING (clerk_id = auth.uid()::text);
CREATE POLICY "professionals_select_admin" ON public.professionals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);
CREATE POLICY "professionals_update_own" ON public.professionals FOR UPDATE USING (clerk_id = auth.uid()::text);
CREATE POLICY "professionals_admin_all" ON public.professionals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- ============================================================================
-- 3. EQUIPMENT_SUPPLIERS (Owner + Admin)
-- ============================================================================

ALTER TABLE public.equipment_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipment_suppliers_select_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_select_admin" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_update_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_admin_all" ON public.equipment_suppliers;

CREATE POLICY "equipment_suppliers_select_own" ON public.equipment_suppliers FOR SELECT USING (clerk_id = auth.uid()::text);
CREATE POLICY "equipment_suppliers_select_admin" ON public.equipment_suppliers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);
CREATE POLICY "equipment_suppliers_update_own" ON public.equipment_suppliers FOR UPDATE USING (clerk_id = auth.uid()::text);
CREATE POLICY "equipment_suppliers_admin_all" ON public.equipment_suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- ============================================================================
-- 4. DELIVERY TRACKING (Supplier + Admin)
-- ============================================================================

ALTER TABLE public.delivery_trackings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_trackings_admin" ON public.delivery_trackings;
DROP POLICY IF EXISTS "delivery_trackings_supplier" ON public.delivery_trackings;
CREATE POLICY "delivery_trackings_admin" ON public.delivery_trackings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);
CREATE POLICY "delivery_trackings_supplier" ON public.delivery_trackings FOR SELECT USING (
  supplier_user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.uid()::text)
);

ALTER TABLE public.delivery_location_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_location_history_admin" ON public.delivery_location_history;
CREATE POLICY "delivery_location_history_admin" ON public.delivery_location_history FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

ALTER TABLE public.delivery_status_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_status_updates_admin" ON public.delivery_status_updates;
CREATE POLICY "delivery_status_updates_admin" ON public.delivery_status_updates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- ============================================================================
-- 5. TABELAS APENAS ADMIN (Policy única)
-- ============================================================================

-- event_projects
ALTER TABLE public.event_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_projects_admin" ON public.event_projects;
CREATE POLICY "event_projects_admin" ON public.event_projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- project_team
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_team_admin" ON public.project_team;
CREATE POLICY "project_team_admin" ON public.project_team FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- project_equipment
ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_equipment_admin" ON public.project_equipment;
CREATE POLICY "project_equipment_admin" ON public.project_equipment FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- project_emails
ALTER TABLE public.project_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_emails_admin" ON public.project_emails;
CREATE POLICY "project_emails_admin" ON public.project_emails FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- supplier_quotations
ALTER TABLE public.supplier_quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_quotations_admin" ON public.supplier_quotations;
CREATE POLICY "supplier_quotations_admin" ON public.supplier_quotations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contracts_admin" ON public.contracts;
CREATE POLICY "contracts_admin" ON public.contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- contract_audit_log
ALTER TABLE public.contract_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contract_audit_log_admin" ON public.contract_audit_log;
CREATE POLICY "contract_audit_log_admin" ON public.contract_audit_log FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- service_orders
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_orders_admin" ON public.service_orders;
CREATE POLICY "service_orders_admin" ON public.service_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- service_order_tasks
ALTER TABLE public.service_order_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_order_tasks_admin" ON public.service_order_tasks;
CREATE POLICY "service_order_tasks_admin" ON public.service_order_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- service_order_timeline
ALTER TABLE public.service_order_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_order_timeline_admin" ON public.service_order_timeline;
CREATE POLICY "service_order_timeline_admin" ON public.service_order_timeline FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- service_order_logs
ALTER TABLE public.service_order_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_order_logs_admin" ON public.service_order_logs;
CREATE POLICY "service_order_logs_admin" ON public.service_order_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR SELECT USING (
  user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "notifications_admin" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_preferences_own" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_admin" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own" ON public.notification_preferences FOR ALL USING (
  user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "notification_preferences_admin" ON public.notification_preferences FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- professional_history
ALTER TABLE public.professional_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "professional_history_admin" ON public.professional_history;
CREATE POLICY "professional_history_admin" ON public.professional_history FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- professional_reviews
ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "professional_reviews_admin" ON public.professional_reviews;
CREATE POLICY "professional_reviews_admin" ON public.professional_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- supplier_reviews
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_reviews_admin" ON public.supplier_reviews;
CREATE POLICY "supplier_reviews_admin" ON public.supplier_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- document_validations
ALTER TABLE public.document_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_validations_admin" ON public.document_validations;
CREATE POLICY "document_validations_admin" ON public.document_validations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limits_admin" ON public.rate_limits;
CREATE POLICY "rate_limits_admin" ON public.rate_limits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- equipment_allocations (deprecated, mas vamos habilitar RLS)
ALTER TABLE public.equipment_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipment_allocations_admin" ON public.equipment_allocations;
CREATE POLICY "equipment_allocations_admin" ON public.equipment_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.clerk_id = auth.uid()::text AND u.user_type = 'admin')
);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  tables_without_rls INTEGER;
  table_name TEXT;
BEGIN
  -- Contar total de tabelas públicas
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Contar tabelas COM RLS
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;

  tables_without_rls := total_tables - tables_with_rls;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ VERIFICAÇÃO DE RLS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total de tabelas: %', total_tables;
  RAISE NOTICE 'Tabelas com RLS: % (%.1f%%)', tables_with_rls, (tables_with_rls::float / total_tables * 100);
  RAISE NOTICE 'Tabelas sem RLS: %', tables_without_rls;

  IF tables_without_rls = 0 THEN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🎉 SUCESSO! Todas as tabelas têm RLS habilitado!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  ELSE
    RAISE WARNING '⚠️ Ainda existem % tabelas sem RLS:', tables_without_rls;
    FOR table_name IN
      SELECT t.tablename
      FROM pg_tables t
      LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
      WHERE t.schemaname = 'public'
        AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false)
      ORDER BY t.tablename
    LOOP
      RAISE WARNING '  ❌ %', table_name;
    END LOOP;
  END IF;
END $$;
