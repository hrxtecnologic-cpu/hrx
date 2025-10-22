-- Migration 008: Adicionar Subcategorias e Sistema de Certificações
-- Criado em: 2025-10-22
-- Descrição: Adiciona suporte para subcategorias profissionais e sistema completo de certificações

-- =====================================================
-- 1. Adicionar campo de subcategorias
-- =====================================================

-- Adicionar coluna subcategories (JSONB) para armazenar subcategorias selecionadas
-- Formato: {"Segurança": ["vigilante", "porteiro"], "Motorista": ["motorista_cat_b"]}
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '{}'::jsonb;

-- Criar índice GIN para busca eficiente em subcategorias
CREATE INDEX IF NOT EXISTS idx_professionals_subcategories ON professionals USING GIN (subcategories);

-- =====================================================
-- 2. Adicionar campo de certificações completo
-- =====================================================

-- Adicionar coluna certifications (JSONB) para armazenar todas as certificações
-- Formato:
-- {
--   "cnv": {
--     "number": "123456",
--     "validity": "2025-12-31",
--     "document_url": "https://...",
--     "status": "approved|pending|rejected",
--     "approved_at": "2024-01-15T10:00:00Z",
--     "approved_by": "uuid-do-admin"
--   },
--   "cnh": {
--     "number": "AB123456789",
--     "category": "D",
--     "validity": "2026-06-15",
--     "document_url": "https://...",
--     "status": "approved"
--   }
-- }
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '{}'::jsonb;

-- Criar índice GIN para busca eficiente em certificações
CREATE INDEX IF NOT EXISTS idx_professionals_certifications ON professionals USING GIN (certifications);

-- =====================================================
-- 3. Migrar dados existentes (validades individuais para certifications)
-- =====================================================

-- Migrar CNH
UPDATE professionals
SET certifications = jsonb_set(
  COALESCE(certifications, '{}'::jsonb),
  '{cnh}',
  jsonb_build_object(
    'number', COALESCE(cnh_number, ''),
    'validity', COALESCE(cnh_validity::text, ''),
    'status', CASE
      WHEN cnh_validity IS NOT NULL THEN 'approved'
      ELSE 'pending'
    END
  )
)
WHERE cnh_number IS NOT NULL OR cnh_validity IS NOT NULL;

-- Migrar CNV
UPDATE professionals
SET certifications = jsonb_set(
  COALESCE(certifications, '{}'::jsonb),
  '{cnv}',
  jsonb_build_object(
    'validity', cnv_validity::text,
    'status', 'approved'
  )
)
WHERE cnv_validity IS NOT NULL;

-- Migrar NR10
UPDATE professionals
SET certifications = jsonb_set(
  COALESCE(certifications, '{}'::jsonb),
  '{nr10}',
  jsonb_build_object(
    'validity', nr10_validity::text,
    'status', 'approved'
  )
)
WHERE nr10_validity IS NOT NULL;

-- Migrar NR35
UPDATE professionals
SET certifications = jsonb_set(
  COALESCE(certifications, '{}'::jsonb),
  '{nr35}',
  jsonb_build_object(
    'validity', nr35_validity::text,
    'status', 'approved'
  )
)
WHERE nr35_validity IS NOT NULL;

-- Migrar DRT
UPDATE professionals
SET certifications = jsonb_set(
  COALESCE(certifications, '{}'::jsonb),
  '{drt}',
  jsonb_build_object(
    'validity', drt_validity::text,
    'status', 'approved'
  )
)
WHERE drt_validity IS NOT NULL;

-- =====================================================
-- 4. Comentários nas colunas
-- =====================================================

COMMENT ON COLUMN professionals.subcategories IS 'Subcategorias selecionadas pelo profissional organizadas por categoria principal. Formato: {"Segurança": ["vigilante", "porteiro"]}';

COMMENT ON COLUMN professionals.certifications IS 'Todas as certificações do profissional com número, validade e status. Formato: {"cnv": {"number": "123", "validity": "2025-12-31", "status": "approved"}}';

