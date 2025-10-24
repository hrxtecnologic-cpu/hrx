-- =====================================================
-- Migration 030: Adicionar UNIQUE Constraints
-- Data: 2025-10-24
-- Descrição: Adiciona UNIQUE em clerk_id de contractors e equipment_suppliers
--            para prevenir duplicação de cadastros (1 usuário = 1 cadastro)
-- =====================================================

-- =====================================================
-- 1. Verificar duplicatas em contractors.clerk_id
-- =====================================================
DO $$
DECLARE
  duplicates_count_contractors INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicates_count_contractors
  FROM (
    SELECT clerk_id
    FROM contractors
    WHERE clerk_id IS NOT NULL
    GROUP BY clerk_id
    HAVING COUNT(*) > 1
  ) AS dups;

  IF duplicates_count_contractors > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Existem % clerk_ids duplicados em contractors', duplicates_count_contractors;
    RAISE NOTICE 'Execute a query abaixo para ver duplicatas:';
    RAISE NOTICE 'SELECT clerk_id, COUNT(*), array_agg(id) FROM contractors WHERE clerk_id IS NOT NULL GROUP BY clerk_id HAVING COUNT(*) > 1;';
    RAISE EXCEPTION 'Corrija as duplicatas antes de adicionar UNIQUE constraint';
  ELSE
    RAISE NOTICE 'Nenhuma duplicata encontrada em contractors.clerk_id';
  END IF;
END $$;

-- =====================================================
-- 2. Verificar duplicatas em equipment_suppliers.clerk_id
-- =====================================================
DO $$
DECLARE
  duplicates_count_suppliers INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicates_count_suppliers
  FROM (
    SELECT clerk_id
    FROM equipment_suppliers
    WHERE clerk_id IS NOT NULL
    GROUP BY clerk_id
    HAVING COUNT(*) > 1
  ) AS dups;

  IF duplicates_count_suppliers > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Existem % clerk_ids duplicados em equipment_suppliers', duplicates_count_suppliers;
    RAISE NOTICE 'Execute a query abaixo para ver duplicatas:';
    RAISE NOTICE 'SELECT clerk_id, COUNT(*), array_agg(id) FROM equipment_suppliers WHERE clerk_id IS NOT NULL GROUP BY clerk_id HAVING COUNT(*) > 1;';
    RAISE EXCEPTION 'Corrija as duplicatas antes de adicionar UNIQUE constraint';
  ELSE
    RAISE NOTICE 'Nenhuma duplicata encontrada em equipment_suppliers.clerk_id';
  END IF;
END $$;

-- =====================================================
-- 3. Adicionar UNIQUE constraint em contractors.clerk_id
-- =====================================================
ALTER TABLE contractors
ADD CONSTRAINT contractors_clerk_id_unique
UNIQUE(clerk_id);

COMMENT ON CONSTRAINT contractors_clerk_id_unique ON contractors
IS 'Ensures one contractor per authenticated user (prevents duplicate registrations)';

-- =====================================================
-- 4. Adicionar UNIQUE constraint em equipment_suppliers.clerk_id
-- =====================================================
ALTER TABLE equipment_suppliers
ADD CONSTRAINT equipment_suppliers_clerk_id_unique
UNIQUE(clerk_id);

COMMENT ON CONSTRAINT equipment_suppliers_clerk_id_unique ON equipment_suppliers
IS 'Ensures one supplier per authenticated user (prevents duplicate registrations)';

-- =====================================================
-- RESUMO DA MIGRATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 030 executada com sucesso!';
  RAISE NOTICE 'Constraints adicionados:';
  RAISE NOTICE '  - contractors.clerk_id UNIQUE';
  RAISE NOTICE '  - equipment_suppliers.clerk_id UNIQUE';
  RAISE NOTICE 'Beneficios: Previne multiplos cadastros por usuario';
END $$;
