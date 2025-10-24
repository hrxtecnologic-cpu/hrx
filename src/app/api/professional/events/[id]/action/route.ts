import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ====================================
 * POST /api/professional/events/[id]/action
 * ====================================
 * Profissional confirma ou rejeita convite pelo dashboard
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: teamMemberId } = await params;
    const { action } = await req.json();

    // Validar action
    if (!action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar profissional (suporta clerk_id direto ou via users)
    let professional = null;

    const { data: profByClerkId } = await supabase
      .from('professionals')
      .select('id, full_name')
      .eq('clerk_id', userId)
      .single();

    if (profByClerkId) {
      professional = profByClerkId;
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (userData) {
        const { data: profByUserId } = await supabase
          .from('professionals')
          .select('id, full_name')
          .eq('user_id', userData.id)
          .single();

        if (profByUserId) {
          professional = profByUserId;
        }
      }
    }

    if (!professional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    // Buscar membro da equipe
    const { data: teamMember, error: teamError } = await supabase
      .from('project_team')
      .select('id, status, project_id')
      .eq('id', teamMemberId)
      .eq('professional_id', professional.id)
      .single();

    if (teamError || !teamMember) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Validar status
    if (teamMember.status !== 'invited') {
      return NextResponse.json(
        {
          error: 'Status inválido',
          message: 'Apenas convites pendentes podem ser confirmados ou rejeitados',
        },
        { status: 400 }
      );
    }

    // Atualizar status
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('project_team')
      .update({
        status: newStatus,
        confirmed_at: action === 'confirm' ? now : null,
        updated_at: now,
      })
      .eq('id', teamMemberId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao processar ação' },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      action: action,
      message:
        action === 'confirm'
          ? 'Presença confirmada com sucesso!'
          : 'Convite recusado. Obrigado por avisar.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar ação' },
      { status: 500 }
    );
  }
}
