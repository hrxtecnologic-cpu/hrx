-- Adiciona coluna proposed_budget à tabela equipment_suppliers
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar coluna proposed_budget (orçamento proposto pelo fornecedor)
ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS proposed_budget DECIMAL(10,2);

-- Adicionar comentário para documentação
COMMENT ON COLUMN equipment_suppliers.proposed_budget IS 'Orçamento proposto pelo fornecedor para os equipamentos';
