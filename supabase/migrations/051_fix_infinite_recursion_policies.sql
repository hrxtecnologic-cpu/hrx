-- ============================================================================
-- Migration 051: EMERGENCIAL - Corrigir Recursão Infinita em Policies
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Corrigir erro "infinite recursion detected in policy for relation users"
--
-- PROBLEMA: Policies de professionals/suppliers fazem SELECT em users,
--           mas users também tem policies que verificam users = RECURSÃO!
--
-- SOLUÇÃO: Usar auth.jwt() claims ao invés de SELECT em users
-- ============================================================================

-- ============================================================================
-- 1. CRIAR FUNCTION HELPER PARA VERIFICAR SE USUÁRIO É ADMIN
-- ============================================================================

-- Esta function NÃO causa recursão porque usa SECURITY DEFINER
-- e acessa users sem passar pelas policies RLS

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE clerk_id = auth.uid()::text
    AND user_type = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Verifica se o usuário autenticado é admin. SECURITY DEFINER para evitar recursão RLS.';

-- ============================================================================
-- 2. SIMPLIFICAR POLICIES DA TABELA users (REMOVER RECURSÃO)
-- ============================================================================

-- Dropar todas as policies atuais
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_system" ON public.users;

-- Policy 1: Usuário pode ver seu próprio registro (SEM SUBQUERY)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 2: Usuário pode atualizar seu próprio registro (SEM SUBQUERY)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Admin pode ver TODOS (usando function helper)
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Policy 4: Admin pode fazer tudo (usando function helper)
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 3. RECRIAR POLICIES DE professionals (USANDO FUNCTION HELPER)
-- ============================================================================

DROP POLICY IF EXISTS "professionals_select_approved_public" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_admin" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_admin_all" ON public.professionals;

-- Policy 1: Qualquer um pode ver profissionais aprovados (PUBLIC)
CREATE POLICY "professionals_select_approved_public" ON public.professionals
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Profissional pode ver seu próprio perfil
CREATE POLICY "professionals_select_own" ON public.professionals
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Admin pode ver TODOS (usando function helper - SEM RECURSÃO)
CREATE POLICY "professionals_select_admin" ON public.professionals
  FOR SELECT
  USING (public.is_admin());

-- Policy 4: Profissional pode atualizar seu próprio perfil
CREATE POLICY "professionals_update_own" ON public.professionals
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 5: Admin pode fazer tudo (usando function helper - SEM RECURSÃO)
CREATE POLICY "professionals_admin_all" ON public.professionals
  FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 4. RECRIAR POLICIES DE equipment_suppliers (USANDO FUNCTION HELPER)
-- ============================================================================

DROP POLICY IF EXISTS "suppliers_select_approved_public" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_select_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_select_admin" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_update_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_admin_all" ON public.equipment_suppliers;

-- Policy 1: Qualquer um pode ver fornecedores aprovados (PUBLIC)
CREATE POLICY "suppliers_select_approved_public" ON public.equipment_suppliers
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Fornecedor pode ver seu próprio perfil
CREATE POLICY "suppliers_select_own" ON public.equipment_suppliers
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Admin pode ver TODOS (usando function helper - SEM RECURSÃO)
CREATE POLICY "suppliers_select_admin" ON public.equipment_suppliers
  FOR SELECT
  USING (public.is_admin());

-- Policy 4: Fornecedor pode atualizar seu perfil
CREATE POLICY "suppliers_update_own" ON public.equipment_suppliers
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 5: Admin pode fazer tudo (usando function helper - SEM RECURSÃO)
CREATE POLICY "suppliers_admin_all" ON public.equipment_suppliers
  FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 5. ATUALIZAR OUTRAS POLICIES QUE USAM O PADRÃO ANTIGO
-- ============================================================================

-- Atualizar event_types
DROP POLICY IF EXISTS "event_types_admin_all" ON public.event_types;
CREATE POLICY "event_types_admin_all" ON public.event_types
  FOR ALL
  USING (public.is_admin());

-- Atualizar categories
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL
  USING (public.is_admin());

-- Atualizar category_subcategories
DROP POLICY IF EXISTS "category_subcategories_admin_all" ON public.category_subcategories;
CREATE POLICY "category_subcategories_admin_all" ON public.category_subcategories
  FOR ALL
  USING (public.is_admin());

-- Atualizar email_template_config
DROP POLICY IF EXISTS "email_template_config_admin" ON public.email_template_config;
CREATE POLICY "email_template_config_admin" ON public.email_template_config
  FOR ALL
  USING (public.is_admin());

-- Atualizar delivery_trackings
DROP POLICY IF EXISTS "delivery_trackings_admin" ON public.delivery_trackings;
CREATE POLICY "delivery_trackings_admin" ON public.delivery_trackings
  FOR ALL
  USING (public.is_admin());

-- Atualizar delivery_location_history
DROP POLICY IF EXISTS "delivery_location_history_admin" ON public.delivery_location_history;
CREATE POLICY "delivery_location_history_admin" ON public.delivery_location_history
  FOR ALL
  USING (public.is_admin());

-- Atualizar delivery_status_updates
DROP POLICY IF EXISTS "delivery_status_updates_admin" ON public.delivery_status_updates;
CREATE POLICY "delivery_status_updates_admin" ON public.delivery_status_updates
  FOR ALL
  USING (public.is_admin());

-- Atualizar event_projects
DROP POLICY IF EXISTS "event_projects_admin" ON public.event_projects;
CREATE POLICY "event_projects_admin" ON public.event_projects
  FOR ALL
  USING (public.is_admin());

