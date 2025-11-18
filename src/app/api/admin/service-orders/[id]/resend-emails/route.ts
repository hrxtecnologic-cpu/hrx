/**
 * =====================================================
 * API: Reenviar Emails de OS
 * =====================================================
 * Reenvia emails de uma OS para profissionais e fornecedores
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { sendServiceOrderEmails } from '@/lib/services/service-order-email';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Verificar autenticação
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      logger.warn('Tentativa de acesso não autenticado ao reenvio de emails');
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 🔒 Verificar se é admin (mesma lógica do middleware)
    const metadata = sessionClaims?.metadata;
    let isAdmin = metadata?.isAdmin === true || metadata?.role === 'admin';

    if (!isAdmin) {
      // Fallback 1: verificar por email
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);

      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

      const isAdminByEmail = ADMIN_EMAILS.includes(userEmail);

      if (isAdminByEmail) {
        isAdmin = true;
        logger.info('Admin verificado por email para reenvio', { email: userEmail });
      } else {
        // Fallback 2: verificar role no banco
        const supabase = await createClient();

        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', userId)
          .single();

        const isAdminByRole = user?.role === 'admin';

        if (!isAdminByRole) {
          logger.warn('Tentativa de acesso não autorizado ao reenvio de emails', {
            userId,
            email: userEmail
          });
          return NextResponse.json(
            { success: false, error: 'Acesso negado - apenas admins' },
            { status: 403 }
          );
        }

        isAdmin = true;
        logger.info('Admin verificado por role no banco para reenvio', { userId });
      }
    }

    const supabase = await createClient();

    const params = await context.params;
    const { id: serviceOrderId } = params;

    logger.info('Reenviando emails de OS', { serviceOrderId, userId });

    // Verificar se OS existe (usando supabase já criado acima)
    const { data: serviceOrder, error: osError } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', serviceOrderId)
      .single();

    if (osError || !serviceOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'OS não encontrada',
        },
        { status: 404 }
      );
    }

    // Reenviar emails
    const result = await sendServiceOrderEmails({
      serviceOrderId,
    });

    if (result.success) {
      logger.info('Emails de OS reenviados com sucesso', {
        serviceOrderId,
        profissionais: result.emailsSent.professionals,
        fornecedores: result.emailsSent.suppliers,
      });

      return NextResponse.json({
        success: true,
        message: 'Emails reenviados com sucesso',
        emailsSent: result.emailsSent,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logger.error('Erro ao reenviar emails de OS', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reenviar emails',
      },
      { status: 500 }
    );
  }
}
