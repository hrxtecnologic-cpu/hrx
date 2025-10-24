import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/deliveries
 * Lista entregas (filtradas por role)
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    // Buscar user para verificar role
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let query = supabase
      .from('delivery_trackings')
      .select(`
        *,
        event_project:event_projects(
          id,
          event_name,
          event_date,
          venue_address,
          venue_city,
          venue_state,
          created_by
        ),
        supplier:equipment_suppliers(
          id,
          company_name,
          phone
        )
      `)
      .order('scheduled_delivery_time', { ascending: true });

    // Filtros baseados em role
    if (userData.role === 'supplier') {
      query = query.eq('supplier_user_id', userData.id);
    } else if (userData.role === 'client' && eventId) {
      query = query.eq('event_project_id', eventId);
    }

    // Filtro de status
    if (status) {
      query = query.eq('status', status);
    }

    const { data: deliveries, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deliveries: deliveries || [],
    });
  } catch (error: any) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar entregas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deliveries
 * Cria nova entrega (admin apenas)
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const {
      event_project_id,
      supplier_id,
      supplier_user_id,
      equipment_items,
      destination_address,
      destination_latitude,
      destination_longitude,
      scheduled_delivery_time,
      notes,
    } = body;

    // Validar campos obrigatórios
    if (!event_project_id || !supplier_id || !equipment_items || !destination_address || !destination_latitude || !destination_longitude || !scheduled_delivery_time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Buscar localização do fornecedor
    const { data: supplierData } = await supabase
      .from('equipment_suppliers')
      .select('address, latitude, longitude')
      .eq('id', supplier_id)
      .single();

    // Criar entrega
    const { data: delivery, error } = await supabase
      .from('delivery_trackings')
      .insert({
        event_project_id,
        supplier_id,
        supplier_user_id,
        equipment_items,
        destination_address,
        destination_latitude,
        destination_longitude,
        scheduled_delivery_time,
        origin_address: supplierData?.address,
        origin_latitude: supplierData?.latitude,
        origin_longitude: supplierData?.longitude,
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      delivery,
    });
  } catch (error: any) {
    console.error('Erro ao criar entrega:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar entrega' },
      { status: 500 }
    );
  }
}
