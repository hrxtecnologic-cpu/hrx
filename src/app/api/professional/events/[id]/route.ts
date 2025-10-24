import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ====================================
 * GET /api/professional/events/[id]
 * ====================================
 * Retorna detalhes de um evento específico do profissional
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: teamMemberId } = await params;
    const supabase = await createClient();

    // Buscar profissional (suporta clerk_id direto ou via users)
    let professional = null;

    const { data: profByClerkId } = await supabase
      .from('professionals')
      .select('id')
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
          .select('id')
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

    // Buscar membro da equipe com detalhes do projeto
    const { data: teamMember, error: teamError } = await supabase
      .from('project_team')
      .select(`
        id,
        project_id,
        role,
        category,
        duration_days,
        daily_rate,
        total_cost,
        status,
        invited_at,
        confirmed_at,
        notes,
        event_projects (
          id,
          project_number,
          event_name,
          event_type,
          event_description,
          event_date,
          start_time,
          end_time,
          venue_name,
          venue_address,
          venue_city,
          venue_state,
          venue_zip,
          client_name,
          is_urgent,
          status
        )
      `)
      .eq('id', teamMemberId)
      .eq('professional_id', professional.id)
      .single();

    if (teamError || !teamMember) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Montar resposta
    const project = (teamMember as any).event_projects;

    return NextResponse.json({
      success: true,
      event: {
        id: teamMember.id,
        project_id: project.id,
        project_number: project.project_number,
        event_name: project.event_name,
        event_type: project.event_type,
        event_description: project.event_description,
        event_date: project.event_date,
        start_time: project.start_time,
        end_time: project.end_time,
        venue_name: project.venue_name,
        venue_address: project.venue_address,
        venue_city: project.venue_city,
        venue_state: project.venue_state,
        venue_zip: project.venue_zip,
        client_name: project.client_name,
        role: teamMember.role,
        category: teamMember.category,
        duration_days: teamMember.duration_days,
        daily_rate: teamMember.daily_rate,
        total_cost: teamMember.total_cost,
        status: teamMember.status,
        invited_at: teamMember.invited_at,
        confirmed_at: teamMember.confirmed_at,
        is_urgent: project.is_urgent,
        notes: teamMember.notes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar evento' },
      { status: 500 }
    );
  }
}
