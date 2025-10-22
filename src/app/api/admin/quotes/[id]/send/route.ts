import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { sendQuoteRequestEmail } from '@/lib/resend/emails';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendQuoteRequestBody {
  supplier_ids: string[]; // IDs dos fornecedores
  deadline: string; // Data limite para resposta (ISO string)
}

// =============================================
// POST /api/admin/quotes/[id]/send - Disparar emails para fornecedores
// =============================================
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const quoteId = params.id;
    const body: SendQuoteRequestBody = await req.json();

    // Validações
    if (!body.supplier_ids || body.supplier_ids.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um fornecedor deve ser selecionado' },
        { status: 400 }
      );
    }

    if (!body.deadline) {
      return NextResponse.json(
        { error: 'Prazo de resposta é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar orçamento com itens
    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Buscar itens
    const { data: items, error: itemsError } = await supabase
      .from('quote_request_items')
      .select('*')
      .eq('quote_request_id', quoteId);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum item encontrado para este orçamento' },
        { status: 400 }
      );
    }

    // Buscar fornecedores
    const { data: suppliers, error: suppliersError } = await supabase
      .from('equipment_suppliers')
      .select('id, company_name, contact_name, email, phone')
      .in('id', body.supplier_ids);

    if (suppliersError || !suppliers || suppliers.length === 0) {
      return NextResponse.json(
        { error: 'Fornecedores não encontrados' },
        { status: 404 }
      );
    }

    // Preparar itens para email
    const emailItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      duration_days: item.duration_days,
      description: item.description,
    }));

    // Formatar deadline para exibição
    const deadlineDate = new Date(body.deadline);
    const deadlineFormatted = deadlineDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Disparar emails e criar registros de cotação
    const results = [];
    const emailRecords = [];

    for (const supplier of suppliers) {
      try {
        // Criar registro de cotação pendente
        const { data: supplierQuote, error: quoteInsertError } = await supabase
          .from('supplier_quotes')
          .insert([
            {
              quote_request_id: quoteId,
              supplier_id: supplier.id,
              supplier_price: 0, // Será preenchido pelo fornecedor
              hrx_price: 0,
              profit_margin_applied: quote.profit_margin,
              profit_amount: 0,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (quoteInsertError) {
          console.error(`Erro ao criar cotação para ${supplier.company_name}:`, quoteInsertError);
          results.push({
            supplier: supplier.company_name,
            success: false,
            error: quoteInsertError.message,
          });
          continue;
        }

        // Enviar email
        const emailResult = await sendQuoteRequestEmail({
          supplierName: supplier.contact_name || supplier.company_name,
          supplierEmail: supplier.email,
          quoteRequestId: quoteId,
          clientName: quote.client_name,
          eventDate: quote.event_date,
          eventType: quote.event_type,
          eventLocation: quote.event_location,
          items: emailItems,
          deadline: deadlineFormatted,
        });

        // Registrar envio do email
        emailRecords.push({
          quote_request_id: quoteId,
          supplier_quote_id: supplierQuote.id,
          recipient_email: supplier.email,
          recipient_name: supplier.company_name,
          email_type: 'quote_request',
          status: emailResult.success ? 'sent' : 'failed',
          resend_id: emailResult.emailId,
          error_message: emailResult.error,
          sent_at: emailResult.success ? new Date().toISOString() : null,
        });

        // Atualizar status da cotação
        if (emailResult.success) {
          await supabase
            .from('supplier_quotes')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', supplierQuote.id);
        }

        results.push({
          supplier: supplier.company_name,
          success: emailResult.success,
          emailId: emailResult.emailId,
          error: emailResult.error,
        });
      } catch (error) {
        console.error(`Erro ao processar fornecedor ${supplier.company_name}:`, error);
        results.push({
          supplier: supplier.company_name,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    // Salvar registros de emails
    if (emailRecords.length > 0) {
      await supabase.from('quote_emails').insert(emailRecords);
    }

    // Atualizar status do orçamento para 'sent'
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      await supabase
        .from('quote_requests')
        .update({ status: 'sent' })
        .eq('id', quoteId);
    }

    return NextResponse.json({
      success: true,
      totalSent: successCount,
      totalFailed: results.length - successCount,
      results,
    });
  } catch (error) {
    console.error('Erro ao enviar solicitações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
