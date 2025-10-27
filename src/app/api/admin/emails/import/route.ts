import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';
import { resend } from '@/lib/resend/client';
import { logEmail } from '@/lib/resend/email-logger';

/**
 * POST /api/admin/emails/import
 *
 * Importa historico de emails do Resend para o banco de dados
 */
export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    let totalImported = 0;
    let hasMore = true;
    let after: string | undefined;
    const limit = 100; // Maximo permitido pela API


    // Buscar emails em lotes ate nao ter mais
    while (hasMore) {
      const result = await resend.emails.list({
        limit,
        ...(after ? { after } : {}),
      });

      if (result.error) {
        return NextResponse.json(
          { error: 'Erro ao buscar emails do Resend', details: result.error },
          { status: 500 }
        );
      }

      // Verificar estrutura da resposta

      const emailsData = result.data?.data || [];
      const has_more = result.data?.has_more || false;
      hasMore = has_more;


      if (emailsData.length === 0) {
        break;
      }

      // Importar cada email
      for (const email of emailsData) {
        try {
          // Determinar o tipo de destinatario baseado no email
          let recipientType: 'professional' | 'contractor' | 'supplier' | 'admin' | 'hrx' = 'hrx';

          // Tentar inferir o tipo baseado no assunto ou destinatario
          const subject = email.subject.toLowerCase();
          if (subject.includes('profissional') || subject.includes('professional')) {
            recipientType = 'professional';
          } else if (subject.includes('contratante') || subject.includes('solicitacao') || subject.includes('contractor')) {
            recipientType = 'contractor';
          } else if (subject.includes('fornecedor') || subject.includes('orcamento') || subject.includes('supplier')) {
            recipientType = 'supplier';
          } else if (subject.includes('admin') || subject.includes('notificacao')) {
            recipientType = 'admin';
          }

          // Determinar o template usado baseado no assunto
          let templateUsed = 'UnknownEmail';
          if (subject.includes('boas-vindas') || subject.includes('bem-vindo')) {
            templateUsed = 'SimpleWelcomeEmail';
          } else if (subject.includes('confirmacao') && subject.includes('solicitacao')) {
            templateUsed = 'ContractorConfirmationEmail';
          } else if (subject.includes('confirmacao') && subject.includes('contato')) {
            templateUsed = 'ContactConfirmationEmail';
          } else if (subject.includes('orcamento') && subject.includes('aceito')) {
            templateUsed = 'QuoteAcceptedEmail';
          } else if (subject.includes('orcamento') && subject.includes('solicitacao')) {
            templateUsed = 'QuoteRequestEmail';
          } else if (subject.includes('urgente')) {
            templateUsed = 'UrgentQuoteAdminEmail';
          } else if (subject.includes('novo cadastro')) {
            templateUsed = 'AdminNotificationEmail';
          } else if (subject.includes('nova solicitacao')) {
            templateUsed = 'AdminRequestNotificationEmail';
          }

          // Determinar status baseado no last_event
          let status: 'sent' | 'failed' | 'pending' = 'sent';
          let errorMessage: string | undefined;

          if (email.last_event === 'failed' || email.last_event === 'bounced') {
            status = 'failed';
            errorMessage = `Email ${email.last_event}`;
          } else if (email.last_event === 'queued' || email.last_event === 'scheduled') {
            status = 'pending';
          }

          // Pegar o primeiro destinatario
          const recipientEmail = Array.isArray(email.to) ? email.to[0] : email.to;

          // Salvar no banco
          await logEmail({
            recipientEmail,
            recipientType,
            subject: email.subject,
            templateUsed,
            status,
            errorMessage,
            externalId: email.id,
            sentAt: email.created_at,
          });

          totalImported++;
        } catch (emailError) {
          // Continuar mesmo se um email falhar
        }
      }

      // Pegar o cursor para a proxima pagina
      if (has_more && emailsData.length > 0) {
        // O cursor 'after' e o ID do ultimo email
        after = emailsData[emailsData.length - 1].id;
      }
    }


    return NextResponse.json({
      success: true,
      totalImported,
      message: `${totalImported} emails importados com sucesso`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
}
