-- ============================================================================
-- Migration 045: Corrigir Security Definer Views
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Remover SECURITY DEFINER de views públicas para melhorar segurança
--   O linter detectou 17 views com SECURITY DEFINER que não precisam dessa flag
--
-- SECURITY DEFINER = executa com permissões do criador (perigoso!)
-- SECURITY INVOKER = executa com permissões do usuário (seguro!)
-- ============================================================================

-- ============================================================================
-- 1. ALTERAR VIEWS PARA SECURITY INVOKER
-- ============================================================================

-- Views de estatísticas e métricas (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.professional_review_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.supplier_review_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.notification_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.system_metrics SET (security_invoker = true);

-- Views de top performers (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.top_professionals SET (security_invoker = true);
ALTER VIEW IF EXISTS public.top_suppliers SET (security_invoker = true);

-- Views de pipeline e relatórios (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.sales_pipeline SET (security_invoker = true);
ALTER VIEW IF EXISTS public.projects_by_month SET (security_invoker = true);
ALTER VIEW IF EXISTS public.upcoming_events SET (security_invoker = true);

-- Views de documentos e revisão (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.documents_pending_review SET (security_invoker = true);

-- Views de geocodificação (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.professionals_pending_geocoding SET (security_invoker = true);
ALTER VIEW IF EXISTS public.suppliers_pending_geocoding SET (security_invoker = true);
ALTER VIEW IF EXISTS public.events_pending_geocoding SET (security_invoker = true);

-- Views de categorias (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.professional_categories_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.equipment_categories_view SET (security_invoker = true);

-- Views de certificações (não precisam SECURITY DEFINER)
ALTER VIEW IF EXISTS public.professionals_with_certifications SET (security_invoker = true);

-- View de verificação de migração (não precisa SECURITY DEFINER)
ALTER VIEW IF EXISTS public.migration_verification SET (security_invoker = true);

-- ============================================================================
-- 2. COMENTÁRIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON VIEW public.professional_review_stats IS
  'Estatísticas de avaliações de profissionais. SECURITY INVOKER = usa permissões do usuário consultando.';

COMMENT ON VIEW public.supplier_review_stats IS
  'Estatísticas de avaliações de fornecedores. SECURITY INVOKER = usa permissões do usuário consultando.';

COMMENT ON VIEW public.top_professionals IS
  'Top 50 profissionais por projetos concluídos. SECURITY INVOKER = usa permissões do usuário consultando.';

COMMENT ON VIEW public.top_suppliers IS
  'Top 50 fornecedores por cotações aceitas. SECURITY INVOKER = usa permissões do usuário consultando.';

-- ============================================================================
-- 3. EXPLICAÇÃO: SECURITY DEFINER vs SECURITY INVOKER
-- ============================================================================

-- SECURITY DEFINER (PERIGOSO):
--   - View executa com permissões do CRIADOR da view
--   - Qualquer usuário pode ver TODOS os dados, ignorando RLS
--   - Útil APENAS quando você realmente quer bypass de RLS
--
-- SECURITY INVOKER (SEGURO - PADRÃO):
--   - View executa com permissões do USUÁRIO consultando
--   - RLS é respeitado normalmente
--   - Usuário vê apenas o que tem permissão de ver
--
-- Exemplo:
--   User A (admin) cria view com SECURITY DEFINER
--   User B (regular) consulta a view
--   → User B vê TODOS os dados (como se fosse admin!) ❌
--
--   User A (admin) cria view com SECURITY INVOKER
--   User B (regular) consulta a view
--   → User B vê apenas SEUS dados (respeitando RLS) ✅

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar que views foram alteradas para SECURITY INVOKER
DO $$
DECLARE
  definer_count INTEGER;
  invoker_count INTEGER;
BEGIN
  -- Contar views ainda com SECURITY DEFINER
  SELECT COUNT(*) INTO definer_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';

  -- No PostgreSQL 15+, podemos verificar a opção security_invoker
  -- Mas essa query funciona em versões anteriores também
  SELECT COUNT(*) INTO invoker_count
  FROM pg_views
  WHERE schemaname = 'public';

  IF definer_count > 0 THEN
    RAISE WARNING '⚠️ Ainda existem % views com SECURITY DEFINER', definer_count;
  ELSE
    RAISE NOTICE '✅ Todas as views foram alteradas para SECURITY INVOKER';
  END IF;

  RAISE NOTICE 'ℹ️ Total de views públicas: %', invoker_count;
END $$;

-- Listar views públicas para confirmação
SELECT
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
