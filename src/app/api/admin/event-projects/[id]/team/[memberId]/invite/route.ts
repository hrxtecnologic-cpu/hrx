import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { sendProfessionalInvitation } from '@/lib/resend/emails';

/**
 * ===============================================
 * POST /api/admin/event-projects/[id]/team/[memberId]/invite
 * ===============================================
 * Envia convite por email para profissional confirmar presença
 *
 * Fluxo:
 *  1. Valida admin auth
 *  2. Busca dados do membro da equipe e profissional
 *  3. Busca dados do projeto
 *  4. Gera token único de convite
 *  5. Envia email com link de confirmação
 *  6. Atualiza status para 'invited'
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
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

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: projectId, memberId } = await params;
    const supabase = await createClient();

    // ========================================
    // 1. BUSCAR MEMBRO DA EQUIPE
    // ========================================
    const { data: teamMember, error: teamError } = await supabase
      .from('project_team')
      .select(`
        id,
        project_id,
        professional_id,
        external_name,
        role,
        category,
        duration_days,
        daily_rate,
        status,
        notes
      `)
      .eq('id', memberId)
      .eq('project_id', projectId)
      .single();

    if (teamError || !teamMember) {
      return NextResponse.json(
        { error: 'Membro da equipe não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem profissional alocado
    if (!teamMember.professional_id) {
      return NextResponse.json(
        {
          error: 'Profissional não alocado',
          message: 'É necessário ter um profissional alocado para enviar convite',
        },
        { status: 400 }
      );
    }

    // ========================================
    // 2. BUSCAR DADOS DO PROFISSIONAL
    // ========================================
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('id, full_name, email, phone')
      .eq('id', teamMember.professional_id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se profissional tem email
    if (!professional.email) {
      return NextResponse.json(
        {
          error: 'Email não cadastrado',
          message: 'O profissional não possui email cadastrado',
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
        event_date,
        venue_address,
        venue_city,
        venue_state,
        client_name,
        is_urgent,
        status
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // ========================================
    // 4. GERAR TOKEN DE CONVITE
    // ========================================
    // Usar função do banco para gerar token único
    const { data: tokenResult, error: tokenError } = await supabase
      .rpc('generate_invitation_token', { team_member_id: memberId });

    if (tokenError) {
      return NextResponse.json(
        {
          error: 'Erro ao gerar token',
          message: 'Não foi possível gerar token de convite',
        },
        { status: 500 }
      );
    }

    const invitationToken = tokenResult as string;

    // ========================================
    // 5. ENVIAR EMAIL DE CONVITE
    // ========================================
    const eventLocation = `${project.venue_city}, ${project.venue_state}`;

    const emailResult = await sendProfessionalInvitation({
      // Profissional
      professionalName: professional.full_name,
      professionalEmail: professional.email,

      // Evento
      eventName: project.event_name,
      eventType: project.event_type,
      eventDate: project.event_date,
      eventLocation: eventLocation,

      // Função
      role: teamMember.role,
      category: teamMember.category,
      durationDays: teamMember.duration_days,
      dailyRate: teamMember.daily_rate,

      // Projeto
      clientName: project.client_name,
      isUrgent: project.is_urgent || false,
      projectNumber: project.project_number,
      projectId: project.id,
      teamMemberId: teamMember.id,

      // Observações
      additionalNotes: teamMember.notes,

      // Token
      invitationToken: invitationToken,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: 'Erro ao enviar email',
          message: emailResult.error || 'Não foi possível enviar convite por email',
        },
        { status: 500 }
      );
    }

    // ========================================
    // 6. LOG E RETORNO
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message: 'Convite enviado com sucesso',
        professionalName: professional.full_name,
        professionalEmail: professional.email,
        invitationToken: invitationToken,
        emailId: emailResult.emailId,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        message: 'Ocorreu um erro ao enviar o convite',
      },
      { status: 500 }
    );
  }
}
