-- =====================================================
-- MIGRAÇÃO 003: Adicionar coluna de portfólio
-- =====================================================
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- Adicionar coluna portfolio (array de URLs de fotos)
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '[]';

-- Comentário explicativo
COMMENT ON COLUMN professionals.portfolio IS 'Array JSON com URLs das fotos de portfólio: ["url1", "url2", ...]';

-- Atualizar comentário da coluna documents para incluir portfolio
COMMENT ON COLUMN professionals.documents IS 'Armazena URLs e metadados dos documentos:
{
  "rg_front": "url",
  "rg_back": "url",
  "cpf": "url",
  "proof_of_address": "url",
  "nr10": "url",
  "nr35": "url",
  "drt": "url",
  "cnv": "url"
}
Portfolio está em coluna separada (portfolio).';
