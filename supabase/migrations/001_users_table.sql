-- Migration 001: Users Table
-- Cria a tabela de usuários sincronizada com Clerk
-- Data: 2025-10-19

-- =====================================================
-- TABELA: users (Usuários)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Clerk integration
  clerk_id VARCHAR(255) UNIQUE NOT NULL,

  -- Dados do usuário
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),

  -- Tipo de usuário
  user_type VARCHAR(20) CHECK (user_type IN ('professional', 'contractor', NULL)),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE users IS 'Usuários da plataforma (sincronizado com Clerk)';
COMMENT ON COLUMN users.clerk_id IS 'ID único do Clerk para autenticação';
COMMENT ON COLUMN users.user_type IS 'Tipo: professional (profissional) ou contractor (contratante)';
COMMENT ON COLUMN users.status IS 'Status: active (ativo), inactive (inativo), deleted (deletado)';

-- =====================================================
-- TRIGGER: Auto-update de updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANTS (Permissões)
-- =====================================================

GRANT ALL ON users TO postgres, anon, authenticated, service_role;

-- =====================================================
-- RLS (Row Level Security) - Desabilitado por padrão
-- =====================================================

-- Desabilita RLS temporariamente para facilitar desenvolvimento
-- IMPORTANTE: Habilitar RLS em produção!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM DA MIGRATION 001
-- =====================================================
