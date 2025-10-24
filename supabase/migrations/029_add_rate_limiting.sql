-- =====================================================
-- Migration 029: Sistema de Rate Limiting
-- Data: 2025-10-24
-- Descrição: Adiciona tabela para rate limiting usando Supabase
-- =====================================================

-- Criar tabela para rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier VARCHAR(255) PRIMARY KEY,
  count INTEGER DEFAULT 1 NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para limpeza automática de registros expirados
-- Removemos WHERE clause porque NOW() não é IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires
ON rate_limits(expires_at);

-- Índice para busca rápida por identificador
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier
ON rate_limits(identifier);

-- Comentários
COMMENT ON TABLE rate_limits IS 'Rate limiting storage - tracks request counts per identifier (IP, user ID, etc)';
COMMENT ON COLUMN rate_limits.identifier IS 'Unique identifier (IP address, user ID, API key, etc)';
COMMENT ON COLUMN rate_limits.count IS 'Number of requests in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start time of current rate limit window';
COMMENT ON COLUMN rate_limits.expires_at IS 'Expiration time for automatic cleanup';

-- Função para limpeza automática de registros expirados
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_rate_limits() IS 'Remove expired rate limit records (run periodically via cron)';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limits_updated_at
BEFORE UPDATE ON rate_limits
FOR EACH ROW
EXECUTE FUNCTION update_rate_limits_updated_at();

-- =====================================================
-- NOTA: Para limpeza automática, configure um cron job:
--
-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '*/5 * * * *',  -- A cada 5 minutos
--   'SELECT cleanup_expired_rate_limits();'
-- );
-- =====================================================
