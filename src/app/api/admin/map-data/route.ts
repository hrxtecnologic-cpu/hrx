import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
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

    const supabase = await createAdminClient();
    const markers: any[] = [];

    // Buscar profissionais com coordenadas
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, full_name, latitude, longitude, city, state, status, categories, subcategories, street, number, complement, neighborhood, phone, email')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (professionals) {
      professionals.forEach(prof => {
        // Montar endereço completo
        const addressParts = [
          prof.street,
          prof.number && `nº ${prof.number}`,
          prof.complement,
          prof.neighborhood,
        ].filter(Boolean);
        const fullAddress = addressParts.length > 0
          ? `${addressParts.join(', ')} - ${prof.city}/${prof.state}`
          : null;

        markers.push({
          id: prof.id,
          type: 'professional',
          latitude: prof.latitude,
          longitude: prof.longitude,
          name: prof.full_name,
          city: prof.city,
          state: prof.state,
          status: prof.status,
          categories: prof.categories,
          subcategories: prof.subcategories,
          address: fullAddress,
          phone: prof.phone,
          email: prof.email,
        });
      });
    }

    // Buscar fornecedores com coordenadas
    const { data: suppliers } = await supabase
      .from('equipment_suppliers')
      .select('id, company_name, latitude, longitude, city, state, status, equipment_types, address, phone, email')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (suppliers) {
      suppliers.forEach(sup => {
        markers.push({
          id: sup.id,
          type: 'supplier',
          latitude: sup.latitude,
          longitude: sup.longitude,
          name: sup.company_name,
          city: sup.city,
          state: sup.state,
          status: sup.status,
          categories: sup.equipment_types,
          address: sup.address,
          phone: sup.phone,
          email: sup.email,
        });
      });
    }

    // Buscar eventos próximos com coordenadas
    const { data: events } = await supabase
      .from('event_projects')
      .select('id, project_number, event_name, latitude, longitude, venue_city, venue_state, venue_address, client_phone, client_email, status')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(50);

    if (events) {
      events.forEach(event => {
        markers.push({
          id: event.id,
          type: 'event',
          latitude: event.latitude,
          longitude: event.longitude,
          name: `${event.project_number} - ${event.event_name}`,
          city: event.venue_city,
          state: event.venue_state,
          status: event.status,
          address: event.venue_address,
          phone: event.client_phone,
          email: event.client_email,
        });
      });
    }

    return NextResponse.json({
      success: true,
      markers,
      total: markers.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados do mapa' },
      { status: 500 }
    );
  }
}
