import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// POST /api/suppliers/quotations/[id]/respond - Fornecedor responde cotação (PUBLIC)
// =============================================
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotationId = params.id;

    // Rate limiting por IP (endpoint público)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_FORM);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validações
    if (!body.supplier_price || body.supplier_price <= 0) {
      return NextResponse.json(
        { error: 'Preço é obrigatório e deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Buscar cotação
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        project:event_projects!inner(
          id,
          project_number,
          profit_margin,
          status
        )
      `)
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Cotação não encontrada ou inválida' },
        { status: 404 }
      );
    }

    // Verificar se cotação pode receber resposta
    const allowedStatuses = ['pending', 'sent'];
    if (!allowedStatuses.includes(quotation.status)) {
      return NextResponse.json(
        {
          error: `Esta cotação não pode mais receber respostas (status: ${quotation.status})`,
        },
        { status: 400 }
      );
    }

    // Verificar deadline
    if (quotation.deadline) {
      const deadline = new Date(quotation.deadline);
      const now = new Date();

      if (now > deadline) {
        return NextResponse.json(
          { error: 'O prazo para responder esta cotação já expirou' },
          { status: 400 }
        );
      }
    }

    // Calcular preço HRX com margem de lucro
    const supplierPrice = parseFloat(body.supplier_price);
    const profitMarginPercent = quotation.project.profit_margin; // 35 ou 80
    const profitAmount = supplierPrice * (profitMarginPercent / 100);
    const hrxPrice = supplierPrice + profitAmount;

    // Atualizar cotação
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('supplier_quotations')
      .update({
        supplier_price: supplierPrice,
        hrx_price: hrxPrice,
        profit_margin_applied: profitMarginPercent,
        profit_amount: profitAmount,
        status: 'received',
        responded_at: new Date().toISOString(),
        supplier_notes: body.notes,
        delivery_time: body.delivery_time,
        payment_terms: body.payment_terms,
      })
      .eq('id', quotationId)
      .select()
      .single();

    if (updateError) {
      logger.error('Erro ao processar resposta de cotação', {
        error: updateError.message,
        quotationId,
        ip,
      });
      return NextResponse.json(
        { error: 'Erro ao processar resposta' },
        { status: 500 }
      );
    }

    logger.info('Cotação respondida por fornecedor', {
      quotationId,
      projectId: quotation.project_id,
      supplierId: quotation.supplier_id,
      supplierPrice,
      hrxPrice,
      profitMargin: profitMarginPercent,
      ip,
    });

    // TODO: Enviar email de notificação para admin sobre nova cotação recebida

    return NextResponse.json({
      success: true,
      message: 'Cotação enviada com sucesso! A HRX entrará em contato em breve.',
      quotation: {
        id: updatedQuotation.id,
        supplier_price: updatedQuotation.supplier_price,
        received_at: updatedQuotation.responded_at,
      },
    });
  } catch (error: any) {
    logger.error('Erro ao processar resposta de cotação', {
      error: error.message,
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// GET /api/suppliers/quotations/[id]/respond - Visualizar detalhes da cotação (PUBLIC)
// =============================================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotationId = params.id;

    // Rate limiting por IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    // Buscar cotação com detalhes do projeto e equipamento
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select(`
        id,
        status,
        deadline,
        created_at,
        supplier_price,
        responded_at,
        project:event_projects!inner(
          project_number,
          client_name,
          event_name,
          event_date,
          venue_city,
          venue_state
        ),
        equipment:project_equipment!inner(
          name,
          category,
          subcategory,
          description,
          quantity,
          duration_days,
          specifications
        )
      `)
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se ainda pode responder
    const canRespond = ['pending', 'sent'].includes(quotation.status);
    const isExpired = quotation.deadline && new Date(quotation.deadline) < new Date();

    return NextResponse.json({
      quotation: {
        id: quotation.id,
        status: quotation.status,
        deadline: quotation.deadline,
        canRespond: canRespond && !isExpired,
        isExpired: isExpired,
        alreadyResponded: !!quotation.supplier_price,
        project: quotation.project,
        equipment: quotation.equipment,
      },
    });
  } catch (error: any) {
    logger.error('Erro ao buscar cotação', { error: error.message });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
