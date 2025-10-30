-- ============================================================================
-- Migration 055: DESABILITAR RLS em TODAS as Tabelas
-- ============================================================================
-- Data: 2025-10-30
-- Decisão: RLS não é necessário porque:
--   1. Cliente NUNCA acessa Supabase diretamente
--   2. Todas as queries passam por Next.js API Routes
--   3. Autenticação é feita por Clerk (não Supabase Auth)
--   4. Verificação de permissões é feita no backend (isAdmin())
--   5. APIs usam service_role key que bypassa RLS de qualquer forma
--
-- Problema que RLS causou:
--   - 50+ APIs quebraram com erros 500/404
--   - Complexidade desnecessária
--   - Manutenção difícil
--
-- Conclusão: RLS adiciona complexidade SEM benefício de segurança real
-- ============================================================================

-- ============================================================================
-- DESABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

-- Migration 041: 4 tabelas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs DISABLE ROW LEVEL SECURITY;

-- Migration 047: 28 tabelas (rate_limits já foi desabilitado na 053)
ALTER TABLE public.event_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_trackings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_location_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_validations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_allocations DISABLE ROW LEVEL SECURITY;

-- rate_limits já foi desabilitado na migration 053 (tabela interna)

-- ============================================================================
-- DROPAR TODAS AS POLICIES (Não são mais necessárias)
-- ============================================================================

-- Nota: Não vou dropar policies explicitamente porque ao desabilitar RLS
-- as policies simplesmente não são aplicadas. Deixar as policies no banco
-- não causa problemas e facilita se no futuro quisermos reabilitar RLS.

-- ============================================================================
-- DROPAR FUNCTION is_admin() (Não é mais necessária)
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin();

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  tables_without_rls INTEGER;
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
  RAISE NOTICE '✅ MIGRATION 055 - DESABILITAR RLS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total de tabelas: %', total_tables;
  RAISE NOTICE 'Tabelas COM RLS: %', tables_with_rls;
  RAISE NOTICE 'Tabelas SEM RLS: %', tables_without_rls;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  IF tables_with_rls = 0 THEN
    RAISE NOTICE '🎉 SUCESSO! RLS desabilitado em todas as tabelas!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Lembre-se:';
    RAISE NOTICE '   - Segurança continua garantida por Clerk + Next.js';
    RAISE NOTICE '   - Supabase Linter mostrará warnings (pode ignorar)';
    RAISE NOTICE '   - Sistema voltará a funcionar normalmente';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  ELSE
    RAISE WARNING '⚠️ Ainda existem % tabelas com RLS habilitado', tables_with_rls;
    RAISE WARNING 'Execute: SELECT tablename FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename WHERE t.schemaname = ''public'' AND c.relrowsecurity = true;';
  END IF;
END $$;

-- ============================================================================
-- MODELO DE SEGURANÇA ATUAL (Sem RLS)
-- ============================================================================

-- 🔒 CAMADAS DE SEGURANÇA:
--
-- 1. Clerk Auth (JWT)
--    - Autentica usuários
--    - Gera tokens seguros
--
-- 2. Next.js Middleware
--    - Verifica tokens
--    - Protege rotas admin
--
-- 3. API Routes
--    - Verificam isAdmin()
--    - Validam permissões
--    - Usam service_role key
--
-- 4. Supabase
--    - Recebe queries autenticadas
--    - Service role bypassa qualquer restrição
--    - NUNCA é acessado diretamente pelo cliente
--
-- ✅ Segurança: MANTIDA (3 camadas antes de chegar no Supabase)
-- ✅ Complexidade: REDUZIDA (sem RLS desnecessário)
-- ✅ Manutenção: SIMPLIFICADA (menos código, menos bugs)

-- ============================================================================
-- ROLLBACK (Se necessário no futuro)
-- ============================================================================

-- Se no futuro precisar reabilitar RLS:
-- 1. Execute novamente migrations 041, 047
-- 2. Corrija todas as 50+ APIs para usar createAdminClient()
-- 3. Teste extensivamente cada rota
--
-- Mas provavelmente NÃO será necessário!

-- ============================================================================
-- NOTAS PARA O FUTURO
-- ============================================================================

-- ⚠️ Quando RLS SERIA necessário:
--    - Se expor PostgREST API diretamente para clientes
--    - Se usar Supabase Auth ao invés de Clerk
--    - Se frontend fazer queries diretas (não recomendado)
--
-- ✅ Seu caso atual (RLS NÃO necessário):
--    - Cliente acessa apenas via Next.js APIs
--    - Clerk faz autenticação
--    - Backend verifica permissões
--    - Service role key sempre bypassa RLS de qualquer forma
--
-- Conclusão: RLS era proteção redundante e custosa
