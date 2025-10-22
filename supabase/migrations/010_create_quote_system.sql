-- =============================================
-- Migration 010: Sistema de Orçamentos
-- =============================================
-- Criado em: 22/10/2025
-- Descrição: Sistema completo de solicitação de orçamentos para fornecedores

-- =============================================
-- 1. Tabela: quote_requests (Solicitações de Orçamento)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informações do cliente/evento
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    event_date DATE,
    event_type TEXT,
    event_location TEXT,
    description TEXT,

    -- Urgência e margem
    is_urgent BOOLEAN DEFAULT FALSE,
    profit_margin DECIMAL(5,2) NOT NULL, -- 35.00 ou 80.00

    -- Status do orçamento
    status TEXT NOT NULL DEFAULT 'draft',
    -- Possíveis status: draft, sent, analyzing, finalized, cancelled

    -- Valores totais (calculados)
    total_supplier_cost DECIMAL(10,2) DEFAULT 0, -- Quanto vamos pagar aos fornecedores
    total_client_price DECIMAL(10,2) DEFAULT 0,  -- Quanto vamos cobrar do cliente
    total_profit DECIMAL(10,2) DEFAULT 0,         -- Lucro total

    -- Metadados
    created_by TEXT, -- clerk_id do admin que criou
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,

    CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'analyzing', 'finalized', 'cancelled')),
    CONSTRAINT valid_profit_margin CHECK (profit_margin IN (35.00, 80.00))
);

-- Índices para quote_requests
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_urgent ON quote_requests(is_urgent);
CREATE INDEX idx_quote_requests_event_date ON quote_requests(event_date);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at DESC);

-- Comentários
COMMENT ON TABLE quote_requests IS 'Solicitações de orçamento da HRX para eventos';
COMMENT ON COLUMN quote_requests.is_urgent IS 'Se true, margem de lucro é 80%, senão 35%';
COMMENT ON COLUMN quote_requests.profit_margin IS 'Margem de lucro em %: 35.00 (normal) ou 80.00 (urgente)';

-- =============================================
-- 2. Tabela: quote_request_items (Itens da Solicitação)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,

    -- Tipo do item
    item_type TEXT NOT NULL,
    -- Possíveis tipos: equipment, professional, service, other

    -- Detalhes do item
    category TEXT NOT NULL,
    subcategory TEXT,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    duration_days INTEGER NOT NULL DEFAULT 1,

    -- Especificações técnicas (JSONB flexível)
    specifications JSONB DEFAULT '{}'::jsonb,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',
    -- Possíveis status: pending, quoted, assigned, confirmed

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_item_type CHECK (item_type IN ('equipment', 'professional', 'service', 'other')),
    CONSTRAINT valid_item_status CHECK (status IN ('pending', 'quoted', 'assigned', 'confirmed')),
    CONSTRAINT valid_quantity CHECK (quantity > 0),
    CONSTRAINT valid_duration CHECK (duration_days > 0)
);

-- Índices para quote_request_items
CREATE INDEX idx_quote_items_request ON quote_request_items(quote_request_id);
CREATE INDEX idx_quote_items_type ON quote_request_items(item_type);
CREATE INDEX idx_quote_items_status ON quote_request_items(status);

-- Comentários
COMMENT ON TABLE quote_request_items IS 'Itens individuais de cada solicitação de orçamento';
COMMENT ON COLUMN quote_request_items.specifications IS 'Especificações técnicas em JSON: {"voltage": "220V", "power": "1000W"}';

-- =============================================
-- 3. Tabela: supplier_quotes (Orçamentos dos Fornecedores)
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    quote_request_item_id UUID REFERENCES quote_request_items(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES equipment_suppliers(id) ON DELETE CASCADE,

    -- Preços
    supplier_price DECIMAL(10,2) NOT NULL, -- Quanto o fornecedor cobra
    hrx_price DECIMAL(10,2) NOT NULL,      -- Preço com margem para o cliente
    profit_margin_applied DECIMAL(5,2) NOT NULL, -- Margem aplicada (35 ou 80)
    profit_amount DECIMAL(10,2) NOT NULL,  -- Lucro em R$

    -- Detalhes da cotação
    description TEXT,
    notes TEXT,
    availability_confirmed BOOLEAN DEFAULT FALSE,

    -- Status da cotação
    status TEXT NOT NULL DEFAULT 'pending',
    -- Possíveis status: pending, sent, received, accepted, rejected

    -- Timestamps
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_quote_status CHECK (status IN ('pending', 'sent', 'received', 'accepted', 'rejected')),
    CONSTRAINT valid_prices CHECK (supplier_price > 0 AND hrx_price > 0),
    CONSTRAINT valid_profit CHECK (profit_amount >= 0)
);

