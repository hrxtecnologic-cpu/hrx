-- Migration: Adicionar campos legais aos fornecedores
-- Data: 2025-10-28
-- Descrição: Adiciona legal_name e cnpj à tabela equipment_suppliers

-- ========== ALTER TABLE: equipment_suppliers ==========

-- Adicionar Razão Social (nome legal da empresa)
ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS legal_name TEXT;

-- Adicionar CNPJ (pode ser NULL para fornecedores sem registro formal)
ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

-- ========== INDEXES ==========

-- Índice para buscar por CNPJ (útil para verificar duplicatas)
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_cnpj
ON equipment_suppliers(cnpj)
WHERE cnpj IS NOT NULL;

-- ========== COMMENTS ==========

COMMENT ON COLUMN equipment_suppliers.legal_name IS
'Razão Social da empresa fornecedora (nome legal registrado)';

COMMENT ON COLUMN equipment_suppliers.cnpj IS
'CNPJ da empresa no formato 00.000.000/0000-00 (opcional)';
