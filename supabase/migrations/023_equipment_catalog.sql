-- Migration: Sistema de Catálogo Flexível para Fornecedores
-- Data: 2025-10-27
-- Descrição: Adiciona campo JSONB para catálogo detalhado de equipamentos/serviços

-- ========== ALTER TABLE: equipment_suppliers ==========

-- Adicionar coluna para catálogo detalhado
ALTER TABLE equipment_suppliers
ADD COLUMN equipment_catalog JSONB DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN equipment_suppliers.equipment_catalog IS
'Catálogo detalhado de equipamentos/serviços do fornecedor.
Estrutura flexível com especificações completas, preços detalhados,
fotos, vídeos e documentos técnicos.

Estrutura esperada (array de objetos):
[
  {
    "id": "uuid",
    "category": "som_audio",
    "subcategory": "sistema_som_completo",
    "name": "Sistema de Som 500 pessoas - Line Array",
    "description": "Sistema profissional com Line Array JBL...",
    "specifications": {
      "capacidade_pessoas": 500,
      "potencia_rms": "10.000W",
      "marca": "JBL",
      "modelo": "VRX932LA",
      "quantidade_caixas": 4,
      "quantidade_subs": 2,
      "alcance_metros": 50
    },
    "pricing": {
      "daily": 2500,
      "three_days": 6500,
      "weekly": 12000,
      "monthly": 35000,
      "custom_periods": [
        {"period": "Final de semana", "price": 5000},
        {"period": "Feriado", "price": 3500}
      ]
    },
    "extras": [
      {"name": "Técnico de som", "price": 800, "unit": "por dia"},
      {"name": "Transporte", "price": 500, "unit": "fixo"},
      {"name": "Montagem", "price": 400, "unit": "fixo"}
    ],
    "photos": ["url1", "url2", "url3"],
    "videos": ["youtube_url"],
    "documents": ["pdf_url"],
    "availability": {
      "status": "available",
      "quantity": 2,
      "min_rental_days": 1,
      "notes": "Requer agendamento com 7 dias de antecedência"
    },
    "created_at": "2025-10-27T...",
    "updated_at": "2025-10-27T...",
    "is_featured": false,
    "is_active": true
  }
]';

-- ========== INDEX ==========

-- Índice GIN para buscas rápidas no catálogo
CREATE INDEX idx_equipment_catalog_gin ON equipment_suppliers USING GIN (equipment_catalog);

-- Índice para buscar por categoria dentro do JSONB
CREATE INDEX idx_equipment_catalog_category ON equipment_suppliers USING GIN ((equipment_catalog -> 'category'));

-- ========== HELPER FUNCTIONS ==========

-- Função para contar itens ativos no catálogo
CREATE OR REPLACE FUNCTION count_active_catalog_items(supplier_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM equipment_suppliers,
       jsonb_array_elements(equipment_catalog) AS item
  WHERE id = supplier_id
    AND (item->>'is_active')::boolean = true;
$$;

COMMENT ON FUNCTION count_active_catalog_items(UUID) IS
'Retorna o número de itens ativos no catálogo de um fornecedor';

-- Função para buscar itens por categoria
CREATE OR REPLACE FUNCTION get_catalog_items_by_category(
  supplier_id UUID,
  category_name TEXT
)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT jsonb_agg(item)
  FROM equipment_suppliers,
       jsonb_array_elements(equipment_catalog) AS item
  WHERE id = supplier_id
    AND item->>'category' = category_name
    AND (item->>'is_active')::boolean = true;
$$;

COMMENT ON FUNCTION get_catalog_items_by_category(UUID, TEXT) IS
'Retorna todos os itens ativos de uma categoria específica do catálogo';

-- ========== GRANT PERMISSIONS ==========

GRANT EXECUTE ON FUNCTION count_active_catalog_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_catalog_items(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_catalog_items_by_category(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_catalog_items_by_category(UUID, TEXT) TO service_role;
