-- =====================================================
-- SCRIPT COMPLETO DE CRIAÇÃO DE TABELAS - HRX SYSTEM
-- =====================================================

-- 1. Tabela de Usuários (integração com Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  user_type VARCHAR(50), -- 'professional', 'contractor', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Profissionais
CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE,

  -- Dados Pessoais
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  cpf VARCHAR(14),
  birth_date DATE,
  gender VARCHAR(20),

  -- Endereço
  zip_code VARCHAR(10),
  street VARCHAR(255),
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),

  -- Profissional
  categories TEXT[] DEFAULT '{}', -- Array de categorias
  experience_years INTEGER,
  bio TEXT,
  profile_photo_url TEXT,

  -- Documentos
  rg_front_url TEXT,
  rg_back_url TEXT,
  cpf_document_url TEXT,
  proof_of_residence_url TEXT,
  professional_photo_url TEXT,

  -- Bancário
  bank_name VARCHAR(100),
  bank_account_type VARCHAR(20),
  bank_agency VARCHAR(10),
  bank_account VARCHAR(20),
  pix_key VARCHAR(255),

  -- Disponibilidade
  available_days TEXT[] DEFAULT '{}',
  preferred_shifts TEXT[] DEFAULT '{}',

  -- Status e Controle
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Solicitações de Contratantes
CREATE TABLE IF NOT EXISTS contractor_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255),

  -- Dados da Empresa
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  responsible_name VARCHAR(255) NOT NULL,
  responsible_role VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  accepts_whatsapp BOOLEAN DEFAULT FALSE,
  website VARCHAR(255),
  company_address TEXT,

  -- Dados do Evento
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  expected_attendance INTEGER,

  -- Local do Evento
  venue_name VARCHAR(255),
  venue_address VARCHAR(255) NOT NULL,
  venue_city VARCHAR(100) NOT NULL,
  venue_state VARCHAR(2) NOT NULL,
  venue_zip VARCHAR(10),

  -- Profissionais Necessários
  professionals_needed JSONB, -- Array de { category, quantity, shift, requirements }

  -- Equipamentos
  needs_equipment BOOLEAN DEFAULT FALSE,
  equipment_list TEXT[] DEFAULT '{}',
  equipment_other TEXT,
  equipment_notes TEXT,

  -- Orçamento e Observações
  budget_range VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'normal', -- 'normal', 'urgent', 'very_urgent'
  additional_notes TEXT,

  -- Status e Controle
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Categorias de Profissionais
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Tipos de Evento
CREATE TABLE IF NOT EXISTS event_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Alocações de Profissionais para Eventos
CREATE TABLE IF NOT EXISTS event_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES contractor_requests(id) ON DELETE CASCADE,
  allocations JSONB NOT NULL, -- Array de { category, shift, selectedProfessionals: [ids] }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id)
);

-- 7. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  request_id UUID REFERENCES contractor_requests(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'event_allocation', 'status_update', 'general', etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Professionals
CREATE INDEX IF NOT EXISTS idx_professionals_clerk_id ON professionals(clerk_id);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON professionals(email);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_categories ON professionals USING GIN(categories);

-- Contractor Requests
CREATE INDEX IF NOT EXISTS idx_contractor_requests_clerk_id ON contractor_requests(clerk_id);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_status ON contractor_requests(status);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_start_date ON contractor_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_event_type ON contractor_requests(event_type);

-- Event Allocations
CREATE INDEX IF NOT EXISTS idx_event_allocations_request ON event_allocations(request_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_professional ON notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- =====================================================
-- DADOS PADRÃO
-- =====================================================

-- Inserir categorias padrão
INSERT INTO categories (name, description) VALUES
  ('Garçom', 'Profissional de serviço de mesa e atendimento'),
  ('Bartender', 'Profissional especializado em preparo de drinks'),
  ('Cozinheiro', 'Profissional de cozinha e preparo de alimentos'),
  ('Recepcionista', 'Profissional de recepção e atendimento'),
  ('Segurança', 'Profissional de segurança e controle de acesso'),
  ('DJ', 'Profissional de música e entretenimento'),
  ('Fotógrafo', 'Profissional de fotografia de eventos'),
  ('Decorador', 'Profissional de decoração e ambientação'),
  ('Mestre de Cerimônias', 'Profissional de condução de eventos'),
  ('Hostess', 'Profissional de recepção e orientação de convidados'),
  ('Auxiliar de Cozinha', 'Profissional auxiliar de cozinha'),
  ('Sommelier', 'Profissional especialista em vinhos'),
  ('Buffet', 'Profissional de serviço de buffet'),
  ('Valet', 'Profissional de estacionamento e manobrista'),
  ('Limpeza', 'Profissional de limpeza e manutenção')
ON CONFLICT (name) DO NOTHING;

-- Inserir tipos de evento padrão
INSERT INTO event_types (name, description) VALUES
  ('Casamento', 'Cerimônias e festas de casamento'),
  ('Festa Corporativa', 'Eventos empresariais e corporativos'),
  ('Aniversário', 'Festas de aniversário e comemorações'),
  ('Formatura', 'Festas de formatura e colação de grau'),
  ('Show/Apresentação', 'Shows musicais e apresentações artísticas'),
  ('Conferência', 'Conferências, palestras e seminários'),
  ('Workshop', 'Workshops e treinamentos'),
  ('Feira/Exposição', 'Feiras comerciais e exposições'),
  ('Inauguração', 'Inaugurações e lançamentos'),
  ('Jantar/Almoço', 'Jantares e almoços executivos'),
  ('Happy Hour', 'Happy hours e confraternizações'),
  ('Coquetel', 'Coquetéis e eventos sociais'),
  ('Festival', 'Festivais e eventos culturais'),
  ('Lançamento de Produto', 'Lançamentos de produtos e serviços'),
  ('Outros', 'Outros tipos de eventos')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE users IS 'Usuários do sistema integrados com Clerk';
COMMENT ON TABLE professionals IS 'Cadastro completo de profissionais';
COMMENT ON TABLE contractor_requests IS 'Solicitações de contratação de equipes';
COMMENT ON TABLE categories IS 'Categorias de profissionais disponíveis';
COMMENT ON TABLE event_types IS 'Tipos de eventos disponíveis';
COMMENT ON TABLE event_allocations IS 'Alocação de profissionais para eventos';
COMMENT ON TABLE notifications IS 'Notificações enviadas aos profissionais';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
