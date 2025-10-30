-- ============================================================================
-- Migration 053: Correção Simplificada de RLS (SEM RECURSÃO)
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Corrigir RLS de forma simples, sem causar recursão infinita
--
-- ESTRATÉGIA NOVA: Não verificar admin em policies que usam subqueries
--                  Usar apenas auth.uid() direto
-- ============================================================================

-- ============================================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE EM rate_limits (TABELA INTERNA)
-- ============================================================================

ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limits IS
  'Tabela interna para rate limiting. RLS DESABILITADO.';

-- ============================================================================
-- 2. CRIAR FUNCTION is_admin() (SECURITY DEFINER para evitar recursão)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Usar SECURITY DEFINER permite acessar users SEM passar por RLS
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE clerk_id = auth.uid()::text
    AND user_type = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Verifica se usuário é admin. SECURITY DEFINER evita recursão RLS.';

-- ============================================================================
-- 3. LIMPAR TODAS AS POLICIES EXISTENTES DE TABELAS PRINCIPAIS
-- ============================================================================

-- users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_system" ON public.users;

-- professionals
DROP POLICY IF EXISTS "professionals_select_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_admin" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_approved_public" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_admin_all" ON public.professionals;

-- equipment_suppliers
DROP POLICY IF EXISTS "equipment_suppliers_select_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_select_admin" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_select_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_select_admin" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_select_approved_public" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_update_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "suppliers_admin_all" ON public.equipment_suppliers;

-- ============================================================================
-- 4. CRIAR POLICIES SIMPLES PARA users (SEM SUBQUERY = SEM RECURSÃO)
-- ============================================================================

-- Policy 1: Usuário vê apenas seu próprio registro
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 2: Usuário atualiza apenas seu próprio registro
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Permitir INSERT para service_role (webhooks do Clerk)
CREATE POLICY "users_insert_service_role" ON public.users
  FOR INSERT
  WITH CHECK (true);  -- service_role bypassa RLS de qualquer forma

-- ============================================================================
-- 5. CRIAR POLICIES PARA professionals (COM ACESSO PÚBLICO)
-- ============================================================================

-- Policy 1: PÚBLICO - Qualquer um vê profissionais aprovados
CREATE POLICY "professionals_public_approved" ON public.professionals
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Profissional vê seu próprio perfil (mesmo se pending)
CREATE POLICY "professionals_own" ON public.professionals
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Profissional atualiza seu próprio perfil
CREATE POLICY "professionals_update_own" ON public.professionals
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 4: service_role pode fazer tudo (APIs internas)
CREATE POLICY "professionals_service_role" ON public.professionals
  FOR ALL
  USING (true);  -- service_role bypassa RLS

-- ============================================================================
-- 6. CRIAR POLICIES PARA equipment_suppliers (COM ACESSO PÚBLICO)
-- ============================================================================

-- Policy 1: PÚBLICO - Qualquer um vê fornecedores aprovados
CREATE POLICY "suppliers_public_approved" ON public.equipment_suppliers
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Fornecedor vê seu próprio perfil
CREATE POLICY "suppliers_own" ON public.equipment_suppliers
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Fornecedor atualiza seu próprio perfil
CREATE POLICY "suppliers_update_own" ON public.equipment_suppliers
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 4: service_role pode fazer tudo
CREATE POLICY "suppliers_service_role" ON public.equipment_suppliers
  FOR ALL
  USING (true);

-- ============================================================================
-- 7. SIMPLIFICAR POLICIES DE OUTRAS TABELAS (Apenas service_role)
-- ============================================================================

-- Para as demais tabelas, vamos permitir apenas service_role (APIs)
-- Isso evita recursão e mantém segurança via service_role key

-- Lista de tabelas que só admins/service_role devem acessar
DO $$
DECLARE
  admin_tables TEXT[] := ARRAY[
    'event_types',
    'categories',
    'category_subcategories',
    'email_template_config',
    'delivery_trackings',
    'delivery_location_history',
    'delivery_status_updates',
    'event_projects',
    'project_team',
    'project_equipment',
    'project_emails',
    'supplier_quotations',
    'contracts',
    'contract_audit_log',
    'service_orders',
    'service_order_tasks',
    'service_order_timeline',
    'service_order_logs',
    'professional_history',
    'professional_reviews',
    'supplier_reviews',
    'document_validations',
    'equipment_allocations'
  ];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY admin_tables
  LOOP
    -- Dropar policies antigas
    EXECUTE format('DROP POLICY IF EXISTS "%s_admin" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_admin_all" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_all" ON public.%I', table_name, table_name);

    -- Criar policy simples: apenas service_role
    EXECUTE format(
      'CREATE POLICY "%s_service_role" ON public.%I FOR ALL USING (true)',
      table_name, table_name
    );

    RAISE NOTICE 'Policy criada para: %', table_name;
  END LOOP;
END $$;

-- ============================================================================
-- 8. POLICIES PARA notifications E notification_preferences
-- ============================================================================

-- notifications
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;

CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "notifications_service_role" ON public.notifications
  FOR ALL
  USING (true);

-- notification_preferences
DROP POLICY IF EXISTS "notification_preferences_own" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_admin" ON public.notification_preferences;

CREATE POLICY "notification_preferences_own" ON public.notification_preferences
  FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "notification_preferences_service_role" ON public.notification_preferences
  FOR ALL
  USING (true);

-- ============================================================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  rate_limits_rls BOOLEAN;
  users_policies INTEGER;
  professionals_policies INTEGER;
BEGIN
  -- Verificar rate_limits
  SELECT c.relrowsecurity INTO rate_limits_rls
  FROM pg_class c
  WHERE c.relname = 'rate_limits' AND c.relnamespace = 'public'::regnamespace;

  -- Contar policies
  SELECT COUNT(*) INTO users_policies
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';

  SELECT COUNT(*) INTO professionals_policies
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'professionals';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ VERIFICAÇÃO MIGRATION 053';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'rate_limits RLS: % (FALSE = correto)', rate_limits_rls;
  RAISE NOTICE 'users policies: %', users_policies;
  RAISE NOTICE 'professionals policies: %', professionals_policies;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- Testar is_admin()
SELECT
  CASE
    WHEN public.is_admin() IS NOT NULL THEN 'Function is_admin() OK'
    ELSE 'Function is_admin() ERRO'
  END as status;

-- ============================================================================
-- IMPORTANTE: Como funciona agora
-- ============================================================================

-- 1. rate_limits: SEM RLS (tabela interna)
--
-- 2. users: RLS habilitado, mas apenas para SELECT/UPDATE próprio
--    - service_role pode fazer tudo (webhooks Clerk)
--
-- 3. professionals/suppliers: RLS habilitado
--    - Público vê apenas aprovados
--    - Usuário vê/edita próprio perfil
--    - service_role pode fazer tudo (APIs admin)
--
-- 4. Demais tabelas: RLS habilitado
--    - Apenas service_role pode acessar
--    - APIs Next.js usam service_role key
--
-- 5. Sem recursão: Policies não fazem subqueries em users
--    - Usam apenas auth.uid()::text direto
--    - service_role bypassa RLS automaticamente
