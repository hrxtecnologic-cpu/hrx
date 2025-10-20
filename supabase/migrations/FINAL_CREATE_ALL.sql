-- =====================================================
-- SCRIPT SIMPLES - CRIA TUDO DO ZERO
-- =====================================================

-- 1. TABELA DE PROFISSIONAIS
CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  cpf VARCHAR(14),
  birth_date DATE,
  gender VARCHAR(20),
  zip_code VARCHAR(10),
  street VARCHAR(255),
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  categories TEXT[],
  experience_years INTEGER,
  bio TEXT,
  profile_photo_url TEXT,
  rg_front_url TEXT,
  rg_back_url TEXT,
  cpf_document_url TEXT,
  proof_of_residence_url TEXT,
  professional_photo_url TEXT,
  bank_name VARCHAR(100),
  bank_account_type VARCHAR(20),
  bank_agency VARCHAR(10),
  bank_account VARCHAR(20),
  pix_key VARCHAR(255),
  available_days TEXT[],
  preferred_shifts TEXT[],
  status VARCHAR(20) DEFAULT 'pending',
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE SOLICITAÇÕES
CREATE TABLE IF NOT EXISTS contractor_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255),
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  responsible_name VARCHAR(255) NOT NULL,
  responsible_role VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  accepts_whatsapp BOOLEAN DEFAULT FALSE,
  website VARCHAR(255),
  company_address TEXT,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  expected_attendance INTEGER,
  venue_name VARCHAR(255),
  venue_address VARCHAR(255) NOT NULL,
  venue_city VARCHAR(100) NOT NULL,
  venue_state VARCHAR(2) NOT NULL,
  venue_zip VARCHAR(10),
  professionals_needed JSONB,
  needs_equipment BOOLEAN DEFAULT FALSE,
  equipment_list TEXT[],
  equipment_other TEXT,
  equipment_notes TEXT,
  budget_range VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'normal',
  additional_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE TIPOS DE EVENTO
CREATE TABLE IF NOT EXISTS event_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE ALOCAÇÕES
CREATE TABLE IF NOT EXISTS event_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  allocations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  request_id UUID,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  user_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSERIR CATEGORIAS
INSERT INTO categories (name, description) VALUES
  ('Garçom', 'Profissional de serviço de mesa'),
  ('Bartender', 'Profissional de bebidas'),
  ('Cozinheiro', 'Profissional de cozinha'),
  ('Recepcionista', 'Profissional de recepção'),
  ('Segurança', 'Profissional de segurança'),
  ('DJ', 'Profissional de música'),
  ('Fotógrafo', 'Profissional de fotografia'),
  ('Decorador', 'Profissional de decoração'),
  ('Mestre de Cerimônias', 'Profissional de eventos'),
  ('Hostess', 'Profissional de recepção')
ON CONFLICT (name) DO NOTHING;

-- INSERIR TIPOS DE EVENTO
INSERT INTO event_types (name, description) VALUES
  ('Casamento', 'Festas de casamento'),
  ('Festa Corporativa', 'Eventos empresariais'),
  ('Aniversário', 'Festas de aniversário'),
  ('Formatura', 'Festas de formatura'),
  ('Show/Apresentação', 'Shows e apresentações'),
  ('Conferência', 'Conferências e palestras'),
  ('Workshop', 'Workshops e treinamentos'),
  ('Feira/Exposição', 'Feiras e exposições'),
  ('Inauguração', 'Inaugurações'),
  ('Outros', 'Outros tipos de eventos')
ON CONFLICT (name) DO NOTHING;