-- =====================================================
-- 5. Criar função para validar certificações
-- =====================================================

CREATE OR REPLACE FUNCTION validate_certifications()
RETURNS trigger AS $$
BEGIN
  -- Validar formato de certifications se não for nulo
  IF NEW.certifications IS NOT NULL THEN
    -- Verificar se é um objeto JSON válido
    IF jsonb_typeof(NEW.certifications) != 'object' THEN
      RAISE EXCEPTION 'certifications deve ser um objeto JSON';
    END IF;
  END IF;

  -- Validar formato de subcategories se não for nulo
  IF NEW.subcategories IS NOT NULL THEN
    -- Verificar se é um objeto JSON válido
    IF jsonb_typeof(NEW.subcategories) != 'object' THEN
      RAISE EXCEPTION 'subcategories deve ser um objeto JSON';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Criar trigger para validação
-- =====================================================

DROP TRIGGER IF EXISTS validate_certifications_trigger ON professionals;

CREATE TRIGGER validate_certifications_trigger
  BEFORE INSERT OR UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION validate_certifications();

-- =====================================================
-- 7. Criar view para facilitar consultas
-- =====================================================

CREATE OR REPLACE VIEW professionals_with_certifications AS
SELECT
  p.id,
  p.full_name,
  p.cpf,
  p.email,
  p.phone,
  p.categories,
  p.subcategories,
  p.certifications,
  p.status,
  -- Extrair validades para facilitar queries
  (p.certifications->>'cnh')::jsonb->>'validity' as cnh_validity,
  (p.certifications->>'cnv')::jsonb->>'validity' as cnv_validity,
  (p.certifications->>'nr10')::jsonb->>'validity' as nr10_validity,
  (p.certifications->>'nr35')::jsonb->>'validity' as nr35_validity,
  (p.certifications->>'drt')::jsonb->>'validity' as drt_validity,
  (p.certifications->>'coren')::jsonb->>'validity' as coren_validity,
  (p.certifications->>'crm')::jsonb->>'validity' as crm_validity,
  -- Status das certificações
  (p.certifications->>'cnh')::jsonb->>'status' as cnh_status,
  (p.certifications->>'cnv')::jsonb->>'status' as cnv_status,
  p.created_at,
  p.updated_at
FROM professionals p;

COMMENT ON VIEW professionals_with_certifications IS 'View para facilitar consultas de profissionais com certificações extraídas';

-- =====================================================
-- 8. Funções auxiliares para busca
-- =====================================================

-- Função para verificar se profissional tem certificação válida
CREATE OR REPLACE FUNCTION has_valid_certification(
  prof_certifications JSONB,
  cert_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    prof_certifications ? cert_type AND
    (prof_certifications->cert_type->>'status') = 'approved' AND
    (
      (prof_certifications->cert_type->>'validity') IS NULL OR
      (prof_certifications->cert_type->>'validity')::date >= CURRENT_DATE
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION has_valid_certification IS 'Verifica se profissional tem certificação válida e aprovada';

-- Função para buscar profissionais por subcategoria
CREATE OR REPLACE FUNCTION get_professionals_by_subcategory(
  category_name TEXT,
  subcategory_name TEXT
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  subcategories JSONB,
  certifications JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.subcategories,
    p.certifications
  FROM professionals p
  WHERE
    p.subcategories ? category_name AND
    p.subcategories->category_name @> to_jsonb(ARRAY[subcategory_name]::text[]);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_professionals_by_subcategory IS 'Busca profissionais por categoria e subcategoria específica';

-- =====================================================
-- 9. Indexes adicionais para performance
-- =====================================================

-- Índice para busca por status de profissional
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);

-- Índice para busca por categorias (já existe, mas garantindo)
CREATE INDEX IF NOT EXISTS idx_professionals_categories ON professionals USING GIN (categories);

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
