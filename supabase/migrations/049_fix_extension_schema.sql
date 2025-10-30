-- ============================================================================
-- Migration 049: Mover Extensão pg_trgm para Schema Correto
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Mover a extensão pg_trgm do schema public para extensions
--   conforme boas práticas recomendadas pelo Supabase
--
-- Problema detectado: Extension 'pg_trgm' está no schema public
-- Severidade: WARNING (não crítico, mas deve ser corrigido)
-- ============================================================================

-- ============================================================================
-- O QUE É pg_trgm?
-- ============================================================================
-- pg_trgm (Trigram) é uma extensão do PostgreSQL para:
--   - Busca de texto com similaridade (fuzzy search)
--   - Operadores LIKE %%, <->, % (similarity)
--   - Índices GIN e GIST para texto
--
-- Por que não deve estar no schema public?
--   1. Organização: Extensões devem ficar em schema separado
--   2. Segurança: Evita conflitos de nomes com tabelas/functions
--   3. Manutenção: Facilita upgrades e rollbacks
--   4. Supabase Best Practice: extensions schema é o padrão
-- ============================================================================

-- ============================================================================
-- VERIFICAR SE EXTENSÃO EXISTE E ONDE ESTÁ
-- ============================================================================

DO $$
DECLARE
  ext_schema TEXT;
BEGIN
  -- Buscar em qual schema está a extensão pg_trgm
  SELECT n.nspname INTO ext_schema
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'pg_trgm';

  IF ext_schema IS NULL THEN
    RAISE NOTICE 'ℹ️ Extensão pg_trgm não encontrada (talvez não esteja instalada)';
  ELSIF ext_schema = 'public' THEN
    RAISE NOTICE '⚠️ Extensão pg_trgm está no schema public (precisa ser movida)';
  ELSE
    RAISE NOTICE '✅ Extensão pg_trgm já está no schema correto: %', ext_schema;
  END IF;
END $$;

-- ============================================================================
-- CRIAR SCHEMA extensions SE NÃO EXISTIR
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;

COMMENT ON SCHEMA extensions IS 'Schema para extensões PostgreSQL (pg_trgm, uuid-ossp, etc)';

-- ============================================================================
-- MOVER EXTENSÃO pg_trgm PARA extensions SCHEMA
-- ============================================================================

DO $$
DECLARE
  ext_schema TEXT;
BEGIN
  -- Verificar onde está a extensão
  SELECT n.nspname INTO ext_schema
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'pg_trgm';

  IF ext_schema = 'public' THEN
    -- Mover extensão do public para extensions
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    RAISE NOTICE '✅ Extensão pg_trgm movida de public para extensions';

  ELSIF ext_schema IS NULL THEN
    -- Extensão não existe, criar no schema correto
    CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
    RAISE NOTICE '✅ Extensão pg_trgm criada no schema extensions';

  ELSE
    -- Já está em outro schema (provavelmente extensions)
    RAISE NOTICE 'ℹ️ Extensão pg_trgm já está no schema: %', ext_schema;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Erro ao mover extensão pg_trgm: %', SQLERRM;
    RAISE NOTICE 'ℹ️ Isso pode acontecer se houver dependências. Verifique manualmente.';
END $$;

-- ============================================================================
-- ATUALIZAR search_path PARA INCLUIR extensions SCHEMA
-- ============================================================================

-- IMPORTANTE: Após mover a extensão, é necessário garantir que o search_path
-- inclua o schema extensions, senão as funções do pg_trgm não serão encontradas

DO $$
BEGIN
  -- Configurar search_path padrão do database para incluir extensions
  -- Isso garante que funções como similarity(), show_trgm(), etc funcionem
  EXECUTE 'ALTER DATABASE ' || current_database() ||
          ' SET search_path = public, extensions';

  RAISE NOTICE '✅ search_path do database atualizado para incluir extensions';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Não foi possível alterar search_path do database: %', SQLERRM;
    RAISE NOTICE 'ℹ️ Você pode precisar executar manualmente:';
    RAISE NOTICE '   ALTER DATABASE your_db_name SET search_path = public, extensions;';
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  ext_schema TEXT;
  ext_version TEXT;
