import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PUT - Update event type
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    console.error('Erro ao atualizar tipo de evento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tipo de evento' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event type
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // TODO: Verificar se tipo de evento está em uso antes de deletar

    const { error } = await supabase
      .from('event_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar tipo de evento:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar tipo de evento' },
      { status: 500 }
    );
  }
}
