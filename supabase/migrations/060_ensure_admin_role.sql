-- ============================================================================
-- Migration 060: Adicionar Campo is_admin na Tabela Users
-- ============================================================================
-- Data: 2025-11-18
-- Objetivo: Criar campo is_admin e marcar emails configurados como admin
-- ============================================================================

-- PASSO 1: Adicionar coluna is_admin (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna is_admin criada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna is_admin já existe';
  END IF;
END $$;

-- PASSO 2: Marcar emails admin como is_admin = true
UPDATE users
SET is_admin = true
WHERE email IN ('hrxtecnologic@gmail.com', 'simulaioab@gmail.com')
  AND is_admin = false;

-- PASSO 3: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Verificação
DO $$
DECLARE
  v_admin_count INTEGER;
  v_admin_emails TEXT[];
BEGIN
  SELECT COUNT(*), ARRAY_AGG(email)
  INTO v_admin_count, v_admin_emails
  FROM users
  WHERE is_admin = true;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION 060 - ADD is_admin COLUMN';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Admins encontrados: %', v_admin_count;
  RAISE NOTICE 'Emails admin: %', v_admin_emails;
  RAISE NOTICE '';
  RAISE NOTICE '👑 Campo is_admin criado e configurado!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
