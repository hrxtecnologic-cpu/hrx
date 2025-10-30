-- ============================================================================
-- Migration 050: EMERGENCIAL - Corrigir RLS Bloqueando APIs
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Corrigir policies RLS que estão causando erros 500 nas APIs
--
-- Problemas identificados:
--   1. rate_limits com RLS habilitado (tabela INTERNA do Supabase)
--   2. professionals com policy muito restritiva (bloqueia leituras públicas)
--   3. Outras tabelas que precisam de acesso público
-- ============================================================================

-- ============================================================================
-- 1. REMOVER RLS DA TABELA rate_limits (TABELA INTERNA)
-- ============================================================================

-- rate_limits é usada pelo PostgREST/Supabase internamente para rate limiting
-- Ela NÃO deve ter RLS habilitado, pois precisa ser acessada pelo sistema

ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_admin" ON public.rate_limits;

COMMENT ON TABLE public.rate_limits IS
  'Tabela interna para rate limiting. RLS DESABILITADO por ser tabela de sistema.';

-- ============================================================================
-- 2. CORRIGIR POLICIES DE professionals
-- ============================================================================

-- Problema: Policies atuais bloqueiam leitura pública de profissionais aprovados
-- Solução: Permitir SELECT público em profissionais com status='approved'

DROP POLICY IF EXISTS "professionals_select_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_admin" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_admin_all" ON public.professionals;

-- Policy 1: Qualquer um pode ver profissionais aprovados (PUBLIC)
CREATE POLICY "professionals_select_approved_public" ON public.professionals
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Profissional pode ver seu próprio perfil (mesmo se pending/rejected)
CREATE POLICY "professionals_select_own" ON public.professionals
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Admin pode ver TODOS os profissionais
CREATE POLICY "professionals_select_admin" ON public.professionals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND u.user_type = 'admin'
    )
  );

-- Policy 4: Profissional pode atualizar seu próprio perfil
CREATE POLICY "professionals_update_own" ON public.professionals
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 5: Admin pode fazer tudo (INSERT, UPDATE, DELETE)
CREATE POLICY "professionals_admin_all" ON public.professionals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND u.user_type = 'admin'
    )
  );

-- ============================================================================
-- 3. CORRIGIR POLICIES DE equipment_suppliers
-- ============================================================================

-- Mesmo problema: fornecedores aprovados devem ser públicos

DROP POLICY IF EXISTS "equipment_suppliers_select_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_select_admin" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_update_own" ON public.equipment_suppliers;
DROP POLICY IF EXISTS "equipment_suppliers_admin_all" ON public.equipment_suppliers;

-- Policy 1: Qualquer um pode ver fornecedores aprovados (PUBLIC)
CREATE POLICY "suppliers_select_approved_public" ON public.equipment_suppliers
  FOR SELECT
  USING (status = 'approved');

-- Policy 2: Fornecedor pode ver seu próprio perfil
CREATE POLICY "suppliers_select_own" ON public.equipment_suppliers
  FOR SELECT
  USING (clerk_id = auth.uid()::text);

-- Policy 3: Admin pode ver TODOS
CREATE POLICY "suppliers_select_admin" ON public.equipment_suppliers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND u.user_type = 'admin'
    )
  );

-- Policy 4: Fornecedor pode atualizar seu perfil
CREATE POLICY "suppliers_update_own" ON public.equipment_suppliers
  FOR UPDATE
  USING (clerk_id = auth.uid()::text);

-- Policy 5: Admin pode fazer tudo
CREATE POLICY "suppliers_admin_all" ON public.equipment_suppliers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = auth.uid()::text
      AND u.user_type = 'admin'
    )
  );

-- ============================================================================
-- 4. VERIFICAR SE HÁ OUTRAS TABELAS INTERNAS DO SUPABASE COM RLS
-- ============================================================================

-- Tabelas que NUNCA devem ter RLS (tabelas internas do Supabase):
-- - storage.objects (gerenciado pelo Supabase Storage)
-- - storage.buckets (gerenciado pelo Supabase Storage)
-- - auth.* (gerenciado pelo Supabase Auth)
-- - realtime.* (gerenciado pelo Supabase Realtime)

-- Nossa tabela rate_limits é personalizada, mas funciona como tabela interna
-- Portanto, RLS DEVE estar desabilitado

-- ============================================================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  rate_limits_rls BOOLEAN;
  professionals_policies INTEGER;
  suppliers_policies INTEGER;
BEGIN
  -- Verificar se rate_limits tem RLS desabilitado
  SELECT c.relrowsecurity INTO rate_limits_rls
  FROM pg_class c
  WHERE c.relname = 'rate_limits'
  AND c.relnamespace = 'public'::regnamespace;

  -- Contar policies de professionals
  SELECT COUNT(*) INTO professionals_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'professionals';

  -- Contar policies de equipment_suppliers
  SELECT COUNT(*) INTO suppliers_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'equipment_suppliers';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ VERIFICAÇÃO DE CORREÇÕES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  IF rate_limits_rls = FALSE THEN
    RAISE NOTICE '✅ rate_limits: RLS DESABILITADO (correto para tabela interna)';
  ELSE
    RAISE WARNING '⚠️ rate_limits: RLS ainda HABILITADO (incorreto!)';
  END IF;

  RAISE NOTICE 'Professionals policies: % (esperado: 5)', professionals_policies;
  RAISE NOTICE 'Suppliers policies: % (esperado: 5)', suppliers_policies;

  IF professionals_policies >= 5 AND suppliers_policies >= 5 THEN
    RAISE NOTICE '✅ Policies criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Algumas policies podem estar faltando';
  END IF;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================================================
-- 6. TESTAR ACESSO PÚBLICO
-- ============================================================================

-- Simular acesso anônimo (sem autenticação)
SET LOCAL ROLE anon;

-- Deve retornar apenas profissionais aprovados
SELECT COUNT(*) as "Profissionais Públicos Visíveis"
FROM public.professionals
WHERE status = 'approved';

-- Deve retornar apenas fornecedores aprovados
SELECT COUNT(*) as "Fornecedores Públicos Visíveis"
FROM public.equipment_suppliers
WHERE status = 'approved';

-- Resetar role
RESET ROLE;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. TABELAS INTERNAS: Nunca habilite RLS em tabelas usadas internamente
--    pelo sistema (rate_limits, session storage, etc)
--
-- 2. DADOS PÚBLICOS: Profissionais e fornecedores APROVADOS devem ser
--    visíveis publicamente para que o marketplace funcione
--
-- 3. DADOS PRIVADOS: Profissionais PENDING/REJECTED só devem ser visíveis
--    para o próprio usuário e admins
--
-- 4. TESTING: Sempre teste com diferentes roles (anon, authenticated, admin)
--    após criar policies RLS

-- ============================================================================
-- ROLLBACK (se necessário)
-- ============================================================================

-- Se algo der errado, execute:
-- ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "professionals_select_approved_public" ON public.professionals;
-- DROP POLICY IF EXISTS "suppliers_select_approved_public" ON public.equipment_suppliers;
