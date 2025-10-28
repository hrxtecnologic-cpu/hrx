/**
 * =====================================================
 * API: Preferencias de Notificacoes
 * =====================================================
 * GET - Buscar preferencias do usuario
 * PUT - Atualizar preferencias do usuario
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    let { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          notify_project_updates: true,
          notify_invitations: true,
          notify_quotations: true,
          notify_documents: true,
          notify_payments: true,
          notify_reminders: true,
          digest_frequency: 'instant',
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar preferencias:', createError);
        return NextResponse.json({ error: 'Erro ao criar preferencias' }, { status: 500 });
      }

      preferences = newPreferences;
    } else if (error) {
      console.error('Erro ao buscar preferencias:', error);
      return NextResponse.json({ error: 'Erro ao buscar preferencias' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Erro na API de preferencias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const body = await request.json();

    const allowedFields = [
      'email_enabled',
      'push_enabled',
      'sms_enabled',
      'notify_project_updates',
      'notify_invitations',
      'notify_quotations',
      'notify_documents',
      'notify_payments',
      'notify_reminders',
      'digest_frequency',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 });
    }

    const { data: updatedPreferences, error: updateError } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar preferencias:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar preferencias' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Erro na API de preferencias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
