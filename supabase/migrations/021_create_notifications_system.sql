-- =====================================================
-- Migration: Sistema de Notificações e Alertas
-- Criado em: 2025-10-23
-- Descrição: Sistema completo de notificações em tempo real + alertas automáticos
-- =====================================================

-- =====================================================
-- TABELA: notifications
-- =====================================================
-- Notificações para usuários (admin, profissionais, fornecedores)

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Destinatário
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'professional', 'supplier', 'client')),

    -- Tipo de notificação
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'project_created',           -- Novo projeto criado
        'project_status_changed',    -- Status do projeto mudou
        'invitation_received',       -- Recebeu convite para projeto
        'invitation_accepted',       -- Convite aceito
        'invitation_rejected',       -- Convite rejeitado
        'quotation_received',        -- Cotação recebida de fornecedor
        'quotation_accepted',        -- Cotação aceita
        'document_approved',         -- Documento aprovado
        'document_rejected',         -- Documento rejeitado
        'document_expiring',         -- Documento vencendo em breve
        'team_incomplete',           -- Equipe incompleta
        'proposal_sent',             -- Proposta enviada ao cliente
        'payment_received',          -- Pagamento recebido
        'event_reminder',            -- Lembrete de evento
        'system_alert'               -- Alerta do sistema
    )),

    -- Conteúdo
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,                 -- URL para ação (ex: /admin/projetos/123)

    -- Relacionamentos (opcional)
    project_id UUID REFERENCES event_projects(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES equipment_suppliers(id) ON DELETE SET NULL,

    -- Controle
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Metadata (JSON flexível para dados extras)
    metadata JSONB DEFAULT '{}'::JSONB
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_type);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_project ON notifications(project_id) WHERE project_id IS NOT NULL;

