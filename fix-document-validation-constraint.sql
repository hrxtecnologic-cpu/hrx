-- ============================================
-- FIX: Atualizar CHECK CONSTRAINT para incluir CNV e CNH_PHOTO
-- ============================================
--
-- PROBLEMA: A tabela document_validations tem um check constraint
-- que não inclui os novos tipos de documentos (cnv e cnh_photo)
--
-- ERRO: new row for relation "document_validations" violates
--       check constraint "valid_document_type"
--
-- SOLUÇÃO: Remover constraint antigo e criar novo com todos os tipos
-- ============================================

-- 1. Remover constraint antigo
ALTER TABLE document_validations
DROP CONSTRAINT IF EXISTS valid_document_type;

-- 2. Criar novo constraint com TODOS os tipos de documentos
ALTER TABLE document_validations
ADD CONSTRAINT valid_document_type
CHECK (document_type IN (
  'rg_front',
  'rg_back',
  'cpf',
  'proof_of_address',
  'cnh_photo',      -- NOVO: CNH para motoristas
  'nr10',
  'nr35',
  'drt',
  'cnv',            -- NOVO: CNV para segurança
  'portfolio'
));

-- 3. Verificar se constraint foi criado corretamente
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'valid_document_type';
