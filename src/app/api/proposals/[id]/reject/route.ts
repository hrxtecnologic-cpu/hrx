import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// GET /api/proposals/[id]/reject
// Página pública para rejeitar proposta
// =============================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);
    if (!rateLimitResult.success) return NextResponse.json(createRateLimitError(rateLimitResult), { status: 429 });
    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Validar token (email do cliente)
    if (!token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Link Inválido - HRX Eventos</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f9fafb; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              h1 { color: #DC2626; }
              p { color: #4a5568; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Link Inválido</h1>
              <p>Este link de rejeição de proposta é inválido ou expirou.</p>
              <p>Entre em contato conosco para mais informações.</p>
            </div>
          </body>
        </html>
        `,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Buscar projeto
    const { data: project, error } = await supabase
      .from('event_projects')
      .select('id, project_number, client_name, client_email, event_name, status')
      .eq('id', projectId)
      .eq('client_email', token)
      .single();

    if (error || !project) {
      logger.error('Projeto não encontrado para rejeitar proposta', { projectId, token });
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Proposta Não Encontrada - HRX Eventos</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f9fafb; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              h1 { color: #DC2626; }
              p { color: #4a5568; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Proposta Não Encontrada</h1>
              <p>Não foi possível encontrar esta proposta.</p>
              <p>Verifique se o link está correto ou entre em contato conosco.</p>
            </div>
          </body>
        </html>
        `,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Atualizar status para 'rejected'
    const { error: updateError } = await supabase
      .from('event_projects')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      logger.error('Erro ao atualizar status do projeto', { projectId, error: updateError });
      throw new Error('Erro ao processar rejeição');
    }

    logger.info('Proposta rejeitada pelo cliente', { projectId, clientEmail: token });

    // Página de rejeição - Dark Theme HRX
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposta Recusada - HRX Eventos</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
              color: #e5e7eb;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              width: 100%;
              background: #27272a;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
              border: 1px solid #3f3f46;
              text-align: center;
            }
            .logo {
              background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 20px;
              display: inline-block;
              margin-bottom: 30px;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #fca5a5;
              margin-bottom: 15px;
              font-size: 28px;
            }
            .subtitle {
              color: #a1a1aa;
              line-height: 1.6;
              margin-bottom: 30px;
              font-size: 16px;
            }
            .project-info {
              background: #18181b;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #3f3f46;
            }
            .project-info p {
              color: #d4d4d8;
              margin: 8px 0;
              font-size: 15px;
            }
            .project-info strong { color: #f5f5f5; }
            .feedback-box {
              text-align: left;
              background: #78350f;
              padding: 24px;
              border-radius: 8px;
              margin: 25px 0;
              border: 2px solid #fbbf24;
            }
            .feedback-box h2 {
              color: #fde047;
              font-size: 18px;
              margin-bottom: 15px;
            }
            .feedback-box p {
              color: #fef3c7;
              margin: 12px 0;
              line-height: 1.6;
            }
            .feedback-box ul {
              color: #fef3c7;
              list-style: none;
              padding: 0;
              margin: 15px 0;
            }
            .feedback-box li {
              padding: 6px 0;
              padding-left: 24px;
              position: relative;
            }
            .feedback-box li:before {
              content: "•";
              position: absolute;
              left: 8px;
              color: #fbbf24;
              font-size: 20px;
            }
            .feedback-box strong {
              color: #fde047;
            }
            .contact {
              background: #18181b;
              padding: 24px;
              border-radius: 8px;
              margin: 25px 0;
              border: 1px solid #3f3f46;
            }
            .contact h3 {
              color: #f5f5f5;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .contact p {
              color: #d4d4d8;
              margin: 8px 0;
              line-height: 1.6;
            }
            .contact a {
              color: #ef4444;
              text-decoration: none;
              font-weight: 500;
            }
            .contact a:hover {
              color: #dc2626;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #3f3f46;
              color: #71717a;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">HRX Eventos</div>

            <div class="icon">💬</div>
            <h1>Proposta Recusada</h1>
            <p class="subtitle">Registramos sua decisão, <strong>${project.client_name}</strong>.</p>

            <div class="project-info">
              <p><strong>Projeto:</strong> ${project.project_number}</p>
              <p><strong>Evento:</strong> ${project.event_name}</p>
              <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #3f3f46;">
                <span style="color: #fca5a5; font-weight: 600;">✕ Status:</span>
                <span style="color: #fecaca;">Recusado</span>
              </p>
            </div>

            <div class="feedback-box">
              <h2>📢 Gostaríamos do Seu Feedback</h2>
              <p>Sua opinião é muito importante para nós! Poderia nos dizer o motivo da recusa?</p>
              <ul>
                <li>Preço acima do orçamento?</li>
                <li>Optou por outro fornecedor?</li>
                <li>Evento foi cancelado?</li>
                <li>Outro motivo?</li>
              </ul>
              <p>Por favor, responda para: <strong>atendimento@hrxeventos.com.br</strong></p>
            </div>

            <div class="contact">
              <h3>📞 Ficamos à Disposição</h3>
              <p>Se mudar de ideia ou tiver qualquer dúvida, estamos aqui para ajudar!</p>
              <p style="margin-top: 15px;">
                🌐 Site: <a href="https://www.hrxeventos.com.br">www.hrxeventos.com.br</a><br>
                📧 Email: <a href="mailto:atendimento@hrxeventos.com.br">atendimento@hrxeventos.com.br</a><br>
                📱 WhatsApp: <a href="https://wa.me/5521999952457">(21) 99995-2457</a>
              </p>
            </div>

            <div class="footer">
              <p>Esperamos trabalhar com você em uma próxima oportunidade! 🤝</p>
              <p style="margin-top: 8px;">© 2025 HRX Eventos - Plataforma de Profissionais para Eventos</p>
            </div>
          </div>
        </body>
      </html>
      `,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: unknown) {
    logger.error('Erro ao processar rejeição de proposta', { error: error instanceof Error ? error.message : String(error) });
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Erro - HRX Eventos</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f9fafb; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #DC2626; }
            p { color: #4a5568; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Erro ao Processar</h1>
            <p>Ocorreu um erro ao processar sua rejeição.</p>
            <p>Por favor, entre em contato conosco.</p>
          </div>
        </body>
      </html>
      `,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
