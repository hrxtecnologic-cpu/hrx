/**
 * =====================================================
 * API: Cadastro Manual de Fornecedores (Admin)
 * =====================================================
 * Permite admin cadastrar fornecedores manualmente
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api';

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const data = await request.json();

    const {
      company_name,
      contact_name,
      email,
      phone,
      cnpj,
      city,
      state,
      notes,
      equipment_catalog,
    } = data;

    // Validações
    if (!company_name || !contact_name || !email || !phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se já existe fornecedor com mesmo email ou CNPJ
    let duplicateQuery = supabase
      .from('equipment_suppliers')
      .select('id, company_name, email, cnpj');

    if (cnpj) {
      duplicateQuery = duplicateQuery.or(`email.eq.${email},cnpj.eq.${cnpj}`);
    } else {
      duplicateQuery = duplicateQuery.eq('email', email);
    }

    const { data: existing } = await duplicateQuery.limit(1).single();

    if (existing) {
      return NextResponse.json(
        {
          error: 'Já existe um fornecedor cadastrado com este email ou CNPJ',
          existing: {
            name: existing.company_name,
            email: existing.email,
            cnpj: existing.cnpj,
          },
        },
        { status: 409 }
      );
    }

    // Extrair tipos de equipamento do catálogo
    const equipment_types = equipment_catalog
      ? [...new Set(equipment_catalog.map((item: any) => item.category))]
      : [];

    // Inserir fornecedor
    const { data: supplier, error: insertError } = await supabase
      .from('equipment_suppliers')
      .insert({
        company_name,
        contact_name,
        email,
        phone,
        cnpj,
        city,
        state,
        notes,
        equipment_types,
        equipment_catalog: equipment_catalog || [],
        status: 'active',
        created_by_admin: true,
        created_by_admin_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[manual-supplier] Erro ao inserir:', insertError);
      return NextResponse.json(
        { error: 'Erro ao cadastrar fornecedor', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('[manual-supplier] Fornecedor cadastrado:', supplier.id);

    return NextResponse.json({
      success: true,
      supplier: {
        id: supplier.id,
        company_name: supplier.company_name,
        email: supplier.email,
        status: supplier.status,
      },
    });
  } catch (error: any) {
    console.error('[manual-supplier] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
});
