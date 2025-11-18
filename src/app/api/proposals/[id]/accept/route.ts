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
// GET /api/proposals/[id]/accept
// Página pública para aceitar proposta
// =============================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
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
              <p>Este link de aceitação de proposta é inválido ou expirou.</p>
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
      logger.error('Projeto não encontrado para aceitar proposta', { projectId, token });
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

    // Verificar se já foi aceita/rejeitada
    if (project.status === 'approved') {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Proposta Já Aceita - HRX Eventos</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f9fafb; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              h1 { color: #16a34a; }
              p { color: #4a5568; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Proposta Já Aceita</h1>
              <p>Esta proposta já foi aceita anteriormente.</p>
              <p>Nossa equipe entrará em contato em breve para alinhar os próximos passos.</p>
            </div>
          </body>
        </html>
        `,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Atualizar status para 'approved'
    const { error: updateError } = await supabase
      .from('event_projects')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      logger.error('Erro ao atualizar status do projeto', { projectId, error: updateError });
      throw new Error('Erro ao processar aceitação');
    }

    logger.info('Proposta aceita pelo cliente', { projectId, clientEmail: token });

    // =====================================================
    // FLUXO AUTOMÁTICO: Gerar e Enviar Contrato
    // =====================================================
    // Import dynamically to avoid circular dependencies
    const { generateContract } = await import('@/lib/services/contract-service');
    const { sendContractForSignature } = await import('@/lib/services/contract-signature-service');

    // Execute asynchronously without blocking the response
    Promise.resolve().then(async () => {
      try {
        // 1. Gerar contrato
        logger.info('Iniciando geração automática de contrato', { projectId });
        const contractResult = await generateContract({ projectId, userId: 'system-auto' });

        if (contractResult.success && contractResult.contract) {
          const contractId = contractResult.contract.id;
          logger.info('Contrato gerado automaticamente', { projectId, contractId });

          // 2. Aguardar 5 segundos antes de enviar
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // 3. Enviar contrato para assinatura
          try {
            const sendResult = await sendContractForSignature(contractId);

            if (sendResult.success) {
              logger.info('Contrato enviado automaticamente para assinatura', {
                projectId,
                contractId,
              });
            } else {
              logger.error('Erro ao enviar contrato automaticamente', {
                projectId,
                contractId,
                error: sendResult.message,
              });
            }
          } catch (sendError: unknown) {
            logger.error('Exceção ao enviar contrato automaticamente', {
              projectId,
              contractId,
              error: sendError.message,
            });
          }
        } else {
          logger.error('Falha ao gerar contrato automaticamente', {
            projectId,
            error: contractResult.message,
          });
        }
      } catch (error: unknown) {
        logger.error('Erro no fluxo automático de contrato', {
          projectId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Página de sucesso - Dark Theme HRX
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposta Aceita - HRX Eventos</title>
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
            .success-icon {
              font-size: 80px;
              margin-bottom: 20px;
              animation: bounce 0.6s ease;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            h1 {
              color: #4ade80;
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
            .next-steps {
              text-align: left;
              background: #1e3a8a;
              padding: 24px;
              border-radius: 8px;
              margin: 25px 0;
              border: 2px solid #3b82f6;
            }
            .next-steps h2 {
              color: #93c5fd;
              font-size: 18px;
              margin-bottom: 15px;
            }
            .next-steps ul {
              color: #dbeafe;
              list-style: none;
              padding: 0;
            }
            .next-steps li {
              padding: 8px 0;
              padding-left: 24px;
              position: relative;
            }
            .next-steps li:before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #4ade80;
              font-weight: bold;
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

            <div class="success-icon">✅</div>
            <h1>Proposta Aceita com Sucesso!</h1>
            <p class="subtitle">Obrigado por aceitar nossa proposta, <strong>${project.client_name}</strong>!</p>

            <div class="project-info">
              <p><strong>Projeto:</strong> ${project.project_number}</p>
              <p><strong>Evento:</strong> ${project.event_name}</p>
              <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #3f3f46;">
                <span style="color: #4ade80; font-weight: 600;">✓ Status:</span>
                <span style="color: #86efac;">Aprovado</span>
              </p>
            </div>

            <div class="next-steps">
              <h2>📋 Próximos Passos</h2>
              <ul>
                <li>Nossa equipe entrará em contato em até 24 horas</li>
                <li>Enviaremos o contrato para assinatura</li>
                <li>Alinharemos todos os detalhes do evento</li>
                <li>Iniciaremos os preparativos para seu evento</li>
              </ul>
            </div>

            <div class="contact">
              <h3>📞 Contato</h3>
              <p>🌐 Site: <a href="https://www.hrxeventos.com.br">www.hrxeventos.com.br</a></p>
              <p>📧 Email: <a href="mailto:atendimento@hrxeventos.com.br">atendimento@hrxeventos.com.br</a></p>
              <p>📱 WhatsApp: <a href="https://wa.me/5521999952457">(21) 99995-2457</a></p>
            </div>

            <div class="footer">
              <p>Você receberá um email de confirmação em breve.</p>
              <p style="margin-top: 8px;">© 2025 HRX Eventos - Plataforma de Profissionais para Eventos</p>
            </div>
          </div>
        </body>
      </html>
      `,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: unknown) {
    logger.error('Erro ao processar aceitação de proposta', { error: error instanceof Error ? error.message : String(error) });
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
            <p>Ocorreu um erro ao processar sua aceitação.</p>
            <p>Por favor, entre em contato conosco para confirmar sua aceitação.</p>
          </div>
        </body>
      </html>
      `,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