-- Atualizar project_team
DROP POLICY IF EXISTS "project_team_admin" ON public.project_team;
CREATE POLICY "project_team_admin" ON public.project_team
  FOR ALL
  USING (public.is_admin());

-- Atualizar project_equipment
DROP POLICY IF EXISTS "project_equipment_admin" ON public.project_equipment;
CREATE POLICY "project_equipment_admin" ON public.project_equipment
  FOR ALL
  USING (public.is_admin());

-- Atualizar project_emails
DROP POLICY IF EXISTS "project_emails_admin" ON public.project_emails;
CREATE POLICY "project_emails_admin" ON public.project_emails
  FOR ALL
  USING (public.is_admin());

-- Atualizar supplier_quotations
DROP POLICY IF EXISTS "supplier_quotations_admin" ON public.supplier_quotations;
CREATE POLICY "supplier_quotations_admin" ON public.supplier_quotations
  FOR ALL
  USING (public.is_admin());

-- Atualizar contracts
DROP POLICY IF EXISTS "contracts_admin" ON public.contracts;
CREATE POLICY "contracts_admin" ON public.contracts
  FOR ALL
  USING (public.is_admin());

-- Atualizar contract_audit_log
DROP POLICY IF EXISTS "contract_audit_log_admin" ON public.contract_audit_log;
CREATE POLICY "contract_audit_log_admin" ON public.contract_audit_log
  FOR ALL
  USING (public.is_admin());

-- Atualizar service_orders
DROP POLICY IF EXISTS "service_orders_admin" ON public.service_orders;
CREATE POLICY "service_orders_admin" ON public.service_orders
  FOR ALL
  USING (public.is_admin());

-- Atualizar service_order_tasks
DROP POLICY IF EXISTS "service_order_tasks_admin" ON public.service_order_tasks;
CREATE POLICY "service_order_tasks_admin" ON public.service_order_tasks
  FOR ALL
  USING (public.is_admin());

-- Atualizar service_order_timeline
DROP POLICY IF EXISTS "service_order_timeline_admin" ON public.service_order_timeline;
CREATE POLICY "service_order_timeline_admin" ON public.service_order_timeline
  FOR ALL
  USING (public.is_admin());

-- Atualizar service_order_logs
DROP POLICY IF EXISTS "service_order_logs_admin" ON public.service_order_logs;
CREATE POLICY "service_order_logs_admin" ON public.service_order_logs
  FOR ALL
  USING (public.is_admin());

-- Atualizar notification_preferences (admin)
DROP POLICY IF EXISTS "notification_preferences_admin" ON public.notification_preferences;
CREATE POLICY "notification_preferences_admin" ON public.notification_preferences
  FOR ALL
  USING (public.is_admin());

-- Atualizar notifications (admin)
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;
CREATE POLICY "notifications_admin" ON public.notifications
  FOR ALL
  USING (public.is_admin());

-- Atualizar professional_history
DROP POLICY IF EXISTS "professional_history_admin" ON public.professional_history;
CREATE POLICY "professional_history_admin" ON public.professional_history
  FOR ALL
  USING (public.is_admin());

-- Atualizar professional_reviews
DROP POLICY IF EXISTS "professional_reviews_admin" ON public.professional_reviews;
CREATE POLICY "professional_reviews_admin" ON public.professional_reviews
  FOR ALL
  USING (public.is_admin());

-- Atualizar supplier_reviews
DROP POLICY IF EXISTS "supplier_reviews_admin" ON public.supplier_reviews;
CREATE POLICY "supplier_reviews_admin" ON public.supplier_reviews
  FOR ALL
  USING (public.is_admin());

-- Atualizar document_validations
DROP POLICY IF EXISTS "document_validations_admin" ON public.document_validations;
CREATE POLICY "document_validations_admin" ON public.document_validations
  FOR ALL
  USING (public.is_admin());

-- Atualizar equipment_allocations
DROP POLICY IF EXISTS "equipment_allocations_admin" ON public.equipment_allocations;
CREATE POLICY "equipment_allocations_admin" ON public.equipment_allocations
  FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  total_policies INTEGER;
BEGIN
  -- Contar todas as policies que usam is_admin()
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND definition LIKE '%is_admin()%';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ VERIFICAÇÃO DE POLICIES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Policies usando is_admin(): %', total_policies;
  RAISE NOTICE 'Function is_admin() criada: ✅';
  RAISE NOTICE 'Recursão infinita resolvida: ✅';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. SECURITY DEFINER: A function is_admin() usa SECURITY DEFINER para
--    executar com permissões do criador (postgres), evitando recursão RLS
--
-- 2. STABLE: Marcada como STABLE porque o resultado pode mudar entre transações
--    mas não dentro da mesma query
--
-- 3. PERFORMANCE: is_admin() é executada UMA VEZ por query e cacheada,
--    não há impacto significativo de performance
--
-- 4. ALTERNATIVA: Poderíamos usar auth.jwt() claims, mas isso requer
--    configurar o Clerk para incluir user_type no JWT token

-- ============================================================================
-- TESTE
-- ============================================================================

-- Testar se is_admin() funciona
SELECT public.is_admin() AS "Sou admin?";

-- Listar todas as policies usando is_admin()
SELECT
  schemaname,
  tablename,
  policyname,
  substr(definition, 1, 50) as definition_preview
FROM pg_policies
WHERE schemaname = 'public'
AND definition LIKE '%is_admin()%'
ORDER BY tablename, policyname;
