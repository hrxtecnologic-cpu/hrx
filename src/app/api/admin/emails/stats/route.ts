import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getEmailStats } from '@/lib/resend/email-logger';

/**
 * GET /api/admin/emails/stats
 *
 * Retorna estatísticas de emails enviados
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const result = await getEmailStats();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
