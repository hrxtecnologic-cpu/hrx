-- Migration: Adicionar campos de custo em project_equipment
-- Data: 2025-01-24
-- Descrição: Adiciona daily_rate e total_cost para controle de custos estimados,
--            similar ao que já existe em project_team

-- Adicionar coluna daily_rate
ALTER TABLE public.project_equipment
ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0;

-- Adicionar coluna total_cost
ALTER TABLE public.project_equipment
ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0;

-- Adicionar comentários
COMMENT ON COLUMN public.project_equipment.daily_rate IS 'Diária estimada/planejada do equipamento (independente de cotações)';
COMMENT ON COLUMN public.project_equipment.total_cost IS 'Custo total calculado: quantity × duration_days × daily_rate';

-- Atualizar total_cost existente com base em cotações aceitas (se houver)
UPDATE public.project_equipment pe
SET total_cost = (
  SELECT sq.total_price
  FROM public.supplier_quotations sq
  WHERE sq.id = pe.selected_quote_id
  AND sq.status = 'accepted'
  LIMIT 1
)
WHERE pe.selected_quote_id IS NOT NULL;

-- Log
SELECT 'Migration completed: added daily_rate and total_cost to project_equipment' as status;
