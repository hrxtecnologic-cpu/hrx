-- ================================================================
-- CORREÇÃO: CHECK constraint user_type na tabela notifications
-- ================================================================
-- Problema: tabela notifications não aceita 'contractor'
-- Solução: Adicionar 'contractor' no CHECK constraint
-- ================================================================

-- Remover constraint antiga
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_type_check;

-- Adicionar nova constraint com 'contractor'
ALTER TABLE notifications
ADD CONSTRAINT notifications_user_type_check
CHECK (user_type IN ('admin', 'professional', 'contractor', 'supplier', 'client'));

-- Verificar se funcionou
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'notifications_user_type_check';

-- Resultado esperado:
-- notifications_user_type_check | CHECK (user_type IN ('admin', 'professional', 'contractor', 'supplier', 'client'))
