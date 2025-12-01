-- ============================================================================
-- FIX URGENTE: Adicionar is_admin se não existir
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Adicionar coluna is_admin (ignora erro se já existir)
DO $$
BEGIN
  ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN
    RAISE NOTICE 'Coluna is_admin já existe';
END $$;

-- Marcar seus emails como admin
UPDATE public.users
SET is_admin = true
WHERE email IN ('hrxtecnologic@gmail.com', 'simulaioab@gmail.com');

-- Verificar resultado
SELECT
  email,
  is_admin,
  CASE
    WHEN is_admin = true THEN '✅ ADMIN'
    ELSE '❌ Não admin'
  END as status
FROM public.users
WHERE email IN ('hrxtecnologic@gmail.com', 'simulaioab@gmail.com');
