import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ====================================
 * GET /api/professional/dashboard
 * ====================================
 * Retorna dados do dashboard do profissional
 *
 * Busca:
 *  - Convites pendentes (status: invited)
 *  - Próximos eventos (status: confirmed, allocated)
 *  - Eventos concluídos (status: completed)
 *  - Estatísticas (total ganho, a receber, etc)
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // ========================================
    // 1. BUSCAR PROFISSIONAL PELO CLERK ID
    // ========================================
    // Suporta 2 modelos: clerk_id direto OU user_id via tabela users

    // Tentar buscar direto por clerk_id
    let professional = null;
    let professionalError = null;

    const { data: profByClerkId, error: err1 } = await supabase
      .from('professionals')
      .select('id, full_name, email, phone, status, categories, documents, city, state, rejection_reason')
      .eq('clerk_id', userId)
      .single();

    if (profByClerkId) {
      professional = profByClerkId;
    } else {
      // Tentar buscar via users table (modelo antigo)
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (userData) {
        const { data: profByUserId, error: err2 } = await supabase
          .from('professionals')
          .select('id, full_name, email, phone, status, categories, documents, city, state, rejection_reason')
          .eq('user_id', userData.id)
          .single();

        if (profByUserId) {
          professional = profByUserId;
        } else {
          professionalError = err2;
        }
      }
    }

    if (!professional) {
      return NextResponse.json(
        {
          error: 'Profissional não encontrado',
          message: 'Seu perfil não foi encontrado no sistema',
        },
        { status: 404 }
      );
    }

    // ========================================
    // 2. BUSCAR TODOS OS EVENTOS DO PROFISSIONAL
    // ========================================
    const { data: teamMembers, error: teamError } = await supabase
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
        event_projects (
          id,
          project_number,
          event_name,
          event_type,
          event_date,
          start_time,
          end_time,
          venue_address,
          venue_city,
          venue_state,
          client_name,
          is_urgent,
          status
        )
      `)
      .eq('professional_id', professional.id)
      .order('invited_at', { ascending: false });

    if (teamError) {
      return NextResponse.json(
        {
          error: 'Erro ao buscar eventos',
          message: 'Não foi possível carregar seus eventos',
        },
        { status: 500 }
      );
    }

    // ========================================
    // 3. PROCESSAR E CATEGORIZAR EVENTOS
    // ========================================
    const allEvents = (teamMembers || [])
      .filter((member: any) => member.event_projects) // Garantir que tem projeto
      .map((member: any) => {
        const project = member.event_projects;
        return {
          id: member.id,
          project_id: project.id,
          project_number: project.project_number,
          event_name: project.event_name,
          event_type: project.event_type,
          event_date: project.event_date,
          start_time: project.start_time,
          end_time: project.end_time,
          venue_city: project.venue_city,
          venue_state: project.venue_state,
          venue_address: project.venue_address,
          role: member.role,
          category: member.category,
          duration_days: member.duration_days,
          daily_rate: member.daily_rate,
          total_cost: member.total_cost,
          status: member.status,
          invited_at: member.invited_at,
          confirmed_at: member.confirmed_at,
          is_urgent: project.is_urgent,
          project_status: project.status,
        };
      });

    // Categorizar eventos
    const pendingEvents = allEvents.filter(
      (event: any) => event.status === 'invited'
    );

    const upcomingEvents = allEvents.filter(
      (event: any) =>
        (event.status === 'confirmed' || event.status === 'allocated') &&
        new Date(event.event_date) >= new Date()
    );

    const completedEvents = allEvents.filter(
      (event: any) => event.status === 'completed'
    );

    // ========================================
    // 4. CALCULAR ESTATÍSTICAS
    // ========================================

    // Total ganho (eventos concluídos)
    const totalEarned = completedEvents.reduce(
      (sum: number, event: any) => sum + (event.total_cost || 0),
      0
    );

    // A receber (eventos confirmados + alocados)
    const pendingEarnings = upcomingEvents.reduce(
      (sum: number, event: any) => sum + (event.total_cost || 0),
      0
    );

    const stats = {
      pending_invitations: pendingEvents.length,
      upcoming_events: upcomingEvents.length,
      completed_events: completedEvents.length,
      total_earned: totalEarned,
      pending_earnings: pendingEarnings,
    };

    // ========================================
    // 5. RETORNAR DADOS
    // ========================================
    return NextResponse.json({
      success: true,
      professional: {
        id: professional.id,
        name: professional.full_name,
        email: professional.email,
        phone: professional.phone,
        status: professional.status,
        categories: professional.categories,
        documents: professional.documents,
        city: professional.city,
        state: professional.state,
        rejection_reason: professional.rejection_reason,
      },
      stats,
      pending_events: pendingEvents,
      upcoming_events: upcomingEvents,
      completed_events: completedEvents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        message: 'Ocorreu um erro ao carregar o dashboard',
      },
      { status: 500 }
    );
  }
}
