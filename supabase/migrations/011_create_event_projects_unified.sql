-- =====================================================
-- Migration 011: Event Projects - Unified Architecture
-- =====================================================
-- Descrição: Cria arquitetura unificada de projetos de eventos
--            Unifica contractor_requests + quote_requests em event_projects
--            Profissionais + Equipamentos em um único projeto
-- Data: 2025-10-22
-- Autor: HRX Dev Team
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR NOVAS TABELAS
-- =====================================================

-- Tabela principal: EVENT_PROJECTS (substitui contractor_requests e quote_requests)
CREATE TABLE IF NOT EXISTS event_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Número único do projeto (gerado automaticamente)
    project_number VARCHAR NOT NULL UNIQUE,

    -- Dados do Cliente
    client_name VARCHAR NOT NULL,
    client_email VARCHAR,
    client_phone VARCHAR,
    client_company VARCHAR, -- Empresa do cliente (se houver)
    client_cnpj VARCHAR,     -- CNPJ da empresa do cliente

    -- Dados do Evento
    event_name VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    event_description TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    expected_attendance INTEGER,

    -- Localização do Evento
    venue_name VARCHAR,
    venue_address TEXT NOT NULL,
    venue_city VARCHAR NOT NULL,
    venue_state VARCHAR NOT NULL,
    venue_zip VARCHAR,

    -- Business Logic
    is_urgent BOOLEAN DEFAULT FALSE,
    profit_margin NUMERIC(5,2) NOT NULL DEFAULT 35.00 CHECK (profit_margin IN (35.00, 80.00)),
    budget_range VARCHAR,

    -- Status do Projeto
    status VARCHAR NOT NULL DEFAULT 'new' CHECK (status IN (
        'new',           -- Novo (acabou de chegar)
        'analyzing',     -- Analisando (admin verificando)
        'quoting',       -- Cotando (enviando para fornecedores)
        'quoted',        -- Cotado (recebeu cotações)
        'proposed',      -- Proposta enviada ao cliente
        'approved',      -- Aprovado pelo cliente
        'in_execution',  -- Em execução
        'completed',     -- Concluído
        'cancelled'      -- Cancelado
    )),

    -- Financeiro (calculado automaticamente via trigger)
    total_team_cost NUMERIC(10,2) DEFAULT 0,        -- Custo total da equipe
    total_equipment_cost NUMERIC(10,2) DEFAULT 0,   -- Custo total dos equipamentos
    total_cost NUMERIC(10,2) DEFAULT 0,             -- Custo total (team + equipment)
    total_client_price NUMERIC(10,2) DEFAULT 0,     -- Preço final para o cliente
    total_profit NUMERIC(10,2) DEFAULT 0,           -- Lucro total

    -- Observações
    additional_notes TEXT,
    internal_notes TEXT,    -- Notas internas (não visível para cliente)

    -- Metadados
    created_by VARCHAR,     -- Clerk ID de quem criou
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    quoted_at TIMESTAMPTZ,  -- Quando foi enviado para cotação
    proposed_at TIMESTAMPTZ, -- Quando proposta foi enviada ao cliente
    approved_at TIMESTAMPTZ, -- Quando cliente aprovou
    completed_at TIMESTAMPTZ, -- Quando foi concluído

    -- Link com tabelas antigas (para migração gradual)
    migrated_from_contractor_request_id UUID,
    migrated_from_quote_request_id UUID
);

