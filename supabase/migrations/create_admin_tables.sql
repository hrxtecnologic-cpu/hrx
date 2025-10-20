-- Tabela de Categorias de Profissionais
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Tipos de Evento
CREATE TABLE IF NOT EXISTS event_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Alocações de Profissionais para Eventos
CREATE TABLE IF NOT EXISTS event_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES contractor_requests(id) ON DELETE CASCADE,
  allocations JSONB NOT NULL, -- Array de { category, shift, selectedProfessionals: [ids] }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id)
);

-- Tabela de Notificações
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_event_allocations_request ON event_allocations(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_professional ON notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

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
  ('Hostess', 'Profissional de recepção e orientação de convidados')
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
  ('Outros', 'Outros tipos de eventos')
ON CONFLICT (name) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE categories IS 'Categorias de profissionais disponíveis no sistema';
COMMENT ON TABLE event_types IS 'Tipos de eventos disponíveis para solicitações';
COMMENT ON TABLE event_allocations IS 'Alocação de profissionais para eventos específicos';
COMMENT ON TABLE notifications IS 'Notificações enviadas aos profissionais';
