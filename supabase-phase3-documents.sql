-- =====================================================
-- FASE 3: Sistema Avançado de Validação de Documentos
-- =====================================================

-- 1. Tabela de validação individual por documento
CREATE TABLE IF NOT EXISTS document_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'rg_front', 'rg_back', 'cpf', 'proof_of_address', etc
  document_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id), -- Admin que revisou
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1, -- Versão do documento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_document_type CHECK (document_type IN ('rg_front', 'rg_back', 'cpf', 'proof_of_address', 'work_permit', 'criminal_record', 'vaccination_card', 'other'))
);

-- 2. Tabela de histórico de alterações
CREATE TABLE IF NOT EXISTS professional_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'document_uploaded', 'document_approved', 'document_rejected'
  action_by UUID REFERENCES users(id), -- Quem fez a ação (null = próprio profissional)
  field_changed VARCHAR(100), -- Campo que foi alterado (opcional)
  old_value TEXT, -- Valor antigo (JSON ou texto)
  new_value TEXT, -- Valor novo (JSON ou texto)
  description TEXT, -- Descrição da ação
  metadata JSONB, -- Dados adicionais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_document_validations_professional ON document_validations(professional_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON document_validations(status);
CREATE INDEX IF NOT EXISTS idx_document_validations_type ON document_validations(document_type);
CREATE INDEX IF NOT EXISTS idx_professional_history_professional ON professional_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_history_created_at ON professional_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_history_action_type ON professional_history(action_type);

-- 4. Trigger para registrar mudanças automaticamente
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
        WHEN NEW.status = 'rejected' THEN 'Cadastro rejeitado: ' || COALESCE(NEW.rejection_reason, 'Sem motivo especificado')
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_log_professional_changes ON professionals;
CREATE TRIGGER trigger_log_professional_changes
  AFTER INSERT OR UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION log_professional_changes();

-- 5. Trigger para atualizar updated_at automaticamente
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

-- 6. View para facilitar consultas de documentos com validação
CREATE OR REPLACE VIEW professional_documents_status AS
SELECT
  p.id as professional_id,
  p.full_name,
  p.email,
  p.status as overall_status,
  jsonb_build_object(
    'rg_front', (
      SELECT jsonb_build_object(
        'url', dv.document_url,
        'status', dv.status,
        'version', dv.version,
        'rejection_reason', dv.rejection_reason,
        'reviewed_at', dv.reviewed_at
      )
      FROM document_validations dv
      WHERE dv.professional_id = p.id
        AND dv.document_type = 'rg_front'
      ORDER BY dv.version DESC
      LIMIT 1
    ),
    'rg_back', (
      SELECT jsonb_build_object(
        'url', dv.document_url,
        'status', dv.status,
        'version', dv.version,
        'rejection_reason', dv.rejection_reason,
        'reviewed_at', dv.reviewed_at
      )
      FROM document_validations dv
      WHERE dv.professional_id = p.id
        AND dv.document_type = 'rg_back'
      ORDER BY dv.version DESC
      LIMIT 1
    ),
    'cpf', (
      SELECT jsonb_build_object(
        'url', dv.document_url,
        'status', dv.status,
        'version', dv.version,
        'rejection_reason', dv.rejection_reason,
        'reviewed_at', dv.reviewed_at
      )
      FROM document_validations dv
      WHERE dv.professional_id = p.id
        AND dv.document_type = 'cpf'
      ORDER BY dv.version DESC
      LIMIT 1
    ),
    'proof_of_address', (
      SELECT jsonb_build_object(
        'url', dv.document_url,
        'status', dv.status,
        'version', dv.version,
        'rejection_reason', dv.rejection_reason,
        'reviewed_at', dv.reviewed_at
      )
      FROM document_validations dv
      WHERE dv.professional_id = p.id
        AND dv.document_type = 'proof_of_address'
      ORDER BY dv.version DESC
      LIMIT 1
    )
  ) as documents_status
FROM professionals p;

-- 7. Função helper para pegar histórico completo
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
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE document_validations IS 'Validação individual de cada documento com versionamento';
COMMENT ON TABLE professional_history IS 'Histórico completo de todas as alterações e ações realizadas';
COMMENT ON COLUMN document_validations.version IS 'Versão do documento - incrementa a cada reenvio';
COMMENT ON COLUMN professional_history.action_type IS 'Tipo de ação: created, updated, approved, rejected, document_uploaded, etc';
COMMENT ON VIEW professional_documents_status IS 'View consolidada com status individual de cada documento';