-- =====================================================
-- Tabela: PROJECT_TEAM (Profissionais alocados no projeto)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,

    -- Profissional (pode ser da base ou externo)
    professional_id UUID REFERENCES professionals(id), -- Se for da base HRX
    external_name VARCHAR,  -- Se for profissional externo

    -- Função no Projeto
    role VARCHAR NOT NULL,           -- Ex: Eletricista, Rigger, Motorista
    category VARCHAR NOT NULL,        -- Categoria profissional
    subcategory VARCHAR,              -- Subcategoria

    -- Quantidade e Duração
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days > 0),

    -- Valores
    daily_rate NUMERIC(10,2),         -- Diária paga ao profissional
    total_cost NUMERIC(10,2),         -- Custo total (daily_rate * days * quantity)

    -- Status
    status VARCHAR NOT NULL DEFAULT 'planned' CHECK (status IN (
        'planned',      -- Planejado (ainda não confirmado)
        'invited',      -- Convidado (enviado convite)
        'confirmed',    -- Confirmado (profissional aceitou)
        'rejected',     -- Rejeitado (profissional recusou)
        'allocated',    -- Alocado (confirmado e pronto para trabalhar)
        'working',      -- Trabalhando (evento em andamento)
        'completed',    -- Concluído
        'cancelled'     -- Cancelado
    )),

    -- Observações
    notes TEXT,

    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    invited_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ

    -- NOTA: Constraint removida para permitir "vagas planejadas" sem profissional alocado
    -- Quando status='planned', pode não ter nem professional_id nem external_name
    -- Quando status IN ('invited','confirmed','allocated'), deve ter um ou outro
);

-- =====================================================
-- Tabela: PROJECT_EQUIPMENT (Equipamentos solicitados)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,

    -- Equipamento
    equipment_type VARCHAR NOT NULL,  -- Ex: Som, Luz, Palco, etc
    category VARCHAR NOT NULL,
    subcategory VARCHAR,
    name VARCHAR NOT NULL,            -- Nome específico do equipamento
    description TEXT,

    -- Quantidade e Duração
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    duration_days INTEGER NOT NULL DEFAULT 1 CHECK (duration_days > 0),

    -- Especificações técnicas
    specifications JSONB DEFAULT '{}',

    -- Status
    status VARCHAR NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested',    -- Solicitado (ainda não enviado para fornecedores)
        'quoting',      -- Cotando (enviado para fornecedores)
        'quoted',       -- Cotado (recebeu cotações)
        'selected',     -- Selecionado (fornecedor escolhido)
        'confirmed',    -- Confirmado (fornecedor confirmou disponibilidade)
        'delivered',    -- Entregue
        'returned',     -- Devolvido
        'cancelled'     -- Cancelado
    )),

    -- Fornecedor selecionado
    selected_supplier_id UUID REFERENCES equipment_suppliers(id),
    selected_quote_id UUID, -- Link com supplier_quotations

    -- Observações
    notes TEXT,

    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Tabela: SUPPLIER_QUOTATIONS (Cotações de fornecedores)
-- Substitui supplier_quotes
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES project_equipment(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES equipment_suppliers(id),

    -- Valores do Fornecedor
    supplier_price NUMERIC(10,2) NOT NULL,           -- Preço cobrado pelo fornecedor
    supplier_notes TEXT,

    -- Cálculos HRX (com margem aplicada)
    profit_margin_applied NUMERIC(5,2) NOT NULL,     -- Margem aplicada (35% ou 80%)
    hrx_price NUMERIC(10,2) NOT NULL,                -- Preço que HRX cobra do cliente
    profit_amount NUMERIC(10,2) NOT NULL CHECK (profit_amount >= 0),  -- Lucro HRX

    -- Disponibilidade
    availability_confirmed BOOLEAN DEFAULT FALSE,
    delivery_date DATE,
    pickup_date DATE,

    -- Status
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Aguardando fornecedor responder
        'sent',         -- Enviado ao fornecedor
        'received',     -- Recebido do fornecedor
        'accepted',     -- Aceito pela HRX
        'rejected',     -- Rejeitado pela HRX
        'expired'       -- Expirado (prazo passou)
    )),

    -- Prazos
    deadline TIMESTAMPTZ,  -- Prazo para fornecedor responder

    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

