/**
 * Recalcula custos totais do projeto
 *
 * Esta função soma os custos da equipe e equipamentos,
 * aplica a margem de lucro e atualiza os campos do projeto.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function recalculateProjectCosts(projectId: string) {
  try {
    // 1. Buscar projeto para pegar margem de lucro
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('profit_margin')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Erro ao buscar projeto:', projectError);
      return { success: false, error: projectError.message };
    }

    const profitMargin = project?.profit_margin || 30;

    // 2. Calcular total da equipe
    const { data: teamMembers, error: teamError } = await supabase
      .from('project_team')
      .select('total_cost')
      .eq('project_id', projectId);

    if (teamError) {
      console.error('Erro ao buscar equipe:', teamError);
      return { success: false, error: teamError.message };
    }

    const totalTeamCost = (teamMembers || []).reduce(
      (sum, member) => sum + (member.total_cost || 0),
      0
    );

    // 3. Calcular total de equipamentos (a partir do total_cost dos equipamentos)
    const { data: equipmentItems, error: equipmentError } = await supabase
      .from('project_equipment')
      .select('total_cost')
      .eq('project_id', projectId);

    if (equipmentError) {
      console.error('Erro ao buscar equipamentos:', equipmentError);
      return { success: false, error: equipmentError.message };
    }

    const totalEquipmentCost = (equipmentItems || []).reduce(
      (sum, item) => sum + (item.total_cost || 0),
      0
    );

    // 4. Calcular totais
    const totalCost = totalTeamCost + totalEquipmentCost;
    const totalClientPrice = totalCost * (1 + profitMargin / 100);
    const totalProfit = totalClientPrice - totalCost;

    // 5. Atualizar projeto
    const { error: updateError } = await supabase
      .from('event_projects')
      .update({
        total_team_cost: totalTeamCost,
        total_equipment_cost: totalEquipmentCost,
        total_cost: totalCost,
        total_client_price: totalClientPrice,
        total_profit: totalProfit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Erro ao atualizar custos do projeto:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`💰 Custos recalculados para projeto ${projectId}:`, {
      totalTeamCost,
      totalEquipmentCost,
      totalCost,
      totalClientPrice,
      totalProfit,
    });

    return {
      success: true,
      costs: {
        totalTeamCost,
        totalEquipmentCost,
        totalCost,
        totalClientPrice,
        totalProfit,
      },
    };
  } catch (error: any) {
    console.error('Erro ao recalcular custos:', error);
    return { success: false, error: error.message };
  }
}
