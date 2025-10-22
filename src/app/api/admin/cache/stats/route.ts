import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getCacheStats } from '@/lib/cache';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/cache/stats
 *
 * Retorna estatísticas do cache do sistema
 *
 * Requer: Admin
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
        { error: 'Acesso negado. Apenas administradores podem visualizar estatísticas do cache.' },
        { status: 403 }
      );
    }

    const stats = getCacheStats();

    logger.info('Estatísticas de cache consultadas', { userId });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas do cache', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas do cache' },
      { status: 500 }
    );
  }
}
