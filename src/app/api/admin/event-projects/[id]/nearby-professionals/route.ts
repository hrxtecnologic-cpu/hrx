import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
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


    // 1. Buscar dados do projeto (incluindo geolocalização)
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('venue_city, venue_state, venue_address, latitude, longitude')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    let professionals: any[] = [];

    // 2. Se o projeto tem coordenadas, usar busca por proximidade
    if (project.latitude && project.longitude) {
      // Usar função RPC otimizada para busca por distância
      const { data, error: rpcError } = await supabase.rpc('get_nearby_professionals', {
        event_lat: project.latitude,
        event_lon: project.longitude,
        max_distance_km: maxDistance,
        filter_category: category || null,
        filter_status: 'approved'
      });

      if (rpcError) {
        console.error('[nearby-professionals] Erro na RPC:', rpcError);
        // Fallback para busca por cidade/estado
        professionals = await fallbackCitySearch(project, category);
      } else {
        professionals = data || [];
      }
    } else {
      // Fallback: buscar por cidade/estado
      professionals = await fallbackCitySearch(project, category);
    }


    return NextResponse.json({
      professionals: professionals,
      total: professionals.length,
      eventLocation: {
        city: project.venue_city,
        state: project.venue_state,
        latitude: project.latitude,
        longitude: project.longitude,
        hasCoordinates: !!(project.latitude && project.longitude),
      },
      filters: {
        category,
        subcategory,
        maxDistance,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Fallback: busca por cidade/estado quando não há coordenadas
 */
async function fallbackCitySearch(project: any, category: string | null) {
  let query = supabase
    .from('professionals')
    .select(`
      id,
      full_name,
      email,
      phone,
      categories,
      subcategories,
      city,
      state,
      latitude,
      longitude,
      status,
      service_radius_km
    `)
    .eq('status', 'approved');

  // Filtrar por cidade/estado do evento
  if (project.venue_city) {
    query = query.eq('city', project.venue_city);
  }
  if (project.venue_state) {
    query = query.eq('state', project.venue_state);
  }

  const { data: professionals } = await query;

  // Filtrar por categoria em JavaScript
  let filteredProfessionals = professionals || [];
  if (category && filteredProfessionals.length > 0) {
    filteredProfessionals = filteredProfessionals.filter(prof => {
      if (!prof.categories || !Array.isArray(prof.categories)) {
        return false;
      }
      return prof.categories.includes(category);
    });
  }

  // Adicionar flag indicando que é fallback
  return filteredProfessionals.map(prof => ({
    ...prof,
    distance_km: null,
    search_method: 'city_state_fallback'
  }));
}
