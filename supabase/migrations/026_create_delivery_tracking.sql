-- =====================================================
-- Migration 026: Sistema de Tracking de Entregas
-- =====================================================
-- Cria tabelas para rastreamento de entregas de equipamentos em tempo real
-- Permite que fornecedores atualizem a localização e que clientes acompanhem

-- =====================================================
-- 1. Tabela de Entregas
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery_trackings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  event_project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES equipment_suppliers(id) ON DELETE CASCADE,
  supplier_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Informações da Entrega
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Status possíveis:
  -- 'pending'     - Aguardando início
  -- 'preparing'   - Preparando equipamento
  -- 'in_transit'  - Em trânsito
  -- 'delivered'   - Entregue
  -- 'cancelled'   - Cancelada

  -- Equipamentos sendo entregues (JSON array)
  equipment_items JSONB NOT NULL DEFAULT '[]',
  -- Exemplo: [
  --   {
  --     "name": "Mesa Redonda 1.5m",
  --     "quantity": 10,
  --     "category": "Mobiliário"
  --   }
  -- ]

  -- Localização Atual (atualizada pelo fornecedor)
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,

  -- Endereço de Origem (fornecedor)
  origin_address TEXT,
  origin_latitude DECIMAL(10, 8),
  origin_longitude DECIMAL(11, 8),

  -- Endereço de Destino (evento)
  destination_address TEXT NOT NULL,
  destination_latitude DECIMAL(10, 8) NOT NULL,
  destination_longitude DECIMAL(11, 8) NOT NULL,

  -- Horários
  scheduled_pickup_time TIMESTAMPTZ,
  scheduled_delivery_time TIMESTAMPTZ NOT NULL,
  actual_pickup_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,

  -- Informações da Rota
  estimated_distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,

  -- Observações
  notes TEXT,
  delivery_notes TEXT, -- Notas do entregador

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_delivery_trackings_event ON delivery_trackings(event_project_id);
CREATE INDEX idx_delivery_trackings_supplier ON delivery_trackings(supplier_id);
CREATE INDEX idx_delivery_trackings_status ON delivery_trackings(status);
CREATE INDEX idx_delivery_trackings_scheduled ON delivery_trackings(scheduled_delivery_time);
CREATE INDEX idx_delivery_trackings_location ON delivery_trackings(current_latitude, current_longitude);

-- =====================================================
-- 2. Tabela de Histórico de Localizações
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  delivery_tracking_id UUID NOT NULL REFERENCES delivery_trackings(id) ON DELETE CASCADE,

  -- Localização
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Velocidade estimada (km/h)
  speed_kmh DECIMAL(5, 2),

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de histórico
CREATE INDEX idx_delivery_location_history_tracking ON delivery_location_history(delivery_tracking_id, recorded_at DESC);

-- =====================================================
-- 3. Tabela de Atualizações de Status
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  delivery_tracking_id UUID NOT NULL REFERENCES delivery_trackings(id) ON DELETE CASCADE,

  -- Status anterior e novo
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,

  -- Quem atualizou
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Observações
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para histórico de status
CREATE INDEX idx_delivery_status_updates_tracking ON delivery_status_updates(delivery_tracking_id, created_at DESC);

-- =====================================================
-- 4. Trigger para atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_delivery_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_tracking_updated_at
  BEFORE UPDATE ON delivery_trackings
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_tracking_updated_at();

-- =====================================================
-- 5. Trigger para criar histórico de status
-- =====================================================

