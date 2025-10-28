import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

// GET - List all suppliers
export async function GET(req: NextRequest) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    // ========== Autenticação ==========
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
      throw error;
    }

    // Buscar estatísticas de orçamentos para cada fornecedor
    const suppliersWithStats = await Promise.all(
      (data || []).map(async (supplier) => {
        const { data: quotations } = await supabase
          .from('supplier_quotations')
          .select('id, status, total_price')
          .eq('supplier_id', supplier.id);

        const total = quotations?.length || 0;
        const submitted = quotations?.filter(q => ['submitted', 'accepted'].includes(q.status)).length || 0;
        const accepted = quotations?.filter(q => q.status === 'accepted').length || 0;
        const rejected = quotations?.filter(q => q.status === 'rejected').length || 0;
        const acceptanceRate = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0;

        // Calcular ticket médio dos orçamentos aceitos
        const acceptedQuotations = quotations?.filter(q => q.status === 'accepted' && q.total_price) || [];
        const avgTicket = acceptedQuotations.length > 0
          ? acceptedQuotations.reduce((sum, q) => sum + (q.total_price || 0), 0) / acceptedQuotations.length
          : 0;

        return {
          ...supplier,
          stats: {
            totalQuotations: total,
            submittedQuotations: submitted,
            acceptedQuotations: accepted,
            rejectedQuotations: rejected,
            acceptanceRate,
            avgTicket,
          },
        };
      })
    );

    return NextResponse.json(suppliersWithStats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    );
  }
}

// POST - Create new supplier
export async function POST(req: NextRequest) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, contact_name, email, phone, equipment_types, pricing, notes, equipment_catalog } = body;

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
        equipment_catalog: equipment_catalog || [],
        pricing: pricing || {},
        notes: notes || null,
        status: 'active',
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar fornecedor' },
      { status: 500 }
    );
  }
}
