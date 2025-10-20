-- =====================================================
-- 1. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. ADICIONAR clerk_id NA TABELA professionals
-- =====================================================

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_professionals_clerk_id ON professionals(clerk_id);

-- =====================================================
-- 3. CRIAR TRIGGERS PARA TODAS AS TABELAS
-- =====================================================

-- Trigger para professionals
DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para contractor_requests
DROP TRIGGER IF EXISTS update_contractor_requests_updated_at ON contractor_requests;
CREATE TRIGGER update_contractor_requests_updated_at
  BEFORE UPDATE ON contractor_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para contractors
DROP TRIGGER IF EXISTS update_contractors_updated_at ON contractors;
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para event_types
DROP TRIGGER IF EXISTS update_event_types_updated_at ON event_types;
CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON event_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para event_allocations
DROP TRIGGER IF EXISTS update_event_allocations_updated_at ON event_allocations;
CREATE TRIGGER update_event_allocations_updated_at
  BEFORE UPDATE ON event_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para requests
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ADICIONAR ÍNDICES ÚTEIS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_city ON professionals(city);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON professionals(state);

CREATE INDEX IF NOT EXISTS idx_contractor_requests_status ON contractor_requests(status);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_venue_city ON contractor_requests(venue_city);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_venue_state ON contractor_requests(venue_state);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_start_date ON contractor_requests(start_date);

CREATE INDEX IF NOT EXISTS idx_notifications_professional_id ON notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_event_allocations_request_id ON event_allocations(request_id);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
