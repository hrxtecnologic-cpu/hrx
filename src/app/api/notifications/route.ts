/**
 * =====================================================
 * API: Notificações do Usuário
 * =====================================================
 * GET - Buscar notificações do usuário
 * POST - Criar notificação
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Buscar user do Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Parâmetros de filtro
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar notificações
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar notificações' },
        { status: 500 }
      );
    }

    // Buscar estatísticas
    const { data: stats } = await supabase
      .from('notification_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        stats: stats || {
          total_notifications: 0,
          unread_count: 0,
          urgent_count: 0,
          high_count: 0,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verificar se é admin
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    // Criar notificação
    const body = await request.json();
    const {
      target_user_id,
      user_type,
      notification_type,
      title,
      message,
      action_url,
      project_id,
      professional_id,
      supplier_id,
      priority = 'normal',
      metadata = {},
    } = body;

    // Validar campos obrigatórios
    if (!target_user_id || !user_type || !notification_type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Chamar função SQL
    const { data: notificationId, error: createError } = await supabase.rpc(
      'create_notification',
      {
        p_user_id: target_user_id,
        p_user_type: user_type,
        p_notification_type: notification_type,
        p_title: title,
        p_message: message,
        p_action_url: action_url || null,
        p_project_id: project_id || null,
        p_professional_id: professional_id || null,
        p_supplier_id: supplier_id || null,
        p_priority: priority,
        p_metadata: metadata,
      }
    );

    if (createError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { notification_id: notificationId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
