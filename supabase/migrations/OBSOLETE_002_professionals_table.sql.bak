-- Migration: Tabela de Profissionais
-- Criado em: 2025-10-19
-- Descrição: Cadastro completo de profissionais para eventos

-- =====================================================
-- TABELA PROFESSIONALS
-- =====================================================

CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Dados Pessoais
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,

  -- Endereço
  cep VARCHAR(9),
  street VARCHAR(255),
  number VARCHAR(10),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),

  -- Experiência
  categories JSONB NOT NULL, -- array de categorias
  has_experience BOOLEAN DEFAULT false,
  experience_description TEXT,
  years_of_experience VARCHAR(10), -- '<1', '1-3', '3-5', '5-10', '10+'

  -- Disponibilidade
  availability JSONB NOT NULL, -- {weekdays, weekends, holidays, night, travel}

  -- Documentos (URLs Supabase Storage)
  rg_photo_url VARCHAR(500),
  cpf_photo_url VARCHAR(500),
  profile_photo_url VARCHAR(500),
  proof_of_residence_url VARCHAR(500),
  certificates JSONB, -- array de URLs de certificados

  -- Dados Bancários
  bank_name VARCHAR(100),
  account_type VARCHAR(20), -- 'Corrente' ou 'Poupança'
  agency VARCHAR(10),
  account_number VARCHAR(20),
  pix_key VARCHAR(100),

  -- Controle
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, inactive
  accepts_notifications BOOLEAN DEFAULT true,

  -- Observações internas (admin)
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_cpf ON professionals(cpf);
CREATE INDEX idx_professionals_email ON professionals(email);
CREATE INDEX idx_professionals_status ON professionals(status);
CREATE INDEX idx_professionals_categories ON professionals USING GIN (categories);
CREATE INDEX idx_professionals_city ON professionals(city);
CREATE INDEX idx_professionals_state ON professionals(state);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Atualizar updated_at automaticamente
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE professionals IS 'Cadastro de profissionais para eventos';
COMMENT ON COLUMN professionals.categories IS 'Array JSON com categorias selecionadas';
COMMENT ON COLUMN professionals.availability IS 'JSON com disponibilidade: {weekdays, weekends, holidays, night, travel}';
COMMENT ON COLUMN professionals.certificates IS 'Array JSON com URLs de certificados adicionais';
COMMENT ON COLUMN professionals.status IS 'Status do cadastro: pending (análise), approved (aprovado), rejected (rejeitado), inactive (inativo)';
