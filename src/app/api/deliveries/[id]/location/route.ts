import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/deliveries/[id]/location
 * Atualiza localização da entrega (fornecedor apenas)
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();
    const params = await context.params;
    const deliveryId = params.id;

    // Buscar user
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar entrega para verificar permissão
    const { data: delivery } = await supabase
      .from('delivery_trackings')
      .select('supplier_user_id, status')
      .eq('id', deliveryId)
      .single();

    if (!delivery) {
      return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
    }

    // Verificar permissão (fornecedor ou admin)
    if (userData.role !== 'admin' && delivery.supplier_user_id !== userData.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const { latitude, longitude, speed_kmh } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude e longitude são obrigatórios' },
        { status: 400 }
      );
    }

    // Atualizar localização atual na entrega
    const { error: updateError } = await supabase
      .from('delivery_trackings')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    if (updateError) throw updateError;

    // Criar registro no histórico
    const { error: historyError } = await supabase
      .from('delivery_location_history')
      .insert({
        delivery_tracking_id: deliveryId,
        latitude,
        longitude,
        speed_kmh,
      });

    if (historyError) throw historyError;

    return NextResponse.json({
      success: true,
      message: 'Localização atualizada',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar localização' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deliveries/[id]/location
 * Busca histórico de localizações
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();
    const params = await context.params;
    const deliveryId = params.id;

    // Buscar histórico
    const { data: locations, error } = await supabase
      .from('delivery_location_history')
      .select('*')
      .eq('delivery_tracking_id', deliveryId)
      .order('recorded_at', { ascending: false })
      .limit(100); // Últimas 100 localizações

    if (error) throw error;

    return NextResponse.json({
      success: true,
      locations: locations || [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}
