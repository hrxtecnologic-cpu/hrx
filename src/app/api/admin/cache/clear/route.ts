import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { cacheClear } from '@/lib/cache';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/cache/clear
 *
 * Limpa o cache do sistema (total ou parcial)
 *
 * Body (opcional):
 * {
 *   "prefix": "geocoding" // limpa apenas chaves com esse prefixo
 * }
 *
 * Requer: Admin
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem limpar o cache.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { prefix } = body;

    const cleared = await cacheClear(prefix);

    logger.info('Cache limpo', { userId, prefix: prefix || 'all', cleared });

    return NextResponse.json({
      success: true,
      message: prefix
        ? `Cache com prefixo "${prefix}" limpo com sucesso`
        : 'Cache completamente limpo',
      data: {
        cleared,
        prefix: prefix || null,
      },
    });
  } catch (error) {
    logger.error('Erro ao limpar cache', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Erro ao limpar cache' },
      { status: 500 }
    );
  }
}
