/**
 * =====================================================
 * API: Cadastro Manual de Profissionais (Admin)
 * =====================================================
 * Permite admin cadastrar profissionais manualmente
 * durante período de transição
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api';

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const data = await request.json();

    const {
      full_name,
      cpf,
      email,
      phone,
      cep,
      street,
      number,
      neighborhood,
      city,
      state,
      categories,
      status,
      availability,
    } = data;

    // Validações básicas
    if (!full_name || !cpf || !email || !phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos uma categoria' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se já existe profissional com mesmo CPF ou email
    const { data: existing } = await supabase
      .from('professionals')
      .select('id, full_name, cpf, email')
      .or(`cpf.eq.${cpf},email.eq.${email}`)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: 'Já existe um profissional cadastrado com este CPF ou email',
          existing: {
            name: existing.full_name,
            cpf: existing.cpf,
            email: existing.email,
          },
        },
        { status: 409 }
      );
    }

    // Inserir profissional
    const { data: professional, error: insertError } = await supabase
      .from('professionals')
      .insert({
        full_name,
        cpf,
        email,
        phone,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        categories,
        subcategories: {},
        status: status || 'approved',
        availability: availability || {
          weekdays: true,
          weekends: true,
          holidays: false,
          night: false,
          travel: false,
        },
        service_radius_km: 50,
        experience_years: 0,
        documents: {},
        portfolio_urls: [],
        created_by_admin: true,
        created_by_admin_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[manual-professional] Erro ao inserir:', insertError);
      return NextResponse.json(
        { error: 'Erro ao cadastrar profissional', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('[manual-professional] Profissional cadastrado:', professional.id);

    return NextResponse.json({
      success: true,
      professional: {
        id: professional.id,
        full_name: professional.full_name,
        email: professional.email,
        status: professional.status,
      },
    });
  } catch (error: any) {
    console.error('[manual-professional] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
});
