import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { FinalProposalEmail } from '@/lib/resend/templates/FinalProposalEmail';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// =============================================
// POST /api/admin/event-projects/[id]/send-proposal
// Enviar proposta final ao cliente
// =============================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params (Next.js 15)
    const { id: projectId } = await params;

    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting (envio de proposta é uma operação de escrita)
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    // 1. Buscar projeto completo
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      logger.error('Projeto não encontrado', { projectId, error: projectError?.message });
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem email do cliente
    if (!project.client_email) {
      return NextResponse.json(
        { error: 'Projeto não possui email do cliente cadastrado' },
        { status: 400 }
      );
    }

    // 2. Buscar equipe com preços
    const { data: team, error: teamError } = await supabase
      .from('project_team')
      .select(`
        *,
        professional:professionals(
          id,
          full_name,
          categories
        )
      `)
      .eq('project_id', projectId);

    if (teamError) {
      logger.error('Erro ao buscar equipe', { projectId, error: teamError.message });
      return NextResponse.json(
        { error: 'Erro ao buscar equipe do projeto' },
        { status: 500 }
      );
    }

    // 3. Buscar equipamentos (sem JOIN para evitar erro)
    let equipment: Array<Record<string, unknown>> = [];
    try {
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', projectId);

      if (equipmentError) {
        throw new Error(`Erro ao buscar equipamentos: ${equipmentError.message}`);
      }

      equipment = equipmentData || [];

      // Buscar cotações selecionadas separadamente
      if (equipment.length > 0) {
        const quoteIds = equipment
          .map(e => e.selected_quote_id)
          .filter(Boolean);

        if (quoteIds.length > 0) {
          const { data: quotations } = await supabase
            .from('supplier_quotations')
            .select('id, total_price, daily_rate, delivery_fee, setup_fee')
            .in('id', quoteIds);

          // Mapear cotações para equipamentos
          if (quotations) {
            equipment = equipment.map(eq => ({
              ...eq,
              selected_quotation: quotations.find(q => q.id === eq.selected_quote_id) || null,
            }));
          }
        }
      }
    } catch (error: unknown) {
      logger.error('Erro ao buscar equipamentos', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
        stack: error.stack,
      });
      return NextResponse.json(
        { error: `Erro ao buscar equipamentos: ${error.message}` },
        { status: 500 }
      );
    }

    // Validar se tem pelo menos equipe ou equipamentos
    if ((!team || team.length === 0) && (!equipment || equipment.length === 0)) {
      return NextResponse.json(
        { error: 'Projeto precisa ter pelo menos profissionais ou equipamentos selecionados' },
        { status: 400 }
      );
    }

    // 4. Preparar dados da equipe para o email
    const teamMembers = (team || []).map((member) => ({
      category: member.category || member.professional?.categories?.[0] || 'Profissional',
      quantity: member.quantity || 1,
      unit_price: member.daily_rate || 0,
      total_price: member.total_cost || 0,
    }));

    // 5. Preparar dados dos equipamentos para o email
    const equipmentItems = (equipment || []).map((item) => {
      // Pegar preço da cotação selecionada, se houver
      const quotationPrice = item.selected_quotation?.total_price || 0;
      const deliveryFee = item.selected_quotation?.delivery_fee || 0;
      const setupFee = item.selected_quotation?.setup_fee || 0;
      const quantity = item.quantity || 1;
      const duration = item.duration_days || 1;

      // Calcular preço total incluindo taxas
      const basePrice = quotationPrice * quantity * duration;
      const totalPrice = basePrice + deliveryFee + setupFee;

      return {
        name: item.name,
        category: item.category,
        quantity: quantity,
        duration_days: duration,
        unit_price: quotationPrice,
        total_price: totalPrice,
      };
    });

    // 6. Calcular totais
    const teamSubtotal = teamMembers.reduce((sum, m) => sum + m.total_price, 0);
    const equipmentSubtotal = equipmentItems.reduce((sum, e) => sum + e.total_price, 0);
    const subtotal = teamSubtotal + equipmentSubtotal;
    const total = subtotal; // Já está com a margem aplicada

    // 7. URLs para aceitar/rejeitar (vamos criar essas rotas depois)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/api/proposals/${projectId}/accept?token=${encodeURIComponent(project.client_email)}`;
    const rejectUrl = `${baseUrl}/api/proposals/${projectId}/reject?token=${encodeURIComponent(project.client_email)}`;

    // 8. Enviar email
    const emailData = {
      clientName: project.client_name,
      clientEmail: project.client_email,
      proposalNumber: project.project_number,
      projectId: project.id,
      eventName: project.event_name,
      eventDate: project.event_date,
      eventType: project.event_type,
      venueName: project.venue_name,
      venueAddress: project.venue_address,
      venueCity: project.venue_city,
      venueState: project.venue_state,
      expectedAttendance: project.expected_attendance,
      teamMembers,
      teamSubtotal,
      equipment: equipmentItems,
      equipmentSubtotal,
      subtotal,
      total,
      acceptUrl,
      rejectUrl,
    };

    let emailSent = false;
    let emailError = null;

    try {
      logger.info('Preparando envio de email', {
        projectId,
        recipient: project.client_email,
        from: process.env.RESEND_FROM_EMAIL,
        hasResendKey: !!process.env.RESEND_API_KEY,
      });

      const { data: emailResult, error: sendError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'HRX Eventos <noreply@hrxeventos.com.br>',
        to: [project.client_email],
        subject: `Proposta Comercial - ${project.event_name} (${project.project_number})`,
        react: FinalProposalEmail(emailData),
      });

      if (sendError) {
        emailError = sendError.message;
        logger.error('Erro ao enviar email de proposta', {
          projectId,
          error: sendError.message,
          errorObject: JSON.stringify(sendError),
        });
      } else {
        emailSent = true;
        logger.info('Email de proposta enviado', {
          projectId,
          emailId: emailResult?.id,
          recipient: project.client_email,
        });
      }
    } catch (error: unknown) {
      emailError = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Exceção ao enviar email', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
        stack: error.stack,
        errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
    }

    // 9. Registrar email na tabela project_emails
    if (emailSent) {
      await supabase.from('project_emails').insert({
        project_id: projectId,
        email_type: 'final_proposal',
        recipient_email: project.client_email,
        subject: `Proposta Comercial - ${project.event_name}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } else {
      await supabase.from('project_emails').insert({
        project_id: projectId,
        email_type: 'final_proposal',
        recipient_email: project.client_email,
        subject: `Proposta Comercial - ${project.event_name}`,
        status: 'failed',
        error_message: emailError,
      });
    }

    // 10. Atualizar status do projeto para 'proposed'
    if (emailSent) {
      await supabase
        .from('event_projects')
        .update({
          status: 'proposed',
          proposed_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      logger.info('Status do projeto atualizado para proposed', { projectId });
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: `Erro ao enviar email: ${emailError}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Proposta enviada com sucesso',
      emailSent: true,
      recipient: project.client_email,
      totalValue: total,
    });
  } catch (error: unknown) {
    logger.error('Erro ao enviar proposta', {
      error: error instanceof Error ? error.message : String(error),
      stack: error.stack,
      errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
