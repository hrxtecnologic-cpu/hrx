-- Migration 004: Contractors and Requests Tables
-- Cria as tabelas para contratantes e solicitações de equipe
-- Data: 2025-10-19

-- =====================================================
-- TABELA: contractors (Contratantes)
-- =====================================================

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados da Empresa
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  responsible_name VARCHAR(255) NOT NULL,
  responsible_role VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,

  -- Endereço
  company_address TEXT,
  website VARCHAR(255),

  -- Vinculação com usuário Clerk (opcional - pode ser cadastro direto sem login)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Controle
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para contractors
CREATE INDEX idx_contractors_cnpj ON contractors(cnpj);
CREATE INDEX idx_contractors_email ON contractors(email);
CREATE INDEX idx_contractors_user_id ON contractors(user_id);
CREATE INDEX idx_contractors_status ON contractors(status);

-- Comentários
COMMENT ON TABLE contractors IS 'Empresas contratantes de profissionais para eventos';
COMMENT ON COLUMN contractors.cnpj IS 'CNPJ no formato 00.000.000/0000-00';
COMMENT ON COLUMN contractors.user_id IS 'Referência ao usuário Clerk (quando o contratante cria conta)';

-- =====================================================
-- TABELA: requests (Solicitações de Equipe)
-- =====================================================

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Número único da solicitação (gerado automaticamente)
  request_number VARCHAR(20) UNIQUE NOT NULL,

  -- Referência ao contratante
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,

  -- Dados do Evento
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_type_other VARCHAR(100),
  event_description TEXT,

  -- Local do Evento
  venue_name VARCHAR(255),
  venue_address TEXT NOT NULL,
  venue_city VARCHAR(100) NOT NULL,
  venue_state VARCHAR(2) NOT NULL,

  -- Datas e Horários
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,

  -- Público esperado
  expected_attendance INTEGER,

  -- Necessidades de Profissionais (JSONB)
  -- Formato: [{"category": "Segurança", "quantity": 10, "shift": "12h-20h", "requirements": "..."}]
  professionals_needed JSONB NOT NULL,

  -- Equipamentos
  needs_equipment BOOLEAN DEFAULT false,
  equipment_list JSONB, -- Array de equipamentos: ["Ambulância", "Gerador", ...]
  equipment_other TEXT,
  equipment_notes TEXT,

  -- Orçamento e Urgência
  budget_range VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'very_urgent')),

  -- Observações adicionais
  additional_notes TEXT,

  -- Controle
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'quoted', 'hired', 'completed', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para requests
CREATE INDEX idx_requests_request_number ON requests(request_number);
CREATE INDEX idx_requests_contractor_id ON requests(contractor_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_urgency ON requests(urgency);
CREATE INDEX idx_requests_start_date ON requests(start_date);
CREATE INDEX idx_requests_venue_city ON requests(venue_city);
CREATE INDEX idx_requests_venue_state ON requests(venue_state);
CREATE INDEX idx_requests_professionals_needed ON requests USING GIN(professionals_needed);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);

-- Comentários
COMMENT ON TABLE requests IS 'Solicitações de equipe para eventos';
COMMENT ON COLUMN requests.request_number IS 'Número único no formato HRX-2025-0001';
COMMENT ON COLUMN requests.professionals_needed IS 'Array JSON com categorias e quantidades de profissionais';
COMMENT ON COLUMN requests.equipment_list IS 'Array JSON com lista de equipamentos solicitados';
COMMENT ON COLUMN requests.status IS 'new=Nova, in_progress=Em andamento, quoted=Orçada, hired=Contratado, completed=Concluído, cancelled=Cancelado';

-- =====================================================
-- FUNÇÃO: Gerar número de solicitação automático
-- =====================================================

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  seq_number INTEGER;
  new_number VARCHAR(20);
BEGIN
  -- Obtém o ano atual
  year_str := TO_CHAR(NOW(), 'YYYY');

  -- Busca o último número do ano
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(request_number FROM '\d+$')
      AS INTEGER
    )
  ), 0) + 1
  INTO seq_number
  FROM requests
  WHERE request_number LIKE 'HRX-' || year_str || '-%';

  -- Gera o novo número no formato HRX-2025-0001
  new_number := 'HRX-' || year_str || '-' || LPAD(seq_number::TEXT, 4, '0');

  NEW.request_number := new_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar request_number automaticamente
CREATE TRIGGER set_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_request_number();

-- =====================================================
-- TRIGGER: Auto-update de updated_at
-- =====================================================

-- Função genérica para updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para contractors
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para requests
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: email_logs (Log de emails enviados)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Destinatário
  recipient_email VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) CHECK (recipient_type IN ('professional', 'contractor', 'hrx', 'admin')),

  -- Conteúdo
  subject VARCHAR(500),
  template_used VARCHAR(100),

  -- Relacionamento
  related_id UUID, -- ID do professional, request, contractor, etc
  related_type VARCHAR(50), -- 'professional', 'request', etc

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,

  -- Provider info (Resend)
  external_id VARCHAR(255), -- ID do Resend

  -- Timestamp
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para email_logs
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_recipient_type ON email_logs(recipient_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_related_id ON email_logs(related_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Comentários
COMMENT ON TABLE email_logs IS 'Log de todos os emails enviados pelo sistema';
COMMENT ON COLUMN email_logs.recipient_type IS 'Tipo de destinatário: professional, contractor, hrx (interno), admin';
COMMENT ON COLUMN email_logs.external_id IS 'ID retornado pelo provedor de email (Resend)';

-- =====================================================
-- GRANTS (Permissões)
-- =====================================================

-- Permite que a aplicação acesse as tabelas
GRANT ALL ON contractors TO postgres, anon, authenticated, service_role;
GRANT ALL ON requests TO postgres, anon, authenticated, service_role;
GRANT ALL ON email_logs TO postgres, anon, authenticated, service_role;

-- =====================================================
-- RLS (Row Level Security) - Desabilitado por padrão
-- =====================================================

-- Desabilita RLS temporariamente para facilitar desenvolvimento
-- IMPORTANTE: Habilitar RLS em produção!

ALTER TABLE contractors DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- DADOS INICIAIS (Seeds)
-- =====================================================

-- Nenhum dado inicial necessário

-- =====================================================
-- FIM DA MIGRATION 004
-- =====================================================
