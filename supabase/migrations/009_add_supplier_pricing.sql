-- Migration: Adicionar Sistema de Preços por Período para Fornecedores
-- Data: 2025-10-22
-- Descrição: Permite que fornecedores definam preços por diária, 3 dias e 7 dias, com descontos

-- Adicionar coluna de pricing (JSONB) à tabela equipment_suppliers
ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN equipment_suppliers.pricing IS 'Preços por período: { "daily": "R$ 500", "three_days": "R$ 1.200", "weekly": "R$ 2.000", "discount_notes": "10% de desconto para períodos acima de 7 dias" }';

-- Remover coluna antiga proposed_budget (será migrada para pricing se existir)
-- Primeiro, migrar dados existentes
UPDATE equipment_suppliers
SET pricing = jsonb_build_object(
  'daily', proposed_budget,
  'three_days', NULL,
  'weekly', NULL,
  'discount_notes', NULL
)
WHERE proposed_budget IS NOT NULL
  AND (pricing IS NULL OR pricing = '{}'::jsonb);

-- Agora pode remover a coluna antiga (opcional - comentado por segurança)
-- ALTER TABLE equipment_suppliers DROP COLUMN IF EXISTS proposed_budget;

-- Criar índice GIN para busca por pricing
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_pricing
ON equipment_suppliers USING GIN (pricing);

-- Exemplo de query para buscar fornecedores com preço diário definido:
-- SELECT * FROM equipment_suppliers WHERE pricing ? 'daily';
