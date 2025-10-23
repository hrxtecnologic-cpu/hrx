-- Tabela para armazenar orçamentos de fornecedores
CREATE TABLE IF NOT EXISTS supplier_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES equipment_suppliers(id) ON DELETE CASCADE,

  -- Token único para acesso público
  token VARCHAR NOT NULL UNIQUE,

  -- Equipamentos solicitados (JSON)
  requested_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Resposta do fornecedor
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'expired')),

  -- Orçamento
  total_price NUMERIC(10, 2),
  daily_rate NUMERIC(10, 2),
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  setup_fee NUMERIC(10, 2) DEFAULT 0,

  -- Condições
  payment_terms TEXT,
  delivery_details TEXT,
  notes TEXT,

  -- Validade
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,

  -- Índices
  CONSTRAINT unique_project_supplier UNIQUE(project_id, supplier_id)
);

-- Índices para performance
CREATE INDEX idx_supplier_quotations_project ON supplier_quotations(project_id);
CREATE INDEX idx_supplier_quotations_supplier ON supplier_quotations(supplier_id);
CREATE INDEX idx_supplier_quotations_token ON supplier_quotations(token);
CREATE INDEX idx_supplier_quotations_status ON supplier_quotations(status);

-- Comentários
COMMENT ON TABLE supplier_quotations IS 'Orçamentos solicitados e recebidos de fornecedores';
COMMENT ON COLUMN supplier_quotations.token IS 'Token único para fornecedor acessar formulário sem login';
COMMENT ON COLUMN supplier_quotations.requested_items IS 'Lista de equipamentos solicitados com quantidades e especificações';
