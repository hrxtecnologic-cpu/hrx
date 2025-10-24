-- =====================================================
-- Verificação COMPLETA de UNIQUE constraints
-- =====================================================

-- Método 1: Via information_schema (padrão SQL)
SELECT
  'info_schema' as fonte,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('contractors', 'equipment_suppliers', 'professionals')
  AND tc.constraint_type = 'UNIQUE'
  AND tc.constraint_name LIKE '%clerk_id%'
ORDER BY tc.table_name;

-- Método 2: Via pg_constraint (PostgreSQL específico)
SELECT
  'pg_constraint' as fonte,
  n.nspname as schema,
  c.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type
FROM pg_constraint con
JOIN pg_class c ON con.conrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('contractors', 'equipment_suppliers', 'professionals')
  AND con.contype = 'u'  -- UNIQUE constraint
  AND con.conname LIKE '%clerk_id%'
ORDER BY c.relname;

-- Método 3: Via pg_indexes (verificar índices UNIQUE)
SELECT
  'pg_indexes' as fonte,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('contractors', 'equipment_suppliers', 'professionals')
  AND indexname LIKE '%clerk_id%'
ORDER BY tablename;

-- Resumo simplificado
SELECT
  t.table_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class c ON con.conrelid = c.oid
      WHERE c.relname = t.table_name
        AND con.contype = 'u'
        AND con.conname LIKE '%clerk_id%'
    ) THEN '✓ TEM UNIQUE'
    ELSE '✗ SEM UNIQUE'
  END as status
FROM (
  VALUES ('contractors'), ('equipment_suppliers'), ('professionals')
) AS t(table_name);
