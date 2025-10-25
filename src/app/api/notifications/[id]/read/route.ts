/**
 * =====================================================
 * API: Marcar Notificação como Lida
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { id: notificationId } = await context.params;
    const supabase = await createClient();

    // Buscar user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Marcar como lida (UPDATE direto)
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', user.id); // Garantir que é do usuário

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao marcar como lida' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Notificação marcada como lida' },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
