import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/deliveries/[id]/status
 * Atualiza status da entrega (fornecedor ou admin)
 */
export async function PATCH(
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

    // Verificar permissão
    if (userData.role !== 'admin' && delivery.supplier_user_id !== userData.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ['pending', 'preparing', 'in_transit', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Use: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Preparar update
    const updateData: Record<string, unknown> = {
      status,
    };

    if (notes) {
      updateData.delivery_notes = notes;
    }

    // Atualizar timestamps específicos baseado no status
    if (status === 'in_transit' && !delivery.actual_pickup_time) {
      updateData.actual_pickup_time = new Date().toISOString();
    }

    if (status === 'delivered') {
      updateData.actual_delivery_time = new Date().toISOString();
    }

    // Atualizar entrega
    const { error: updateError } = await supabase
      .from('delivery_trackings')
      .update(updateData)
      .eq('id', deliveryId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Status atualizado',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}
