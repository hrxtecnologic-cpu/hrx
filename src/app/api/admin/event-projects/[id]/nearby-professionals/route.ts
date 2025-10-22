import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/event-projects/[id]/nearby-professionals
 *
 * Busca profissionais próximos ao local do evento
 * Query params:
 *   - category: Filtrar por categoria específica
 *   - subcategory: Filtrar por subcategoria específica
 *   - maxDistance: Distância máxima em km (padrão: 100)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '100');

    console.log('🔍 Buscando profissionais próximos:', { projectId: id, category, subcategory, maxDistance });

    // 1. Buscar dados do projeto (para pegar localização do evento)
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('venue_city, venue_state, venue_address')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // 2. Buscar geocodificação do local do evento (se ainda não tem lat/lon)
    // Por enquanto, vamos buscar TODOS os profissionais próximos baseado em cidade/estado
    // TODO: Implementar geocodificação real usando Google Maps API ou similar

    // 3. Buscar profissionais
    let query = supabase
      .from('professionals')
      .select(`
        id,
        full_name,
        email,
        phone,
        categories,
        city,
        state,
        latitude,
        longitude,
        status
      `)
      .eq('status', 'approved');

    // Filtrar por cidade/estado do evento como fallback
    if (project.venue_city) {
      query = query.eq('city', project.venue_city);
    }
    if (project.venue_state) {
      query = query.eq('state', project.venue_state);
    }

    const { data: professionals, error: profError } = await query;

    if (profError) {
      console.error('Erro ao buscar profissionais:', profError);
      return NextResponse.json({ error: profError.message }, { status: 500 });
    }

    // Filtrar por categoria em JavaScript (evita problemas com caracteres especiais no SQL)
    let filteredProfessionals = professionals || [];
    if (category && filteredProfessionals.length > 0) {
      filteredProfessionals = filteredProfessionals.filter(prof => {
        if (!prof.categories || !Array.isArray(prof.categories)) {
          return false;
        }
        return prof.categories.includes(category);
      });
    }

    // 4. Calcular distância para profissionais com geolocalização
    // TODO: Usar função calculate_distance quando tivermos lat/lon do evento

    console.log(`✅ Encontrados ${filteredProfessionals.length} profissionais`);

    return NextResponse.json({
      professionals: filteredProfessionals,
      eventLocation: {
        city: project.venue_city,
        state: project.venue_state,
      },
      filters: {
        category,
        subcategory,
        maxDistance,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar profissionais próximos:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
