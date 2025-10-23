-- =====================================================
-- Migration 016: Corrigir Cálculos Financeiros
-- =====================================================
-- Problema: Campos total_* em event_projects sempre ficam zerados
-- Solução: Criar triggers para recalcular automaticamente
-- =====================================================

-- =====================================================
-- FUNÇÃO 1: Recalcular total_team_cost do projeto
-- =====================================================
-- Soma todos os total_cost dos membros da equipe
CREATE OR REPLACE FUNCTION update_project_team_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o total_team_cost do projeto
  UPDATE event_projects
  SET total_team_cost = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM project_team
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT/UPDATE/DELETE em project_team
DROP TRIGGER IF EXISTS trigger_update_project_team_cost ON project_team;
CREATE TRIGGER trigger_update_project_team_cost
  AFTER INSERT OR UPDATE OR DELETE ON project_team
  FOR EACH ROW
  EXECUTE FUNCTION update_project_team_cost();

-- =====================================================
-- FUNÇÃO 2: Recalcular total_equipment_cost do projeto
-- =====================================================
-- Soma todos os hrx_price das cotações ACEITAS
CREATE OR REPLACE FUNCTION update_project_equipment_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Determinar o project_id
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  -- Atualizar o total_equipment_cost do projeto
  -- Soma: hrx_price * quantity * duration_days de cotações aceitas
  UPDATE event_projects
  SET total_equipment_cost = (
    SELECT COALESCE(SUM(
      sq.hrx_price * pe.quantity * pe.duration_days
    ), 0)
    FROM project_equipment pe
    LEFT JOIN supplier_quotations sq ON sq.id = pe.selected_quote_id
    WHERE pe.project_id = v_project_id
      AND sq.status = 'accepted'
  ),
  updated_at = NOW()
  WHERE id = v_project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT/UPDATE/DELETE em supplier_quotations
DROP TRIGGER IF EXISTS trigger_update_project_equipment_cost_quotations ON supplier_quotations;
CREATE TRIGGER trigger_update_project_equipment_cost_quotations
  AFTER INSERT OR UPDATE OR DELETE ON supplier_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_project_equipment_cost();

-- Trigger para UPDATE em project_equipment (quando selected_quote_id muda)
DROP TRIGGER IF EXISTS trigger_update_project_equipment_cost_equipment ON project_equipment;
CREATE TRIGGER trigger_update_project_equipment_cost_equipment
  AFTER UPDATE ON project_equipment
  FOR EACH ROW
  WHEN (OLD.selected_quote_id IS DISTINCT FROM NEW.selected_quote_id
        OR OLD.quantity IS DISTINCT FROM NEW.quantity
        OR OLD.duration_days IS DISTINCT FROM NEW.duration_days)
  EXECUTE FUNCTION update_project_equipment_cost();

-- =====================================================
-- FUNÇÃO 3: Recalcular totais finais do projeto
-- =====================================================
-- Calcula total_cost, total_client_price e total_profit
CREATE OR REPLACE FUNCTION update_project_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular totais finais
  NEW.total_cost := COALESCE(NEW.total_team_cost, 0) + COALESCE(NEW.total_equipment_cost, 0);

  -- Aplicar margem de lucro para calcular preço ao cliente
  -- total_client_price = total_cost * (1 + profit_margin/100)
  NEW.total_client_price := NEW.total_cost * (1 + COALESCE(NEW.profit_margin, 35) / 100.0);

  -- Calcular lucro
  NEW.total_profit := NEW.total_client_price - NEW.total_cost;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para UPDATE em event_projects (quando total_team_cost ou total_equipment_cost mudam)
DROP TRIGGER IF EXISTS trigger_update_project_totals ON event_projects;
CREATE TRIGGER trigger_update_project_totals
  BEFORE UPDATE ON event_projects
  FOR EACH ROW
  WHEN (OLD.total_team_cost IS DISTINCT FROM NEW.total_team_cost
        OR OLD.total_equipment_cost IS DISTINCT FROM NEW.total_equipment_cost
        OR OLD.profit_margin IS DISTINCT FROM NEW.profit_margin)
  EXECUTE FUNCTION update_project_totals();

-- =====================================================
-- RECALCULAR PROJETOS EXISTENTES
-- =====================================================
-- Atualizar todos os projetos que já existem
DO $$
DECLARE
  v_project RECORD;
BEGIN
  FOR v_project IN SELECT id FROM event_projects LOOP
    -- Forçar recálculo atualizando updated_at
    UPDATE event_projects
    SET updated_at = NOW()
    WHERE id = v_project.id;
  END LOOP;
END $$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar se triggers foram criados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_project_team_cost'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_update_project_team_cost não foi criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_project_equipment_cost_quotations'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_update_project_equipment_cost_quotations não foi criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_project_totals'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_update_project_totals não foi criado';
  END IF;

  RAISE NOTICE 'Todos os triggers foram criados com sucesso!';
END $$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION update_project_team_cost() IS
'Recalcula total_team_cost somando todos os total_cost da equipe';

COMMENT ON FUNCTION update_project_equipment_cost() IS
'Recalcula total_equipment_cost somando hrx_price das cotações aceitas';

COMMENT ON FUNCTION update_project_totals() IS
'Recalcula total_cost, total_client_price e total_profit baseado nos subtotais';