BEGIN
  -- Verificar localização final da extensão
  SELECT n.nspname, e.extversion
  INTO ext_schema, ext_version
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'pg_trgm';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ VERIFICAÇÃO FINAL';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  IF ext_schema IS NOT NULL THEN
    RAISE NOTICE 'Extensão pg_trgm: ✅ Instalada';
    RAISE NOTICE 'Schema: %', ext_schema;
    RAISE NOTICE 'Versão: %', ext_version;

    IF ext_schema = 'extensions' THEN
      RAISE NOTICE 'Status: ✅ CORRETO (no schema extensions)';
    ELSIF ext_schema = 'public' THEN
      RAISE NOTICE 'Status: ⚠️ AINDA NO PUBLIC (migração falhou)';
    ELSE
      RAISE NOTICE 'Status: ℹ️ Em outro schema: %', ext_schema;
    END IF;
  ELSE
    RAISE NOTICE 'Extensão pg_trgm: ❌ NÃO INSTALADA';
  END IF;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================================================
-- TESTAR SE pg_trgm ESTÁ FUNCIONANDO
-- ============================================================================

-- Teste simples de similaridade
SELECT
  'Teste pg_trgm' as descricao,
  extensions.similarity('hello', 'hallo') as similaridade,
  CASE
    WHEN extensions.similarity('hello', 'hallo') > 0
    THEN '✅ Funcionando'
    ELSE '❌ Erro'
  END as status;

-- ============================================================================
-- LISTAR TODAS AS EXTENSÕES E SEUS SCHEMAS
-- ============================================================================

SELECT
  e.extname as "Extensão",
  n.nspname as "Schema",
  e.extversion as "Versão",
  CASE
    WHEN n.nspname = 'extensions' THEN '✅'
    WHEN n.nspname = 'public' THEN '⚠️'
    ELSE 'ℹ️'
  END as "Status"
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY e.extname;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. COMPATIBILIDADE: Esta migration é compatível com PostgreSQL 12+
--
-- 2. DEPENDÊNCIAS: Se houver objetos dependendo do pg_trgm no schema public,
--    a movimentação pode falhar. Nesse caso, será necessário:
--    a) Dropar os objetos dependentes
--    b) Mover a extensão
--    c) Recriar os objetos
--
-- 3. SEARCH_PATH: É CRUCIAL configurar search_path corretamente após mover
--    a extensão, senão queries que usam pg_trgm podem quebrar
--
-- 4. ÍNDICES GIN/GIST: Índices que usam pg_trgm (como idx_professionals_name_trgm)
--    continuarão funcionando normalmente após a mudança de schema
--
-- 5. SUPABASE: No Supabase, o schema padrão para extensões é 'extensions'
--
-- 6. ROLLBACK: Para reverter:
--    ALTER EXTENSION pg_trgm SET SCHEMA public;
--
-- 7. OUTRAS EXTENSÕES: Se você tiver outras extensões no public (uuid-ossp, etc),
--    considere movê-las também para o schema extensions

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Se der erro "cannot move extension pg_trgm because other objects depend on it":
--
-- 1. Listar dependências:
--    SELECT DISTINCT
--      dependent_ns.nspname as schema,
--      dependent_view.relname as object
--    FROM pg_depend
--    JOIN pg_extension ext ON ext.oid = pg_depend.refobjid
--    JOIN pg_class dependent_view ON dependent_view.oid = pg_depend.objid
--    JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
--    WHERE ext.extname = 'pg_trgm';
--
-- 2. Recriar objetos com schema qualificado (extensions.similarity)
-- 3. Tentar mover novamente
