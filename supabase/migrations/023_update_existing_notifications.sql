-- =====================================================
-- Migration: Atualizar Tabela de Notificações Existente
-- =====================================================
-- Esta migration ATUALIZA a tabela notifications existente
-- ao invés de criar uma nova
-- =====================================================

-- 1. Renomear tabela antiga para backup
ALTER TABLE IF EXISTS notifications RENAME TO notifications_old;

-- 2. Criar nova tabela notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'professional', 'supplier', 'client')),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'project_created', 'project_status_changed', 'invitation_received',
        'invitation_accepted', 'invitation_rejected', 'quotation_received',
        'quotation_accepted', 'document_approved', 'document_rejected',
        'document_expiring', 'team_incomplete', 'proposal_sent',
        'payment_received', 'event_reminder', 'system_alert'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    project_id UUID REFERENCES event_projects(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES equipment_suppliers(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 3. Índices
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_type);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_project ON notifications(project_id) WHERE project_id IS NOT NULL;

-- 4. Criar notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    notify_project_updates BOOLEAN DEFAULT true,
    notify_invitations BOOLEAN DEFAULT true,
    notify_quotations BOOLEAN DEFAULT true,
    notify_documents BOOLEAN DEFAULT true,
    notify_payments BOOLEAN DEFAULT true,
    notify_reminders BOOLEAN DEFAULT true,
    digest_frequency TEXT DEFAULT 'instant' CHECK (digest_frequency IN ('instant', 'hourly', 'daily', 'weekly', 'never')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Views e funções (copiar da migration 021)
-- Ver arquivo: 021_create_notifications_system.sql linhas 150-380

-- Opcional: Migrar dados antigos (se quiser preservar)
-- INSERT INTO notifications (user_id, user_type, notification_type, title, message, created_at, is_read)
-- SELECT
--     (SELECT id FROM users WHERE id IN (SELECT user_id FROM professionals WHERE id = n.professional_id) LIMIT 1),
--     'professional',
--     'system_alert',
--     n.title,
--     n.message,
--     n.sent_at,
--     n.read
-- FROM notifications_old n
-- WHERE n.professional_id IS NOT NULL;

-- 6. Remover backup (CUIDADO!)
-- DROP TABLE IF EXISTS notifications_old;

COMMENT ON TABLE notifications IS 'Notificações em tempo real - estrutura atualizada';