-- Índices para supplier_quotes
CREATE INDEX idx_supplier_quotes_request ON supplier_quotes(quote_request_id);
CREATE INDEX idx_supplier_quotes_supplier ON supplier_quotes(supplier_id);
CREATE INDEX idx_supplier_quotes_status ON supplier_quotes(status);
CREATE INDEX idx_supplier_quotes_item ON supplier_quotes(quote_request_item_id);

-- Comentários
COMMENT ON TABLE supplier_quotes IS 'Orçamentos recebidos dos fornecedores para cada solicitação';
COMMENT ON COLUMN supplier_quotes.supplier_price IS 'Preço que o fornecedor cobra (custo)';
COMMENT ON COLUMN supplier_quotes.hrx_price IS 'Preço que HRX cobra do cliente (com margem)';
COMMENT ON COLUMN supplier_quotes.profit_amount IS 'Lucro em R$ (hrx_price - supplier_price)';

-- =============================================
-- 4. Tabela: quote_emails (Histórico de Emails Enviados)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    supplier_quote_id UUID REFERENCES supplier_quotes(id) ON DELETE SET NULL,

    -- Destinatário
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,

    -- Tipo de email
    email_type TEXT NOT NULL,
    -- Tipos: quote_request, quote_urgent_admin, quote_accepted, quote_rejected

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',
    -- Possíveis: pending, sent, delivered, failed

    -- Resend ID
    resend_id TEXT,
    error_message TEXT,

    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_email_type CHECK (email_type IN ('quote_request', 'quote_urgent_admin', 'quote_accepted', 'quote_rejected', 'quote_reminder')),
    CONSTRAINT valid_email_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed'))
);

-- Índices para quote_emails
CREATE INDEX idx_quote_emails_request ON quote_emails(quote_request_id);
CREATE INDEX idx_quote_emails_type ON quote_emails(email_type);
CREATE INDEX idx_quote_emails_status ON quote_emails(status);
CREATE INDEX idx_quote_emails_sent ON quote_emails(sent_at DESC);

-- =============================================
-- 5. Funções Auxiliares
-- =============================================

-- Função para calcular margem de lucro automaticamente
CREATE OR REPLACE FUNCTION calculate_profit_margin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_urgent = TRUE THEN
        NEW.profit_margin := 80.00;
    ELSE
        NEW.profit_margin := 35.00;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular margem automaticamente
CREATE TRIGGER set_profit_margin
    BEFORE INSERT OR UPDATE OF is_urgent ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION calculate_profit_margin();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_quote_requests_timestamp
    BEFORE UPDATE ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_updated_at();

CREATE TRIGGER update_quote_items_timestamp
    BEFORE UPDATE ON quote_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_updated_at();

CREATE TRIGGER update_supplier_quotes_timestamp
    BEFORE UPDATE ON supplier_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_updated_at();

-- Função para calcular preço HRX com margem
CREATE OR REPLACE FUNCTION calculate_hrx_price()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcula o preço HRX com base no preço do fornecedor e margem
    NEW.hrx_price := NEW.supplier_price * (1 + (NEW.profit_margin_applied / 100));
    NEW.profit_amount := NEW.hrx_price - NEW.supplier_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular preço HRX automaticamente
CREATE TRIGGER calculate_hrx_price_trigger
    BEFORE INSERT OR UPDATE OF supplier_price, profit_margin_applied ON supplier_quotes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_hrx_price();

-- =============================================
-- 6. Policies (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_emails ENABLE ROW LEVEL SECURITY;

-- Policies: Admin pode tudo
CREATE POLICY "Admin full access to quote_requests"
    ON quote_requests FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access to quote_request_items"
    ON quote_request_items FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access to supplier_quotes"
    ON supplier_quotes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access to quote_emails"
    ON quote_emails FOR ALL
    USING (true)
    WITH CHECK (true);

-- =============================================
-- 7. Views Úteis
-- =============================================

-- View: Resumo de orçamentos
CREATE OR REPLACE VIEW quote_requests_summary AS
SELECT
    qr.id,
    qr.client_name,
    qr.event_date,
    qr.event_type,
    qr.is_urgent,
    qr.profit_margin,
    qr.status,
    qr.total_supplier_cost,
    qr.total_client_price,
    qr.total_profit,
    COUNT(DISTINCT qri.id) AS total_items,
    COUNT(DISTINCT sq.id) AS total_quotes,
    COUNT(DISTINCT CASE WHEN sq.status = 'accepted' THEN sq.id END) AS accepted_quotes,
    qr.created_at,
    qr.updated_at
FROM quote_requests qr
LEFT JOIN quote_request_items qri ON qr.id = qri.quote_request_id
LEFT JOIN supplier_quotes sq ON qr.id = sq.quote_request_id
GROUP BY qr.id;

COMMENT ON VIEW quote_requests_summary IS 'Resumo de todas as solicitações de orçamento com estatísticas';

-- =============================================
-- FIM DA MIGRATION 010
-- =============================================
