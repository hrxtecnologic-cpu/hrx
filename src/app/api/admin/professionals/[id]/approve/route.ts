import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      return unauthorizedResponse();
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return forbiddenResponse('Acesso negado. Apenas administradores podem aprovar profissionais.');
    }

    const { id } = await params;
    const supabase = await createAdminClient();

    // Buscar dados do profissional antes de aprovar
    const { data: professional, error: fetchError } = await supabase
      .from('professionals')
      .select('full_name, email')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !professional) {
      logger.error('Erro ao buscar profissional para aprovação', fetchError, { professionalId: id });
      return notFoundResponse('Profissional não encontrado');
    }

    // Buscar user_id do admin que está aprovando
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    // Atualizar status do profissional
    const { error } = await supabase
      .from('professionals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: currentUser?.id || null,
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
