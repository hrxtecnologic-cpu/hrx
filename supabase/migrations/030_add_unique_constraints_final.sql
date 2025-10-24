-- =====================================================
-- Migration 030 FINAL: Adicionar UNIQUE Constraints
-- Data: 2025-10-24
-- Descrição: Adiciona UNIQUE em clerk_id (verifica se já existe antes)
-- =====================================================

-- =====================================================
-- 1. contractors.clerk_id
-- =====================================================
DO $$
BEGIN
  -- Verificar se constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contractors_clerk_id_unique'
  ) THEN
    -- Remover índice se existir
    DROP INDEX IF EXISTS idx_contractors_clerk_id;

    -- Verificar duplicatas
    IF EXISTS (
      SELECT clerk_id
      FROM contractors
      WHERE clerk_id IS NOT NULL
      GROUP BY clerk_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'Existem clerk_ids duplicados em contractors. Corrija antes de continuar.';
    END IF;

    -- Adicionar UNIQUE constraint
    ALTER TABLE contractors
    ADD CONSTRAINT contractors_clerk_id_unique
    UNIQUE(clerk_id);

    RAISE NOTICE 'UNIQUE constraint adicionado em contractors.clerk_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint contractors.clerk_id_unique já existe';
  END IF;
END $$;

COMMENT ON CONSTRAINT contractors_clerk_id_unique ON contractors
IS 'Ensures one contractor per authenticated user (prevents duplicate registrations)';

-- =====================================================
-- 2. equipment_suppliers.clerk_id
-- =====================================================
DO $$
BEGIN
  -- Verificar se constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'equipment_suppliers_clerk_id_unique'
  ) THEN
    -- Remover índice se existir
    DROP INDEX IF EXISTS idx_equipment_suppliers_clerk_id;

    -- Verificar duplicatas
    IF EXISTS (
      SELECT clerk_id
      FROM equipment_suppliers
      WHERE clerk_id IS NOT NULL
      GROUP BY clerk_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'Existem clerk_ids duplicados em equipment_suppliers. Corrija antes de continuar.';
    END IF;

    -- Adicionar UNIQUE constraint
    ALTER TABLE equipment_suppliers
    ADD CONSTRAINT equipment_suppliers_clerk_id_unique
    UNIQUE(clerk_id);

    RAISE NOTICE 'UNIQUE constraint adicionado em equipment_suppliers.clerk_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint equipment_suppliers_clerk_id_unique já existe';
  END IF;
END $$;

COMMENT ON CONSTRAINT equipment_suppliers_clerk_id_unique ON equipment_suppliers
IS 'Ensures one supplier per authenticated user (prevents duplicate registrations)';

-- =====================================================
-- RESUMO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 030 executada com sucesso!';
  RAISE NOTICE 'Verificacao completa - constraints UNIQUE garantidos';
END $$;
