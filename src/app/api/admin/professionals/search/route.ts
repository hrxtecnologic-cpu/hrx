/**
 * Advanced Search API for Professionals
 *
 * Endpoint: POST /api/admin/professionals/search
 *
 * Features:
 * - Full-text search across all fields (name, CPF, email, phone, address)
 * - Multiple filters (status, categories, city, state, experience)
 * - Geographic proximity search with radius
 * - Pagination and sorting
 * - Admin-only access
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { getBoundingBox } from '@/lib/geo-utils';
import { withAdmin } from '@/lib/api';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

// =====================================================
// Types
// =====================================================

interface SearchParams {
  // Busca textual
  query?: string;

  // Filtros
  status?: string[];
  categories?: string[];
  hasExperience?: boolean;
  city?: string;
  state?: string;

  // Busca por proximidade
  latitude?: number;
  longitude?: number;
  radius?: number; // em km

  // Paginação
  page?: number;
  limit?: number;

  // Ordenação
  sortBy?: 'name' | 'distance' | 'createdAt' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  professionals: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// =====================================================
// POST /api/admin/professionals/search
// =====================================================

export const POST = withAdmin(async (userId: string, req: Request) => {
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

    // ========== Parse Request Body ==========
    const body = await req.json();
    const params: SearchParams = {
      query: body.query?.trim() || undefined,
      status: body.status || undefined,
      categories: body.categories || undefined,
      hasExperience: body.hasExperience,
      city: body.city?.trim() || undefined,
      state: body.state?.trim() || undefined,
      latitude: body.latitude ? parseFloat(body.latitude) : undefined,
      longitude: body.longitude ? parseFloat(body.longitude) : undefined,
      radius: body.radius ? parseFloat(body.radius) : undefined,
      page: body.page ? parseInt(body.page) : 1,
      limit: body.limit ? parseInt(body.limit) : 20,
      sortBy: body.sortBy || 'name',
      sortOrder: body.sortOrder || 'asc',
    };

    logger.info('Busca avançada iniciada', {
      userId,
      params: {
        query: params.query,
        filters: {
          status: params.status,
          categories: params.categories,
          city: params.city,
          state: params.state,
        },
        proximity: params.latitude && params.longitude
          ? { lat: params.latitude, lng: params.longitude, radius: params.radius }
          : null,
        page: params.page,
        limit: params.limit,
      },
    });

    // ========== Executar Busca ==========
    const result = await searchProfessionals(params);

    logger.info('Busca concluída', {
      total: result.total,
      returned: result.professionals.length,
      page: result.page,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Erro na busca avançada', error instanceof Error ? error : undefined, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: 'Erro ao realizar busca',
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
});

// =====================================================
// Search Implementation
// =====================================================

async function searchProfessionals(params: SearchParams): Promise<SearchResult> {
  // Usar service role key para bypass do RLS (admin access)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Calcular offset para paginação
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  // ========== Construir Query Base ==========
  let query = supabase
    .from('professionals')
    .select('*', { count: 'exact' });

  logger.debug('Query base criada', { table: 'professionals' });

  // ========== Busca Textual (query) ==========
  if (params.query) {
    const searchTerm = params.query;

    // Buscar em múltiplos campos
    query = query.or(
      `full_name.ilike.%${searchTerm}%,` +
      `cpf.ilike.%${searchTerm}%,` +
      `email.ilike.%${searchTerm}%,` +
      `phone.ilike.%${searchTerm}%,` +
      `street.ilike.%${searchTerm}%,` +
      `neighborhood.ilike.%${searchTerm}%,` +
      `city.ilike.%${searchTerm}%,` +
      `state.ilike.%${searchTerm}%`
    );

    logger.debug('Busca textual aplicada', { searchTerm });
  }

  // ========== Filtros ==========

  // Status
  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
    logger.debug('Filtro de status aplicado', { status: params.status });
  }

  // Categorias (JSONB array - filtrar no código ao invés de SQL)
  let categoryFilteredProfessionals: any[] | null = null;

  if (params.categories && params.categories.length > 0) {
    logger.debug('Categorias serão filtradas no código (não no SQL)', {
      categories: params.categories
    });
    // Não adicionar filtro SQL - vamos filtrar depois dos resultados
  }

  // Cidade
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`);
    logger.debug('Filtro de cidade aplicado', { city: params.city });
  }

  // Estado
  if (params.state) {
    query = query.ilike('state', `%${params.state}%`);
    logger.debug('Filtro de estado aplicado', { state: params.state });
  }

  // Experiência
  if (params.hasExperience !== undefined) {
    // Usar o campo booleano has_experience
    query = query.eq('has_experience', params.hasExperience);
    logger.debug('Filtro de experiência aplicado', { hasExperience: params.hasExperience });
  }

  // ========== Busca por Proximidade Geográfica (OTIMIZADO) ==========
  let professionalsByDistance: any[] | null = null;
  let totalByDistance: number | null = null;

  if (params.latitude && params.longitude && params.radius) {
    logger.debug('Usando RPC otimizada para busca geográfica', {
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radius
    });

    // OTIMIZAÇÃO: Usar RPC que calcula distância no banco
    // 8x mais rápido que calcular em JavaScript
    try {
      const { data: professionalsData, error: rpcError } = await supabase.rpc(
        'search_professionals_by_distance',
        {
          search_lat: params.latitude,
          search_lon: params.longitude,
          max_distance_km: params.radius,
          filter_statuses: params.status || null,
          filter_categories: params.categories || null,
          filter_has_experience: params.hasExperience !== undefined ? params.hasExperience : null,
          filter_city: params.city || null,
          filter_state: params.state || null,
          limit_val: limit,
          offset_val: offset,
          sort_by: params.sortBy === 'distance' ? 'distance' :
                   params.sortBy === 'experience' ? 'experience' : 'name'
        }
      );

      if (rpcError) {
        logger.error('Erro ao buscar profissionais via RPC', rpcError);
        throw rpcError;
      }

      professionalsByDistance = professionalsData || [];

      // Buscar total para paginação
      const { data: totalCount, error: countError } = await supabase.rpc(
        'count_professionals_by_distance',
        {
          search_lat: params.latitude,
          search_lon: params.longitude,
          max_distance_km: params.radius,
          filter_statuses: params.status || null,
          filter_categories: params.categories || null,
          filter_has_experience: params.hasExperience !== undefined ? params.hasExperience : null,
          filter_city: params.city || null,
          filter_state: params.state || null
        }
      );

      if (!countError && totalCount !== null) {
        totalByDistance = totalCount;
      }

      logger.debug('Busca geográfica concluída via RPC', {
        total: totalByDistance,
        returned: professionalsByDistance.length,
        avgDistance: professionalsByDistance.length > 0
          ? (professionalsByDistance.reduce((sum, p) => sum + (p.distance_km || 0), 0) / professionalsByDistance.length).toFixed(2)
          : 0
      });
    } catch (error) {
      // Fallback para método antigo se RPC falhar
      logger.warn('RPC falhou, usando método legado', { error });

      const bbox = getBoundingBox(
        { latitude: params.latitude, longitude: params.longitude },
        params.radius
      );

      query = query
        .gte('latitude', bbox.minLatitude)
        .lte('latitude', bbox.maxLatitude)
        .gte('longitude', bbox.minLongitude)
        .lte('longitude', bbox.maxLongitude)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { data: professionalsInBox, error: boxError } = await query;

      if (boxError) {
        logger.error('Erro ao buscar profissionais no bounding box', boxError);
        throw boxError;
      }

      if (professionalsInBox) {
        professionalsByDistance = professionalsInBox
          .map(prof => ({
            ...prof,
            distance_km: calculateDistanceJS(
              params.latitude!,
              params.longitude!,
              prof.latitude,
              prof.longitude
            ),
          }))
          .filter(prof => prof.distance_km <= params.radius!)
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }
  }

  // ========== Executar Query (se não for busca por proximidade) ==========
  if (!professionalsByDistance) {
    // Ordenação
    const sortField = getSortField(params.sortBy || 'name');
    const ascending = params.sortOrder === 'asc';

    query = query.order(sortField, { ascending });

    // Se houver filtro de categorias, buscar tudo e filtrar em JS
    const hasCategoryFilter = params.categories && params.categories.length > 0;

    if (!hasCategoryFilter) {
      // Sem filtro de categoria - paginação normal no SQL
      query = query.range(offset, offset + limit - 1);
    }

    // Executar
    const { data, error, count } = await query;

    if (error) {
      logger.error('Erro ao executar busca', error);
      throw error;
    }

    let professionals = data || [];

    // Filtrar categorias em JavaScript se necessário
    if (hasCategoryFilter && params.categories) {
      logger.debug('Filtrando categorias em JavaScript', {
        totalBeforeFilter: professionals.length,
        categoriesToFilter: params.categories
      });

      professionals = professionals.filter(prof => {
        // Verificar se prof.categories (array) contém alguma das categorias selecionadas
        if (!prof.categories || !Array.isArray(prof.categories)) {
          return false;
        }

        return params.categories!.some(selectedCat =>
          prof.categories.includes(selectedCat)
        );
      });

      logger.debug('Categorias filtradas', {
        totalAfterFilter: professionals.length
      });
    }

    // Aplicar paginação manual se necessário
    if (hasCategoryFilter) {
      const total = professionals.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedResults = professionals.slice(offset, offset + limit);

      return {
        professionals: paginatedResults,
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      };
    }

    // Paginação SQL (sem filtro de categoria)
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      professionals,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  // ========== Retornar Resultados de Busca por Proximidade ==========
  // Se temos o total da RPC, usar ele; senão usar o length do array
  const total = totalByDistance !== null ? totalByDistance : professionalsByDistance.length;
  const totalPages = Math.ceil(total / limit);

  // Se veio da RPC otimizada, já está paginado
  // Se veio do fallback, precisa paginar manualmente
  const paginatedResults = totalByDistance !== null
    ? professionalsByDistance
    : professionalsByDistance.slice(offset, offset + limit);

  return {
    professionals: paginatedResults,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Mapeia campo de ordenação para nome de coluna no banco
 */
function getSortField(sortBy: string): string {
  const fieldMap: Record<string, string> = {
    name: 'full_name',
    createdAt: 'created_at',
    experience: 'has_experience', // Campo booleano de experiência
    distance: 'full_name', // Distância é calculada separadamente
  };

  return fieldMap[sortBy] || 'full_name';
}

/**
 * Calcula distância em JavaScript (Haversine)
 * Fallback quando não podemos usar a função SQL
 */
function calculateDistanceJS(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
