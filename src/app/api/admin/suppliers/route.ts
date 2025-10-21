import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - List all suppliers
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // filter by status if provided
    const equipmentType = searchParams.get('equipmentType'); // filter by equipment type

    const supabase = await createClient();

    let query = supabase
      .from('equipment_suppliers')
      .select('*')
      .order('company_name', { ascending: true });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (equipmentType) {
      query = query.contains('equipment_types', [equipmentType]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar fornecedores:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    );
  }
}

// POST - Create new supplier
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, contact_name, email, phone, equipment_types, proposed_budget, notes } = body;

    // Validations
    if (!company_name || !contact_name || !email || !phone || !equipment_types) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (!Array.isArray(equipment_types) || equipment_types.length === 0) {
      return NextResponse.json(
        { error: 'Tipos de equipamento devem ser uma lista não-vazia' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('equipment_suppliers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('equipment_suppliers')
      .insert([{
        company_name,
        contact_name,
        email,
        phone,
        equipment_types,
        proposed_budget: proposed_budget || null,
        notes: notes || null,
        status: 'active',
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar fornecedor:', error);
      throw error;
    }

    console.log(`✅ Fornecedor criado: ${company_name}`);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro ao criar fornecedor' },
      { status: 500 }
    );
  }
}
