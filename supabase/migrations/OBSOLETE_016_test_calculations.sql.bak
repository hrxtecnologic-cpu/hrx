-- =====================================================
-- TESTE DOS CÁLCULOS FINANCEIROS
-- =====================================================
-- Este script testa se os triggers estão funcionando corretamente
-- Execute após rodar 016_fix_financial_calculations.sql
-- =====================================================

-- Verificar projeto existente (substitua pelo ID real)
-- SELECT id, project_number FROM event_projects LIMIT 1;

-- Exemplo de teste com projeto 35ea9efb-5d49-4899-b444-98fd4b4a91df
DO $$
DECLARE
  v_project_id UUID := '45673b3e-a76e-4aea-80cd-b3641a57c630'; -- SUBSTITUIR PELO ID REAL
  v_team_total NUMERIC;
  v_equipment_total NUMERIC;
  v_project_team_cost NUMERIC;
  v_project_equipment_cost NUMERIC;
  v_total_cost NUMERIC;
  v_total_client_price NUMERIC;
  v_total_profit NUMERIC;
BEGIN
  -- 1. Calcular manualmente o total da equipe
  SELECT COALESCE(SUM(total_cost), 0) INTO v_team_total
  FROM project_team
  WHERE project_id = v_project_id;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'TESTE DE CÁLCULOS FINANCEIROS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Projeto: %', v_project_id;
  RAISE NOTICE '';
  RAISE NOTICE '1. EQUIPE:';
  RAISE NOTICE '   Total calculado manualmente: R$ %', v_team_total;

  -- 2. Calcular manualmente o total de equipamentos (cotações aceitas)
  SELECT COALESCE(SUM(
    sq.hrx_price * pe.quantity * pe.duration_days
  ), 0) INTO v_equipment_total
  FROM project_equipment pe
  LEFT JOIN supplier_quotations sq ON sq.id = pe.selected_quote_id
  WHERE pe.project_id = v_project_id
    AND sq.status = 'accepted';

  RAISE NOTICE '';
  RAISE NOTICE '2. EQUIPAMENTOS:';
  RAISE NOTICE '   Total calculado manualmente: R$ %', v_equipment_total;

  -- 3. Buscar valores armazenados no projeto
  SELECT
    total_team_cost,
    total_equipment_cost,
    total_cost,
    total_client_price,
    total_profit
  INTO
    v_project_team_cost,
    v_project_equipment_cost,
    v_total_cost,
    v_total_client_price,
    v_total_profit
  FROM event_projects
  WHERE id = v_project_id;

  RAISE NOTICE '';
  RAISE NOTICE '3. VALORES NO BANCO (event_projects):';
  RAISE NOTICE '   total_team_cost: R$ %', COALESCE(v_project_team_cost, 0);
  RAISE NOTICE '   total_equipment_cost: R$ %', COALESCE(v_project_equipment_cost, 0);
  RAISE NOTICE '   total_cost: R$ %', COALESCE(v_total_cost, 0);
  RAISE NOTICE '   total_client_price: R$ %', COALESCE(v_total_client_price, 0);
  RAISE NOTICE '   total_profit: R$ %', COALESCE(v_total_profit, 0);

  -- 4. Verificar se os valores estão corretos
  RAISE NOTICE '';
  RAISE NOTICE '4. VERIFICAÇÃO:';

  IF v_project_team_cost = v_team_total THEN
    RAISE NOTICE '   ✅ total_team_cost CORRETO';
  ELSE
    RAISE NOTICE '   ❌ total_team_cost INCORRETO (esperado: %, obtido: %)', v_team_total, v_project_team_cost;
  END IF;

  IF v_project_equipment_cost = v_equipment_total THEN
    RAISE NOTICE '   ✅ total_equipment_cost CORRETO';
  ELSE
    RAISE NOTICE '   ❌ total_equipment_cost INCORRETO (esperado: %, obtido: %)', v_equipment_total, v_project_equipment_cost;
  END IF;

  IF v_total_cost = (v_team_total + v_equipment_total) THEN
    RAISE NOTICE '   ✅ total_cost CORRETO';
  ELSE
    RAISE NOTICE '   ❌ total_cost INCORRETO';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';

END $$;

-- =====================================================
-- QUERY PARA VER DETALHES DA EQUIPE
-- =====================================================
-- Descomente e substitua o ID para ver detalhes

SELECT
  pt.id,
  COALESCE(p.full_name, pt.external_name) as nome,
  pt.role,
  pt.category,
  pt.quantity,
  pt.duration_days,
  pt.daily_rate,
  pt.total_cost,
  pt.status
FROM project_team pt
LEFT JOIN professionals p ON p.id = pt.professional_id
WHERE pt.project_id = '45673b3e-a76e-4aea-80cd-b3641a57c630'
ORDER BY pt.created_at;
*/

-- =====================================================
-- QUERY PARA VER DETALHES DOS EQUIPAMENTOS E COTAÇÕES
-- =====================================================
-- Descomente e substitua o ID para ver detalhes

SELECT
  pe.id,
  pe.name,
  pe.category,
  pe.quantity,
  pe.duration_days,
  pe.status as equipment_status,
  sq.id as quotation_id,
  sq.supplier_price,
  sq.hrx_price,
  sq.status as quotation_status,
  (sq.hrx_price * pe.quantity * pe.duration_days) as total_equipment
FROM project_equipment pe
LEFT JOIN supplier_quotations sq ON sq.id = pe.selected_quote_id
WHERE pe.project_id = '45673b3e-a76e-4aea-80cd-b3641a57c630'
ORDER BY pe.created_at;
*/

-- =====================================================
-- FORÇAR RECÁLCULO DE UM PROJETO ESPECÍFICO
-- =====================================================
-- Se os valores ainda estiverem errados, execute isto:

DO $$
DECLARE
  v_project_id UUID := '45673b3e-a76e-4aea-80cd-b3641a57c630'; -- SUBSTITUIR
BEGIN
  -- Forçar recálculo atualizando timestamp
  UPDATE event_projects
  SET updated_at = NOW()
  WHERE id = v_project_id;

  RAISE NOTICE 'Projeto % recalculado com sucesso', v_project_id;
END $$;
*/
