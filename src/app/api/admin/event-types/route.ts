import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - List all event types
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: eventTypes, error } = await supabase
      .from('event_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(eventTypes || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar tipos de evento' },
      { status: 500 }
    );
  }
}

// POST - Create new event type
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se tipo de evento já existe
    const { data: existing } = await supabase
      .from('event_types')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Tipo de evento já existe' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('event_types')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar tipo de evento' },
      { status: 500 }
    );
  }
}
