import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import { logger } from '@/lib/logger';

// PUT - Atualizar subcategoria
export const PUT = withAdmin(async (userId: string, req: Request, context: { params: Promise<Record<string, string>> }) => {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, slug, description, required_documents, optional_documents, order_index, active } = body;

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (required_documents !== undefined) updateData.required_documents = required_documents;
    if (optional_documents !== undefined) updateData.optional_documents = optional_documents;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('category_subcategories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar subcategoria', error, { userId, subcategoryId: id });
      throw error;
    }

    logger.info('Subcategoria atualizada', { userId, subcategoryId: id });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erro ao atualizar subcategoria', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao atualizar subcategoria' },
      { status: 500 }
    );
  }
});

// DELETE - Deletar subcategoria (soft delete)
export const DELETE = withAdmin(async (userId: string, req: Request, context: { params: Promise<Record<string, string>> }) => {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Soft delete - apenas marca como inativa
    const { data, error } = await supabase
      .from('category_subcategories')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao deletar subcategoria', error, { userId, subcategoryId: id });
      throw error;
    }

    logger.info('Subcategoria deletada', { userId, subcategoryId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erro ao deletar subcategoria', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao deletar subcategoria' },
      { status: 500 }
    );
  }
});
