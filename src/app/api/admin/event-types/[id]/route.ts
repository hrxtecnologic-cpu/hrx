import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

// PUT - Update event type
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
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se outro registro já tem esse nome
    const { data: existing } = await supabase
      .from('event_types')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um tipo de evento com esse nome' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('event_types')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar tipo de evento' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event type
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

    // ========== Buscar nome do tipo de evento antes de deletar ==========
    const { data: eventType, error: fetchError } = await supabase
      .from('event_types')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !eventType) {
      return NextResponse.json(
        { error: 'Tipo de evento não encontrado' },
        { status: 404 }
      );
    }

    // ========== Verificar se tipo de evento está em uso ==========
    // Event type é usado na tabela: event_projects

    // Verificar event_projects
    const { count: eventProjectsCount, error: checkError } = await supabase
      .from('event_projects')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType.name);

    if (checkError) {
      throw checkError;
    }

    if (eventProjectsCount && eventProjectsCount > 0) {
      return NextResponse.json(
        {
          error: 'Tipo de evento em uso',
          message: `Este tipo de evento não pode ser deletado pois está sendo usado em ${eventProjectsCount} projeto(s).`,
          details: {
            totalUses: eventProjectsCount,
            eventProjects: eventProjectsCount,
            eventTypeName: eventType.name,
          }
        },
        { status: 409 }
      );
    }

    // ========== Deletar tipo de evento (não está em uso) ==========
    const { error } = await supabase
      .from('event_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Tipo de evento "${eventType.name}" deletado com sucesso`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar tipo de evento' },
      { status: 500 }
    );
  }
}
