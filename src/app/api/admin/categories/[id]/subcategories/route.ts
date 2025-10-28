import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import { logger } from '@/lib/logger';

// GET - Listar subcategorias de uma categoria
export const GET = withAdmin(async (userId: string, req: Request, context: any) => {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: subcategories, error } = await supabase
      .from('category_subcategories')
      .select('*')
      .eq('category_id', id)
      .eq('active', true)
      .order('order_index', { ascending: true });

    if (error) {
      logger.error('Erro ao buscar subcategorias', error, { userId, categoryId: id });
      throw error;
    }

    return NextResponse.json(subcategories || []);
  } catch (error) {
    logger.error('Erro ao buscar subcategorias', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao buscar subcategorias' },
      { status: 500 }
    );
  }
});

// POST - Criar nova subcategoria
export const POST = withAdmin(async (userId: string, req: Request, context: any) => {
  try {
    const { id: categoryId } = await context.params;
    const body = await req.json();
    const { name, slug, description, required_documents, optional_documents } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se subcategoria já existe
    const { data: existing } = await supabase
      .from('category_subcategories')
      .select('id')
      .eq('category_id', categoryId)
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Subcategoria com este slug já existe' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('category_subcategories')
      .insert([{
        category_id: categoryId,
        name,
        slug,
        description: description || null,
        required_documents: required_documents || [],
        optional_documents: optional_documents || [],
        active: true,
        order_index: 999
      }])
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar subcategoria', error, { userId, categoryId, name });
      throw error;
    }

    logger.info('Subcategoria criada', { userId, subcategoryId: data.id, name });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erro ao criar subcategoria', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao criar subcategoria' },
      { status: 500 }
    );
  }
});
