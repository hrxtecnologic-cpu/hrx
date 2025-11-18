import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/contratante/meus-projetos/[id]
 *
 * Retorna detalhes de um projeto específico do contratante
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Buscar projeto do contratante
    const { data: project, error } = await supabase
      .from('event_projects')
      .select(`
        *,
        project_team (
          id,
          role,
          category,
          subcategory,
          quantity,
          duration_days,
          daily_rate,
          total_cost,
          client_price,
          status,
          external_name,
          professionals (
            id,
            full_name,
            categories
          )
        ),
        project_equipment (
          id,
          equipment_type,
          category,
          subcategory,
          name,
          description,
          quantity,
          duration_days,
          total_cost,
          client_price,
          status
        )
      `)
      .eq('id', id)
      .eq('created_by', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado ou você não tem permissão para visualizá-lo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contratante/meus-projetos/[id]
 *
 * Atualiza um projeto existente (apenas status="new")
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const supabase = await createClient();

    // Verificar se projeto existe e pertence ao usuário
    const { data: existingProject, error: fetchError } = await supabase
      .from('event_projects')
      .select('id, status, created_by')
      .eq('id', id)
      .eq('created_by', userId)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Apenas permite edição se status = "new"
    if (existingProject.status !== 'new') {
      return NextResponse.json(
        { error: 'Apenas projetos com status "Novo" podem ser editados' },
        { status: 403 }
      );
    }

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = {};

    // Dados do cliente
    if (body.client_name !== undefined) updateData.client_name = body.client_name;
    if (body.client_email !== undefined) updateData.client_email = body.client_email;
    if (body.client_phone !== undefined) updateData.client_phone = body.client_phone;
    if (body.client_company !== undefined) updateData.client_company = body.client_company;

    // Dados do evento
    if (body.event_name !== undefined) updateData.event_name = body.event_name;
    if (body.event_type !== undefined) updateData.event_type = body.event_type;
    if (body.event_description !== undefined) updateData.event_description = body.event_description;
    if (body.event_date !== undefined) updateData.event_date = body.event_date;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.expected_attendance !== undefined) updateData.expected_attendance = body.expected_attendance;

    // Local do evento
    if (body.venue_name !== undefined) updateData.venue_name = body.venue_name;
    if (body.venue_address !== undefined) updateData.venue_address = body.venue_address;
    if (body.venue_city !== undefined) updateData.venue_city = body.venue_city;
    if (body.venue_state !== undefined) updateData.venue_state = body.venue_state;
    if (body.venue_zip !== undefined) updateData.venue_zip = body.venue_zip;

    // Outros campos
    if (body.is_urgent !== undefined) updateData.is_urgent = body.is_urgent;
    if (body.client_budget !== undefined) updateData.client_budget = body.client_budget;
    if (body.additional_notes !== undefined) updateData.additional_notes = body.additional_notes;

    // Atualizar o projeto
    const { data: updatedProject, error: updateError } = await supabase
      .from('event_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar projeto', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Projeto atualizado com sucesso',
      project: updatedProject,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
