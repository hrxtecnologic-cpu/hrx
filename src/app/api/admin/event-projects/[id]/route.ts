import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { UpdateEventProjectData, EventProjectWithDetails } from '@/types/event-project';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// GET /api/admin/event-projects/[id] - Detalhes completos do projeto
// =============================================
export async function GET(
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
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_READ);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const { id: projectId } = await params;

    // OTIMIZAÇÃO: Executar todas as queries em paralelo (4x mais rápido)
    const [
      { data: project, error: projectError },
      { data: team, error: teamError },
      { data: equipment, error: equipmentError },
      { data: quotations, error: quotationsError },
      { data: emails, error: emailsError }
    ] = await Promise.all([
      // Buscar projeto
      supabase
        .from('event_projects')
        .select('*')
        .eq('id', projectId)
        .single(),

      // Buscar equipe
      supabase
        .from('project_team')
        .select(`
          *,
          professional:professionals(
            id,
            full_name,
            email,
            phone,
            categories
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }),

      // Buscar equipamentos
      supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }),

      // Buscar cotações
      supabase
        .from('supplier_quotations')
        .select(`
          *,
          supplier:equipment_suppliers(
            id,
            company_name,
            contact_name,
            email,
            phone
          ),
          equipment:project_equipment(
            id,
            name,
            category
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),

      // Buscar emails
      supabase
        .from('project_emails')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    ]);

    // Verificar se projeto existe
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Log de erros em queries secundárias (não bloqueia resposta)
    if (teamError) {
      logger.error('Erro ao buscar equipe do projeto', {
        error: teamError.message,
        projectId,
      });
    }

    if (equipmentError) {
      logger.error('Erro ao buscar equipamentos do projeto', {
        error: equipmentError.message,
        projectId,
      });
    }

    if (quotationsError) {
      logger.error('Erro ao buscar cotações do projeto', {
        error: quotationsError.message,
        projectId,
      });
    }

    if (emailsError) {
      logger.error('Erro ao buscar emails do projeto', {
        error: emailsError.message,
        projectId,
      });
    }

    const result: EventProjectWithDetails = {
      ...project,
      team: team || [],
      equipment: equipment || [],
      quotations: quotations || [],
      emails: emails || [],
    };

    logger.info('Detalhes do projeto buscados', {
      userId,
      projectId,
      teamCount: team?.length || 0,
      equipmentCount: equipment?.length || 0,
      quotationsCount: quotations?.length || 0,
    });

    return NextResponse.json({ project: result });
  } catch (error: any) {
    logger.error('Erro ao buscar projeto', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH /api/admin/event-projects/[id] - Atualizar projeto
// =============================================
export async function PATCH(
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

    const { id: projectId } = await params;
    const body: UpdateEventProjectData = await req.json();

    // Campos permitidos para atualização
    const allowedFields = [
      'client_name',
      'client_email',
      'client_phone',
      'client_company',
      'client_cnpj',
      'event_name',
      'event_type',
      'event_description',
      'event_date',
      'start_time',
      'end_time',
      'expected_attendance',
      'venue_name',
      'venue_address',
      'venue_city',
      'venue_state',
      'venue_zip',
      'is_urgent',
      'budget_range',
      'status',
      'additional_notes',
      'internal_notes',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field as keyof UpdateEventProjectData] !== undefined) {
        updateData[field] = body[field as keyof UpdateEventProjectData];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Se mudou urgência, recalcular margem (trigger fará automaticamente)
    // Apenas logar a mudança
    if (updateData.is_urgent !== undefined) {
      logger.info('Urgência do projeto alterada', {
        projectId,
        isUrgent: updateData.is_urgent,
        newMargin: updateData.is_urgent ? 80 : 35,
      });
    }

    // Se está alterando status
    if (updateData.status) {
      // Adicionar timestamps específicos
      if (updateData.status === 'quoted') {
        updateData.quoted_at = new Date().toISOString();
      } else if (updateData.status === 'proposed') {
        updateData.proposed_at = new Date().toISOString();
      } else if (updateData.status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (updateData.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('event_projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar projeto', {
        error: error.message,
        projectId,
        userId,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Projeto atualizado com sucesso', {
      userId,
      projectId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({ success: true, project: data });
  } catch (error: any) {
    logger.error('Erro ao atualizar projeto', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE /api/admin/event-projects/[id] - Cancelar projeto
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

    const { id: projectId } = await params;

    // Verificar se existe
    const { data: project, error: checkError } = await supabase
      .from('event_projects')
      .select('project_number')
      .eq('id', projectId)
      .single();


    if (checkError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Deletar projeto do banco
    const { error } = await supabase
      .from('event_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      logger.error('Erro ao deletar projeto', {
        error: error.message,
        projectId,
        userId,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Projeto deletado', {
      userId,
      projectId,
      projectNumber: project.project_number,
    });

    return NextResponse.json({
      success: true,
      message: 'Projeto deletado com sucesso',
    });
  } catch (error: any) {

    logger.error('Erro ao cancelar projeto', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      errorObject: JSON.stringify(error)
    });
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
