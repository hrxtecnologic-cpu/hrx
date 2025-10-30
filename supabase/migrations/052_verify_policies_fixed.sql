-- ============================================================================
-- Migration 052: Verificação de Policies Corrigidas
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Verificar se Migration 051 funcionou corretamente
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR SE FUNCTION is_admin() EXISTE
-- ============================================================================

DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
  ) INTO func_exists;

  IF func_exists THEN
    RAISE NOTICE '✅ Function is_admin() existe';
  ELSE
    RAISE WARNING '❌ Function is_admin() NÃO EXISTE!';
  END IF;
END $$;

-- ============================================================================
-- 2. TESTAR SE is_admin() FUNCIONA
-- ============================================================================

-- Teste básico: a function deve retornar TRUE ou FALSE sem erros
SELECT
  CASE
    WHEN public.is_admin() IS NOT NULL THEN '✅ Function is_admin() funciona corretamente'
    ELSE '❌ Function is_admin() retornou NULL'
  END AS "Teste is_admin()";

-- ============================================================================
-- 3. CONTAR POLICIES POR TABELA
-- ============================================================================

SELECT
  tablename,
  COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. VERIFICAR SE rate_limits TEM RLS DESABILITADO
-- ============================================================================

DO $$
DECLARE
  rate_limits_rls BOOLEAN;
BEGIN
  SELECT c.relrowsecurity INTO rate_limits_rls
  FROM pg_class c
  WHERE c.relname = 'rate_limits'
  AND c.relnamespace = 'public'::regnamespace;

  IF rate_limits_rls = FALSE THEN
    RAISE NOTICE '✅ rate_limits: RLS DESABILITADO (correto)';
  ELSIF rate_limits_rls = TRUE THEN
    RAISE WARNING '⚠️ rate_limits: RLS ainda HABILITADO (deveria estar desabilitado)';
  ELSE
    RAISE WARNING '❌ Tabela rate_limits não encontrada';
  END IF;
END $$;

-- ============================================================================
-- 5. LISTAR TABELAS SEM RLS (Deve estar vazio exceto rate_limits)
-- ============================================================================

SELECT
  t.tablename,
  c.relrowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
WHERE t.schemaname = 'public'
AND (c.relrowsecurity = FALSE OR c.relrowsecurity IS NULL)
ORDER BY t.tablename;

-- ============================================================================
-- 6. VERIFICAR SE TABELAS PRINCIPAIS TÊM POLICIES
-- ============================================================================

DO $$
DECLARE
  users_policies INTEGER;
  professionals_policies INTEGER;
  suppliers_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_policies
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';

  SELECT COUNT(*) INTO professionals_policies
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'professionals';

  SELECT COUNT(*) INTO suppliers_policies
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'equipment_suppliers';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ RESUMO DE POLICIES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'users: % policies', users_policies;
  RAISE NOTICE 'professionals: % policies', professionals_policies;
  RAISE NOTICE 'equipment_suppliers: % policies', suppliers_policies;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  IF users_policies >= 4 AND professionals_policies >= 5 AND suppliers_policies >= 5 THEN
    RAISE NOTICE '🎉 Todas as policies foram criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Algumas policies podem estar faltando';
  END IF;
END $$;

-- ============================================================================
-- 7. TESTAR ACESSO ANÔNIMO A PROFISSIONAIS APROVADOS
-- ============================================================================

-- Simular acesso anônimo (deve funcionar para profissionais aprovados)
DO $$
DECLARE
  approved_count INTEGER;
BEGIN
  -- Resetar role temporariamente para simular usuário anônimo
  SET LOCAL ROLE anon;

  SELECT COUNT(*) INTO approved_count
  FROM public.professionals
  WHERE status = 'approved';

  RESET ROLE;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ TESTE DE ACESSO PÚBLICO';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Profissionais aprovados visíveis para anon: %', approved_count;
  RAISE NOTICE 'Se este número for > 0, acesso público está funcionando!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
EXCEPTION
  WHEN OTHERS THEN
    RESET ROLE;
    RAISE WARNING 'Erro ao testar acesso anônimo: %', SQLERRM;
END $$;

-- ============================================================================
-- 8. VERIFICAR SE HÁ RECURSÃO (Deve retornar sem erros)
-- ============================================================================

-- Este SELECT testa se há recursão infinita
-- Se executar sem erro, significa que a recursão foi corrigida
DO $$
BEGIN
  PERFORM COUNT(*)
  FROM public.professionals p
  WHERE EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.clerk_id = auth.uid()::text
  );

  RAISE NOTICE '✅ Teste de recursão passou! Não há mais recursão infinita.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Ainda há problemas de recursão: %', SQLERRM;
END $$;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

-- Se tudo estiver correto, você deve ver:
--
-- ✅ Function is_admin() existe
-- ✅ Function is_admin() funciona corretamente
-- ✅ rate_limits: RLS DESABILITADO (correto)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ RESUMO DE POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- users: 4 policies
-- professionals: 5 policies
-- equipment_suppliers: 5 policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎉 Todas as policies foram criadas com sucesso!
-- ✅ TESTE DE ACESSO PÚBLICO
-- Profissionais aprovados visíveis para anon: X
-- ✅ Teste de recursão passou! Não há mais recursão infinita.
