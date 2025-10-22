-- =====================================================
-- FIX: Corrigir view event_projects_summary
-- =====================================================
-- A view estava faltando a coluna quotations_count esperada pelo frontend

DROP VIEW IF EXISTS event_projects_summary CASCADE;

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

    -- Total de cotações (soma de todas as cotações, independente do status)
    (SELECT COUNT(*) FROM supplier_quotations WHERE project_id = ep.id) AS quotations_count,

    -- Cotações recebidas
    (SELECT COUNT(*) FROM supplier_quotations WHERE project_id = ep.id AND status = 'received') AS quotations_received_count,

    -- Cotações aceitas
    (SELECT COUNT(*) FROM supplier_quotations WHERE project_id = ep.id AND status = 'accepted') AS quotations_accepted_count

FROM event_projects ep;

-- Confirmar criação
DO $$
BEGIN
    RAISE NOTICE '✅ View event_projects_summary recriada com sucesso!';
    RAISE NOTICE '📋 Agora o painel admin deve funcionar corretamente.';
END $$;
