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
    if (!body.total_price || body.total_price <= 0) {
      return NextResponse.json(
        { error: 'Preço total é obrigatório e deve ser maior que zero' },
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

    // Verificar valid_until (prazo)
    if (quotation.valid_until) {
      const validUntil = new Date(quotation.valid_until);
      const now = new Date();

      if (now > validUntil) {
        return NextResponse.json(
          { error: 'O prazo para responder esta cotação já expirou' },
          { status: 400 }
        );
      }
    }

    // Atualizar cotação com campos que existem no banco
    const { data: updatedQuotation, error: updateError } = await supabase
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
      totalPrice: updatedQuotation.total_price,
      ip,
    });

    // TODO: Enviar email de notificação para admin sobre nova cotação recebida

    return NextResponse.json({
      success: true,
      message: 'Cotação enviada com sucesso! A HRX entrará em contato em breve.',
      quotation: {
        id: updatedQuotation.id,
        total_price: updatedQuotation.total_price,
        submitted_at: updatedQuotation.submitted_at,
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

    // Buscar cotação com detalhes do projeto
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select(`
        id,
        status,
        valid_until,
        created_at,
        total_price,
        requested_items,
        responded_at,
        project:event_projects!inner(
          project_number,
          client_name,
          event_name,
          event_date,
          venue_city,
          venue_state
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
    const canRespond = ['pending'].includes(quotation.status);
    const isExpired = quotation.valid_until && new Date(quotation.valid_until) < new Date();

    return NextResponse.json({
      quotation: {
        id: quotation.id,
        status: quotation.status,
        valid_until: quotation.valid_until,
        canRespond: canRespond && !isExpired,
        isExpired: isExpired,
        alreadyResponded: !!quotation.total_price,
        requested_items: quotation.requested_items,
        project: quotation.project,
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
