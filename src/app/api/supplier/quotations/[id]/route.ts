import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ====================================
 * GET /api/supplier/quotations/[id]
 * ====================================
 * Retorna detalhes de uma cotação específica para o fornecedor
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: quotationId } = await params;
    const supabase = await createClient();

    // Buscar fornecedor
    const { data: userData } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const { data: supplier } = await supabase
      .from('equipment_suppliers')
      .select('id, status')
      .eq('email', userData.email)
      .single();

    if (!supplier || supplier.status !== 'active') {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado ou inativo' },
        { status: 403 }
      );
    }

    // Buscar cotação
    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .select(`
        id,
        project_id,
        supplier_id,
        token,
        requested_items,
        status,
        total_price,
        daily_rate,
        delivery_fee,
        setup_fee,
        payment_terms,
        delivery_details,
        notes,
        valid_until,
        created_at,
        submitted_at,
        responded_at,
        project:event_projects (
          project_number,
          event_name,
          event_description,
          event_date,
          event_type,
          client_name,
          venue_name,
          venue_city,
          venue_state
        )
      `)
      .eq('id', quotationId)
      .eq('supplier_id', supplier.id)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quotation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        message: 'Não foi possível carregar a cotação',
      },
      { status: 500 }
    );
  }
}
