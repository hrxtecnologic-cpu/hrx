-- Tabela de Fornecedores de Equipamentos
CREATE TABLE IF NOT EXISTS equipment_suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  equipment_types TEXT[] NOT NULL DEFAULT '{}',
  proposed_budget TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_status ON equipment_suppliers(status);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_email ON equipment_suppliers(email);

-- Tabela de Alocações de Equipamentos
CREATE TABLE IF NOT EXISTS equipment_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES contractor_requests(id) ON DELETE CASCADE,
  allocations JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id)
);

-- Índice para buscar alocações por solicitação
CREATE INDEX IF NOT EXISTS idx_equipment_allocations_request ON equipment_allocations(request_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_equipment_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_suppliers_updated_at
  BEFORE UPDATE ON equipment_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_suppliers_updated_at();

CREATE OR REPLACE FUNCTION update_equipment_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_allocations_updated_at
  BEFORE UPDATE ON equipment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_allocations_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE equipment_suppliers IS 'Fornecedores de equipamentos para eventos';
COMMENT ON TABLE equipment_allocations IS 'Alocações de equipamentos por evento';
