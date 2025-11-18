import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { findNearbyProfessionals, calculateTravelCosts } from '@/lib/mapbox-matching';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/mapbox/matching
 *
 * Encontra profissionais/fornecedores próximos a um evento
 *
 * Body:
 * {
 *   eventId?: string,        // ID do evento (busca coordenadas)
 *   latitude?: number,       // Ou coordenadas diretas
 *   longitude?: number,
 *   maxDistanceKm?: number,  // Padrão: 50km
 *   maxDurationMinutes?: number, // Padrão: 60min
 *   limit?: number,          // Padrão: 20
 *   categories?: string[],   // Filtrar por categorias
 *   type?: 'professional' | 'supplier' | 'both' // Tipo de candidato
 * }
 */
export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), { status: 429 });
    }

    // Autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      eventId,
      latitude,
      longitude,
      maxDistanceKm = 50,
      maxDurationMinutes = 60,
      limit = 20,
      categories,
      type = 'both',
    } = body;

    const supabase = await createClient();

    // Obter coordenadas do evento
    let eventLocation: { latitude: number; longitude: number } | null = null;

    if (eventId) {
      const { data: event } = await supabase
        .from('event_projects')
        .select('latitude, longitude, event_name, venue_city, venue_state')
        .eq('id', eventId)
        .single();

      if (!event || !event.latitude || !event.longitude) {
        return NextResponse.json(
          { error: 'Evento não encontrado ou sem coordenadas' },
          { status: 404 }
        );
      }

      eventLocation = {
        latitude: event.latitude,
        longitude: event.longitude,
      };
    } else if (latitude && longitude) {
      eventLocation = { latitude, longitude };
    } else {
      return NextResponse.json(
        { error: 'Forneça eventId ou latitude/longitude' },
        { status: 400 }
      );
    }

    // Buscar candidatos
    const candidates: Array<Record<string, unknown>> = [];

    // Profissionais
    if (type === 'professional' || type === 'both') {
      const { data: professionals } = await supabase
        .from('professionals')
        .select('id, full_name, latitude, longitude, categories, status, phone, email, service_radius_km')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('status', 'active');

      if (professionals) {
        candidates.push(
          ...professionals.map(p => ({
            id: p.id,
            name: p.full_name,
            type: 'professional' as const,
            latitude: p.latitude,
            longitude: p.longitude,
            categories: p.categories,
            status: p.status,
            phone: p.phone,
            email: p.email,
            isAvailable: true,
            serviceRadiusKm: p.service_radius_km || 50,
          }))
        );
      }
    }

    // Fornecedores
    if (type === 'supplier' || type === 'both') {
      const { data: suppliers } = await supabase
        .from('equipment_suppliers')
        .select('id, company_name, latitude, longitude, equipment_types, status, phone, email')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('status', 'active');

      if (suppliers) {
        candidates.push(
          ...suppliers.map(s => ({
            id: s.id,
            name: s.company_name,
            type: 'supplier' as const,
            latitude: s.latitude,
            longitude: s.longitude,
            categories: s.equipment_types,
            status: s.status,
            phone: s.phone,
            email: s.email,
            isAvailable: true,
          }))
        );
      }
    }

    // Executar matching
    const result = await findNearbyProfessionals(eventLocation, candidates, {
      maxDistanceKm,
      maxDurationMinutes,
      limit,
      categories,
    });

    // Adicionar custo de deslocamento
    const matchesWithCost = calculateTravelCosts(result.matches);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        matches: matchesWithCost,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
