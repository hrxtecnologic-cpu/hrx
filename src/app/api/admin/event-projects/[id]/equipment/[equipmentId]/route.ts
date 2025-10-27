/**
 * API: Gerenciar Equipamento Individual do Projeto
 * DELETE: Remove equipamento
 * PATCH: Atualiza dados do equipamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';
import { recalculateProjectCosts } from '@/lib/recalculate-project-costs';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';

/**
 * DELETE: Remover equipamento
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; equipmentId: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }


    // Verificar autenticação
    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const supabase = await createAdminClient();
    const { id: projectId, equipmentId } = await context.params;

    // Verificar se o equipamento existe
    const { data: equipment, error: fetchError } = await supabase
      .from('project_equipment')
      .select('*')
      .eq('id', equipmentId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipamento não encontrado' },
        { status: 404 }
      );
    }

    // Remover equipamento
    const { error: deleteError } = await supabase
      .from('project_equipment')
      .delete()
      .eq('id', equipmentId)
      .eq('project_id', projectId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao remover equipamento do projeto' },
        { status: 500 }
      );
    }

    // Recalcular custos do projeto
    await recalculateProjectCosts(projectId);

    return NextResponse.json({
      success: true,
      message: 'Equipamento removido do projeto com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Atualizar dados do equipamento
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; equipmentId: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }


    // Verificar autenticação
    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const supabase = await createAdminClient();
    const { id: projectId, equipmentId } = await context.params;
    const body = await request.json();

    // Campos permitidos para atualização
    const allowedFields = [
      'name',
      'description',
      'quantity',
      'duration_days',
      'specifications',
      'notes',
      'status',
      'selected_supplier_id',
      'selected_quote_id'
    ];

    // Filtrar apenas campos permitidos
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Atualizar equipamento
    const { data, error } = await supabase
      .from('project_equipment')
      .update(updates)
      .eq('id', equipmentId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar equipamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Equipamento atualizado com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
