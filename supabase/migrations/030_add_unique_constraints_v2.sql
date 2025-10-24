-- =====================================================
-- Migration 030 v2: Adicionar UNIQUE Constraints
-- Data: 2025-10-24
-- Descrição: Adiciona UNIQUE em clerk_id de contractors e equipment_suppliers
-- =====================================================

-- =====================================================
-- 1. contractors.clerk_id
-- =====================================================

-- Remover índice se existir (migration 028 criou índice, não constraint)
DROP INDEX IF EXISTS idx_contractors_clerk_id;

-- Verificar duplicatas
DO $$
DECLARE
  duplicates_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicates_count
  FROM (
    SELECT clerk_id
    FROM contractors
    WHERE clerk_id IS NOT NULL
    GROUP BY clerk_id
    HAVING COUNT(*) > 1
  ) AS dups;

  IF duplicates_count > 0 THEN
    RAISE EXCEPTION 'Existem % clerk_ids duplicados em contractors. Corrija antes de continuar.', duplicates_count;
  END IF;
END $$;

-- Adicionar UNIQUE constraint
ALTER TABLE contractors
ADD CONSTRAINT contractors_clerk_id_unique
UNIQUE(clerk_id);

COMMENT ON CONSTRAINT contractors_clerk_id_unique ON contractors
IS 'Ensures one contractor per authenticated user (prevents duplicate registrations)';

-- =====================================================
-- 2. equipment_suppliers.clerk_id
-- =====================================================

-- Remover índice se existir (migration 027 criou índice, não constraint)
DROP INDEX IF EXISTS idx_equipment_suppliers_clerk_id;

-- Verificar duplicatas
DO $$
DECLARE
  duplicates_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicates_count
  FROM (
    SELECT clerk_id
    FROM equipment_suppliers
    WHERE clerk_id IS NOT NULL
    GROUP BY clerk_id
    HAVING COUNT(*) > 1
  ) AS dups;

  IF duplicates_count > 0 THEN
    RAISE EXCEPTION 'Existem % clerk_ids duplicados em equipment_suppliers. Corrija antes de continuar.', duplicates_count;
  END IF;
END $$;

-- Adicionar UNIQUE constraint
ALTER TABLE equipment_suppliers
ADD CONSTRAINT equipment_suppliers_clerk_id_unique
UNIQUE(clerk_id);

COMMENT ON CONSTRAINT equipment_suppliers_clerk_id_unique ON equipment_suppliers
IS 'Ensures one supplier per authenticated user (prevents duplicate registrations)';

-- =====================================================
-- RESUMO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 030 v2 executada com sucesso!';
  RAISE NOTICE 'Constraints adicionados:';
  RAISE NOTICE '  - contractors.clerk_id UNIQUE';
  RAISE NOTICE '  - equipment_suppliers.clerk_id UNIQUE';
END $$;
