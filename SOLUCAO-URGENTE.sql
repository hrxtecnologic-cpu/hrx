-- ⚡ SOLUÇÃO URGENTE: Criar usuário no Supabase manualmente
-- Execute no SQL Editor do Supabase AGORA

-- ==============================================================
-- PASSO 1: Descobrir seu clerk_id
-- ==============================================================
-- Vá para: https://dashboard.clerk.com
-- Clique em "Users"
-- Clique no seu usuário
-- Copie o "User ID" (começa com user_...)

-- ==============================================================
-- PASSO 2: Inserir usuário na tabela users
-- ==============================================================
-- SUBSTITUA os valores abaixo pelos seus dados:

INSERT INTO public.users (clerk_id, email, full_name, user_type, status)
VALUES (
  'user_SEU_CLERK_ID_AQUI',  -- ⚠️ SUBSTITUA: user_xxxxx
  'seu-email@gmail.com',      -- ⚠️ SUBSTITUA: seu email
  'Seu Nome Completo',        -- ⚠️ SUBSTITUA: seu nome
  'professional',             -- ✅ Já correto
  'active'                    -- ✅ Já correto
)
ON CONFLICT (clerk_id) DO NOTHING;  -- Evita duplicar se já existir

-- ==============================================================
-- PASSO 3: Verificar se foi criado
-- ==============================================================
SELECT * FROM public.users WHERE email = 'seu-email@gmail.com';

-- Deve retornar uma linha com seus dados

-- ==============================================================
-- EXEMPLO COMPLETO:
-- ==============================================================
-- INSERT INTO public.users (clerk_id, email, full_name, user_type, status)
-- VALUES (
--   'user_2abc123xyz',
--   'joao@email.com',
--   'João da Silva',
--   'professional',
--   'active'
-- );

-- ==============================================================
-- OBSERVAÇÕES:
-- ==============================================================
-- 1. Este é um WORKAROUND temporário
-- 2. O webhook do Clerk deveria fazer isso automaticamente
-- 3. Depois precisamos configurar o webhook corretamente
-- 4. Por enquanto, isso resolve para você testar o cadastro
