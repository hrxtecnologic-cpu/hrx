import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendProfessionalApprovalEmail } from '@/lib/resend/emails';
import { isAdmin } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
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
      return forbiddenResponse('Acesso negado. Apenas administradores podem aprovar profissionais.');
    }

    const { id } = await params;
    const supabase = await createClient();

    // Buscar dados do profissional antes de aprovar
    const { data: professional, error: fetchError } = await supabase
      .from('professionals')
      .select('full_name, email')
      .eq('id', id)
      .single();

    if (fetchError || !professional) {
      logger.error('Erro ao buscar profissional para aprovação', fetchError, { professionalId: id });
      return notFoundResponse('Profissional não encontrado');
    }

    // Atualizar status do profissional
    const { error } = await supabase
      .from('professionals')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Enviar email de notificação ao profissional
    const emailResult = await sendProfessionalApprovalEmail({
      professionalName: professional.full_name,
      professionalEmail: professional.email,
    });

    if (!emailResult.success) {
      logger.error('Erro ao enviar email de aprovação', undefined, {
        professionalId: id,
        error: emailResult.error
      });
      // Não falhar a operação se o email não for enviado
    } else {
      logger.info('Profissional aprovado e email enviado', {
        professionalId: id
      });
    }

    return successResponse(undefined, 'Profissional aprovado com sucesso');
  } catch (error) {
    logger.error('Erro ao aprovar profissional', error instanceof Error ? error : undefined, { professionalId: id });
    return handleError(error, 'Erro ao aprovar profissional');
  }
}
