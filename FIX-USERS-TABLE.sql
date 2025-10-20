-- ⚡ CORREÇÃO URGENTE: Tabela users
-- Execute no SQL Editor do Supabase

-- ===================================
-- 1. DESABILITAR RLS NA TABELA USERS
-- ===================================
-- O webhook usa SERVICE_ROLE_KEY, mas RLS pode estar bloqueando

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ===================================
-- 2. CRIAR SEU USUÁRIO MANUALMENTE (TEMPORÁRIO)
-- ===================================
-- IMPORTANTE: Pegue seu clerk_id no Clerk Dashboard primeiro!
-- https://dashboard.clerk.com → Users → Seu usuário → copie o "User ID"

-- SUBSTITUA os valores abaixo:
INSERT INTO public.users (clerk_id, email, full_name, user_type, status)
VALUES (
  'SEU_CLERK_ID_AQUI',      -- ⚠️ Exemplo: user_2abc123xyz
  'seu-email@gmail.com',     -- ⚠️ Seu email real
  'Seu Nome',                -- ⚠️ Seu nome
  'professional',            -- ✅ Já correto
  'active'                   -- ✅ Já correto
)
ON CONFLICT (clerk_id) DO UPDATE SET
  user_type = 'professional',
  updated_at = now();

-- ===================================
-- 3. VERIFICAR SE FOI CRIADO
-- ===================================
SELECT * FROM public.users WHERE email = 'seu-email@gmail.com';

-- Deve retornar 1 linha com seus dados

-- ===================================
-- 4. EXEMPLO COMPLETO:
-- ===================================
-- Se seu clerk_id for "user_2nAbCdEfGh123" e email "joao@gmail.com":
--
-- INSERT INTO public.users (clerk_id, email, full_name, user_type, status)
-- VALUES (
--   'user_2nAbCdEfGh123',
--   'joao@gmail.com',
--   'João da Silva',
--   'professional',
--   'active'
-- );

-- ===================================
-- OBSERVAÇÕES:
-- ===================================
-- 1. Este é um WORKAROUND temporário para você testar
-- 2. Vamos arrumar o webhook depois
-- 3. Por enquanto, isso vai permitir que você teste o cadastro
