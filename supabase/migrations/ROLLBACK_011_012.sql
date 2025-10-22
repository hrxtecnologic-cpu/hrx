-- =====================================================
-- ROLLBACK: Migrations 011 e 012
-- =====================================================
-- Descrição: Reverte as migrations 011 e 012 (event_projects)
-- ATENÇÃO: SÓ EXECUTAR SE DER MUITO ERRADO!
-- ATENÇÃO: FAZER BACKUP ANTES DE EXECUTAR!
-- Data: 2025-10-22
-- =====================================================

-- =====================================================
-- ANTES DE EXECUTAR, VERIFIQUE:
-- =====================================================
-- 1. Você tem backup do banco?
-- 2. Você tem certeza que quer reverter?
-- 3. Há dados novos que serão perdidos?
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'INICIANDO ROLLBACK DAS MIGRATIONS 011 E 012';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Dados que serão DELETADOS:';
    RAISE NOTICE '- % projetos', (SELECT COUNT(*) FROM event_projects);
    RAISE NOTICE '- % membros de equipe', (SELECT COUNT(*) FROM project_team);
    RAISE NOTICE '- % equipamentos', (SELECT COUNT(*) FROM project_equipment);
    RAISE NOTICE '- % cotações', (SELECT COUNT(*) FROM supplier_quotations);
    RAISE NOTICE '- % emails', (SELECT COUNT(*) FROM project_emails);
    RAISE NOTICE '====================================';
    RAISE NOTICE 'AGUARDANDO 10 SEGUNDOS PARA CANCELAR...';
    RAISE NOTICE 'Pressione Ctrl+C para CANCELAR';
    RAISE NOTICE '====================================';

    -- Aguardar 10 segundos
    PERFORM pg_sleep(10);

    RAISE NOTICE 'Continuando com rollback...';
END $$;

-- =====================================================
-- PARTE 1: DELETAR VIEWS
-- =====================================================

DROP VIEW IF EXISTS event_projects_full CASCADE;
DROP VIEW IF EXISTS event_projects_summary CASCADE;

RAISE NOTICE 'Views deletadas';

-- =====================================================
-- PARTE 2: DELETAR TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_event_projects_updated_at ON event_projects;
DROP TRIGGER IF EXISTS trigger_project_team_updated_at ON project_team;
DROP TRIGGER IF EXISTS trigger_project_equipment_updated_at ON project_equipment;
DROP TRIGGER IF EXISTS trigger_supplier_quotations_updated_at ON supplier_quotations;
DROP TRIGGER IF EXISTS trigger_calculate_project_profit_margin ON event_projects;
DROP TRIGGER IF EXISTS trigger_generate_project_number ON event_projects;
DROP TRIGGER IF EXISTS trigger_calculate_team_member_cost ON project_team;
DROP TRIGGER IF EXISTS trigger_calculate_quotation_hrx_values ON supplier_quotations;

RAISE NOTICE 'Triggers deletados';

-- =====================================================
-- PARTE 3: DELETAR FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS calculate_project_profit_margin() CASCADE;
DROP FUNCTION IF EXISTS generate_project_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_team_member_cost() CASCADE;
DROP FUNCTION IF EXISTS calculate_quotation_hrx_values() CASCADE;

RAISE NOTICE 'Functions deletadas';

-- =====================================================
-- PARTE 4: DELETAR SEQUENCES
-- =====================================================

DROP SEQUENCE IF EXISTS project_number_seq CASCADE;

RAISE NOTICE 'Sequences deletadas';

-- =====================================================
-- PARTE 5: DELETAR TABELAS (ordem inversa de dependências)
-- =====================================================

-- Deletar project_emails primeiro (sem FKs dependentes)
DROP TABLE IF EXISTS project_emails CASCADE;
RAISE NOTICE 'Tabela project_emails deletada';

-- Deletar supplier_quotations (depende de project_equipment)
DROP TABLE IF EXISTS supplier_quotations CASCADE;
RAISE NOTICE 'Tabela supplier_quotations deletada';

-- Deletar project_equipment (depende de event_projects)
DROP TABLE IF EXISTS project_equipment CASCADE;
RAISE NOTICE 'Tabela project_equipment deletada';

-- Deletar project_team (depende de event_projects)
DROP TABLE IF EXISTS project_team CASCADE;
RAISE NOTICE 'Tabela project_team deletada';

-- Deletar event_projects (tabela principal)
DROP TABLE IF EXISTS event_projects CASCADE;
RAISE NOTICE 'Tabela event_projects deletada';

-- =====================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    tables_remaining INTEGER;
BEGIN
    -- Verificar se alguma tabela ainda existe
    SELECT COUNT(*) INTO tables_remaining
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
          'event_projects',
          'project_team',
          'project_equipment',
          'supplier_quotations',
          'project_emails'
      );

    IF tables_remaining > 0 THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem % tabelas não deletadas!', tables_remaining;
    ELSE
        RAISE NOTICE '====================================';
        RAISE NOTICE 'ROLLBACK CONCLUÍDO COM SUCESSO!';
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Todas as tabelas foram deletadas';
        RAISE NOTICE 'Todas as views foram deletadas';
        RAISE NOTICE 'Todos os triggers foram deletados';
        RAISE NOTICE 'Todas as functions foram deletadas';
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Sistema voltou para estado anterior às migrations 011 e 012';
        RAISE NOTICE 'Tables antigas (contractor_requests, quote_requests) preservadas';
        RAISE NOTICE '====================================';
    END IF;
END $$;

-- =====================================================
-- PRÓXIMOS PASSOS APÓS ROLLBACK:
-- =====================================================
-- 1. Verificar se contractor_requests ainda tem dados
-- 2. Verificar se quote_requests ainda tem dados
-- 3. Restaurar do backup se necessário
-- 4. Voltar código para commit: 46cb28ef
-- =====================================================

-- =====================================================
-- FIM DO ROLLBACK
-- =====================================================
