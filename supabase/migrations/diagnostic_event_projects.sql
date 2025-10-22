-- =====================================================
-- DIAGNÓSTICO: Verificar por que eventos não aparecem
-- =====================================================

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_projects') THEN
        RAISE NOTICE '✅ Tabela event_projects existe';
    ELSE
        RAISE NOTICE '❌ Tabela event_projects NÃO existe!';
    END IF;
END $$;

-- 2. Contar registros na tabela
DO $$
DECLARE
    count_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_records FROM event_projects;
    RAISE NOTICE '📊 Total de registros em event_projects: %', count_records;
END $$;

-- 3. Mostrar últimos 5 registros criados
SELECT
    id,
    project_number,
    client_name,
    event_name,
    status,
    created_at
FROM event_projects
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar se a view existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'event_projects_summary') THEN
        RAISE NOTICE '✅ View event_projects_summary existe';
    ELSE
        RAISE NOTICE '❌ View event_projects_summary NÃO existe!';
    END IF;
END $$;

-- 5. Verificar dados na view
DO $$
DECLARE
    count_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_records FROM event_projects_summary;
    RAISE NOTICE '📊 Total de registros na view event_projects_summary: %', count_records;
END $$;

-- 6. Mostrar dados da view
SELECT
    id,
    project_number,
    client_name,
    event_name,
    status,
    team_count,
    equipment_count,
    created_at
FROM event_projects_summary
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verificar se há erros na view (tentar recriar)
-- Execute manualmente se necessário:
-- DROP VIEW IF EXISTS event_projects_summary CASCADE;
