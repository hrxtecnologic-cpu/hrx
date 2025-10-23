-- Tabela para armazenar configurações personalizáveis dos templates de email
-- Permite customizar cores, textos, logos e informações de contato sem alterar código

CREATE TABLE IF NOT EXISTS email_template_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Branding
  company_name TEXT DEFAULT 'HRX Tecnologia',
  company_logo_url TEXT,

  -- Cores do tema (hex colors)
  primary_color TEXT DEFAULT '#DC2626', -- vermelho HRX
  secondary_color TEXT DEFAULT '#EF4444',
  background_color TEXT DEFAULT '#f9fafb',
  text_color TEXT DEFAULT '#1a1a1a',

  -- Informações de contato
  contact_email TEXT DEFAULT 'contato@hrxeventos.com.br',
  contact_phone TEXT DEFAULT '(11) 99999-9999',
  contact_whatsapp TEXT DEFAULT '5511999999999',
  contact_website TEXT DEFAULT 'https://hrxeventos.com.br',
  contact_address TEXT,

  -- Redes sociais
  social_instagram TEXT,
  social_facebook TEXT,
  social_linkedin TEXT,

  -- Textos customizáveis por template (JSONB)
  template_texts JSONB DEFAULT '{}'::jsonb,

  -- Configurações adicionais
  footer_text TEXT DEFAULT 'HRX Tecnologia - Conectando profissionais a eventos',
  show_social_links BOOLEAN DEFAULT true,
  show_contact_info BOOLEAN DEFAULT true,

  -- Apenas uma configuração ativa por vez
  is_active BOOLEAN DEFAULT false
);

-- Inserir configuração padrão
INSERT INTO email_template_config (
  is_active,
  company_name,
  primary_color,
  secondary_color,
  contact_email,
  contact_phone,
  contact_whatsapp,
  contact_website,
  template_texts
) VALUES (
  true,
  'HRX Tecnologia',
  '#DC2626',
  '#EF4444',
  'contato@hrxeventos.com.br',
  '(11) 99999-9999',
  '5511999999999',
  'https://hrxeventos.com.br',
  '{
    "professional-welcome": {
      "subject": "Bem-vindo à HRX!",
      "greeting": "Olá",
      "cta_text": "Acessar Plataforma"
    },
    "contractor-confirmation": {
      "subject": "Solicitação Recebida - HRX",
      "greeting": "Olá",
      "confirmation_text": "Recebemos sua solicitação de evento"
    },
    "quote-request": {
      "subject": "Nova Solicitação de Orçamento - HRX",
      "greeting": "Olá",
      "cta_text": "Enviar Orçamento"
    },
    "final-proposal": {
      "subject": "Proposta Final - HRX",
      "greeting": "Olá",
      "accept_button": "Aceitar Proposta",
      "reject_button": "Recusar Proposta"
    }
  }'::jsonb
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_template_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_template_config_updated_at
  BEFORE UPDATE ON email_template_config
  FOR EACH ROW
  EXECUTE FUNCTION update_email_template_config_updated_at();

-- Trigger para garantir apenas uma configuração ativa por vez
CREATE OR REPLACE FUNCTION ensure_single_active_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Desativa todas as outras configurações
    UPDATE email_template_config
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_config_trigger
  BEFORE INSERT OR UPDATE ON email_template_config
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_config();

-- Índices
CREATE INDEX idx_email_template_config_active ON email_template_config(is_active) WHERE is_active = true;

-- Comentários
COMMENT ON TABLE email_template_config IS 'Configurações personalizáveis para templates de email';
COMMENT ON COLUMN email_template_config.template_texts IS 'Textos customizados por template em formato JSON';
COMMENT ON COLUMN email_template_config.is_active IS 'Apenas uma configuração pode estar ativa por vez';
