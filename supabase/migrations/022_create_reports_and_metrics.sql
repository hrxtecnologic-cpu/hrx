-- =====================================================
-- Migration: Sistema de Relatórios e Métricas
-- Criado em: 2025-10-23
-- Descrição: Views e funções para dashboards e relatórios
-- =====================================================

-- =====================================================
-- VIEW: Métricas Gerais do Sistema
-- =====================================================

CREATE OR REPLACE VIEW system_metrics AS
SELECT
    -- Projetos
    (SELECT COUNT(*) FROM event_projects) as total_projects,
    (SELECT COUNT(*) FROM event_projects WHERE status = 'new') as projects_new,
    (SELECT COUNT(*) FROM event_projects WHERE status IN ('analyzing', 'quoting', 'quoted')) as projects_in_progress,
    (SELECT COUNT(*) FROM event_projects WHERE status = 'proposed') as projects_proposed,
    (SELECT COUNT(*) FROM event_projects WHERE status = 'approved') as projects_approved,
    (SELECT COUNT(*) FROM event_projects WHERE status = 'completed') as projects_completed,
    (SELECT COUNT(*) FROM event_projects WHERE status = 'cancelled') as projects_cancelled,

    -- Profissionais
    (SELECT COUNT(*) FROM professionals) as total_professionals,
    (SELECT COUNT(*) FROM professionals WHERE status = 'pending') as professionals_pending,
    (SELECT COUNT(*) FROM professionals WHERE status = 'approved') as professionals_approved,
    (SELECT COUNT(*) FROM professionals WHERE status = 'rejected') as professionals_rejected,

    -- Fornecedores
    (SELECT COUNT(*) FROM equipment_suppliers) as total_suppliers,
    (SELECT COUNT(*) FROM equipment_suppliers WHERE status = 'active') as suppliers_active,
    (SELECT COUNT(*) FROM equipment_suppliers WHERE status = 'inactive') as suppliers_inactive,

    -- Financeiro
    (SELECT COALESCE(SUM(total_cost), 0) FROM event_projects) as total_costs,
    (SELECT COALESCE(SUM(total_client_price), 0) FROM event_projects) as total_revenue,
    (SELECT COALESCE(SUM(total_profit), 0) FROM event_projects) as total_profit,
    (SELECT COALESCE(AVG(profit_margin), 0) FROM event_projects WHERE profit_margin IS NOT NULL) as avg_profit_margin,

    -- Equipe
    (SELECT COUNT(*) FROM project_team) as total_team_assignments,
    (SELECT COUNT(*) FROM project_team WHERE status = 'confirmed') as team_confirmed,
    (SELECT COUNT(*) FROM project_team WHERE status = 'invited') as team_invited,
    (SELECT COUNT(*) FROM project_team WHERE status = 'rejected') as team_rejected,

    -- Documentos
    (SELECT COUNT(*) FROM document_validations) as total_documents,
    (SELECT COUNT(*) FROM document_validations WHERE status = 'approved') as documents_approved,
    (SELECT COUNT(*) FROM document_validations WHERE status = 'pending') as documents_pending,
    (SELECT COUNT(*) FROM document_validations WHERE status = 'rejected') as documents_rejected,
    (SELECT COUNT(*) FROM document_validations WHERE reviewed_at IS NOT NULL) as documents_reviewed,

    -- Cotações
    (SELECT COUNT(*) FROM supplier_quotations) as total_quotations,
    (SELECT COUNT(*) FROM supplier_quotations WHERE status = 'pending') as quotations_pending,
    (SELECT COUNT(*) FROM supplier_quotations WHERE status = 'received') as quotations_received,
    (SELECT COUNT(*) FROM supplier_quotations WHERE status = 'accepted') as quotations_accepted,

    -- Timestamps
    NOW() as calculated_at;

-- =====================================================
-- VIEW: Métricas de Projetos por Mês
-- =====================================================

