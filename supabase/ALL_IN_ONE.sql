-- =====================================================
-- HRX - TODAS AS MIGRATIONS CONSOLIDADAS
-- =====================================================
-- Este arquivo contém TODAS as migrations em ordem
-- Execute APENAS se for a primeira vez ou se quiser resetar tudo
-- =====================================================

-- =====================================================
-- MIGRATION 001: Users Table
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  user_type VARCHAR(20) CHECK (user_type IN ('professional', 'contractor', NULL)),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =====================================================
-- MIGRATION 002: Professionals Table
-- =====================================================

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Dados Pessoais
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,

  -- Endereço
  cep VARCHAR(9) NOT NULL,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(10) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,

  -- Experiência Profissional
  categories JSONB NOT NULL,
  has_experience BOOLEAN NOT NULL,
  experience_description TEXT,
  years_of_experience VARCHAR(10),

  -- Disponibilidade
  availability JSONB NOT NULL,

  -- Documentos
  documents JSONB,

  -- Dados Bancários
  bank_name VARCHAR(100),
  account_type VARCHAR(20),
  agency VARCHAR(10),
  account_number VARCHAR(20),
  pix_key VARCHAR(100),

  -- Controle
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  accepts_notifications BOOLEAN DEFAULT true,

  -- Admin
  internal_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_cpf ON professionals(cpf);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON professionals(email);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_categories ON professionals USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_professionals_city ON professionals(city);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON professionals(state);

-- =====================================================
-- MIGRATION 003: Add Portfolio Column
-- =====================================================

ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS portfolio JSONB;

-- =====================================================
-- MIGRATION 004: Contractors and Requests Tables
-- =====================================================

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  responsible_name VARCHAR(255) NOT NULL,
  responsible_role VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company_address TEXT,
  website VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_cnpj ON contractors(cnpj);
CREATE INDEX IF NOT EXISTS idx_contractors_email ON contractors(email);
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(20) UNIQUE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_type_other VARCHAR(100),
  event_description TEXT,
  venue_name VARCHAR(255),
  venue_address TEXT NOT NULL,
  venue_city VARCHAR(100) NOT NULL,
  venue_state VARCHAR(2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  expected_attendance INTEGER,
  professionals_needed JSONB NOT NULL,
  needs_equipment BOOLEAN DEFAULT false,
  equipment_list JSONB,
  equipment_other TEXT,
  equipment_notes TEXT,
  budget_range VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'very_urgent')),
  additional_notes TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'quoted', 'hired', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_request_number ON requests(request_number);
CREATE INDEX IF NOT EXISTS idx_requests_contractor_id ON requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON requests(urgency);
CREATE INDEX IF NOT EXISTS idx_requests_start_date ON requests(start_date);
CREATE INDEX IF NOT EXISTS idx_requests_venue_city ON requests(venue_city);
CREATE INDEX IF NOT EXISTS idx_requests_venue_state ON requests(venue_state);
CREATE INDEX IF NOT EXISTS idx_requests_professionals_needed ON requests USING GIN(professionals_needed);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) CHECK (recipient_type IN ('professional', 'contractor', 'hrx', 'admin')),
  subject VARCHAR(500),
  template_used VARCHAR(100),
  related_id UUID,
  related_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  external_id VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_type ON email_logs(recipient_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_related_id ON email_logs(related_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contractors_updated_at ON contractors;
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de solicitação
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  seq_number INTEGER;
  new_number VARCHAR(20);
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(request_number FROM '\d+$')
      AS INTEGER
    )
  ), 0) + 1
  INTO seq_number
  FROM requests
  WHERE request_number LIKE 'HRX-' || year_str || '-%';

  new_number := 'HRX-' || year_str || '-' || LPAD(seq_number::TEXT, 4, '0');

  NEW.request_number := new_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_request_number ON requests;
CREATE TRIGGER set_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_request_number();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON users TO postgres, anon, authenticated, service_role;
GRANT ALL ON professionals TO postgres, anon, authenticated, service_role;
GRANT ALL ON contractors TO postgres, anon, authenticated, service_role;
GRANT ALL ON requests TO postgres, anon, authenticated, service_role;
GRANT ALL ON email_logs TO postgres, anon, authenticated, service_role;

-- =====================================================
-- RLS (Desabilitado para desenvolvimento)
-- =====================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractors DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM - Todas as migrations aplicadas!
-- =====================================================

-- Verificação final
SELECT 'Migrations aplicadas com sucesso!' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'professionals', 'contractors', 'requests', 'email_logs')
ORDER BY table_name;
