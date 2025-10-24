import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ====================================
 * GET /api/supplier/dashboard
 * ====================================
 * Retorna dashboard do fornecedor com cotações e estatísticas
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // ========================================
    // 1. BUSCAR FORNECEDOR PELO CLERK ID
    // ========================================
    // Buscar no users table
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

    // Buscar fornecedor pelo email do usuário
    const { data: supplier, error: supplierError } = await supabase
      .from('equipment_suppliers')
      .select('id, company_name, contact_name, email, phone, equipment_types, proposed_budget, notes, status')
      .eq('email', userData.email)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    if (supplier.status !== 'active') {
      return NextResponse.json(
        { error: 'Fornecedor inativo' },
        { status: 403 }
      );
    }

    // ========================================
    // 2. BUSCAR COTAÇÕES DO FORNECEDOR
    // ========================================
    const { data: quotations, error: quotationsError } = await supabase
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
          event_date,
          client_name
        )
      `)
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (quotationsError) {
      throw quotationsError;
    }

    // ========================================
    // 3. CALCULAR ESTATÍSTICAS
    // ========================================
    const stats = {
      pending_quotations: quotations?.filter(
        (q) => q.status === 'pending'
      ).length || 0,
      total_quotations: quotations?.length || 0,
      accepted_quotations: quotations?.filter((q) => q.status === 'accepted').length || 0,
      total_value: quotations
        ?.filter((q) => q.status === 'accepted' && q.total_price)
        .reduce((sum, q) => sum + (q.total_price || 0), 0) || 0,
    };

    // ========================================
    // 4. RETORNAR DADOS
    // ========================================
    return NextResponse.json({
      success: true,
      supplier: {
        id: supplier.id,
        company_name: supplier.company_name,
        contact_name: supplier.contact_name,
        email: supplier.email,
        phone: supplier.phone,
        equipment_types: supplier.equipment_types,
        proposed_budget: supplier.proposed_budget,
        notes: supplier.notes,
        status: supplier.status,
      },
      quotations: quotations || [],
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro interno',
        message: 'Não foi possível carregar o dashboard',
      },
      { status: 500 }
    );
  }
}