-- =====================================================
-- TABELA: notification_preferences
-- =====================================================
-- Preferências de notificação por usuário

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Canais de notificação
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,

    -- Tipos específicos
    notify_project_updates BOOLEAN DEFAULT true,
    notify_invitations BOOLEAN DEFAULT true,
    notify_quotations BOOLEAN DEFAULT true,
    notify_documents BOOLEAN DEFAULT true,
    notify_payments BOOLEAN DEFAULT true,
    notify_reminders BOOLEAN DEFAULT true,

    -- Frequência de digest (se não quer notificações instantâneas)
    digest_frequency TEXT DEFAULT 'instant' CHECK (digest_frequency IN ('instant', 'hourly', 'daily', 'weekly', 'never')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- =====================================================
-- FUNÇÕES: Criar notificação
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_user_type TEXT,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_action_url TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_professional_id UUID DEFAULT NULL,
    p_supplier_id UUID DEFAULT NULL,
    p_priority TEXT DEFAULT 'normal',
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_preferences RECORD;
BEGIN
    -- Verificar preferências do usuário
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;

    -- Se usuário desabilitou notificações deste tipo, não criar
    IF v_preferences IS NOT NULL THEN
        IF v_preferences.digest_frequency = 'never' THEN
            RETURN NULL;
        END IF;

        -- Verificar tipos específicos
        IF p_notification_type IN ('project_created', 'project_status_changed') AND NOT v_preferences.notify_project_updates THEN
            RETURN NULL;
        END IF;

        IF p_notification_type IN ('invitation_received', 'invitation_accepted', 'invitation_rejected') AND NOT v_preferences.notify_invitations THEN
            RETURN NULL;
        END IF;

        IF p_notification_type IN ('quotation_received', 'quotation_accepted') AND NOT v_preferences.notify_quotations THEN
            RETURN NULL;
        END IF;

        IF p_notification_type IN ('document_approved', 'document_rejected', 'document_expiring') AND NOT v_preferences.notify_documents THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Criar notificação
    INSERT INTO notifications (
        user_id,
        user_type,
        notification_type,
        title,
        message,
        action_url,
        project_id,
        professional_id,
        supplier_id,
        priority,
        metadata
    ) VALUES (
        p_user_id,
        p_user_type,
        p_notification_type,
        p_title,
        p_message,
        p_action_url,
        p_project_id,
        p_professional_id,
        p_supplier_id,
        p_priority,
        p_metadata
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES: Marcar como lida
-- =====================================================

CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND is_read = false;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES: Marcar todas como lidas
-- =====================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES: Limpar notificações antigas
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
    AND is_read = true;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÕES: Alertas Automáticos
-- =====================================================

-- Alerta: Documentos vencendo em 30 dias
CREATE OR REPLACE FUNCTION check_expiring_documents()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_doc RECORD;
    v_professional RECORD;
    v_admin_id UUID;
BEGIN
    -- Buscar documentos pendentes há mais de 7 dias
    FOR v_doc IN
        SELECT dv.*, p.id as professional_id, p.full_name, u.id as user_id
        FROM document_validations dv
        JOIN professionals p ON dv.professional_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE dv.status = 'pending'
        AND dv.created_at < NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
            -- Não notificar se já foi notificado nas últimas 7 dias
            SELECT 1 FROM notifications
            WHERE notification_type = 'document_expiring'
            AND professional_id = dv.professional_id
            AND metadata->>'document_type' = dv.document_type
            AND created_at > NOW() - INTERVAL '7 days'
        )
    LOOP
        -- Notificar admin sobre documento pendente
        SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
        IF v_admin_id IS NOT NULL THEN
            PERFORM create_notification(
                v_admin_id,
                'admin',
                'document_expiring',
                'Documento pendente há mais de 7 dias',
                'Documento ' || v_doc.document_type || ' de ' || v_doc.full_name || ' está pendente há mais de 7 dias.',
                '/admin/profissionais/' || v_doc.professional_id,
                NULL,
                v_doc.professional_id,
                NULL,
                'normal',
                jsonb_build_object('document_type', v_doc.document_type, 'uploaded_at', v_doc.created_at)
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Alerta: Convites sem resposta há mais de 48h
CREATE OR REPLACE FUNCTION check_pending_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_team_member RECORD;
    v_admin_id UUID;
BEGIN
    -- Buscar convites pendentes há mais de 48h
    FOR v_team_member IN
        SELECT
            pt.*,
            p.full_name,
            ep.project_number,
            ep.event_name,
            u.id as admin_id
        FROM project_team pt
        JOIN event_projects ep ON pt.project_id = ep.id
        JOIN professionals p ON pt.professional_id = p.id
        LEFT JOIN users u ON u.role = 'admin'
        WHERE pt.status = 'invited'
        AND pt.invited_at < NOW() - INTERVAL '48 hours'
        AND NOT EXISTS (
            SELECT 1 FROM notifications
            WHERE notification_type = 'invitation_received'
            AND project_id = pt.project_id
            AND professional_id = pt.professional_id
            AND created_at > NOW() - INTERVAL '48 hours'
        )
        LIMIT 10
    LOOP
        -- Notificar admin
        IF v_team_member.admin_id IS NOT NULL THEN
            PERFORM create_notification(
                v_team_member.admin_id,
                'admin',
                'system_alert',
                'Convite sem resposta',
                v_team_member.full_name || ' não respondeu convite do projeto ' ||
                v_team_member.project_number || ' há mais de 48h.',
                '/admin/projetos/' || v_team_member.project_id,
                v_team_member.project_id,
                v_team_member.professional_id,
                NULL,
                'normal',
                jsonb_build_object('team_member_id', v_team_member.id)
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Alerta: Projetos próximos sem equipe completa
CREATE OR REPLACE FUNCTION check_incomplete_teams()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_project RECORD;
    v_admin_id UUID;
BEGIN
    -- Buscar projetos nos próximos 7 dias sem equipe completa
    FOR v_project IN
        SELECT
            ep.*,
            COUNT(pt.id) as team_count,
            u.id as admin_id
        FROM event_projects ep
        LEFT JOIN project_team pt ON ep.id = pt.project_id AND pt.status IN ('confirmed', 'invited')
        LEFT JOIN users u ON u.role = 'admin'
        WHERE ep.event_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND ep.status NOT IN ('cancelled', 'completed')
        GROUP BY ep.id, u.id
        HAVING COUNT(pt.id) = 0  -- Nenhum membro na equipe
    LOOP
        -- Notificar admin
        IF v_project.admin_id IS NOT NULL THEN
            PERFORM create_notification(
                v_project.admin_id,
                'admin',
                'team_incomplete',
                'Projeto sem equipe',
                'Projeto ' || v_project.project_number || ' (' || v_project.event_name ||
                ') está em ' || EXTRACT(DAY FROM v_project.event_date - NOW()) ||
                ' dias e ainda não tem equipe alocada.',
                '/admin/projetos/' || v_project.id,
                v_project.id,
                NULL,
                NULL,
                'urgent',
                jsonb_build_object('event_date', v_project.event_date, 'team_count', v_project.team_count)
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Notificações automáticas
-- =====================================================

-- Trigger: Convite enviado
CREATE OR REPLACE FUNCTION notify_invitation_sent()
RETURNS TRIGGER AS $$
DECLARE
    v_professional RECORD;
    v_project RECORD;
BEGIN
    -- Buscar dados
    SELECT * INTO v_professional FROM professionals WHERE id = NEW.professional_id;
    SELECT * INTO v_project FROM event_projects WHERE id = NEW.project_id;

    -- Notificar profissional (se tiver user_id)
    IF v_professional.user_id IS NOT NULL THEN
        PERFORM create_notification(
            v_professional.user_id,
            'professional',
            'invitation_received',
            'Novo convite de projeto',
            'Você foi convidado para o projeto ' || v_project.project_number || ' - ' || v_project.event_name,
            '/professional/invitations/' || NEW.id,
            NEW.project_id,
            NEW.professional_id,
            NULL,
            'high',
            jsonb_build_object('role', NEW.role, 'category', NEW.category)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_invitation_sent
    AFTER UPDATE OF status ON project_team
    FOR EACH ROW
    WHEN (OLD.status = 'planned' AND NEW.status = 'invited')
    EXECUTE FUNCTION notify_invitation_sent();

-- Trigger: Convite respondido
CREATE OR REPLACE FUNCTION notify_invitation_responded()
RETURNS TRIGGER AS $$
DECLARE
    v_professional RECORD;
    v_project RECORD;
    v_admin_id UUID;
    v_notification_type TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Buscar dados
    SELECT * INTO v_professional FROM professionals WHERE id = NEW.professional_id;
    SELECT * INTO v_project FROM event_projects WHERE id = NEW.project_id;
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

    -- Determinar tipo de notificação
    IF NEW.status = 'confirmed' THEN
        v_notification_type := 'invitation_accepted';
        v_title := 'Convite aceito';
        v_message := v_professional.full_name || ' aceitou o convite para ' || v_project.project_number;
    ELSIF NEW.status = 'rejected' THEN
        v_notification_type := 'invitation_rejected';
        v_title := 'Convite recusado';
        v_message := v_professional.full_name || ' recusou o convite para ' || v_project.project_number;
    ELSE
        RETURN NEW;
    END IF;

    -- Notificar admin
    IF v_admin_id IS NOT NULL THEN
        PERFORM create_notification(
            v_admin_id,
            'admin',
            v_notification_type,
            v_title,
            v_message,
            '/admin/projetos/' || NEW.project_id,
            NEW.project_id,
            NEW.professional_id,
            NULL,
            CASE WHEN NEW.status = 'rejected' THEN 'high' ELSE 'normal' END,
            jsonb_build_object('team_member_id', NEW.id, 'role', NEW.role)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_invitation_responded
    AFTER UPDATE OF status ON project_team
    FOR EACH ROW
    WHEN (OLD.status = 'invited' AND NEW.status IN ('confirmed', 'rejected'))
    EXECUTE FUNCTION notify_invitation_responded();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE notifications IS 'Notificações em tempo real para todos os usuários';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação por usuário';

COMMENT ON FUNCTION create_notification IS 'Cria notificação respeitando preferências do usuário';
COMMENT ON FUNCTION check_expiring_documents IS 'Verifica documentos vencendo em 30 dias';
COMMENT ON FUNCTION check_pending_invitations IS 'Verifica convites sem resposta há 48h';
COMMENT ON FUNCTION check_incomplete_teams IS 'Verifica projetos próximos sem equipe';

-- =====================================================
-- VIEWS: Estatísticas
-- =====================================================

CREATE OR REPLACE VIEW notification_stats AS
SELECT
    user_id,
    user_type,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
    COUNT(*) FILTER (WHERE priority = 'high') as high_count,
    MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id, user_type;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
