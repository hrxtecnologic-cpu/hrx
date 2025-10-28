-- =====================================================
-- Migration 037: Expandir Sistema de Categorias
-- =====================================================
-- Descrição: Expande a tabela categories existente e cria
-- tabela de subcategorias vinculada.
-- IMPORTANTE: NÃO toca na tabela professionals
-- =====================================================

-- =====================================================
-- 1. EXPANDIR TABELA CATEGORIES EXISTENTE
-- =====================================================

-- Adicionar novos campos à tabela categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS category_type VARCHAR(50) DEFAULT 'professional' CHECK (category_type IN ('professional', 'equipment')),
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index);

COMMENT ON COLUMN categories.category_type IS 'Tipo de categoria: professional (profissionais) ou equipment (equipamentos/fornecedores)';
COMMENT ON COLUMN categories.icon IS 'Nome do ícone para UI (ex: shield, truck, music)';
COMMENT ON COLUMN categories.color IS 'Cor em hex ou tailwind (ex: #ef4444 ou red-600)';
COMMENT ON COLUMN categories.order_index IS 'Ordem de exibição customizada';
COMMENT ON COLUMN categories.active IS 'Se a categoria está ativa e visível';

-- =====================================================
-- 2. CRIAR TABELA DE SUBCATEGORIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS category_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL, -- Identificador único (ex: "vigilante", "motorista_cat_b")
  description TEXT,
  required_documents JSONB DEFAULT '[]'::jsonb, -- Lista de documentos obrigatórios
  optional_documents JSONB DEFAULT '[]'::jsonb, -- Lista de documentos opcionais
  unit VARCHAR(50), -- Apenas para equipamentos (ex: "unidade", "metro", "hora")
  suggested_price DECIMAL(10,2), -- Apenas para equipamentos (preço sugerido)
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_category_slug UNIQUE(category_id, slug),
  CONSTRAINT unique_category_name_per_category UNIQUE(category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_category_subcategories_category ON category_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_category_subcategories_active ON category_subcategories(active);
CREATE INDEX IF NOT EXISTS idx_category_subcategories_slug ON category_subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_category_subcategories_order ON category_subcategories(order_index);

COMMENT ON TABLE category_subcategories IS 'Subcategorias de profissionais e tipos de equipamentos';
COMMENT ON COLUMN category_subcategories.slug IS 'Identificador único usado no código (ex: vigilante, line_array)';
COMMENT ON COLUMN category_subcategories.required_documents IS 'Array de códigos de documentos obrigatórios (ex: ["cnh", "cnv"])';
COMMENT ON COLUMN category_subcategories.optional_documents IS 'Array de códigos de documentos opcionais (ex: ["nr35", "drt"])';

-- =====================================================
-- 3. TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_category_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_category_subcategories_updated_at
  BEFORE UPDATE ON category_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_subcategories_updated_at();

-- =====================================================
-- 4. VIEWS PARA FACILITAR CONSULTAS
-- =====================================================

-- View com categorias e suas subcategorias (profissionais)
CREATE OR REPLACE VIEW professional_categories_view AS
SELECT
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.icon,
  c.color,
  c.order_index as category_order,
  c.active as category_active,
  COALESCE(
    json_agg(
      json_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug,
        'description', s.description,
        'required_documents', s.required_documents,
        'optional_documents', s.optional_documents,
        'order_index', s.order_index,
        'active', s.active
      ) ORDER BY s.order_index, s.name
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) as subcategories
FROM categories c
LEFT JOIN category_subcategories s ON c.id = s.category_id AND s.active = true
WHERE c.category_type = 'professional' AND c.active = true
GROUP BY c.id, c.name, c.description, c.icon, c.color, c.order_index, c.active
ORDER BY c.order_index, c.name;

COMMENT ON VIEW professional_categories_view IS 'Categorias de profissionais com subcategorias em JSON';

-- View com categorias de equipamentos
CREATE OR REPLACE VIEW equipment_categories_view AS
SELECT
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.icon,
  c.color,
  c.order_index as category_order,
  c.active as category_active,
  COALESCE(
    json_agg(
      json_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug,
        'description', s.description,
        'unit', s.unit,
        'suggested_price', s.suggested_price,
        'order_index', s.order_index,
        'active', s.active
      ) ORDER BY s.order_index, s.name
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) as subcategories
FROM categories c
LEFT JOIN category_subcategories s ON c.id = s.category_id AND s.active = true
WHERE c.category_type = 'equipment' AND c.active = true
GROUP BY c.id, c.name, c.description, c.icon, c.color, c.order_index, c.active
ORDER BY c.order_index, c.name;

COMMENT ON VIEW equipment_categories_view IS 'Categorias de equipamentos com tipos em JSON';

-- =====================================================
-- 5. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para buscar subcategorias de uma categoria
CREATE OR REPLACE FUNCTION get_category_subcategories(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  required_documents JSONB,
  optional_documents JSONB,
  unit VARCHAR,
  suggested_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.slug,
    s.description,
    s.required_documents,
    s.optional_documents,
    s.unit,
    s.suggested_price
  FROM category_subcategories s
  WHERE s.category_id = p_category_id AND s.active = true
  ORDER BY s.order_index, s.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_category_subcategories IS 'Retorna subcategorias de uma categoria específica';

-- Função para buscar documentos obrigatórios de múltiplas subcategorias
CREATE OR REPLACE FUNCTION get_required_documents_for_slugs(p_slugs TEXT[])
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_agg(DISTINCT doc)
    FILTER (WHERE doc IS NOT NULL),
    '[]'::jsonb
  ) INTO result
  FROM category_subcategories s,
  LATERAL jsonb_array_elements_text(s.required_documents) doc
  WHERE s.slug = ANY(p_slugs) AND s.active = true;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_required_documents_for_slugs IS 'Retorna união de documentos obrigatórios para array de slugs de subcategorias';

-- =====================================================
-- 6. IMPORTANTE: PROFISSIONAIS NÃO SÃO ALTERADOS
-- =====================================================

-- A tabela professionals continua EXATAMENTE como está
-- O campo subcategories JSONB continua funcionando
-- Esta migration apenas expande as categorias disponíveis
-- para serem gerenciadas via admin interface

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
