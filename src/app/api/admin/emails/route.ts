import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getEmailHistory } from '@/lib/resend/email-logger';

/**
 * GET /api/admin/emails
 *
 * Busca historico de emails enviados com filtros opcionais
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recipientEmail = searchParams.get('recipientEmail') || undefined;
    const recipientType = searchParams.get('recipientType') || undefined;
    const templateUsed = searchParams.get('templateUsed') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const result = await getEmailHistory({
      recipientEmail,
      recipientType,
      templateUsed,
      status,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao buscar historico de emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emails: result.data,
      total: result.count,
      pagination: {
        limit,
        offset,
        total: result.count,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar emails:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