CREATE OR REPLACE FUNCTION create_delivery_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou, criar registro no histórico
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO delivery_status_updates (
      delivery_tracking_id,
      old_status,
      new_status,
      updated_by_user_id
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.supplier_user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_status_changed
  AFTER INSERT OR UPDATE ON delivery_trackings
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_status_history();

-- =====================================================
-- 6. View para Entregas Ativas
-- =====================================================

CREATE OR REPLACE VIEW active_deliveries AS
SELECT
  dt.*,
  ep.event_name,
  ep.event_date,
  ep.event_location,
  es.company_name AS supplier_name,
  u.name AS driver_name,
  u.phone AS driver_phone,

  -- Calcular tempo restante estimado
  CASE
    WHEN dt.scheduled_delivery_time > NOW() THEN
      EXTRACT(EPOCH FROM (dt.scheduled_delivery_time - NOW())) / 60
    ELSE 0
  END AS minutes_until_delivery,

  -- Verificar se está atrasado
  CASE
    WHEN dt.status NOT IN ('delivered', 'cancelled') AND NOW() > dt.scheduled_delivery_time THEN true
    ELSE false
  END AS is_late

FROM delivery_trackings dt
LEFT JOIN event_projects ep ON dt.event_project_id = ep.id
LEFT JOIN equipment_suppliers es ON dt.supplier_id = es.id
LEFT JOIN users u ON dt.supplier_user_id = u.id
WHERE dt.status IN ('pending', 'preparing', 'in_transit');

-- =====================================================
-- 7. Função para calcular ETA (Estimated Time of Arrival)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_delivery_eta(
  p_delivery_id UUID
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_current_lat DECIMAL;
  v_current_lon DECIMAL;
  v_dest_lat DECIMAL;
  v_dest_lon DECIMAL;
  v_avg_speed_kmh DECIMAL := 40; -- Velocidade média no trânsito urbano
  v_distance_km DECIMAL;
  v_eta_hours DECIMAL;
BEGIN
  -- Buscar coordenadas
  SELECT
    current_latitude,
    current_longitude,
    destination_latitude,
    destination_longitude
  INTO
    v_current_lat,
    v_current_lon,
    v_dest_lat,
    v_dest_lon
  FROM delivery_trackings
  WHERE id = p_delivery_id;

  -- Se não tem localização atual, retornar horário agendado
  IF v_current_lat IS NULL OR v_current_lon IS NULL THEN
    RETURN (SELECT scheduled_delivery_time FROM delivery_trackings WHERE id = p_delivery_id);
  END IF;

  -- Calcular distância usando Haversine
  v_distance_km := (
    6371 * acos(
      cos(radians(v_current_lat)) *
      cos(radians(v_dest_lat)) *
      cos(radians(v_dest_lon) - radians(v_current_lon)) +
      sin(radians(v_current_lat)) *
      sin(radians(v_dest_lat))
    )
  );

  -- Calcular tempo estimado em horas
  v_eta_hours := v_distance_km / v_avg_speed_kmh;

  -- Retornar ETA
  RETURN NOW() + (v_eta_hours * INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. RLS Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE delivery_trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_updates ENABLE ROW LEVEL SECURITY;

-- Admin pode fazer tudo
CREATE POLICY delivery_trackings_admin_all ON delivery_trackings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Fornecedor pode ver e atualizar suas entregas
CREATE POLICY delivery_trackings_supplier_read ON delivery_trackings
  FOR SELECT USING (
    supplier_user_id = auth.uid()
  );

CREATE POLICY delivery_trackings_supplier_update ON delivery_trackings
  FOR UPDATE USING (
    supplier_user_id = auth.uid()
  ) WITH CHECK (
    supplier_user_id = auth.uid()
  );

-- Cliente pode ver entregas do seu evento
CREATE POLICY delivery_trackings_client_read ON delivery_trackings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_projects ep
      WHERE ep.id = delivery_trackings.event_project_id
      AND ep.created_by = auth.uid()
    )
  );

-- Histórico de localização segue as mesmas regras
CREATE POLICY delivery_location_history_admin_all ON delivery_location_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY delivery_location_history_supplier ON delivery_location_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM delivery_trackings dt
      WHERE dt.id = delivery_location_history.delivery_tracking_id
      AND dt.supplier_user_id = auth.uid()
    )
  );

CREATE POLICY delivery_location_history_client_read ON delivery_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM delivery_trackings dt
      JOIN event_projects ep ON dt.event_project_id = ep.id
      WHERE dt.id = delivery_location_history.delivery_tracking_id
      AND ep.created_by = auth.uid()
    )
  );

-- Status updates seguem as mesmas regras
CREATE POLICY delivery_status_updates_admin_all ON delivery_status_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY delivery_status_updates_read ON delivery_status_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM delivery_trackings dt
      LEFT JOIN event_projects ep ON dt.event_project_id = ep.id
      WHERE dt.id = delivery_status_updates.delivery_tracking_id
      AND (dt.supplier_user_id = auth.uid() OR ep.created_by = auth.uid())
    )
  );

-- =====================================================
-- 9. Comentários
-- =====================================================

COMMENT ON TABLE delivery_trackings IS 'Rastreamento de entregas de equipamentos em tempo real';
COMMENT ON TABLE delivery_location_history IS 'Histórico de localizações GPS das entregas';
COMMENT ON TABLE delivery_status_updates IS 'Histórico de mudanças de status das entregas';
COMMENT ON COLUMN delivery_trackings.status IS 'Status da entrega: pending, preparing, in_transit, delivered, cancelled';
COMMENT ON COLUMN delivery_trackings.equipment_items IS 'Lista de equipamentos sendo entregues (JSON)';
COMMENT ON FUNCTION calculate_delivery_eta IS 'Calcula ETA baseado na localização atual e destino';
