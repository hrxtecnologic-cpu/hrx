-- =====================================================
-- Migration 040: Create Equipment Categories View
-- =====================================================
-- Descrição: Cria view otimizada para categorias de equipamentos
-- Similar à professional_categories_view mas para equipamentos
-- =====================================================

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
        'required_documents', s.required_documents,
        'optional_documents', s.optional_documents,
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

-- Comentário explicativo
COMMENT ON VIEW equipment_categories_view IS 'View otimizada que retorna categorias de equipamentos com suas subcategorias agregadas em JSON';
