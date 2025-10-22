-- =====================================================
-- MASTER FIX: Diagnóstico + Correção Automática
-- =====================================================
-- Este script verifica e corrige todos os problemas

-- 1. Verificar se tabela event_projects existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_projects') THEN
        RAISE NOTICE '✅ Tabela event_projects existe';
    ELSE
        RAISE EXCEPTION '❌ ERRO: Tabela event_projects NÃO existe! Execute a migration 011 primeiro.';
    END IF;
END $$;

-- 2. Contar registros
DO $$
DECLARE
    count_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_records FROM event_projects;
    RAISE NOTICE '📊 Total de registros em event_projects: %', count_records;

    IF count_records = 0 THEN
        RAISE NOTICE '⚠️ Nenhum projeto encontrado. Preencha o formulário /solicitar-evento primeiro.';
    END IF;
END $$;

-- 3. Recriar view event_projects_summary com todas as colunas necessárias
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

    -- Total de cotações (esperado pelo frontend como quotations_count)
    (SELECT COUNT(*) FROM supplier_quotations WHERE project_id = ep.id) AS quotations_count

FROM event_projects ep;

-- 4. Confirmar criação da view
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'event_projects_summary') THEN
        RAISE NOTICE '✅ View event_projects_summary criada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ ERRO: Falha ao criar view event_projects_summary!';
    END IF;
END $$;

-- 5. Mostrar dados de exemplo da view
DO $$
DECLARE
    count_in_view INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_in_view FROM event_projects_summary;
    RAISE NOTICE '📊 Total de registros na view: %', count_in_view;

    IF count_in_view > 0 THEN
        RAISE NOTICE '✅ Dados estão disponíveis na view! O admin deve funcionar agora.';
    ELSE
        RAISE NOTICE '⚠️ View criada mas sem dados. Preencha o formulário /solicitar-evento.';
    END IF;
END $$;

-- 6. Mostrar últimos 3 projetos
SELECT
    project_number,
    client_name,
    event_name,
    status,
    team_count,
    equipment_count,
    created_at
FROM event_projects_summary
ORDER BY created_at DESC
LIMIT 3;

-- 7. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA!';
    RAISE NOTICE '📋 Atualize a página /admin/projetos (F5)';
    RAISE NOTICE '════════════════════════════════════════';
END $$;
