/**
 * =====================================================
 * API: Assinar Contrato Digitalmente
 * =====================================================
 * Valida token JWT e registra assinatura digital
 * com hash SHA-256 para garantir integridade
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);

    if (!rateLimitResult.success) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><title>Muitas Tentativas</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>⏱️ Muitas tentativas</h1>
            <p>Por favor, aguarde alguns minutos antes de tentar novamente.</p>
          </body>
        </html>`,
        {
          status: 429,
          headers: {
            'Content-Type': 'text/html',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const { id: contractId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return createErrorPage('Link Inválido', 'Token de assinatura não fornecido');
    }

    // 1. Validar JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return createErrorPage('Link Expirado', 'Este link de assinatura expirou. Solicite um novo contrato.');
      }
      return createErrorPage('Link Inválido', 'Token de assinatura inválido');
    }

    // 2. Buscar contrato
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        project:event_projects(
          id,
          project_number,
          client_name,
          client_email,
          event_name,
          event_date,
          total_client_price
        )
      `)
      .eq('id', contractId)
      .eq('signature_token', token)
      .maybeSingle();

    if (contractError || !contract) {
      return createErrorPage('Contrato Não Encontrado', 'Não foi possível localizar este contrato');
    }

    // 3. Verificar se já foi assinado
    if (contract.status === 'signed') {
      return createSuccessPage(contract, true);
    }

    // 4. Verificar se token expirou
    if (contract.token_expires_at && new Date(contract.token_expires_at) < new Date()) {
      return createErrorPage('Link Expirado', 'Este link de assinatura expirou. Solicite um novo contrato.');
    }

    // Mostrar página de confirmação de assinatura
    return createSignaturePage(contract, token);
  } catch (error: any) {
    console.error('Erro ao processar assinatura:', error);
    return createErrorPage('Erro', 'Ocorreu um erro ao processar sua solicitação');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const { id: contractId } = await params;
    const body = await request.json();
    const { token, fullName } = body;

    if (!token || !fullName) {
      return NextResponse.json({ error: 'Token e nome completo são obrigatórios' }, { status: 400 });
    }

    // 1. Validar JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // 2. Buscar contrato
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('signature_token', token)
      .maybeSingle();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    // 3. Verificar se já foi assinado
    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contrato já foi assinado' }, { status: 400 });
    }

    // 4. Obter IP do cliente
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // 5. Gerar hash SHA-256 da assinatura
    const signatureData = {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      signedBy: fullName,
      signedByEmail: decoded.clientEmail,
      signedAt: new Date().toISOString(),
      ip: clientIp,
      contractData: contract.contract_data,
    };

    const signatureHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureData))
      .digest('hex');

    // 6. Registrar assinatura
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_name: fullName,
        signed_by_email: decoded.clientEmail,
        signed_by_ip: clientIp,
        signature_hash: signatureHash,
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Erro ao registrar assinatura:', updateError);
      return NextResponse.json({ error: 'Erro ao registrar assinatura' }, { status: 500 });
    }

    // 7. Atualizar status do projeto para "in_execution"
    await supabase
      .from('event_projects')
      .update({
        status: 'in_execution',
      })
      .eq('id', contract.project_id);

    // 8. Log de auditoria
    await supabase.from('contract_audit_log').insert({
      contract_id: contractId,
      action: 'signed',
      performed_by: decoded.clientEmail,
      ip_address: clientIp,
      metadata: {
        signedByName: fullName,
        signatureHash: signatureHash,
      },
    });

    // 9. Disparar geração automática da OS com IA
    Promise.resolve().then(async () => {
      try {
        const { generateServiceOrder } = await import('@/lib/services/service-order-generation');
        const { logger } = await import('@/lib/logger');

        logger.info('Iniciando geração automática de OS após assinatura', {
          contractId,
          projectId: contract.project_id,
        });

        const osResult = await generateServiceOrder({
          contractId: contractId,
          projectId: contract.project_id,
        });

        if (osResult.success && osResult.serviceOrder?.id) {
          logger.info('OS gerada automaticamente com sucesso', {
            osId: osResult.serviceOrder.id,
            osNumber: osResult.serviceOrder.osNumber,
          });

          // Enviar emails para profissionais e fornecedores
          const { sendServiceOrderEmails } = await import('@/lib/services/service-order-email');

          const emailResult = await sendServiceOrderEmails({
            serviceOrderId: osResult.serviceOrder.id,
          });

          if (emailResult.success) {
            logger.info('Emails de OS enviados com sucesso', {
              profissionais: emailResult.emailsSent.professionals,
              fornecedores: emailResult.emailsSent.suppliers,
            });
          } else {
            logger.error('Erro ao enviar emails de OS', {
              message: emailResult.message,
              errors: emailResult.errors,
            });
          }
        } else {
          logger.error('Erro ao gerar OS automaticamente', {
            error: osResult.message,
          });
        }
      } catch (error: any) {
        const { logger } = await import('@/lib/logger');
        logger.error('Exceção ao gerar OS automaticamente', error);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Contrato assinado com sucesso',
      signatureHash,
    });
  } catch (error: any) {
    console.error('Erro ao assinar contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =====================================================
// Funções auxiliares para gerar páginas HTML
// =====================================================

function createErrorPage(title: string, message: string) {
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - HRX Eventos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            background: #27272a;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid #3f3f46;
            text-align: center;
          }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #ef4444; margin-bottom: 15px; font-size: 24px; }
          p { color: #a1a1aa; line-height: 1.6; }
          .button {
            margin-top: 30px;
            padding: 12px 24px;
            background: #DC2626;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="https://www.hrxeventos.com.br" class="button">Voltar ao Site</a>
        </div>
      </body>
    </html>`,
    { status: 400, headers: { 'Content-Type': 'text/html' } }
  );
}

function createSignaturePage(contract: any, token: string) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Extrair dados do contrato
  const contractData = contract.contract_data || {};
  const teamMembers = contractData.teamMembers || [];
  const equipment = contractData.equipment || [];
  const totalTeam = contractData.totalTeam || 0;
  const totalEquipment = contractData.totalEquipment || 0;

  // Gerar tabela de equipe HTML
  const teamTable = teamMembers.length > 0 ? `
    <div class="section">
      <h3 style="color: #93c5fd; margin-bottom: 15px;">👥 Equipe Contratada</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          ${teamMembers.map((member: any) => `
            <tr>
              <td>${member.category}</td>
              <td>${member.quantity} profissional(is)</td>
              <td>${member.durationDays} dia(s)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // Gerar tabela de equipamentos HTML
  const equipmentTable = equipment.length > 0 ? `
    <div class="section">
      <h3 style="color: #93c5fd; margin-bottom: 15px;">🎛️ Equipamentos Contratados</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Quantidade</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          ${equipment.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity} unidade(s)</td>
              <td>${item.durationDays} dia(s)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assinar Contrato - HRX Eventos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
            min-height: 100vh;
            padding: 20px;
            color: #e5e7eb;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #27272a;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid #3f3f46;
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
          h1 { color: #f5f5f5; margin-bottom: 10px; font-size: 28px; }
          .subtitle { color: #a1a1aa; margin-bottom: 30px; font-size: 15px; }
          .info-box {
            background: #18181b;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #3f3f46;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #3f3f46;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #a1a1aa; font-size: 14px; }
          .info-value { color: #f5f5f5; font-weight: 600; }
          .section {
            margin: 25px 0;
            padding: 20px;
            background: #18181b;
            border-radius: 8px;
            border: 1px solid #3f3f46;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .data-table th {
            background: #09090b;
            color: #a1a1aa;
            padding: 12px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            border-bottom: 2px solid #3f3f46;
          }
          .data-table td {
            padding: 12px;
            border-bottom: 1px solid #27272a;
            color: #d4d4d8;
          }
          .data-table tbody tr:hover {
            background: #0a0a0b;
          }
          .data-table tfoot td {
            padding: 15px 12px;
            border-top: 2px solid #3f3f46;
            border-bottom: none;
            font-size: 16px;
          }
          .total-box {
            background: linear-gradient(135deg, #065f46 0%, #047857 100%);
            padding: 20px 25px;
            border-radius: 8px;
            margin: 25px 0;
            border: 2px solid #10b981;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            color: #d1fae5;
            font-size: 18px;
            font-weight: 600;
          }
          .total-value {
            color: #ffffff;
            font-size: 32px;
            font-weight: 700;
          }
          .signature-form {
            background: #1e3a8a;
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
            border: 2px solid #3b82f6;
          }
          .form-group { margin-bottom: 20px; }
          label {
            display: block;
            color: #93c5fd;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 15px;
          }
          input {
            width: 100%;
            padding: 14px;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            background: #1e293b;
            color: #f5f5f5;
            font-size: 16px;
          }
          input:focus {
            outline: none;
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .button {
            width: 100%;
            padding: 18px;
            background: #DC2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          .button:hover {
            background: #B91C1C;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
          }
          .button:disabled {
            background: #71717a;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          .terms {
            margin-top: 25px;
            padding: 20px;
            background: #18181b;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            color: #a1a1aa;
            font-size: 13px;
            line-height: 1.8;
          }
          .success-message {
            display: none;
            text-align: center;
            padding: 60px 40px;
          }
          .success-icon { font-size: 96px; margin-bottom: 25px; animation: bounce 0.6s; }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
          @media (max-width: 768px) {
            .container { padding: 25px; }
            .data-table { font-size: 13px; }
            .data-table th, .data-table td { padding: 8px; }
            .total-value { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">HRX Eventos</div>

          <div id="signatureForm">
            <h1>📋 Contrato de Prestação de Serviços</h1>
            <p class="subtitle">Revise todos os detalhes antes de assinar digitalmente</p>

            <!-- Informações Básicas -->
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">📄 Número do Contrato:</span>
                <span class="info-value">${contract.contract_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📁 Projeto:</span>
                <span class="info-value">${contract.project.project_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👤 Cliente:</span>
                <span class="info-value">${contract.project.client_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🎉 Evento:</span>
                <span class="info-value">${contract.project.event_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📅 Data do Evento:</span>
                <span class="info-value">${formatDate(contract.project.event_date)}</span>
              </div>
            </div>

            <!-- Tabela de Equipe -->
            ${teamTable}

            <!-- Tabela de Equipamentos -->
            ${equipmentTable}

            <!-- Valor Total -->
            <div class="total-box">
              <span class="total-label">💰 Valor Total do Contrato:</span>
              <span class="total-value">${formatCurrency(contract.total_value)}</span>
            </div>

            <!-- Condições de Pagamento -->
            <div class="section">
              <h3 style="color: #93c5fd; margin-bottom: 12px;">💳 Condições de Pagamento</h3>
              <p style="color: #d4d4d8; line-height: 1.6;">${contractData.paymentTerms || '50% antecipado, 50% após o evento'}</p>
            </div>

            ${contractData.specialClauses ? `
            <!-- Observações -->
            <div class="section">
              <h3 style="color: #93c5fd; margin-bottom: 12px;">📝 Observações Especiais</h3>
              <p style="color: #d4d4d8; line-height: 1.6; white-space: pre-wrap;">${contractData.specialClauses}</p>
            </div>
            ` : ''}

            <!-- Formulário de Assinatura -->
            <div class="signature-form">
              <h2 style="color: #dbeafe; margin-bottom: 8px; font-size: 22px;">✍️ Assinatura Digital</h2>
              <p style="color: #93c5fd; margin-bottom: 25px; font-size: 14px;">
                Ao assinar, você confirma que leu e concorda com todos os termos acima
              </p>

              <form id="signForm" onsubmit="signContract(event)">
                <div class="form-group">
                  <label for="fullName">Nome Completo *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    placeholder="Digite seu nome completo para assinatura"
                  />
                </div>

                <button type="submit" class="button" id="submitBtn">
                  ✍️ ASSINAR CONTRATO DIGITALMENTE
                </button>
              </form>
            </div>

            <div class="terms">
              <strong style="color: #f5f5f5; font-size: 14px;">⚠️ IMPORTANTE - Ao assinar digitalmente você concorda que:</strong><br><br>
              ✓ Leu e compreendeu todos os termos e condições deste contrato<br>
              ✓ A assinatura digital tem <strong>validade jurídica equivalente à assinatura física</strong><br>
              ✓ Um hash criptográfico SHA-256 será gerado para garantir a integridade do documento<br>
              ✓ O projeto será automaticamente movido para status <strong>"Em Execução"</strong><br>
              ✓ Nossa equipe iniciará imediatamente os preparativos para o seu evento<br>
              ✓ Os dados de data, hora, IP e dispositivo serão registrados para auditoria
            </div>
          </div>

          <div id="successMessage" class="success-message">
            <div class="success-icon">✅</div>
            <h1 style="color: #4ade80; font-size: 36px; margin-bottom: 15px;">Contrato Assinado com Sucesso!</h1>
            <p class="subtitle" style="font-size: 16px; color: #d4d4d8; line-height: 1.8;">
              Seu contrato <strong>${contract.contract_number}</strong> foi assinado digitalmente e registrado com segurança.<br><br>
              Nossa equipe receberá a notificação e entrará em contato em breve para iniciar os preparativos do seu evento.<br><br>
              <strong style="color: #4ade80;">Obrigado por confiar na HRX Eventos!</strong>
            </p>
          </div>
        </div>

        <script>
          async function signContract(event) {
            event.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const fullName = document.getElementById('fullName').value.trim();

            if (!fullName || fullName.length < 3) {
              alert('Por favor, digite seu nome completo.');
              return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ PROCESSANDO ASSINATURA...';

            try {
              const response = await fetch('/api/contracts/${contract.id}/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: '${token}',
                  fullName: fullName
                })
              });

              const data = await response.json();

              if (response.ok) {
                document.getElementById('signatureForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                alert('❌ Erro ao assinar: ' + (data.error || 'Erro desconhecido. Tente novamente.'));
                submitBtn.disabled = false;
                submitBtn.innerHTML = '✍️ ASSINAR CONTRATO DIGITALMENTE';
              }
            } catch (error) {
              alert('❌ Erro de conexão. Verifique sua internet e tente novamente.');
              submitBtn.disabled = false;
              submitBtn.innerHTML = '✍️ ASSINAR CONTRATO DIGITALMENTE';
            }
          }
        </script>
      </body>
    </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

function createSuccessPage(contract: any, alreadySigned: boolean) {
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato Assinado - HRX Eventos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            background: #27272a;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid #3f3f46;
            text-align: center;
          }
          .icon { font-size: 80px; margin-bottom: 20px; }
          h1 { color: #4ade80; margin-bottom: 15px; }
          p { color: #a1a1aa; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>${alreadySigned ? 'Contrato Já Assinado' : 'Contrato Assinado!'}</h1>
          <p>
            ${alreadySigned
              ? 'Este contrato já foi assinado anteriormente.'
              : 'Seu contrato foi assinado digitalmente com sucesso.'}
          </p>
          <p style="margin-top: 20px;">
            Nossa equipe entrará em contato em breve para alinhar os preparativos do evento.
          </p>
        </div>
      </body>
    </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
