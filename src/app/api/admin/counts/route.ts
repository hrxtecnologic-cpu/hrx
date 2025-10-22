import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/counts
 *
 * Retorna contadores para badges do menu admin
 *
 * Response:
 * {
 *   documents: number,  // Profissionais com status 'pending'
 *   requests: number    // Contractor requests com status 'pending'
 * }
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar contadores.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Buscar profissionais pendentes (documentos)
    const { count: documentsCount, error: documentsError } = await supabase
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (documentsError) {
      logger.error('Erro ao buscar contagem de documentos pendentes', documentsError);
      throw documentsError;
    }

    // Buscar solicitações pendentes
    const { count: requestsCount, error: requestsError } = await supabase
      .from('contractor_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (requestsError) {
      logger.error('Erro ao buscar contagem de solicitações pendentes', requestsError);
      throw requestsError;
    }

    logger.debug('Contadores admin consultados', {
      userId,
      documents: documentsCount || 0,
      requests: requestsCount || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsCount || 0,
        requests: requestsCount || 0,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar contadores admin', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Erro ao buscar contadores' },
      { status: 500 }
    );
  }
}
