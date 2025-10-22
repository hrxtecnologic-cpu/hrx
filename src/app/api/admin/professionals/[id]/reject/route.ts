import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { sendProfessionalRejectionEmail } from '@/lib/resend/emails';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  successResponse,
  handleError,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return forbiddenResponse('Acesso negado. Apenas administradores podem rejeitar profissionais.');
    }

    const { id } = await params;
    const { reason, documentsWithIssues } = await req.json();

    if (!reason) {
      return badRequestResponse('Motivo da rejeição é obrigatório');
    }

    const supabase = await createClient();

    // Buscar dados do profissional antes de rejeitar
    const { data: professional, error: fetchError } = await supabase
      .from('professionals')
      .select('full_name, email')
      .eq('id', id)
      .single();

    if (fetchError || !professional) {
      logger.error('Erro ao buscar profissional para rejeição', fetchError, { professionalId: id });
      return notFoundResponse('Profissional não encontrado');
    }

    // Atualizar status do profissional
    const { error } = await supabase
      .from('professionals')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Enviar email de notificação ao profissional
    const emailResult = await sendProfessionalRejectionEmail({
      professionalName: professional.full_name,
      professionalEmail: professional.email,
      rejectionReason: reason,
      documentsWithIssues: documentsWithIssues || [],
    });

    if (!emailResult.success) {
      logger.error('Erro ao enviar email de rejeição', undefined, {
        professionalId: id,
        error: emailResult.error
      });
      // Não falhar a operação se o email não for enviado
    } else {
      logger.info('Profissional rejeitado e email enviado', {
        professionalId: id,
        reason: reason
      });
    }

    return successResponse(undefined, 'Profissional rejeitado com sucesso');
  } catch (error) {
    logger.error('Erro ao rejeitar profissional', error instanceof Error ? error : undefined, { professionalId: id });
    return handleError(error, 'Erro ao rejeitar profissional');
  }
}
