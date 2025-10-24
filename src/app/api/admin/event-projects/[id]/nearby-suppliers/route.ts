import { NextResponse } from 'next/server';
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
    const equipmentType = searchParams.get('equipmentType');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '100');


    // 1. Buscar dados do projeto (para pegar localização do evento)
    const { data: project, error: projectError } = await supabase
      .from('event_projects')
      .select('venue_city, venue_state, venue_address')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // 2. Buscar fornecedores
    let query = supabase
      .from('equipment_suppliers')
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        equipment_types,
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

    // Filtrar por cidade/estado do evento como fallback
    if (project.venue_city) {
      query = query.eq('city', project.venue_city);
    }
    if (project.venue_state) {
      query = query.eq('state', project.venue_state);
    }

    const { data: suppliers, error: suppliersError } = await query;

    if (suppliersError) {
      return NextResponse.json({ error: suppliersError.message }, { status: 500 });
    }

    // 3. Calcular distância e frete para fornecedores com geolocalização
    // TODO: Usar função get_nearby_suppliers() quando tivermos lat/lon do evento

    // 4. Adicionar informação de frete para cada fornecedor
    const suppliersWithShipping = suppliers?.map(supplier => ({
      ...supplier,
      requiresShipping: false, // Será true se distância > delivery_radius_km
      estimatedShippingFee: 0, // Será calculado baseado na distância
      distance_km: null, // Será calculado quando tivermos geolocalização
      note: supplier.city === project.venue_city
        ? 'Mesmo município - sem frete adicional'
        : 'Frete a combinar conforme distância',
    })) || [];


    return NextResponse.json({
      suppliers: suppliersWithShipping,
      eventLocation: {
        city: project.venue_city,
        state: project.venue_state,
      },
      filters: {
        equipmentType,
        maxDistance,
      },
      note: 'Configure latitude/longitude dos fornecedores para cálculo automático de frete',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
