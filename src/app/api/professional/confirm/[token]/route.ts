import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ====================================
 * POST /api/professional/confirm/[token]
 * ====================================
 * Endpoint para profissional confirmar ou rejeitar convite de evento
 *
 * Query params:
 *  - action: 'confirm' | 'reject'
 *
 * Fluxo:
 *  1. Valida token (existe, não expirado, status válido)
 *  2. Atualiza status do membro da equipe
 *  3. Retorna dados do projeto e evento
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action'); // 'confirm' ou 'reject'

    // Validar action
    if (!action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Ação inválida',
          message: 'Ação deve ser "confirm" ou "reject"',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========================================
    // 1. BUSCAR MEMBRO DA EQUIPE PELO TOKEN
    // ========================================
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('project_team')
      .select(`
        id,
        project_id,
        professional_id,
        external_name,
        role,
        category,
        quantity,
        duration_days,
        daily_rate,
        status,
        invitation_token,
        token_expires_at,
        invited_at
      `)
      .eq('invitation_token', token)
      .single();

    if (teamMemberError || !teamMember) {
      console.error('❌ Token não encontrado:', teamMemberError);
      return NextResponse.json(
        {
          error: 'Token inválido',
          message: 'Token de convite não encontrado ou inválido',
        },
        { status: 404 }
      );
    }

    // ========================================
    // 2. VALIDAÇÕES DO TOKEN
    // ========================================

    // Token expirado?
    if (teamMember.token_expires_at && new Date(teamMember.token_expires_at) < new Date()) {
      return NextResponse.json(
        {
          error: 'Token expirado',
          message: 'O prazo para confirmar este convite já passou. Entre em contato com a HRX.',
          expiredAt: teamMember.token_expires_at,
        },
        { status: 410 } // 410 Gone
      );
    }

    // Token já usado?
    if (teamMember.status === 'confirmed') {
      return NextResponse.json(
        {
          error: 'Convite já confirmado',
          message: 'Você já confirmou presença neste evento anteriormente',
          confirmedAt: teamMember.invited_at,
        },
        { status: 409 } // 409 Conflict
      );
    }

    if (teamMember.status === 'rejected') {
      return NextResponse.json(
        {
          error: 'Convite já rejeitado',
          message: 'Você já rejeitou este convite anteriormente',
        },
        { status: 409 }
      );
    }

    if (teamMember.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Convite cancelado',
          message: 'Este convite foi cancelado pela HRX',
        },
        { status: 410 }
      );
    }

    // Status deve ser 'invited'
    if (teamMember.status !== 'invited') {
      return NextResponse.json(
        {
          error: 'Status inválido',
          message: `Status atual (${teamMember.status}) não permite ação neste momento`,
        },
        { status: 400 }
      );
    }

    // ========================================
    // 3. BUSCAR DADOS DO PROJETO
    // ========================================
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select(`
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
        client_name,
        is_urgent,
        status
      `)
      .eq('id', teamMember.project_id)
      .single();

    if (projectError || !project) {
      console.error('❌ Projeto não encontrado:', projectError);
      return NextResponse.json(
        {
          error: 'Projeto não encontrado',
          message: 'Não foi possível encontrar informações sobre este evento',
        },
        { status: 404 }
      );
    }

    // Verificar se projeto foi cancelado
    if (project.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Projeto cancelado',
          message: 'Este evento foi cancelado pela HRX',
        },
        { status: 410 }
      );
    }

    // ========================================
    // 4. ATUALIZAR STATUS DO MEMBRO
    // ========================================
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('project_team')
      .update({
        status: newStatus,
        confirmed_at: action === 'confirm' ? now : null,
        updated_at: now,
      })
      .eq('id', teamMember.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError);
      return NextResponse.json(
        {
          error: 'Erro ao processar confirmação',
          message: 'Não foi possível atualizar o status. Tente novamente.',
        },
        { status: 500 }
      );
    }

    // ========================================
    // 5. BUSCAR DADOS DO PROFISSIONAL (se houver)
    // ========================================
    let professionalData = null;
    if (teamMember.professional_id) {
      const { data: professional } = await supabase
        .from('professionals')
        .select('full_name, email, phone')
        .eq('id', teamMember.professional_id)
        .single();

      professionalData = professional;
    }

    // ========================================
    // 6. LOG DA AÇÃO
    // ========================================
    console.log(
      `✅ Convite ${action === 'confirm' ? 'confirmado' : 'rejeitado'} | ` +
      `Profissional: ${professionalData?.full_name || teamMember.external_name || 'N/A'} | ` +
      `Projeto: ${project.project_number} | ` +
      `Evento: ${project.event_name}`
    );

    // ========================================
    // 7. RETORNAR SUCESSO
    // ========================================
    return NextResponse.json(
      {
        success: true,
        action: action,
        message: action === 'confirm'
          ? 'Presença confirmada com sucesso! Você receberá mais informações em breve.'
          : 'Convite rejeitado. Obrigado por nos informar.',

        // Dados do projeto
        project: {
          projectNumber: project.project_number,
          eventName: project.event_name,
          eventType: project.event_type,
          eventDescription: project.event_description,
          eventDate: project.event_date,
          startTime: project.start_time,
          endTime: project.end_time,
          venueName: project.venue_name,
          venueAddress: project.venue_address,
          venueCity: project.venue_city,
          venueState: project.venue_state,
          clientName: project.client_name,
          isUrgent: project.is_urgent,
        },

        // Dados da função
        assignment: {
          role: teamMember.role,
          category: teamMember.category,
          durationDays: teamMember.duration_days,
          dailyRate: teamMember.daily_rate,
        },

        // Dados do profissional
        professional: professionalData
          ? {
              name: professionalData.full_name,
              email: professionalData.email,
              phone: professionalData.phone,
            }
          : teamMember.external_name
          ? {
              name: teamMember.external_name,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao processar confirmação:', error);
    return NextResponse.json(
      {
        error: 'Erro interno',
        message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      },
      { status: 500 }
    );
  }
}

/**
 * ====================================
 * GET /api/professional/confirm/[token]
 * ====================================
 * Endpoint para buscar informações do convite (sem confirmar)
 * Usado para exibir dados na página de confirmação
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Buscar membro da equipe pelo token
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('project_team')
      .select(`
        id,
        project_id,
        professional_id,
        external_name,
        role,
        category,
        quantity,
        duration_days,
        daily_rate,
        status,
        invitation_token,
        token_expires_at,
        invited_at,
        confirmed_at
      `)
      .eq('invitation_token', token)
      .single();

    if (teamMemberError || !teamMember) {
      return NextResponse.json(
        {
          error: 'Token inválido',
          message: 'Token de convite não encontrado',
        },
        { status: 404 }
      );
    }

    // Buscar dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select(`
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
        client_name,
        is_urgent,
        status
      `)
      .eq('id', teamMember.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          error: 'Projeto não encontrado',
          message: 'Não foi possível encontrar informações sobre este evento',
        },
        { status: 404 }
      );
    }

    // Buscar dados do profissional (se houver)
    let professionalData = null;
    if (teamMember.professional_id) {
      const { data: professional } = await supabase
        .from('professionals')
        .select('full_name, email, phone')
        .eq('id', teamMember.professional_id)
        .single();

      professionalData = professional;
    }

    // Retornar dados
    return NextResponse.json({
      success: true,
      status: teamMember.status,
      tokenExpired: teamMember.token_expires_at && new Date(teamMember.token_expires_at) < new Date(),
      tokenExpiresAt: teamMember.token_expires_at,

      project: {
        projectNumber: project.project_number,
        eventName: project.event_name,
        eventType: project.event_type,
        eventDescription: project.event_description,
        eventDate: project.event_date,
        startTime: project.start_time,
        endTime: project.end_time,
        venueName: project.venue_name,
        venueAddress: project.venue_address,
        venueCity: project.venue_city,
        venueState: project.venue_state,
        clientName: project.client_name,
        isUrgent: project.is_urgent,
        projectStatus: project.status,
      },

      assignment: {
        role: teamMember.role,
        category: teamMember.category,
        durationDays: teamMember.duration_days,
        dailyRate: teamMember.daily_rate,
      },

      professional: professionalData
        ? {
            name: professionalData.full_name,
            email: professionalData.email,
            phone: professionalData.phone,
          }
        : teamMember.external_name
        ? {
            name: teamMember.external_name,
          }
        : null,

      invitedAt: teamMember.invited_at,
      confirmedAt: teamMember.confirmed_at,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do convite:', error);
    return NextResponse.json(
      {
        error: 'Erro interno',
        message: 'Ocorreu um erro ao buscar informações do convite',
      },
      { status: 500 }
    );
  }
}
