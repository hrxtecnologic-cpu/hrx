-- =====================================================
-- Migration 028: Correções Críticas da Auditoria
-- Data: 2025-10-24
-- Descrição: Corrige problemas críticos encontrados na auditoria
-- =====================================================

-- =====================================================
-- 1. Adicionar clerk_id em contractors
-- =====================================================
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS clerk_id character varying;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id
ON contractors(clerk_id)
WHERE clerk_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN contractors.clerk_id IS 'Clerk user ID for authenticated contractor access';

-- =====================================================
-- 2. Alinhar user_type entre tabelas
-- =====================================================

-- Remover constraint antiga de users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Adicionar nova constraint alinhada com notifications
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('professional', 'contractor', 'supplier', 'admin'));

-- Verificar e corrigir notifications se necessário
-- (notifications já aceita os valores corretos)

-- =====================================================
-- 3. Adicionar UNIQUE em professionals.clerk_id
-- =====================================================

-- Primeiro, verificar se há duplicatas
DO $$
DECLARE
  duplicates_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicates_count
  FROM (
    SELECT clerk_id
    FROM professionals
    WHERE clerk_id IS NOT NULL
    GROUP BY clerk_id
    HAVING COUNT(*) > 1
  ) AS dups;

  IF duplicates_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Existem % clerk_ids duplicados em professionals', duplicates_count;
    RAISE NOTICE 'Execute: SELECT clerk_id, COUNT(*) FROM professionals WHERE clerk_id IS NOT NULL GROUP BY clerk_id HAVING COUNT(*) > 1;';
    RAISE EXCEPTION 'Corrija as duplicatas antes de adicionar UNIQUE constraint';
  END IF;
END $$;

-- Se não houver duplicatas, adicionar UNIQUE
ALTER TABLE professionals
ADD CONSTRAINT professionals_clerk_id_unique
UNIQUE(clerk_id);

-- =====================================================
-- 4. Adicionar índices em Foreign Keys
-- =====================================================

-- equipment_supplier_id em event_projects
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_supplier_id
ON event_projects(equipment_supplier_id)
WHERE equipment_supplier_id IS NOT NULL;

-- professional_id em project_team
CREATE INDEX IF NOT EXISTS idx_project_team_professional_id
ON project_team(professional_id);

-- professional_id e supplier_id em notifications
CREATE INDEX IF NOT EXISTS idx_notifications_professional_id
ON notifications(professional_id)
WHERE professional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_supplier_id
ON notifications(supplier_id)
WHERE supplier_id IS NOT NULL;

-- =====================================================
-- 5. Adicionar validação em campos JSONB
-- =====================================================

-- professionals_needed deve ser array
ALTER TABLE event_projects
ADD CONSTRAINT check_professionals_needed_is_array
CHECK (
  professionals_needed IS NULL OR
  jsonb_typeof(professionals_needed) = 'array'
);

-- equipment_needed deve ser array
ALTER TABLE event_projects
ADD CONSTRAINT check_equipment_needed_is_array
CHECK (
  equipment_needed IS NULL OR
  jsonb_typeof(equipment_needed) = 'array'
);

-- =====================================================
-- DONE
-- =====================================================
-- Verificação final:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('contractors', 'professionals', 'users')
--   AND column_name = 'clerk_id';
