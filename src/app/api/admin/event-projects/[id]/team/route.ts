import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { AddTeamMemberData } from '@/types/event-project';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// POST /api/admin/event-projects/[id]/team - Adicionar membro à equipe
// =============================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;
  let projectId: string | null = null;

  try {
    // Verificar autenticação
    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const resolvedParams = await params;
    projectId = resolvedParams.id;
    const body: AddTeamMemberData = await req.json();

    // Validações
    if (!body.role || !body.category) {
      return NextResponse.json(
        { error: 'Função e categoria são obrigatórias' },
        { status: 400 }
      );
    }

    if (!body.professional_id && !body.external_name) {
      return NextResponse.json(
        { error: 'Informe o profissional (da base ou externo)' },
        { status: 400 }
      );
    }

    if (body.professional_id && body.external_name) {
      return NextResponse.json(
        { error: 'Informe apenas profissional da base OU externo, não ambos' },
        { status: 400 }
      );
    }

    // Verificar se projeto existe
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('id, project_number, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pode adicionar membros neste status
    const editableStatuses = ['new', 'analyzing', 'quoting', 'quoted', 'proposed'];
    if (!editableStatuses.includes(project.status)) {
      return NextResponse.json(
        {
          error: `Não é possível adicionar membros em projetos com status "${project.status}"`,
        },
        { status: 400 }
      );
    }

    // Calcular total_cost
    const daily_rate = body.daily_rate || 0;
    const quantity = body.quantity || 1;
    const duration_days = body.duration_days || 1;
    const total_cost = daily_rate * quantity * duration_days;

    // Adicionar membro
    const { data: teamMember, error: insertError } = await supabase
      .from('project_team')
      .insert([
        {
          project_id: projectId,
          professional_id: body.professional_id,
          external_name: body.external_name,
          role: body.role,
          category: body.category,
          subcategory: body.subcategory,
          quantity: quantity,
          duration_days: duration_days,
          daily_rate: daily_rate,
          total_cost: total_cost,
          notes: body.notes,
          status: 'planned',
        },
      ])
      .select()
      .single();

    if (insertError) {
      logger.error('Erro ao adicionar membro à equipe', {
        error: insertError,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
        errorCode: insertError.code,
        projectId,
        userId,
      });
      return NextResponse.json({
        error: insertError.message || insertError.details || 'Erro ao adicionar membro',
        details: insertError
      }, { status: 500 });
    }

    logger.info('Membro adicionado à equipe', {
      userId,
      projectId,
      teamMemberId: teamMember.id,
      role: body.role,
      isProfessional: !!body.professional_id,
    });

    return NextResponse.json({
      success: true,
      teamMember,
    });
  } catch (error: any) {
    logger.error('Erro ao adicionar membro à equipe', {
      error: error.message,
      errorType: typeof error,
      errorString: String(error),
      stack: error.stack,
      projectId,
      userId,
    });
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error.message || String(error),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE /api/admin/event-projects/[id]/team/[memberId] - Remover membro
// =============================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      );
    }

    // Deletar membro
    const { error } = await supabase
      .from('project_team')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) {
      logger.error('Erro ao remover membro da equipe', {
        error: error.message,
        memberId,
        userId,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Membro removido da equipe', {
      userId,
      projectId,
      memberId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erro ao remover membro', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
