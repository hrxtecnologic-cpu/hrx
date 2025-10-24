-- =====================================================
-- Criar UNIQUE constraints diretamente (sem verificações)
-- =====================================================

-- 1. Remover índices antigos
DROP INDEX IF EXISTS idx_contractors_clerk_id;
DROP INDEX IF EXISTS idx_equipment_suppliers_clerk_id;

-- 2. Criar UNIQUE constraint em contractors
ALTER TABLE contractors
ADD CONSTRAINT contractors_clerk_id_unique
UNIQUE(clerk_id);

-- 3. Criar UNIQUE constraint em equipment_suppliers
ALTER TABLE equipment_suppliers
ADD CONSTRAINT equipment_suppliers_clerk_id_unique
UNIQUE(clerk_id);

-- 4. Verificar se foram criados
SELECT 'contractors' as tabela, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'contractors' AND constraint_name LIKE '%clerk_id%'
UNION ALL
SELECT 'equipment_suppliers' as tabela, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'equipment_suppliers' AND constraint_name LIKE '%clerk_id%'
UNION ALL
SELECT 'professionals' as tabela, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'professionals' AND constraint_name LIKE '%clerk_id%';