-- =====================================================
-- Tabela: PROJECT_EMAILS (Log de emails enviados)
-- Unifica email_logs + quote_emails
-- =====================================================
CREATE TABLE IF NOT EXISTS project_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relacionamentos
    project_id UUID NOT NULL REFERENCES event_projects(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES supplier_quotations(id),

    -- Destinatário
    recipient_email VARCHAR NOT NULL,
    recipient_name VARCHAR,
    recipient_type VARCHAR NOT NULL CHECK (recipient_type IN (
        'client',           -- Cliente final
        'supplier',         -- Fornecedor
        'professional',     -- Profissional
        'hrx_admin',        -- Admin HRX
        'other'
    )),

    -- Email
    email_type VARCHAR NOT NULL CHECK (email_type IN (
        'project_created',      -- Projeto criado
        'quote_request',        -- Solicitação de cotação
        'quote_urgent_admin',   -- Notificação urgente admin
        'quote_received',       -- Cotação recebida
        'quote_accepted',       -- Cotação aceita
        'quote_rejected',       -- Cotação rejeitada
        'proposal_sent',        -- Proposta enviada ao cliente
        'project_approved',     -- Projeto aprovado
        'project_reminder',     -- Lembrete
        'project_completed',    -- Projeto concluído
        'other'
    )),

    subject VARCHAR,
    template_used VARCHAR,

    -- Status
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'sent',
        'delivered',
        'opened',
        'failed'
    )),

    -- Resend integration
    resend_id VARCHAR,
    error_message TEXT,

    -- Metadados
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PARTE 2: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Event Projects
CREATE INDEX idx_event_projects_status ON event_projects(status);
CREATE INDEX idx_event_projects_is_urgent ON event_projects(is_urgent);
CREATE INDEX idx_event_projects_event_date ON event_projects(event_date);
CREATE INDEX idx_event_projects_client_name ON event_projects(client_name);
CREATE INDEX idx_event_projects_project_number ON event_projects(project_number);
CREATE INDEX idx_event_projects_created_at ON event_projects(created_at DESC);

-- Project Team
CREATE INDEX idx_project_team_project_id ON project_team(project_id);
CREATE INDEX idx_project_team_professional_id ON project_team(professional_id);
CREATE INDEX idx_project_team_status ON project_team(status);

-- Project Equipment
CREATE INDEX idx_project_equipment_project_id ON project_equipment(project_id);
CREATE INDEX idx_project_equipment_status ON project_equipment(status);
CREATE INDEX idx_project_equipment_supplier_id ON project_equipment(selected_supplier_id);

-- Supplier Quotations
CREATE INDEX idx_supplier_quotations_project_id ON supplier_quotations(project_id);
CREATE INDEX idx_supplier_quotations_equipment_id ON supplier_quotations(equipment_id);
CREATE INDEX idx_supplier_quotations_supplier_id ON supplier_quotations(supplier_id);
CREATE INDEX idx_supplier_quotations_status ON supplier_quotations(status);

-- Project Emails
CREATE INDEX idx_project_emails_project_id ON project_emails(project_id);
CREATE INDEX idx_project_emails_status ON project_emails(status);
CREATE INDEX idx_project_emails_created_at ON project_emails(created_at DESC);

-- =====================================================
-- PARTE 3: TRIGGERS PARA CÁLCULOS AUTOMÁTICOS
-- =====================================================

-- Trigger: Calcular profit_margin baseado em is_urgent
CREATE OR REPLACE FUNCTION calculate_project_profit_margin()
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

CREATE TRIGGER trigger_calculate_project_profit_margin
    BEFORE INSERT OR UPDATE OF is_urgent ON event_projects
    FOR EACH ROW
    EXECUTE FUNCTION calculate_project_profit_margin();

-- Trigger: Gerar project_number automaticamente
CREATE OR REPLACE FUNCTION generate_project_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_number IS NULL THEN
        NEW.project_number := 'PRJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('project_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence para project_number
CREATE SEQUENCE IF NOT EXISTS project_number_seq START 1;

CREATE TRIGGER trigger_generate_project_number
    BEFORE INSERT ON event_projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_project_number();

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_projects_updated_at
    BEFORE UPDATE ON event_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_project_team_updated_at
    BEFORE UPDATE ON project_team
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_project_equipment_updated_at
    BEFORE UPDATE ON project_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_supplier_quotations_updated_at
    BEFORE UPDATE ON supplier_quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Calcular total_cost do project_team member
CREATE OR REPLACE FUNCTION calculate_team_member_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.daily_rate IS NOT NULL THEN
        NEW.total_cost := NEW.daily_rate * NEW.duration_days * NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_team_member_cost
    BEFORE INSERT OR UPDATE OF daily_rate, duration_days, quantity ON project_team
    FOR EACH ROW
    EXECUTE FUNCTION calculate_team_member_cost();

