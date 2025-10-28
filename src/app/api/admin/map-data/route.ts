import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { withAdmin } from '@/lib/api';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const supabase = await createAdminClient();

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

    // OTIMIZAÇÃO: Suporte a viewport (bounding box) para carregar apenas área visível
    const { searchParams } = new URL(request.url);
    const minLat = searchParams.get('minLat');
    const maxLat = searchParams.get('maxLat');
    const minLng = searchParams.get('minLng');
    const maxLng = searchParams.get('maxLng');
    const types = searchParams.get('types')?.split(',') || ['professional', 'supplier', 'event'];

    const markers: any[] = [];

    // Queries paralelas (3-4x mais rápido)
    const queries: Promise<any>[] = [];

    // Buscar profissionais (se solicitado e com viewport se disponível)
    if (types.includes('professional')) {
      let profQuery = supabase
        .from('professionals')
        .select('id, full_name, latitude, longitude, city, state, status, categories, subcategories, street, number, complement, neighborhood, phone, email')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Aplicar filtro de viewport se fornecido
      if (minLat && maxLat && minLng && maxLng) {
        profQuery = profQuery
          .gte('latitude', parseFloat(minLat))
          .lte('latitude', parseFloat(maxLat))
          .gte('longitude', parseFloat(minLng))
          .lte('longitude', parseFloat(maxLng));
      }

      queries.push(profQuery.then(res => ({ type: 'professionals', data: res.data })));
    }

    // Buscar fornecedores (se solicitado e com viewport se disponível)
    if (types.includes('supplier')) {
      let suppQuery = supabase
        .from('equipment_suppliers')
        .select('id, company_name, latitude, longitude, city, state, status, equipment_types, address, phone, email')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Aplicar filtro de viewport se fornecido
      if (minLat && maxLat && minLng && maxLng) {
        suppQuery = suppQuery
          .gte('latitude', parseFloat(minLat))
          .lte('latitude', parseFloat(maxLat))
          .gte('longitude', parseFloat(minLng))
          .lte('longitude', parseFloat(maxLng));
      }

      queries.push(suppQuery.then(res => ({ type: 'suppliers', data: res.data })));
    }

    // Buscar eventos próximos (se solicitado e com viewport se disponível)
    if (types.includes('event')) {
      let eventQuery = supabase
        .from('event_projects')
        .select('id, project_number, event_name, latitude, longitude, venue_city, venue_state, venue_address, client_phone, client_email, status')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(50);

      // Aplicar filtro de viewport se fornecido
      if (minLat && maxLat && minLng && maxLng) {
        eventQuery = eventQuery
          .gte('latitude', parseFloat(minLat))
          .lte('latitude', parseFloat(maxLat))
          .gte('longitude', parseFloat(minLng))
          .lte('longitude', parseFloat(maxLng));
      }

      queries.push(eventQuery.then(res => ({ type: 'events', data: res.data })));
    }

    // Executar todas as queries em paralelo
    const results = await Promise.all(queries);

    // Processar resultados
    results.forEach(result => {
      if (result.type === 'professionals' && result.data) {
        result.data.forEach((prof: any) => {
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
      } else if (result.type === 'suppliers' && result.data) {
        result.data.forEach((sup: any) => {
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
      } else if (result.type === 'events' && result.data) {
        result.data.forEach((event: any) => {
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
    });

    return NextResponse.json({
      success: true,
      markers,
      total: markers.length,
      viewport: minLat && maxLat && minLng && maxLng ? {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng)
      } : null
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados do mapa' },
      { status: 500 }
    );
  }
});