CREATE OR REPLACE VIEW projects_by_month AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_projects,
    COALESCE(SUM(total_cost), 0) as total_costs,
    COALESCE(SUM(total_client_price), 0) as total_revenue,
    COALESCE(SUM(total_profit), 0) as total_profit,
    COALESCE(AVG(profit_margin), 0) as avg_profit_margin
FROM event_projects
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- VIEW: Top Profissionais
-- =====================================================

CREATE OR REPLACE VIEW top_professionals AS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.categories,
    p.city,
    p.state,
    COUNT(pt.id) as total_projects,
    COUNT(pt.id) FILTER (WHERE pt.status = 'confirmed') as projects_confirmed,
    COUNT(pt.id) FILTER (WHERE pt.status = 'completed') as projects_completed,
    COALESCE(SUM(pt.total_cost), 0) as total_earned,
    COALESCE(AVG(CASE
        WHEN pt.status IN ('confirmed', 'completed') THEN 1
        WHEN pt.status = 'rejected' THEN 0
        ELSE NULL
    END), 0) * 100 as acceptance_rate,
    (
        SELECT COALESCE(AVG(rating), 0)
        FROM professional_reviews pr
        WHERE pr.professional_id = p.id AND pr.is_visible = true
    ) as avg_rating,
    (
        SELECT COUNT(*)
        FROM professional_reviews pr
        WHERE pr.professional_id = p.id AND pr.is_visible = true
    ) as total_reviews
FROM professionals p
LEFT JOIN project_team pt ON p.id = pt.professional_id
WHERE p.status = 'approved'
GROUP BY p.id
ORDER BY projects_completed DESC, total_earned DESC
LIMIT 50;

-- =====================================================
-- VIEW: Top Fornecedores
-- =====================================================

CREATE OR REPLACE VIEW top_suppliers AS
SELECT
    s.id,
    s.company_name,
    s.email,
    s.equipment_types,
    COUNT(sq.id) as total_quotations,
    COUNT(sq.id) FILTER (WHERE sq.status = 'accepted') as quotations_accepted,
    COALESCE(SUM(sq.total_price), 0) as total_quoted,
    COALESCE(SUM(CASE WHEN sq.status = 'accepted' THEN sq.total_price ELSE 0 END), 0) as total_sales,
    COALESCE(AVG(CASE
        WHEN sq.status = 'accepted' THEN 1
        WHEN sq.status = 'rejected' THEN 0
        ELSE NULL
    END), 0) * 100 as acceptance_rate,
    (
        SELECT COALESCE(AVG(rating), 0)
        FROM supplier_reviews sr
        WHERE sr.supplier_id = s.id AND sr.is_visible = true
    ) as avg_rating,
    (
        SELECT COUNT(*)
        FROM supplier_reviews sr
        WHERE sr.supplier_id = s.id AND sr.is_visible = true
    ) as total_reviews
FROM equipment_suppliers s
LEFT JOIN supplier_quotations sq ON s.id = sq.supplier_id
WHERE s.status = 'active'
GROUP BY s.id
ORDER BY quotations_accepted DESC, total_sales DESC
LIMIT 50;

-- =====================================================
-- VIEW: Eventos Próximos
-- =====================================================

CREATE OR REPLACE VIEW upcoming_events AS
SELECT
    ep.id,
    ep.project_number,
    ep.event_name,
    ep.event_type,
    ep.event_date,
    ep.client_name,
    ep.venue_city,
    ep.venue_state,
    ep.status,
    ep.total_cost,
    ep.total_client_price,
    ep.total_profit,
    COUNT(pt.id) as team_size,
    COUNT(pt.id) FILTER (WHERE pt.status = 'confirmed') as team_confirmed,
    COUNT(pe.id) as equipment_count,
    EXTRACT(DAY FROM ep.event_date - NOW()) as days_until_event
