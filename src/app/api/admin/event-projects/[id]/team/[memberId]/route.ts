/**
 * API: Gerenciar Membro Individual da Equipe
 * DELETE: Remove membro da equipe
 * PATCH: Atualiza dados do membro
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { withAdmin } from '@/lib/api';

/**
 * DELETE: Remover membro da equipe
 */
export const DELETE = withAdmin(async (
  userId: string,
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) => {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
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
});

/**
 * PATCH: Atualizar dados do membro
 */
export const PATCH = withAdmin(async (
  userId: string,
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) => {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
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
    const updates: Record<string, unknown> = {};
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
});
