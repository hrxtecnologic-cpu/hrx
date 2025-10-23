-- =====================================================
-- Migration 018: Add Invitation Token to Project Team
-- =====================================================
-- Descrição: Adiciona campos para sistema de confirmação via email
--            - invitation_token: Token único para confirmar presença
--            - token_expires_at: Data de expiração do token
-- Data: 2025-10-23
-- Autor: HRX Dev Team
-- =====================================================

-- Adicionar colunas à tabela project_team
ALTER TABLE project_team
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_project_team_invitation_token
ON project_team(invitation_token)
WHERE invitation_token IS NOT NULL;

-- Índice para limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_project_team_token_expires_at
ON project_team(token_expires_at)
WHERE token_expires_at IS NOT NULL;

-- Comentários de documentação
COMMENT ON COLUMN project_team.invitation_token IS 'Token único gerado para confirmação de presença via email (formato: UUID v4)';
COMMENT ON COLUMN project_team.token_expires_at IS 'Data de expiração do token de convite (padrão: 7 dias após envio)';

-- =====================================================
-- FUNÇÃO: Gerar token único de convite
-- =====================================================
-- Uso: SELECT generate_invitation_token(team_member_id);
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invitation_token(team_member_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    new_token VARCHAR(255);
    token_exists BOOLEAN;
BEGIN
    -- Gerar token único (loop até não haver conflito)
    LOOP
        -- Gerar UUID v4 como token
        new_token := gen_random_uuid()::TEXT;

        -- Verificar se token já existe
        SELECT EXISTS(
            SELECT 1 FROM project_team
            WHERE invitation_token = new_token
        ) INTO token_exists;

        EXIT WHEN NOT token_exists;
    END LOOP;

    -- Atualizar registro com novo token e expiração (7 dias)
    UPDATE project_team
    SET
        invitation_token = new_token,
        token_expires_at = NOW() + INTERVAL '7 days',
        status = 'invited',
        invited_at = NOW(),
        updated_at = NOW()
    WHERE id = team_member_id;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invitation_token IS 'Gera token único de convite e define expiração de 7 dias';

-- =====================================================
-- FUNÇÃO: Validar e confirmar token de convite
-- =====================================================
-- Uso: SELECT confirm_invitation_token('token-aqui');
-- Retorna: JSON com resultado { "success": true/false, "message": "...", "team_member": {...} }
-- =====================================================
CREATE OR REPLACE FUNCTION confirm_invitation_token(token VARCHAR)
RETURNS JSONB AS $$
DECLARE
    team_member RECORD;
    result JSONB;
BEGIN
    -- Buscar membro da equipe pelo token
    SELECT * INTO team_member
    FROM project_team
    WHERE invitation_token = token;

    -- Token não encontrado
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Token inválido ou não encontrado'
        );
    END IF;

    -- Token expirado
    IF team_member.token_expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Token expirado. Solicite um novo convite.',
            'expired_at', team_member.token_expires_at
        );
    END IF;

    -- Token já usado (status = confirmed)
    IF team_member.status = 'confirmed' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Convite já foi confirmado anteriormente',
            'confirmed_at', team_member.confirmed_at
        );
    END IF;

    -- Token cancelado
    IF team_member.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Este convite foi cancelado'
        );
    END IF;

    -- ✅ Confirmar convite
    UPDATE project_team
    SET
        status = 'confirmed',
        confirmed_at = NOW(),
        updated_at = NOW()
        -- NÃO limpar o token para manter histórico
    WHERE id = team_member.id;

    -- Retornar sucesso com dados do membro
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Convite confirmado com sucesso!',
        'team_member', jsonb_build_object(
            'id', team_member.id,
            'project_id', team_member.project_id,
            'role', team_member.role,
            'category', team_member.category,
            'confirmed_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION confirm_invitation_token IS 'Valida e confirma token de convite, retornando resultado em JSON';

-- =====================================================
-- FUNÇÃO: Limpar tokens expirados (manutenção)
-- =====================================================
-- Uso: SELECT cleanup_expired_tokens();
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TABLE(
    cleaned_count INTEGER,
    message TEXT
) AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Limpar tokens expirados que ainda estão em status 'invited'
    UPDATE project_team
    SET
        invitation_token = NULL,
        token_expires_at = NULL
    WHERE
        status = 'invited'
        AND token_expires_at < NOW();

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    RETURN QUERY SELECT
        affected_rows,
        CASE
            WHEN affected_rows = 0 THEN 'Nenhum token expirado encontrado'
            WHEN affected_rows = 1 THEN 'Limpou 1 token expirado'
            ELSE 'Limpou ' || affected_rows || ' tokens expirados'
        END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tokens IS 'Remove tokens expirados para manutenção do banco (executar periodicamente)';

-- =====================================================
-- FIM DA MIGRATION 018
-- =====================================================