-- Trigger: Calcular valores HRX na cotação
CREATE OR REPLACE FUNCTION calculate_quotation_hrx_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular preço HRX com margem aplicada
    NEW.hrx_price := NEW.supplier_price * (1 + NEW.profit_margin_applied / 100);

    -- Calcular lucro
    NEW.profit_amount := NEW.hrx_price - NEW.supplier_price;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_quotation_hrx_values
    BEFORE INSERT OR UPDATE OF supplier_price, profit_margin_applied ON supplier_quotations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quotation_hrx_values();

-- =====================================================
-- PARTE 4: VIEWS PARA LISTAGENS OTIMIZADAS
-- =====================================================

-- View: Resumo de projetos (para listagem)
CREATE OR REPLACE VIEW event_projects_summary AS
SELECT
    ep.id,
    ep.project_number,
    ep.client_name,
    ep.client_email,
    ep.event_name,
    ep.event_type,
    ep.event_date,
    ep.venue_city,
    ep.venue_state,
    ep.is_urgent,
    ep.profit_margin,
    ep.status,
    ep.total_cost,
    ep.total_client_price,
    ep.total_profit,
    ep.created_at,
    ep.updated_at,

    -- Contadores
    (SELECT COUNT(*) FROM project_team WHERE project_id = ep.id) AS team_count,
    (SELECT COUNT(*) FROM project_equipment WHERE project_id = ep.id) AS equipment_count,
    (SELECT COUNT(*) FROM supplier_quotations WHERE project_id = ep.id AND status = 'received') AS quotations_received_count,
    (SELECT COUNT(*) FROM supplier_quotations WHERE project_id = ep.id AND status = 'accepted') AS quotations_accepted_count

FROM event_projects ep;

-- View: Detalhes completos do projeto (para página de detalhes)
CREATE OR REPLACE VIEW event_projects_full AS
SELECT
    ep.*,

    -- Agregações de Team
    (SELECT COALESCE(SUM(total_cost), 0) FROM project_team WHERE project_id = ep.id) AS calculated_team_cost,
    (SELECT COUNT(*) FROM project_team WHERE project_id = ep.id) AS total_team_members,
    (SELECT COUNT(*) FROM project_team WHERE project_id = ep.id AND status = 'confirmed') AS confirmed_team_members,

    -- Agregações de Equipment
    (SELECT COALESCE(SUM(sq.supplier_price), 0)
     FROM project_equipment pe
     JOIN supplier_quotations sq ON sq.equipment_id = pe.id AND sq.status = 'accepted'
     WHERE pe.project_id = ep.id) AS calculated_equipment_cost,
    (SELECT COUNT(*) FROM project_equipment WHERE project_id = ep.id) AS total_equipment_items,
    (SELECT COUNT(*) FROM project_equipment WHERE project_id = ep.id AND status = 'confirmed') AS confirmed_equipment_items

FROM event_projects ep;

-- =====================================================
-- PARTE 5: COMENTÁRIOS NAS TABELAS (Documentação)
-- =====================================================

COMMENT ON TABLE event_projects IS 'Projetos de eventos - entidade principal unificada que substitui contractor_requests e quote_requests';
COMMENT ON TABLE project_team IS 'Profissionais alocados em projetos de eventos';
COMMENT ON TABLE project_equipment IS 'Equipamentos solicitados para projetos de eventos';
COMMENT ON TABLE supplier_quotations IS 'Cotações recebidas de fornecedores para equipamentos';
COMMENT ON TABLE project_emails IS 'Log de emails enviados relacionados a projetos';

COMMENT ON COLUMN event_projects.profit_margin IS 'Margem de lucro: 35% (normal) ou 80% (urgente)';
COMMENT ON COLUMN event_projects.is_urgent IS 'Define se é urgente (80% margem) ou normal (35% margem)';
COMMENT ON COLUMN event_projects.project_number IS 'Número único do projeto no formato PRJ-YYYYMMDD-NNNN';

-- =====================================================
-- FIM DA MIGRATION 011
-- =====================================================
