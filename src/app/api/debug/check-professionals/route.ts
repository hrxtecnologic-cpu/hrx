import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint para verificar estrutura da tabela professionals
 * GET /api/debug/check-professionals
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar um profissional de exemplo
    const { data: sample, error: sampleError } = await supabase
      .from('professionals')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      return NextResponse.json({
        error: 'Erro ao buscar profissional de exemplo',
        details: sampleError.message,
        code: sampleError.code,
      });
    }

    // Verificar tipo da coluna categories
    const categoriesType = typeof sample?.categories;
    const categoriesValue = sample?.categories;
    const isArray = Array.isArray(categoriesValue);

    // Tentar query simples com categories
    const { data: withCat, error: catError } = await supabase
      .from('professionals')
      .select('id, full_name, categories')
      .not('categories', 'is', null)
      .limit(5);

    return NextResponse.json({
      sample: {
        id: sample?.id,
        full_name: sample?.full_name,
        categories: categoriesValue,
        categoriesType,
        isArray,
      },
      queryTest: {
        success: !catError,
        error: catError?.message,
        count: withCat?.length || 0,
        samples: withCat?.map(p => ({
          name: p.full_name,
          categories: p.categories,
          type: typeof p.categories,
          isArray: Array.isArray(p.categories),
        })),
      },
      possibleSolutions: {
        ifJSONB: 'Use: .filter("categories", "@>", JSON.stringify(["Categoria"]))',
        ifTextArray: 'Use: .overlaps("categories", ["Categoria"])',
        ifString: 'Use: .ilike("categories", "%Categoria%")',
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao verificar professionals',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
