import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/projects/[id]/quotations/[quotationId]/accept
 *
 * Aceita um orçamento e atualiza o projeto
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; quotationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: projectId, quotationId } = await params;
    const supabase = await createClient();

    // Buscar o orçamento aceito
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select('*')
      .eq('id', quotationId)
      .eq('project_id', projectId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    if (quotation.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Apenas orçamentos enviados podem ser aceitos' },
        { status: 400 }
      );
    }

    // Atualizar status do orçamento aceito
    const { error: updateAcceptedError } = await supabase
      .from('supplier_quotations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', quotationId);

    if (updateAcceptedError) {
      console.error('Erro ao aceitar orçamento:', updateAcceptedError);
      return NextResponse.json(
        { error: 'Erro ao aceitar orçamento' },
        { status: 500 }
      );
    }

    // Rejeitar todos os outros orçamentos do mesmo projeto
    const { error: rejectOthersError } = await supabase
      .from('supplier_quotations')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .eq('status', 'submitted')
      .neq('id', quotationId);

    if (rejectOthersError) {
      console.warn('Erro ao rejeitar outros orçamentos:', rejectOthersError);
    }

    // Atualizar custos do projeto com valores do orçamento aceito
    const totalEquipmentCost = quotation.total_price || 0;

    // Buscar projeto para recalcular custos totais
    const { data: project, error: projectFetchError } = await supabase
      .from('event_projects')
      .select('total_team_cost, profit_margin')
      .eq('id', projectId)
      .single();

    if (projectFetchError) {
      console.warn('Erro ao buscar projeto para recalcular custos:', projectFetchError);
    }

    // Calcular custos totais
    const totalTeamCost = project?.total_team_cost || 0;
    const totalCost = totalTeamCost + totalEquipmentCost;
    const profitMargin = project?.profit_margin || 30;
    const totalClientPrice = totalCost * (1 + profitMargin / 100);

    // Atualizar projeto com novos custos
    const { error: updateProjectError } = await supabase
      .from('event_projects')
      .update({
        total_equipment_cost: totalEquipmentCost,
        total_cost: totalCost,
        total_client_price: totalClientPrice,
        equipment_supplier_id: quotation.supplier_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateProjectError) {
      console.error('Erro ao atualizar custos do projeto:', updateProjectError);
      // Não falha a requisição, apenas loga o erro
    } else {
      console.log(`💰 Custos atualizados: Equipamentos R$ ${totalEquipmentCost.toFixed(2)} | Total R$ ${totalCost.toFixed(2)} | Cliente R$ ${totalClientPrice.toFixed(2)}`);
    }

    // TODO: Enviar emails (fornecedor aceito + rejeitados)
    // Por enquanto apenas loga
    console.log(`📧 TODO: Enviar email de aceitação para fornecedor`);
    console.log(`📧 TODO: Enviar emails de rejeição para outros fornecedores`);

    console.log(`✅ Orçamento ${quotationId} aceito para projeto ${projectId}`);

    return NextResponse.json({
      success: true,
      message: 'Orçamento aceito com sucesso',
      updatedCosts: {
        totalEquipmentCost,
        totalCost,
        totalClientPrice,
      },
    });
  } catch (error: any) {
    console.error('Erro ao aceitar orçamento:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
