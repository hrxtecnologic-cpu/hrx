-- ================================================================
-- REMOÇÃO DA COLUNA role DA TABELA users
-- ================================================================
-- IMPORTANTE: Execute APÓS migrar todos os dados para user_type
-- ================================================================

-- 1. Verificar se todos os users têm user_type preenchido
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE user_type IS NOT NULL) as with_user_type,
  COUNT(*) FILTER (WHERE user_type IS NULL) as null_user_type
FROM users;

-- Resultado esperado: null_user_type = 0

-- 2. Ver distribuição de user_type
SELECT user_type, COUNT(*) as count
FROM users
GROUP BY user_type
ORDER BY count DESC;

-- 3. DELETAR a coluna role
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 4. Verificar se foi deletada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Deve NÃO aparecer "role" na lista

-- 5. Verificar constraints (não deveria ter nenhuma relacionada a role)
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- ================================================================
-- PRONTO! Coluna role deletada com sucesso
-- ================================================================
