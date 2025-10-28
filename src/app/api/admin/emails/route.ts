import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { getEmailHistory } from '@/lib/resend/email-logger';
import { withAdmin } from '@/lib/api';

/**
 * GET /api/admin/emails
 *
 * Busca historico de emails enviados com filtros opcionais
 */
export const GET = withAdmin(async (userId: string, req: Request) => {
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
