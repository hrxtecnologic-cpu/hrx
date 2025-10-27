import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

/**
 * GET /api/admin/counts
 *
 * Retorna contadores para badges do menu admin
 *
 * Response:
 * {
 *   documents: number  // Profissionais com status 'pending'
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);
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

    logger.debug('Contadores admin consultados', {
      userId,
      documents: documentsCount || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsCount || 0,
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
