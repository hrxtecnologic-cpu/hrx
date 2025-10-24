-- =====================================================
-- Migration 027: Habilitar Realtime para Delivery Tracking
-- =====================================================
-- Descrição: Habilita Supabase Realtime na tabela delivery_trackings
--            para permitir tracking GPS em tempo real
-- Data: 2025-10-24
-- =====================================================

-- Habilitar Realtime na tabela delivery_trackings
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_trackings;

-- Habilitar Realtime na tabela delivery_location_history (para histórico)
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_location_history;

-- Comentários
COMMENT ON TABLE delivery_trackings IS 'Tracking de entregas em tempo real com Supabase Realtime habilitado';
COMMENT ON TABLE delivery_location_history IS 'Histórico de localizações GPS com Realtime habilitado';
