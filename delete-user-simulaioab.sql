-- Script para deletar completamente o usuário simulaioab@gmail.com
-- Execute cada comando separadamente no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT id, clerk_id, email, user_type, status
FROM users
WHERE email = 'simulaioab@gmail.com';

-- 2. Deletar validações de documentos relacionadas
DELETE FROM document_validations
WHERE professional_id IN (
    SELECT id FROM professionals
    WHERE email = 'simulaioab@gmail.com'
);

-- 3. Deletar perfil professional (se existir)
DELETE FROM professionals
WHERE email = 'simulaioab@gmail.com';

-- 4. Deletar perfil contractor (se existir)
DELETE FROM contractors
WHERE email = 'simulaioab@gmail.com';

-- 5. Deletar o usuário principal
DELETE FROM users
WHERE email = 'simulaioab@gmail.com';

-- 6. Verificar se foi deletado
SELECT * FROM users WHERE email = 'simulaioab@gmail.com';

-- Se retornar vazio, o usuário foi deletado com sucesso!
