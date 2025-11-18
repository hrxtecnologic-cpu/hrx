import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, createRateLimitError } from '@/lib/rate-limit';
import { sendQuoteResponseAdminNotification } from '@/lib/resend/emails';
import { logger } from '@/lib/logger';

/**
 * GET /api/public/quotations/[token]
 *
 * Busca dados da solicitação de orçamento (público)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting por IP (rota pública)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimit(ip, {
      interval: 60000, // 1 minuto
      maxRequests: 20, // 20 requests por minuto
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const { token } = await params;
    const supabase = await createClient();

    const { data: quotation, error } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        project:event_projects(
          project_number,
          event_name,
          event_date,
          start_time,
          end_time,
          venue_name,
          venue_address,
          venue_city,
          venue_state
        ),
        supplier:equipment_suppliers(
          company_name,
          contact_name
        )
      `)
      .eq('token', token)
      .single();

    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se expirou
    if (quotation.valid_until && new Date(quotation.valid_until) < new Date()) {
      return NextResponse.json(
        { error: 'Esta solicitação de orçamento expirou' },
        { status: 410 }
      );
    }

    // Verificar se já foi respondida
    if (quotation.status === 'submitted') {
      return NextResponse.json(
        {
          error: 'Orçamento já foi enviado',
          quotation: {
            status: quotation.status,
            submitted_at: quotation.submitted_at,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      quotation,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/public/quotations/[token]
 *
 * Fornecedor envia orçamento (público)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting por IP (rota pública) - mais restritivo para POST
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimit(ip, {
      interval: 60000, // 1 minuto
      maxRequests: 5, // 5 submissions por minuto (proteção contra spam)
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const { token } = await params;
    const body = await req.json();

    const {
      total_price,
      daily_rate,
      delivery_fee = 0,
      setup_fee = 0,
      payment_terms,
      delivery_details,
      notes,
    } = body;

    if (!total_price || total_price <= 0) {
      return NextResponse.json(
        { error: 'Preço total é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar quotation com dados do projeto e fornecedor
    const { data: quotation, error: findError } = await supabase
      .from('supplier_quotations')
      .select(`
        id,
        status,
        valid_until,
        project:event_projects(
          id,
          project_number,
          event_name
        ),
        supplier:equipment_suppliers!supplier_id(
          id,
          company_name,
          contact_name
        ),
        requested_items
      `)
      .eq('token', token)
      .single();

    if (findError || !quotation) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se expirou
    if (quotation.valid_until && new Date(quotation.valid_until) < new Date()) {
      return NextResponse.json(
        { error: 'Esta solicitação de orçamento expirou' },
        { status: 410 }
      );
    }

    // Verificar se já foi respondida
    if (quotation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Orçamento já foi enviado anteriormente' },
        { status: 400 }
      );
    }

    // Atualizar orçamento
    const { data: updated, error: updateError } = await supabase
      .from('supplier_quotations')
      .update({
        total_price,
        daily_rate,
        delivery_fee,
        setup_fee,
        payment_terms,
        delivery_details,
        notes,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', quotation.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao salvar orçamento' },
        { status: 500 }
      );
    }

    // Enviar notificação para admin sobre nova cotação recebida
    try {
      const equipmentName = quotation.requested_items?.[0]?.name || 'Equipamento';
      const quotationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/projetos/${quotation.project?.id}?tab=quotations`;

      const emailResult = await sendQuoteResponseAdminNotification({
        projectNumber: quotation.project?.project_number || 'N/A',
        projectName: quotation.project?.event_name || 'Projeto',
        supplierName: quotation.supplier?.company_name || 'Fornecedor',
        equipmentName: equipmentName,
        totalPrice: total_price,
        dailyRate: daily_rate,
        deliveryFee: delivery_fee,
        setupFee: setup_fee,
        paymentTerms: payment_terms,
        quotationUrl: quotationUrl,
      });

      if (emailResult.success) {
        logger.info('Email de notificação enviado para admin', {
          emailId: emailResult.emailId,
          quotationId: updated.id,
          projectNumber: quotation.project?.project_number,
        });
      } else {
        logger.error('Erro ao enviar email de notificação para admin', undefined, {
          error: emailResult.error,
          quotationId: updated.id,
        });
      }
    } catch (emailError) {
      // Não falha a requisição se email falhar
      logger.error('Exceção ao enviar email de notificação', emailError instanceof Error ? emailError : undefined, {
        quotationId: updated.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Orçamento enviado com sucesso!',
      quotation: updated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
