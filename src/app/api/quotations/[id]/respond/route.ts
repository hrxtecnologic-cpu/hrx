import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// GET /api/quotations/[id]/respond
// Página pública para fornecedor responder cotação
// =============================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quotationId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Validar token (email do fornecedor)
    if (!token) {
      return new NextResponse(
        generateErrorPage('Link Inválido', 'Este link de cotação é inválido ou expirou.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Buscar cotação
    const { data: quotation, error } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        project:event_projects(
          id,
          project_number,
          client_name,
          event_name,
          event_date,
          venue_city,
          venue_state
        ),
        equipment:project_equipment(
          id,
          name,
          category,
          quantity,
          duration_days,
          description,
          specifications
        ),
        supplier:equipment_suppliers(
          id,
          company_name,
          contact_name,
          email
        )
      `)
      .eq('id', quotationId)
      .single();

    if (error || !quotation) {
      logger.error('Cotação não encontrada', { quotationId, token });
      return new NextResponse(
        generateErrorPage('Cotação Não Encontrada', 'Não foi possível encontrar esta cotação.'),
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Validar email do fornecedor
    if (quotation.supplier.email !== token) {
      logger.error('Token inválido para cotação', { quotationId, token });
      return new NextResponse(
        generateErrorPage('Acesso Negado', 'Você não tem permissão para acessar esta cotação.'),
        { status: 403, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Verificar se já foi respondida
    if (quotation.status === 'received' || quotation.status === 'accepted') {
      return new NextResponse(
        generateAlreadyRespondedPage(quotation),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Verificar se expirou
    const deadline = new Date(quotation.deadline);
    const now = new Date();
    const isExpired = now > deadline;

    // Página de formulário
    return new NextResponse(
      generateQuoteFormPage(quotation, isExpired),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    logger.error('Erro ao processar formulário de cotação', { error: error.message });
    return new NextResponse(
      generateErrorPage('Erro', 'Ocorreu um erro ao carregar o formulário.'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// =============================================
// POST /api/quotations/[id]/respond
// Salvar resposta do fornecedor
// =============================================
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quotationId } = await params;
    const body = await req.json();

    // Validações
    if (!body.token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
    }

    if (!body.total_price || body.total_price <= 0) {
      return NextResponse.json({ error: 'Preço total é obrigatório' }, { status: 400 });
    }

    // Buscar cotação
    const { data: quotation, error: fetchError } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        supplier:equipment_suppliers(email, company_name),
        project:event_projects(profit_margin, is_urgent)
      `)
      .eq('id', quotationId)
      .single();

    if (fetchError || !quotation) {
      return NextResponse.json({ error: 'Cotação não encontrada' }, { status: 404 });
    }

    // Validar token
    if (quotation.supplier.email !== body.token) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se já foi respondida
    if (quotation.status === 'submitted' || quotation.status === 'accepted') {
      return NextResponse.json({ error: 'Cotação já foi respondida' }, { status: 400 });
    }

    // Atualizar cotação com campos que existem no banco
    const { error: updateError } = await supabase
      .from('supplier_quotations')
      .update({
        total_price: parseFloat(body.total_price),
        daily_rate: body.daily_rate ? parseFloat(body.daily_rate) : null,
        delivery_fee: body.delivery_fee ? parseFloat(body.delivery_fee) : 0,
        setup_fee: body.setup_fee ? parseFloat(body.setup_fee) : 0,
        payment_terms: body.payment_terms || null,
        delivery_details: body.delivery_details || null,
        notes: body.notes || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      })
      .eq('id', quotationId);

    if (updateError) {
      logger.error('Erro ao atualizar cotação', {
        quotationId,
        error: updateError.message,
      });
      return NextResponse.json(
        { error: 'Erro ao salvar cotação' },
        { status: 500 }
      );
    }

    logger.info('Cotação respondida pelo fornecedor', {
      quotationId,
      supplier: quotation.supplier.company_name,
      totalPrice: body.total_price,
    });

    return NextResponse.json({
      success: true,
      message: 'Cotação enviada com sucesso!',
      totalPrice: body.total_price,
    });
  } catch (error: any) {
    logger.error('Erro ao processar resposta de cotação', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// Funções auxiliares para gerar HTML
// =============================================

function generateErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - HRX Eventos</title>
        ${getStyles()}
      </head>
      <body>
        <div class="container">
          <div class="logo">HRX Eventos</div>
          <div class="icon">❌</div>
          <h1>${title}</h1>
          <p class="subtitle">${message}</p>
          <div class="contact">
            <h3>📞 Entre em Contato</h3>
            <p>📧 Email: <a href="mailto:contato@hrxeventos.com.br">contato@hrxeventos.com.br</a></p>
            <p>📱 WhatsApp: <a href="https://wa.me/5521999999999">(21) 99999-9999</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateAlreadyRespondedPage(quotation: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cotação Já Respondida - HRX Eventos</title>
        ${getStyles()}
      </head>
      <body>
        <div class="container">
          <div class="logo">HRX Eventos</div>
          <div class="icon">✅</div>
          <h1>Cotação Já Respondida</h1>
          <p class="subtitle">Esta cotação já foi respondida anteriormente.</p>

          <div class="info-box">
            <p><strong>Projeto:</strong> ${quotation.project.project_number}</p>
            <p><strong>Equipamento:</strong> ${quotation.equipment.name}</p>
            <p><strong>Sua resposta:</strong> R$ ${quotation.supplier_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
          </div>

          <div class="contact">
            <p>Se precisar alterar sua cotação, entre em contato conosco.</p>
            <p style="margin-top: 15px;">
              📧 Email: <a href="mailto:contato@hrxeventos.com.br">contato@hrxeventos.com.br</a><br>
              📱 WhatsApp: <a href="https://wa.me/5521999999999">(21) 99999-9999</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateQuoteFormPage(quotation: any, isExpired: boolean): string {
  const deadline = new Date(quotation.deadline);
  const deadlineFormatted = deadline.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Responder Cotação - HRX Eventos</title>
        ${getStyles()}
        <script>
          async function submitQuote(event) {
            event.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const form = event.target;

            submitBtn.disabled = true;
            loading.style.display = 'inline-block';

            const formData = {
              token: '${quotation.supplier.email}',
              total_price: parseFloat(form.total_price.value),
              daily_rate: form.daily_rate?.value ? parseFloat(form.daily_rate.value) : null,
              delivery_fee: form.delivery_fee?.value ? parseFloat(form.delivery_fee.value) : null,
              setup_fee: form.setup_fee?.value ? parseFloat(form.setup_fee.value) : null,
              payment_terms: form.payment_terms?.value || null,
              delivery_details: form.delivery_details?.value || null,
              notes: form.notes.value || null,
            };

            try {
              const response = await fetch('/api/quotations/${quotation.id}/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Erro ao enviar cotação');
              }

              // Sucesso - mostrar página de confirmação
              document.body.innerHTML = \`
                <div class="container">
                  <div class="logo">HRX Eventos</div>
                  <div class="icon">✅</div>
                  <h1>Cotação Enviada com Sucesso!</h1>
                  <p class="subtitle">Obrigado por responder, <strong>${quotation.supplier.contact_name || quotation.supplier.company_name}</strong>!</p>

                  <div class="success-box">
                    <p><strong>Sua Cotação:</strong></p>
                    <p class="price">R$ \${data.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div class="info-box">
                    <p>Nossa equipe analisará sua cotação e entrará em contato em breve.</p>
                  </div>

                  <div class="footer">
                    <p>© 2025 HRX Eventos</p>
                  </div>
                </div>
              \`;
            } catch (error) {
              alert('Erro: ' + error.message);
              submitBtn.disabled = false;
              loading.style.display = 'none';
            }
          }
        </script>
      </head>
      <body>
        <div class="container">
          <div class="logo">HRX Eventos</div>

          <h1>📋 Solicitação de Cotação</h1>
          <p class="subtitle">Olá, <strong>${quotation.supplier.contact_name || quotation.supplier.company_name}</strong>!</p>

          ${isExpired ? `
            <div class="warning-box">
              <strong>⚠️ Prazo Expirado</strong>
              <p>O prazo para responder esta cotação expirou em ${deadlineFormatted}.</p>
              <p>Entre em contato conosco se ainda desejar enviar sua cotação.</p>
            </div>
          ` : ''}

          <div class="info-box">
            <h3>🎯 Dados do Projeto</h3>
            <p><strong>Projeto:</strong> ${quotation.project.project_number}</p>
            <p><strong>Cliente:</strong> ${quotation.project.client_name}</p>
            <p><strong>Evento:</strong> ${quotation.project.event_name}</p>
            <p><strong>Data:</strong> ${new Date(quotation.project.event_date).toLocaleDateString('pt-BR')}</p>
            <p><strong>Local:</strong> ${quotation.project.venue_city} - ${quotation.project.venue_state}</p>
          </div>

          <div class="equipment-box">
            <h3>📦 Equipamento Solicitado</h3>
            <p><strong>Item:</strong> ${quotation.equipment.name}</p>
            <p><strong>Categoria:</strong> ${quotation.equipment.category}</p>
            <p><strong>Quantidade:</strong> ${quotation.equipment.quantity} unidade(s)</p>
            <p><strong>Período:</strong> ${quotation.equipment.duration_days} dia(s)</p>
            ${quotation.equipment.description ? `<p><strong>Descrição:</strong> ${quotation.equipment.description}</p>` : ''}
            ${quotation.equipment.specifications ? `<p><strong>Especificações:</strong> ${JSON.stringify(quotation.equipment.specifications)}</p>` : ''}
          </div>

          <div class="deadline-box">
            <p><strong>⏰ Prazo para Resposta:</strong></p>
            <p class="deadline">${deadlineFormatted}</p>
          </div>

          <form onsubmit="submitQuote(event)" ${isExpired ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
            <h3 style="color: #f5f5f5; margin-bottom: 20px;">💰 Sua Cotação</h3>

            <div class="form-group">
              <label for="total_price">Preço Total (R$) *</label>
              <input
                type="number"
                id="total_price"
                name="total_price"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                ${isExpired ? 'disabled' : ''}
              >
              <small>Valor total do serviço/equipamento</small>
            </div>

            <div class="form-group">
              <label for="daily_rate">Diária (R$)</label>
              <input
                type="number"
                id="daily_rate"
                name="daily_rate"
                step="0.01"
                min="0"
                placeholder="0,00"
                ${isExpired ? 'disabled' : ''}
              >
              <small>Valor por dia (opcional)</small>
            </div>

            <div class="form-group">
              <label for="delivery_fee">Taxa de Entrega (R$)</label>
              <input
                type="number"
                id="delivery_fee"
                name="delivery_fee"
                step="0.01"
                min="0"
                placeholder="0,00"
                ${isExpired ? 'disabled' : ''}
              >
              <small>Custo de entrega (opcional)</small>
            </div>

            <div class="form-group">
              <label for="setup_fee">Taxa de Instalação (R$)</label>
              <input
                type="number"
                id="setup_fee"
                name="setup_fee"
                step="0.01"
                min="0"
                placeholder="0,00"
                ${isExpired ? 'disabled' : ''}
              >
              <small>Custo de instalação/montagem (opcional)</small>
            </div>

            <div class="form-group">
              <label for="payment_terms">Condições de Pagamento</label>
              <textarea
                id="payment_terms"
                name="payment_terms"
                rows="2"
                placeholder="Ex: 50% antecipado, 50% após o evento"
                ${isExpired ? 'disabled' : ''}
              ></textarea>
            </div>

            <div class="form-group">
              <label for="delivery_details">Detalhes de Entrega</label>
              <textarea
                id="delivery_details"
                name="delivery_details"
                rows="2"
                placeholder="Informações sobre entrega e retirada"
                ${isExpired ? 'disabled' : ''}
              ></textarea>
            </div>

            <div class="form-group">
              <label for="notes">Observações</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                placeholder="Informações adicionais sobre sua cotação"
                ${isExpired ? 'disabled' : ''}
              ></textarea>
            </div>

            ${!isExpired ? `
              <button type="submit" id="submitBtn" class="submit-btn">
                <span id="loading" style="display: none;">⏳ </span>
                Enviar Cotação
              </button>
            ` : ''}
          </form>

          <div class="footer">
            <p>Dúvidas? Entre em contato: <a href="mailto:contato@hrxeventos.com.br">contato@hrxeventos.com.br</a></p>
            <p style="margin-top: 8px;">© 2025 HRX Eventos</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getStyles(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
        color: #e5e7eb;
        min-height: 100vh;
        padding: 20px;
      }
      .container {
        max-width: 700px;
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
      .icon { font-size: 64px; text-align: center; margin: 20px 0; }
      h1 { color: #f5f5f5; margin-bottom: 10px; text-align: center; }
      .subtitle { color: #a1a1aa; text-align: center; margin-bottom: 30px; line-height: 1.6; }
      .info-box, .equipment-box, .deadline-box, .warning-box, .success-box {
        background: #18181b;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border: 1px solid #3f3f46;
      }
      .warning-box {
        background: #78350f;
        border: 2px solid #fbbf24;
      }
      .warning-box strong { color: #fde047; }
      .warning-box p { color: #fef3c7; margin-top: 8px; }
      .success-box {
        background: #14532d;
        border: 2px solid #16a34a;
        text-align: center;
      }
      .success-box .price {
        font-size: 36px;
        font-weight: bold;
        color: #4ade80;
        margin: 15px 0;
      }
      .info-box h3, .equipment-box h3 {
        color: #f5f5f5;
        margin-bottom: 15px;
        font-size: 18px;
      }
      .info-box p, .equipment-box p, .deadline-box p {
        color: #d4d4d8;
        margin: 8px 0;
        line-height: 1.6;
      }
      .deadline {
        font-size: 20px;
        font-weight: bold;
        color: #fbbf24;
        margin-top: 8px;
      }
      .form-group {
        margin-bottom: 20px;
      }
      label {
        display: block;
        color: #f5f5f5;
        font-weight: 500;
        margin-bottom: 8px;
      }
      input, textarea {
        width: 100%;
        padding: 12px;
        background: #18181b;
        border: 1px solid #3f3f46;
        border-radius: 6px;
        color: #f5f5f5;
        font-size: 16px;
      }
      input:focus, textarea:focus {
        outline: none;
        border-color: #ef4444;
      }
      small {
        display: block;
        color: #a1a1aa;
        font-size: 13px;
        margin-top: 4px;
      }
      .submit-btn {
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 20px;
      }
      .submit-btn:hover {
        opacity: 0.9;
      }
      .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .contact {
        background: #18181b;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border: 1px solid #3f3f46;
        text-align: center;
      }
      .contact h3 { color: #f5f5f5; margin-bottom: 10px; }
      .contact p { color: #d4d4d8; margin: 5px 0; }
      .contact a { color: #ef4444; text-decoration: none; font-weight: 500; }
      .contact a:hover { color: #dc2626; }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #3f3f46;
        text-align: center;
        color: #71717a;
        font-size: 14px;
      }
      .footer a { color: #ef4444; text-decoration: none; }
    </style>
  `;
}
