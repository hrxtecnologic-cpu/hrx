import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  } catch (error: any) {
    console.error('❌ Erro ao buscar solicitação:', error);
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

    // Buscar quotation
    const { data: quotation, error: findError } = await supabase
      .from('supplier_quotations')
      .select('id, status, valid_until')
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
      console.error('❌ Erro ao atualizar orçamento:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar orçamento' },
        { status: 500 }
      );
    }

    console.log(`✅ Orçamento recebido via token ${token}`);

    // TODO: Notificar admin

    return NextResponse.json({
      success: true,
      message: 'Orçamento enviado com sucesso!',
      quotation: updated,
    });
  } catch (error: any) {
    console.error('❌ Erro ao enviar orçamento:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
