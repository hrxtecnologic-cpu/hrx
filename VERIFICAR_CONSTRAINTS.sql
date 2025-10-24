-- =====================================================
-- Query para verificar UNIQUE constraints
-- =====================================================

-- Verificar constraints em contractors
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'contractors'
  AND constraint_name LIKE '%clerk_id%';

-- Verificar constraints em equipment_suppliers
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'equipment_suppliers'
  AND constraint_name LIKE '%clerk_id%';

-- Verificar constraints em professionals (para comparação)
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'professionals'
  AND constraint_name LIKE '%clerk_id%';

-- =====================================================
-- Se ambos existem, está OK!
-- Se algum faltar, execute o ALTER TABLE manualmente:
-- =====================================================

-- Para contractors (se não existir):
-- ALTER TABLE contractors ADD CONSTRAINT contractors_clerk_id_unique UNIQUE(clerk_id);

-- Para equipment_suppliers (se não existir):
-- ALTER TABLE equipment_suppliers ADD CONSTRAINT equipment_suppliers_clerk_id_unique UNIQUE(clerk_id);
