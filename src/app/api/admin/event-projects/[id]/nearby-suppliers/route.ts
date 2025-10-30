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
 * GET /api/admin/event-projects/[id]/nearby-suppliers
 *
 * Busca fornecedores próximos ao local do evento
 * Query params:
 *   - equipmentType: Filtrar por tipo de equipamento
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
    const equipmentType = searchParams.get('equipmentType');
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

    let suppliers: any[] = [];

    // 2. Se o projeto tem coordenadas, usar busca por proximidade
    if (project.latitude && project.longitude) {
      // Usar função RPC otimizada para busca por distância
      const { data, error: rpcError } = await supabase.rpc('get_nearby_suppliers', {
        event_lat: project.latitude,
        event_lon: project.longitude,
        max_distance_km: maxDistance,
        filter_equipment_type: equipmentType || null
      });

      if (rpcError) {
        console.error('[nearby-suppliers] Erro na RPC:', rpcError);
        // Fallback para busca por cidade/estado
        suppliers = await fallbackCitySearchSuppliers(project, equipmentType);
      } else {
        suppliers = data || [];
      }
    } else {
      // Fallback: buscar por cidade/estado
      suppliers = await fallbackCitySearchSuppliers(project, equipmentType);
    }

    // 3. Adicionar cálculo de frete para fornecedores com distância
    const suppliersWithShipping = suppliers.map(supplier => {
      const distance = supplier.distance_km || 0;
      const deliveryRadius = supplier.delivery_radius_km || 50;
      const shippingFeePerKm = supplier.shipping_fee_per_km || 0;

      const requiresShipping = distance > deliveryRadius;
      const estimatedShippingFee = requiresShipping
        ? (distance - deliveryRadius) * shippingFeePerKm
        : 0;

      let note = '';
      if (distance === 0 || distance === null) {
        note = 'Distância não calculada - configure coordenadas';
      } else if (!requiresShipping) {
        note = `Dentro do raio de entrega (${deliveryRadius}km) - sem frete adicional`;
      } else {
        note = `Fora do raio de entrega - frete estimado: R$ ${estimatedShippingFee.toFixed(2)}`;
      }

      return {
        ...supplier,
        requiresShipping,
        estimatedShippingFee: estimatedShippingFee.toFixed(2),
        note,
      };
    });


    return NextResponse.json({
      suppliers: suppliersWithShipping,
      total: suppliersWithShipping.length,
      eventLocation: {
        city: project.venue_city,
        state: project.venue_state,
        latitude: project.latitude,
        longitude: project.longitude,
        hasCoordinates: !!(project.latitude && project.longitude),
      },
      filters: {
        equipmentType,
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
async function fallbackCitySearchSuppliers(project: any, equipmentType: string | null) {
  let query = supabase
    .from('equipment_suppliers')
    .select(`
      id,
      company_name,
      contact_name,
      email,
      phone,
      equipment_types,
      equipment_catalog,
      city,
      state,
      latitude,
      longitude,
      delivery_radius_km,
      shipping_fee_per_km,
      status
    `)
    .eq('status', 'active');

  // Filtrar por tipo de equipamento se fornecido
  if (equipmentType) {
    query = query.contains('equipment_types', [equipmentType]);
  }

  // Filtrar por cidade/estado do evento
  if (project.venue_city) {
    query = query.eq('city', project.venue_city);
  }
  if (project.venue_state) {
    query = query.eq('state', project.venue_state);
  }

  const { data: suppliers } = await query;

  // Adicionar flag indicando que é fallback
  return (suppliers || []).map(supp => ({
    ...supp,
    distance_km: null,
    search_method: 'city_state_fallback'
  }));
}