FROM event_projects ep
LEFT JOIN project_team pt ON ep.id = pt.project_id
LEFT JOIN project_equipment pe ON ep.id = pe.project_id
WHERE ep.event_date >= NOW()
    AND ep.status NOT IN ('cancelled', 'completed')
GROUP BY ep.id
ORDER BY ep.event_date ASC
LIMIT 20;

-- =====================================================
-- VIEW: Documentos Pendentes
-- =====================================================

CREATE OR REPLACE VIEW documents_pending_review AS
SELECT
    dv.id,
    dv.professional_id,
    p.full_name as professional_name,
    p.email as professional_email,
    p.phone as professional_phone,
    dv.document_type,
    dv.status,
    dv.reviewed_at,
    dv.rejection_reason,
    dv.created_at as uploaded_at,
    dv.version
FROM document_validations dv
JOIN professionals p ON dv.professional_id = p.id
WHERE dv.status IN ('pending', 'approved')
ORDER BY
    CASE WHEN dv.status = 'pending' THEN 0 ELSE 1 END,
    dv.created_at DESC;

-- =====================================================
-- VIEW: Pipeline de Vendas
-- =====================================================

CREATE OR REPLACE VIEW sales_pipeline AS
SELECT
    status,
    COUNT(*) as count,
    COALESCE(SUM(total_client_price), 0) as total_value,
    COALESCE(AVG(total_client_price), 0) as avg_value,
    COALESCE(SUM(total_profit), 0) as total_profit,
    ARRAY_AGG(project_number ORDER BY created_at DESC) as recent_projects
FROM event_projects
WHERE status NOT IN ('completed', 'cancelled')
GROUP BY status
ORDER BY
    CASE status
        WHEN 'new' THEN 1
        WHEN 'analyzing' THEN 2
        WHEN 'quoting' THEN 3
        WHEN 'quoted' THEN 4
        WHEN 'proposed' THEN 5
        WHEN 'approved' THEN 6
        WHEN 'in_execution' THEN 7
        ELSE 99
    END;

-- =====================================================
-- FUNÇÃO: Relatório de Período
-- =====================================================

CREATE OR REPLACE FUNCTION generate_period_report(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    metric_category TEXT
) AS $$
BEGIN
    RETURN QUERY

    -- Projetos no período
    SELECT
        'Projetos Criados'::TEXT,
        COUNT(*)::NUMERIC,
        'quantidade'::TEXT,
        'projetos'::TEXT
    FROM event_projects
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    SELECT
        'Projetos Concluídos'::TEXT,
        COUNT(*)::NUMERIC,
        'quantidade'::TEXT,
        'projetos'::TEXT
    FROM event_projects
    WHERE status = 'completed'
        AND updated_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    -- Receita no período
    SELECT
        'Receita Total'::TEXT,
        COALESCE(SUM(total_client_price), 0)::NUMERIC,
        'reais'::TEXT,
        'financeiro'::TEXT
    FROM event_projects
    WHERE status = 'completed'
        AND updated_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    SELECT
        'Lucro Total'::TEXT,
        COALESCE(SUM(total_profit), 0)::NUMERIC,
        'reais'::TEXT,
        'financeiro'::TEXT
    FROM event_projects
    WHERE status = 'completed'
        AND updated_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    SELECT
        'Margem de Lucro Média'::TEXT,
        COALESCE(AVG(profit_margin), 0)::NUMERIC,
        'percentual'::TEXT,
        'financeiro'::TEXT
    FROM event_projects
    WHERE status = 'completed'
        AND updated_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    -- Profissionais no período
    SELECT
        'Profissionais Cadastrados'::TEXT,
        COUNT(*)::NUMERIC,
        'quantidade'::TEXT,
        'profissionais'::TEXT
    FROM professionals
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    SELECT
        'Profissionais Aprovados'::TEXT,
        COUNT(*)::NUMERIC,
        'quantidade'::TEXT,
        'profissionais'::TEXT
    FROM professionals
    WHERE status = 'approved'
        AND created_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    -- Fornecedores no período
    SELECT
        'Cotações Recebidas'::TEXT,
        COUNT(*)::NUMERIC,
        'quantidade'::TEXT,
        'fornecedores'::TEXT
    FROM supplier_quotations
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date

    UNION ALL

    SELECT
        'Cotações Aceitas'::TEXT,
        COUNT(*)::NUMERIC,
        'quantidade'::TEXT,
        'fornecedores'::TEXT
    FROM supplier_quotations
    WHERE status = 'accepted'
        AND updated_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: KPIs do Mês Atual
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_month_kpis()
RETURNS TABLE (
    kpi_name TEXT,
    kpi_value NUMERIC,
    previous_month_value NUMERIC,
    change_percentage NUMERIC,
    trend TEXT
) AS $$
DECLARE
    v_current_month_start DATE := DATE_TRUNC('month', NOW())::DATE;
    v_previous_month_start DATE := (DATE_TRUNC('month', NOW()) - INTERVAL '1 month')::DATE;
