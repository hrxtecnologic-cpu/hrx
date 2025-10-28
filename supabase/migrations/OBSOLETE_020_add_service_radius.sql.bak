-- Migration: Adiciona raio de atuação para profissionais
-- Criado em: 2025-10-27
-- Descrição: Permite que profissionais definam o raio máximo de distância que aceitam viajar

-- =====================================================
-- ALTER TABLE PROFESSIONALS
-- =====================================================

ALTER TABLE professionals
ADD COLUMN service_radius_km INTEGER DEFAULT 50 CHECK (service_radius_km >= 5 AND service_radius_km <= 500);

COMMENT ON COLUMN professionals.service_radius_km IS 'Raio máximo em km que o profissional aceita viajar para eventos (5-500km, padrão: 50km)';

-- =====================================================
-- INDEX
-- =====================================================

CREATE INDEX idx_professionals_service_radius ON professionals(service_radius_km);
