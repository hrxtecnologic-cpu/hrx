/**
 * =====================================================
 * API: Marcar Todas as Notificações como Lidas
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

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

    // Marcar todas como lidas
    const { data: count, error } = await supabase.rpc('mark_all_notifications_as_read', {
      p_user_id: user.id,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao marcar notificações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { marked_count: count },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
