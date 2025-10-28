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
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 Verificar autenticação
    const { userId } = await auth();

    if (!userId) {
      logger.warn('Tentativa de acesso não autenticado ao reenvio de emails');
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 🔒 Verificar se é admin
    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      logger.warn('Tentativa de acesso não autorizado ao reenvio de emails', { userId });
      return NextResponse.json(
        { success: false, error: 'Acesso negado - apenas admins' },
        { status: 403 }
      );
    }

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
  } catch (error: any) {
    logger.error('Erro ao reenviar emails de OS', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao reenviar emails',
      },
      { status: 500 }
    );
  }
}
