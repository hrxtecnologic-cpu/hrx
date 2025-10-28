import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

// GET - Get single supplier
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('equipment_suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedor' },
      { status: 500 }
    );
  }
}

// PUT - Update supplier
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const { company_name, contact_name, email, phone, equipment_types, pricing, notes, status, equipment_catalog } = body;

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

    // Check if email is taken by another supplier
    const { data: existing } = await supabase
      .from('equipment_suppliers')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email já cadastrado por outro fornecedor' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('equipment_suppliers')
      .update({
        company_name,
        contact_name,
        email,
        phone,
        equipment_types,
        equipment_catalog: equipment_catalog || [],
        pricing: pricing || {},
        notes: notes || null,
        status: status || 'active',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar fornecedor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = await createClient();

    // Check if supplier has any allocations
    const { data: allocations } = await supabase
      .from('equipment_allocations')
      .select('id')
      .contains('allocations', [{ supplier_id: id }])
      .limit(1);

    if (allocations && allocations.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar fornecedor com alocações ativas. Desative-o ao invés de deletar.' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('equipment_suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar fornecedor' },
      { status: 500 }
    );
  }
}
