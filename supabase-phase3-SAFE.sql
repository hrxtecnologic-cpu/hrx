-- =====================================================
-- FASE 3: Sistema Avançado de Validação (VERSÃO SEGURA)
-- PODE SER EXECUTADO EM PRODUÇÃO SEM RISCOS
-- =====================================================

-- PASSO 1: Adicionar coluna rejection_reason se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE professionals ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Coluna rejection_reason adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna rejection_reason já existe, pulando...';
    END IF;
END $$;

-- PASSO 2: Adicionar colunas auxiliares se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'professionals'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));
        RAISE NOTICE 'Coluna role adicionada em users';
    END IF;
END $$;

-- PASSO 3: Criar tabela de validação individual por documento
CREATE TABLE IF NOT EXISTS document_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_document_type CHECK (document_type IN ('rg_front', 'rg_back', 'cpf', 'proof_of_address', 'work_permit', 'criminal_record', 'vaccination_card', 'other'))
);

-- PASSO 4: Criar tabela de histórico
CREATE TABLE IF NOT EXISTS professional_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_by UUID REFERENCES users(id),
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 5: Criar índices
CREATE INDEX IF NOT EXISTS idx_document_validations_professional ON document_validations(professional_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON document_validations(status);
CREATE INDEX IF NOT EXISTS idx_document_validations_type ON document_validations(document_type);
CREATE INDEX IF NOT EXISTS idx_professional_history_professional ON professional_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_history_created_at ON professional_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_history_action_type ON professional_history(action_type);

-- PASSO 6: Trigger para registrar mudanças (VERSÃO SEGURA)
CREATE OR REPLACE FUNCTION log_professional_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log quando status muda
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO professional_history (
      professional_id,
      action_type,
      field_changed,
      old_value,
      new_value,
      description
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        ELSE 'updated'
      END,
      'status',
      OLD.status,
      NEW.status,
      CASE
        WHEN NEW.status = 'approved' THEN 'Cadastro aprovado pela equipe'
        WHEN NEW.status = 'rejected' THEN
          'Cadastro rejeitado' ||
          CASE
            WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != ''
            THEN ': ' || NEW.rejection_reason
            ELSE ''
          END
        ELSE 'Status alterado'
      END
    );
  END IF;

  -- Log quando dados pessoais são atualizados
  IF TG_OP = 'UPDATE' AND (
    OLD.full_name IS DISTINCT FROM NEW.full_name OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.cpf IS DISTINCT FROM NEW.cpf OR
    OLD.city IS DISTINCT FROM NEW.city OR
    OLD.state IS DISTINCT FROM NEW.state
  ) THEN
    INSERT INTO professional_history (
      professional_id,
      action_type,
      description
    ) VALUES (
      NEW.id,
      'updated',
      'Dados pessoais atualizados'
    );
  END IF;

  -- Log na criação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO professional_history (
      professional_id,
      action_type,
      description
    ) VALUES (
      NEW.id,
      'created',
      'Cadastro criado'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 7: Criar ou substituir trigger
DROP TRIGGER IF EXISTS trigger_log_professional_changes ON professionals;
CREATE TRIGGER trigger_log_professional_changes
  AFTER INSERT OR UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION log_professional_changes();

-- PASSO 8: Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_validations_updated_at ON document_validations;
CREATE TRIGGER trigger_document_validations_updated_at
  BEFORE UPDATE ON document_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PASSO 9: Função helper para histórico
CREATE OR REPLACE FUNCTION get_professional_history(prof_id UUID)
RETURNS TABLE (
  id UUID,
  action_type VARCHAR,
  description TEXT,
  action_by_email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ph.id,
    ph.action_type,
    ph.description,
    u.email as action_by_email,
    ph.created_at
  FROM professional_history ph
  LEFT JOIN users u ON ph.action_by = u.id
  WHERE ph.professional_id = prof_id
  ORDER BY ph.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('document_validations', 'professional_history');

    IF table_count = 2 THEN
        RAISE NOTICE '✅ SUCESSO! Todas as tabelas foram criadas corretamente.';
    ELSE
        RAISE WARNING '⚠️ Algumas tabelas podem não ter sido criadas.';
    END IF;
END $$;

-- Comentários
COMMENT ON TABLE document_validations IS 'Validação individual de cada documento com versionamento';
COMMENT ON TABLE professional_history IS 'Histórico completo de todas as alterações e ações realizadas';
COMMENT ON COLUMN document_validations.version IS 'Versão do documento - incrementa a cada reenvio';
COMMENT ON COLUMN professional_history.action_type IS 'Tipo de ação: created, updated, approved, rejected, document_uploaded, etc';
