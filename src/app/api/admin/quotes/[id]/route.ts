import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { QuoteRequestWithDetails } from '@/types/quote';

// Force dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// GET /api/admin/quotes/[id] - Detalhes do orçamento
// =============================================
export async function GET(
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

    // Buscar orçamento
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
      .eq('quote_request_id', quoteId)
      .order('created_at', { ascending: true });

    if (itemsError) {
    }

    // Buscar cotações com informações dos fornecedores
    const { data: quotes, error: quotesError } = await supabase
      .from('supplier_quotes')
      .select(`
        *,
        supplier:equipment_suppliers(
          id,
          company_name,
          contact_name,
          email,
          phone
        )
      `)
      .eq('quote_request_id', quoteId)
      .order('created_at', { ascending: false });

    if (quotesError) {
    }

    // Buscar histórico de emails
    const { data: emails, error: emailsError } = await supabase
      .from('quote_emails')
      .select('*')
      .eq('quote_request_id', quoteId)
      .order('created_at', { ascending: false });

    if (emailsError) {
    }

    const result: QuoteRequestWithDetails = {
      ...quote,
      items: items || [],
      quotes: quotes || [],
      emails: emails || [],
    };

    return NextResponse.json({ quote: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH /api/admin/quotes/[id] - Atualizar orçamento
// =============================================
export async function PATCH(
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
    const body = await req.json();

    // Campos permitidos para atualização
    const allowedFields = [
      'client_name',
      'client_email',
      'client_phone',
      'event_date',
      'event_type',
      'event_location',
      'description',
      'is_urgent',
      'status',
      'total_supplier_cost',
      'total_client_price',
      'total_profit',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Se mudou urgência, recalcular margem
    if (updateData.is_urgent !== undefined) {
      updateData.profit_margin = updateData.is_urgent ? 80.00 : 35.00;
    }

    // Se está finalizando, adicionar timestamp
    if (updateData.status === 'finalized') {
      updateData.finalized_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE /api/admin/quotes/[id] - Cancelar orçamento
// =============================================
export async function DELETE(
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

    // Verificar se existe
    const { data: quote, error: checkError } = await supabase
      .from('quote_requests')
      .select('status')
      .eq('id', quoteId)
      .single();

    if (checkError || !quote) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Não deletar, apenas marcar como cancelled
    const { error } = await supabase
      .from('quote_requests')
      .update({ status: 'cancelled' })
      .eq('id', quoteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Orçamento cancelado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
