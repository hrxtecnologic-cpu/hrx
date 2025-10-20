-- =====================================================
-- SCRIPT DE CORREÇÃO DE TABELAS EXISTENTES
-- =====================================================

-- 1. Adicionar colunas faltantes na tabela professionals (se não existirem)
DO $$
BEGIN
  -- Adicionar clerk_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='clerk_id') THEN
    ALTER TABLE professionals ADD COLUMN clerk_id VARCHAR(255);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_professionals_clerk_id ON professionals(clerk_id);
  END IF;

  -- Adicionar categories como array se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='categories') THEN
    ALTER TABLE professionals ADD COLUMN categories TEXT[] DEFAULT '{}';
    CREATE INDEX IF NOT EXISTS idx_professionals_categories ON professionals USING GIN(categories);
  END IF;

  -- Adicionar available_days se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='available_days') THEN
    ALTER TABLE professionals ADD COLUMN available_days TEXT[] DEFAULT '{}';
  END IF;

  -- Adicionar preferred_shifts se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='preferred_shifts') THEN
    ALTER TABLE professionals ADD COLUMN preferred_shifts TEXT[] DEFAULT '{}';
  END IF;

  -- Adicionar rejection_reason se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='rejection_reason') THEN
    ALTER TABLE professionals ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Adicionar approved_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='approved_at') THEN
    ALTER TABLE professionals ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Adicionar approved_by se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='professionals' AND column_name='approved_by') THEN
    ALTER TABLE professionals ADD COLUMN approved_by VARCHAR(255);
  END IF;
END $$;

-- 2. Adicionar colunas faltantes na tabela contractor_requests (se não existirem)
DO $$
BEGIN
  -- Adicionar clerk_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='clerk_id') THEN
    ALTER TABLE contractor_requests ADD COLUMN clerk_id VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_contractor_requests_clerk_id ON contractor_requests(clerk_id);
  END IF;

  -- Adicionar professionals_needed se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='professionals_needed') THEN
    ALTER TABLE contractor_requests ADD COLUMN professionals_needed JSONB;
  END IF;

  -- Adicionar needs_equipment se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='needs_equipment') THEN
    ALTER TABLE contractor_requests ADD COLUMN needs_equipment BOOLEAN DEFAULT FALSE;
  END IF;

  -- Adicionar equipment_list se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='equipment_list') THEN
    ALTER TABLE contractor_requests ADD COLUMN equipment_list TEXT[] DEFAULT '{}';
  END IF;

  -- Adicionar equipment_other se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='equipment_other') THEN
    ALTER TABLE contractor_requests ADD COLUMN equipment_other TEXT;
  END IF;

  -- Adicionar equipment_notes se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='equipment_notes') THEN
    ALTER TABLE contractor_requests ADD COLUMN equipment_notes TEXT;
  END IF;

  -- Adicionar urgency se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='urgency') THEN
    ALTER TABLE contractor_requests ADD COLUMN urgency VARCHAR(20) DEFAULT 'normal';
  END IF;

  -- Adicionar accepts_whatsapp se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='accepts_whatsapp') THEN
    ALTER TABLE contractor_requests ADD COLUMN accepts_whatsapp BOOLEAN DEFAULT FALSE;
  END IF;

  -- Adicionar expected_attendance se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='contractor_requests' AND column_name='expected_attendance') THEN
    ALTER TABLE contractor_requests ADD COLUMN expected_attendance INTEGER;
  END IF;
END $$;

-- 3. Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  user_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. Criar tabela categories se não existir
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela event_types se não existir
CREATE TABLE IF NOT EXISTS event_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela event_allocations se não existir
CREATE TABLE IF NOT EXISTS event_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES contractor_requests(id) ON DELETE CASCADE,
  allocations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_event_allocations_request ON event_allocations(request_id);

-- 7. Criar tabela notifications se não existir
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  request_id UUID REFERENCES contractor_requests(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_professional ON notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 8. Inserir categorias padrão
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

-- 9. Inserir tipos de evento padrão
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
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar todas as tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Mostrar colunas da tabela professionals
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'professionals'
ORDER BY ordinal_position;

-- Mostrar colunas da tabela contractor_requests
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contractor_requests'
ORDER BY ordinal_position;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
