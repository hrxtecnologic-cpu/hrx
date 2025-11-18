import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { createCategorySchema } from '@/lib/validations/admin';
import { withAdmin } from '@/lib/api';
import { logger } from '@/lib/logger';

// GET - List all categories
export const GET = withAdmin(async (userId: string, req: Request) => {
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

    // Get category type from query params (default: professional)
    const { searchParams } = new URL(req.url);
    const categoryType = searchParams.get('type') || 'professional';

    const supabase = await createClient();

    // Buscar categorias com subcategorias usando a view apropriada
    const viewName = categoryType === 'equipment'
      ? 'equipment_categories_view'
      : 'professional_categories_view';

    const { data: categories, error } = await supabase
      .from(viewName)
      .select('*')
      .order('category_order', { ascending: true });

    if (error) {
      logger.error('Erro ao buscar categorias', error, { userId, categoryType });
      throw error;
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    logger.error('Erro ao buscar categorias', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
});

// POST - Create new category
export const POST = withAdmin(async (userId: string, req: Request) => {
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

    const body = await req.json();

    // Validar com Zod
    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, description, category_type } = validation.data;

    const supabase = await createClient();

    // Verificar se categoria já existe (mesmo nome e tipo)
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('category_type', category_type)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Categoria já existe' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name,
        description,
        category_type, // Usar o tipo do body
        active: true,
        order_index: 999 // Novas categorias vão pro final
      }])
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar categoria', error, { userId, name });
      throw error;
    }

    logger.info('Categoria criada com sucesso', { userId, categoryId: data.id, name });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erro ao criar categoria', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
});
