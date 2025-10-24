import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PUT - Update category
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
      .from('categories')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com esse nome' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('categories')
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
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
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

    // ========== Buscar nome da categoria antes de deletar ==========
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // ========== Verificar se categoria está em uso ==========
    // Categories é um JSONB array, precisamos verificar se algum profissional usa essa categoria
    const { data: professionalsUsingCategory, error: checkError } = await supabase
      .from('professionals')
      .select('id, full_name, categories')
      .contains('categories', [category.name]);

    if (checkError) {
      throw checkError;
    }

    if (professionalsUsingCategory && professionalsUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error: 'Categoria em uso',
          message: `Esta categoria não pode ser deletada pois está sendo usada por ${professionalsUsingCategory.length} profissional(is).`,
          details: {
            professionalsCount: professionalsUsingCategory.length,
            categoryName: category.name,
            // Não retornar lista completa por privacidade, apenas count
          }
        },
        { status: 409 }
      );
    }

    // ========== Deletar categoria (não está em uso) ==========
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Categoria "${category.name}" deletada com sucesso`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar categoria' },
      { status: 500 }
    );
  }
}
