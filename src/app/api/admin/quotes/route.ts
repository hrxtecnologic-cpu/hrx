import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import {
  CreateQuoteRequestData,
  QuoteRequest,
  QuoteRequestSummary,
  getProfitMargin
} from '@/types/quote';
import { sendUrgentQuoteAdminEmail } from '@/lib/resend/emails';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// GET /api/admin/quotes - Listar orçamentos
// =============================================
export async function GET(req: Request) {
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

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // draft, sent, analyzing, finalized, cancelled
    const isUrgent = searchParams.get('is_urgent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query
    let query = supabase
      .from('quote_requests_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (isUrgent) {
      query = query.eq('is_urgent', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      quotes: data as QuoteRequestSummary[],
      total: data?.length || 0,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// POST /api/admin/quotes - Criar novo orçamento
// =============================================
export async function POST(req: Request) {
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

    const body: CreateQuoteRequestData = await req.json();

    // Validações básicas
    if (!body.client_name) {
      return NextResponse.json(
        { error: 'Nome do cliente é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um item é necessário' },
        { status: 400 }
      );
    }

    // Calcular margem de lucro baseado na urgência
    const profitMargin = getProfitMargin(body.is_urgent);

    // Criar solicitação de orçamento
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .insert([
        {
          client_name: body.client_name,
          client_email: body.client_email,
          client_phone: body.client_phone,
          event_date: body.event_date,
          event_type: body.event_type,
          event_location: body.event_location,
          description: body.description,
          is_urgent: body.is_urgent,
          profit_margin: profitMargin, // Será calculado automaticamente pelo trigger
          status: 'draft',
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (quoteError) {
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Criar itens do orçamento
    const itemsToInsert = body.items.map((item) => ({
      quote_request_id: quoteRequest.id,
      item_type: item.item_type,
      category: item.category,
      subcategory: item.subcategory,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      duration_days: item.duration_days,
      specifications: item.specifications || {},
      status: 'pending',
    }));

    const { data: items, error: itemsError } = await supabase
      .from('quote_request_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      // Rollback: deletar orçamento
      await supabase.from('quote_requests').delete().eq('id', quoteRequest.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Se for URGENTE, enviar email imediato para admin
    if (body.is_urgent) {

      await sendUrgentQuoteAdminEmail({
        quoteRequestId: quoteRequest.id,
        clientName: body.client_name,
        eventDate: body.event_date,
        eventType: body.event_type,
        eventLocation: body.event_location,
        totalItems: items.length,
        description: body.description,
        profitMargin: profitMargin,
      });
    }

    return NextResponse.json({
      success: true,
      quote: {
        ...quoteRequest,
        items,
      } as QuoteRequest & { items: any[] },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
