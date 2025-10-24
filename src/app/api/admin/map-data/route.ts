import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const markers: any[] = [];

    // Buscar profissionais com coordenadas
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, full_name, latitude, longitude, city, state, status, categories')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (professionals) {
      professionals.forEach(prof => {
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
        });
      });
    }

    // Buscar fornecedores com coordenadas
    const { data: suppliers } = await supabase
      .from('equipment_suppliers')
      .select('id, company_name, latitude, longitude, city, state, status, equipment_types')
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
        });
      });
    }

    // Buscar eventos próximos com coordenadas
    const { data: events } = await supabase
      .from('event_projects')
      .select('id, project_number, event_name, latitude, longitude, venue_city, venue_state, status')
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
