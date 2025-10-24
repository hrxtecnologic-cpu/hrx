-- =====================================================
-- Migration: Catálogo de Equipamentos dos Fornecedores
-- =====================================================
-- Permite que cada fornecedor tenha seu catálogo de equipamentos
-- com especificações, preços e disponibilidade

CREATE TABLE IF NOT EXISTS supplier_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES equipment_suppliers(id) ON DELETE CASCADE,

  -- Informações do Equipamento
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  specifications TEXT,

  -- Disponibilidade e Preços
  quantity INTEGER DEFAULT 1,
  daily_rate NUMERIC(10, 2),
  weekly_rate NUMERIC(10, 2),
  monthly_rate NUMERIC(10, 2),
  replacement_value NUMERIC(10, 2),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supplier_equipment_supplier ON supplier_equipment(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_equipment_status ON supplier_equipment(status);
CREATE INDEX IF NOT EXISTS idx_supplier_equipment_category ON supplier_equipment(category);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_supplier_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplier_equipment_updated_at
  BEFORE UPDATE ON supplier_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_equipment_updated_at();

-- Comentário
COMMENT ON TABLE supplier_equipment IS 'Catálogo de equipamentos disponíveis por fornecedor';
COMMENT ON COLUMN supplier_equipment.supplier_id IS 'Referência ao fornecedor dono do equipamento';
COMMENT ON COLUMN supplier_equipment.daily_rate IS 'Valor da diária de locação';
COMMENT ON COLUMN supplier_equipment.status IS 'Status: active (disponível), inactive (fora de linha), maintenance (em manutenção)';
