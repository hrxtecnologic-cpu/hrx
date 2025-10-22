import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { resend } from '@/lib/resend/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem alterar status de solicitações.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========== Buscar dados da solicitação antes de atualizar ==========
    const { data: request, error: fetchError } = await supabase
      .from('contractor_requests')
      .select('id, event_name, email, company_name, status as old_status, clerk_id')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Se status não mudou, não fazer nada
    if (request.old_status === status) {
      return NextResponse.json({
        success: true,
        message: 'Status já está atualizado'
      });
    }

    // ========== Atualizar status da solicitação ==========
    const { error } = await supabase
      .from('contractor_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // ========== Enviar notificação ao cliente quando status mudar ==========
    const statusMessages: Record<string, { subject: string; message: string }> = {
      in_progress: {
        subject: 'Solicitação em andamento',
        message: 'Sua solicitação está sendo processada por nossa equipe.'
      },
      completed: {
        subject: 'Solicitação concluída',
        message: 'Sua solicitação foi concluída com sucesso!'
      },
      cancelled: {
        subject: 'Solicitação cancelada',
        message: 'Sua solicitação foi cancelada.'
      },
      pending: {
        subject: 'Solicitação pendente',
        message: 'Sua solicitação está aguardando análise.'
      }
    };

    const statusInfo = statusMessages[status] || {
      subject: 'Status da solicitação atualizado',
      message: `O status da sua solicitação foi atualizado para: ${status}`
    };

    try {
      // Enviar email via Resend
      const emailResult = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'HRX Platform <noreply@hrx.com>',
        to: request.email,
        subject: `${statusInfo.subject} - ${request.event_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá, ${request.company_name}!</h2>
            <p>${statusInfo.message}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Evento:</strong> ${request.event_name}</p>
              <p style="margin: 10px 0 0 0;"><strong>Novo Status:</strong> ${status}</p>
            </div>
            <p>Se você tiver dúvidas, entre em contato conosco.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Esta é uma mensagem automática, por favor não responda.
            </p>
          </div>
        `
      });

      // Salvar log do email enviado
      await supabase
        .from('email_logs')
        .insert({
          recipient_email: request.email,
          recipient_type: 'contractor',
          subject: `${statusInfo.subject} - ${request.event_name}`,
          template_used: 'status_change',
          related_id: request.id,
          related_type: 'contractor_request',
          status: 'sent',
          external_id: emailResult.data?.id,
          sent_at: new Date().toISOString()
        });

      logger.info('Notificação de mudança de status enviada', {
        requestId: id,
        email: request.email,
        oldStatus: request.old_status,
        newStatus: status,
        emailId: emailResult.data?.id
      });

    } catch (emailError) {
      // Log do erro mas não falhar a operação
      logger.error('Erro ao enviar notificação de status', emailError instanceof Error ? emailError : undefined, {
        requestId: id,
        email: request.email,
        status
      });

      // Salvar log de email falhado
      await supabase
        .from('email_logs')
        .insert({
          recipient_email: request.email,
          recipient_type: 'contractor',
          subject: `${statusInfo.subject} - ${request.event_name}`,
          template_used: 'status_change',
          related_id: request.id,
          related_type: 'contractor_request',
          status: 'failed',
          error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
          sent_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      message: `Status atualizado de "${request.old_status}" para "${status}"`,
      notificationSent: true
    });
  } catch (error) {
    logger.error('Erro ao atualizar status', error instanceof Error ? error : undefined, {
      requestId: id,
      status
    });
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}