BEGIN
    RETURN QUERY
    WITH
    current_projects AS (
        SELECT COUNT(*)::NUMERIC as value
        FROM event_projects
        WHERE created_at >= v_current_month_start
    ),
    previous_projects AS (
        SELECT COUNT(*)::NUMERIC as value
        FROM event_projects
        WHERE created_at >= v_previous_month_start
            AND created_at < v_current_month_start
    ),
    current_revenue AS (
        SELECT COALESCE(SUM(total_client_price), 0)::NUMERIC as value
        FROM event_projects
        WHERE status = 'completed'
            AND updated_at >= v_current_month_start
    ),
    previous_revenue AS (
        SELECT COALESCE(SUM(total_client_price), 0)::NUMERIC as value
        FROM event_projects
        WHERE status = 'completed'
            AND updated_at >= v_previous_month_start
            AND updated_at < v_current_month_start
    )
    SELECT
        'Projetos Criados'::TEXT,
        COALESCE(cp.value, 0),
        COALESCE(pp.value, 0),
        CASE
            WHEN COALESCE(pp.value, 0) = 0 THEN 100
            ELSE ROUND(((cp.value - pp.value) / pp.value) * 100, 2)
        END,
        CASE
            WHEN cp.value > pp.value THEN 'up'
            WHEN cp.value < pp.value THEN 'down'
            ELSE 'stable'
        END
    FROM current_projects cp, previous_projects pp

    UNION ALL

    SELECT
        'Receita (Projetos Concluídos)'::TEXT,
        COALESCE(cr.value, 0),
        COALESCE(pr.value, 0),
        CASE
            WHEN COALESCE(pr.value, 0) = 0 THEN 100
            ELSE ROUND(((cr.value - pr.value) / pr.value) * 100, 2)
        END,
        CASE
            WHEN cr.value > pr.value THEN 'up'
            WHEN cr.value < pr.value THEN 'down'
            ELSE 'stable'
        END
    FROM current_revenue cr, previous_revenue pr;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON VIEW system_metrics IS 'Métricas gerais do sistema consolidadas';
COMMENT ON VIEW projects_by_month IS 'Projetos e financeiro agregados por mês';
COMMENT ON VIEW top_professionals IS 'Top 50 profissionais por projetos concluídos';
COMMENT ON VIEW top_suppliers IS 'Top 50 fornecedores por cotações aceitas';
COMMENT ON VIEW upcoming_events IS 'Próximos 20 eventos ordenados por data';
COMMENT ON VIEW documents_pending_review IS 'Documentos pendentes e vencendo';
COMMENT ON VIEW sales_pipeline IS 'Pipeline de vendas por status';

COMMENT ON FUNCTION generate_period_report IS 'Gera relatório de métricas para um período específico';
COMMENT ON FUNCTION get_current_month_kpis IS 'KPIs do mês atual com comparação ao mês anterior';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
