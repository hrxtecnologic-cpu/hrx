-- Script para atualizar os Clerk IDs fictícios com IDs reais
-- Use este script se você quiser vincular os dados de seed a usuários reais do Clerk

-- PASSO 1: Liste seus usuários reais do Clerk
-- Execute esta query primeiro para ver os clerk_id disponíveis:
SELECT
  clerk_id,
  email,
  role,
  created_at
FROM users
ORDER BY created_at DESC;

-- PASSO 2: Atualize os profissionais com clerk_ids reais
-- Substitua 'CLERK_ID_REAL_1', 'CLERK_ID_REAL_2', etc. pelos IDs reais do passo 1

-- Exemplo de atualização individual:
-- UPDATE users SET clerk_id = 'CLERK_ID_REAL_1' WHERE clerk_id = 'user_prof_001';
-- UPDATE professionals SET clerk_id = 'CLERK_ID_REAL_1' WHERE clerk_id = 'user_prof_001';

-- Ou, se você preferir manter os IDs fictícios e apenas vincular:
-- Isso é útil para testes sem afetar usuários reais

-- ALTERNATIVA: Criar usuários fictícios (requer acesso à API do Clerk)
-- Não é possível fazer via SQL, precisa ser feito via Clerk Dashboard ou API

-- VERIFICAÇÃO: Confirmar que todos os profissionais têm user_id válido
SELECT
  p.full_name,
  p.clerk_id,
  u.id as user_id,
  u.email,
  CASE
    WHEN u.id IS NULL THEN '❌ SEM USUÁRIO'
    ELSE '✅ OK'
  END as status
FROM professionals p
LEFT JOIN users u ON p.clerk_id = u.clerk_id
WHERE p.full_name IN (
  'João Silva',
  'Maria Santos',
  'Pedro Oliveira',
  'Ana Costa',
  'Carlos Souza',
  'Juliana Lima',
  'Roberto Alves',
  'Fernanda Rocha',
  'Lucas Martins',
  'Patricia Ferreira'
);

-- DICA: Se você não tem usuários reais suficientes,
-- pode criar usuários de teste no Clerk Dashboard:
-- 1. Vá em Authentication > Users
-- 2. Clique em "Add user"
-- 3. Crie com os emails do seed (ex: joao.silva@email.com)
-- 4. Copie o clerk_id gerado
-- 5. Execute os UPDATEs acima com os IDs reais
