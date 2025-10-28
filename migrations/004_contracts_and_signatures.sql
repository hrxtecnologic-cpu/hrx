-- =====================================================
-- Migration: Sistema de Contratos e Assinaturas Digitais
-- =====================================================
-- Descrição: Implementa sistema completo de contratos
-- digitais com assinatura tokenizada e rastreamento
-- =====================================================

-- Tabela de Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  contract_number character varying NOT NULL UNIQUE,

  -- Documento
  contract_type character varying NOT NULL DEFAULT 'service_agreement'::character varying
    CHECK (contract_type::text = ANY (ARRAY['service_agreement'::character varying, 'nda'::character varying, 'amendment'::character varying]::text[])),
  pdf_url text,
  pdf_generated_at timestamp with time zone,

  -- Status
  status character varying NOT NULL DEFAULT 'draft'::character varying
    CHECK (status::text = ANY (ARRAY['draft'::character varying, 'sent'::character varying, 'signed'::character varying, 'expired'::character varying, 'cancelled'::character varying]::text[])),

  -- Assinatura Digital
  signature_token character varying UNIQUE,
  token_expires_at timestamp with time zone,
  signature_hash text, -- SHA-256 do documento + timestamp + IP
  signed_at timestamp with time zone,
  signed_by_name character varying,
  signed_by_email character varying,
  signed_by_ip character varying,

  -- Dados do Contrato
  contract_data jsonb DEFAULT '{}'::jsonb, -- Snapshot dos dados do projeto no momento da geração
  total_value numeric,
  payment_terms text,
  special_clauses text,

  -- Auditoria
  created_by character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,

  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS contracts_project_id_idx ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON public.contracts(status);
CREATE INDEX IF NOT EXISTS contracts_signature_token_idx ON public.contracts(signature_token);
CREATE INDEX IF NOT EXISTS contracts_created_at_idx ON public.contracts(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contracts_updated_at_trigger
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Função para gerar número de contrato automático
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CONT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_contract_number_trigger
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_number();

-- =====================================================
-- Tabela de Log de Ações de Contrato (Auditoria)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contract_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  action character varying NOT NULL
    CHECK (action::text = ANY (ARRAY['generated'::text, 'sent'::text, 'viewed'::text, 'signed'::text, 'downloaded'::text, 'cancelled'::text])),
  performed_by character varying,
  ip_address character varying,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT contract_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT contract_audit_log_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS contract_audit_log_contract_id_idx ON public.contract_audit_log(contract_id);
CREATE INDEX IF NOT EXISTS contract_audit_log_created_at_idx ON public.contract_audit_log(created_at DESC);

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON TABLE public.contracts IS 'Armazena contratos digitais do sistema';
COMMENT ON COLUMN public.contracts.signature_token IS 'Token JWT para validação de assinatura';
COMMENT ON COLUMN public.contracts.signature_hash IS 'Hash SHA-256 para integridade do documento';
COMMENT ON COLUMN public.contracts.contract_data IS 'Snapshot imutável dos dados do projeto';

COMMENT ON TABLE public.contract_audit_log IS 'Log de auditoria de todas as ações em contratos';
