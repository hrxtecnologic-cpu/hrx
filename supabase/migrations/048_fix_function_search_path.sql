-- ============================================================================
-- Migration 048: Corrigir search_path Mutável em Functions
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Adicionar SET search_path = public em TODAS as functions
--   para prevenir ataques de SQL injection via manipulação de search_path
--
-- Problema detectado: 68 functions sem search_path explícito
-- Severidade: WARNING (não crítico, mas deve ser corrigido)
-- ============================================================================

-- ============================================================================
-- O QUE É search_path?
-- ============================================================================
-- search_path define em quais schemas o PostgreSQL vai procurar objetos
-- Se não for definido explicitamente, um usuário mal-intencionado pode:
--   1. Criar um schema malicioso
--   2. Adicionar funções/tabelas falsas nesse schema
--   3. Manipular search_path para priorizar o schema malicioso
--   4. Executar código malicioso quando a function rodar
--
-- Exemplo de ataque SEM search_path:
--   CREATE SCHEMA evil;
--   CREATE TABLE evil.users (clerk_id TEXT, user_type TEXT);
--   INSERT INTO evil.users VALUES ('user_xxx', 'admin');
--   SET search_path = evil, public;
--   -- Agora quando a function rodar, ela vai usar evil.users ao invés de public.users!
--
-- Solução: SET search_path = public (força a function a usar apenas public schema)
-- ============================================================================

-- ============================================================================
-- ESTRATÉGIA: Alterar TODAS as functions automaticamente
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  func_count INTEGER := 0;
BEGIN
  -- Buscar TODAS as functions no schema public
  FOR func_record IN
    SELECT
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- Apenas functions, não procedures
    ORDER BY p.proname
  LOOP
    BEGIN
      -- Tentar adicionar SET search_path = public
      EXECUTE format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public',
        func_record.function_name,
        func_record.args
      );

      func_count := func_count + 1;

      -- Log de sucesso (apenas a cada 10 functions para não poluir)
      IF func_count % 10 = 0 THEN
        RAISE NOTICE '✅ % functions corrigidas até agora...', func_count;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        -- Se der erro em alguma function específica, apenas avisa mas continua
        RAISE WARNING '⚠️ Erro ao corrigir function %(%): %',
          func_record.function_name,
          func_record.args,
          SQLERRM;
    END;
  END LOOP;

  -- Resumo final
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total de functions corrigidas: %', func_count;
  RAISE NOTICE 'Todas as functions agora têm search_path = public';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================================================
-- VERIFICAÇÃO: Contar functions ainda sem search_path
-- ============================================================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  -- Contar functions que ainda não têm search_path definido
  -- (Nota: pg_proc.proconfig armazena SET options, incluindo search_path)
  SELECT COUNT(*) INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (p.proconfig IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS config
      WHERE config LIKE 'search_path=%'
    ));

  IF remaining_count = 0 THEN
    RAISE NOTICE '🎉 SUCESSO! Todas as functions têm search_path configurado!';
  ELSE
    RAISE WARNING '⚠️ Ainda existem % functions sem search_path', remaining_count;
  END IF;
END $$;

-- ============================================================================
-- LISTAR ALGUMAS FUNCTIONS CORRIGIDAS (Primeiras 10)
-- ============================================================================

SELECT
  p.proname as "Function",
  pg_get_function_identity_arguments(p.oid) as "Arguments",
  CASE
    WHEN p.proconfig IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS config
      WHERE config LIKE 'search_path=%'
    ) THEN '✅ Configurado'
    ELSE '❌ Faltando'
  END as "Search Path Status"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname
LIMIT 10;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. PERFORMANCE: Não há impacto de performance ao adicionar search_path
--
-- 2. SEGURANÇA: Isso previne ataques de SQL injection via schema manipulation
--
-- 3. COMPATIBILIDADE: search_path = public funciona em PostgreSQL 12+
--
-- 4. TRIGGERS: Triggers também usam functions, mas são corrigidos automaticamente
--
-- 5. PROCEDURES: Esta migration só corrige FUNCTIONS (prokind = 'f')
--    Se você tiver procedures (prokind = 'p'), precisa corrigir separadamente
--
-- 6. PRÓXIMOS PASSOS: Após executar, rode o Linter novamente para confirmar
--    que os 68 warnings de "function_search_path_mutable" sumiram

-- ============================================================================
-- EXEMPLO DE COMO VERIFICAR search_path DE UMA FUNCTION ESPECÍFICA
-- ============================================================================

-- SELECT
--   proname,
--   proconfig
-- FROM pg_proc
-- WHERE proname = 'calculate_profit_margin';
--
-- Resultado esperado:
-- proname                    | proconfig
-- ---------------------------+------------------
-- calculate_profit_margin    | {search_path=public}
