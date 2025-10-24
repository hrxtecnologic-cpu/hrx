/**
 * API: Gerenciar Membro Individual da Equipe
 * DELETE: Remove membro da equipe
 * PATCH: Atualiza dados do membro
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * DELETE: Remover membro da equipe
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = await createAdminClient();
    const { id: projectId, memberId } = await context.params;

    // Verificar se o membro existe
    const { data: member, error: fetchError } = await supabase
      .from('project_team')
      .select('*')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !member) {
      return NextResponse.json(
        { success: false, error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Remover membro
    const { error: deleteError } = await supabase
      .from('project_team')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao remover membro da equipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Membro removido da equipe com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Atualizar dados do membro
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = await createAdminClient();
    const { id: projectId, memberId } = await context.params;
    const body = await request.json();

    // Campos permitidos para atualização
    const allowedFields = [
      'role',
      'category',
      'quantity',
      'duration_days',
      'daily_rate',
      'status',
      'external_name'
    ];

    // Filtrar apenas campos permitidos
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Recalcular total_cost se necessário
    if (updates.quantity || updates.duration_days || updates.daily_rate) {
      const { data: currentMember } = await supabase
        .from('project_team')
        .select('quantity, duration_days, daily_rate')
        .eq('id', memberId)
        .single();

      const quantity = updates.quantity || currentMember?.quantity || 1;
      const days = updates.duration_days || currentMember?.duration_days || 1;
      const rate = updates.daily_rate || currentMember?.daily_rate || 0;

      updates.total_cost = quantity * days * rate;
    }

    // Atualizar membro
    const { data, error } = await supabase
      .from('project_team')
      .update(updates)
      .eq('id', memberId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar membro' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Membro atualizado com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
