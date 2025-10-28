/**
 * =====================================================
 * API: Verificar Duplicados
 * =====================================================
 * Verifica se já existe cadastro com CPF, email ou CNPJ
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api';

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const { type, cpf, email, cnpj } = await request.json();

    const supabase = await createClient();

    let tableName = '';
    let query: any = null;

    switch (type) {
      case 'professional':
        tableName = 'professionals';
        query = supabase
          .from(tableName)
          .select('id, full_name, cpf, email');

        if (cpf && email) {
          query = query.or(`cpf.eq.${cpf},email.eq.${email}`);
        } else if (cpf) {
          query = query.eq('cpf', cpf);
        } else if (email) {
          query = query.eq('email', email);
        }
        break;

      case 'client':
        tableName = 'event_projects';
        query = supabase
          .from(tableName)
          .select('id, client_name, client_email')
          .eq('client_email', email);
        break;

      case 'supplier':
        tableName = 'equipment_suppliers';
        query = supabase
          .from(tableName)
          .select('id, company_name, email, cnpj');

        if (cnpj && email) {
          query = query.or(`cnpj.eq.${cnpj},email.eq.${email}`);
        } else if (cnpj) {
          query = query.eq('cnpj', cnpj);
        } else if (email) {
          query = query.eq('email', email);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo inválido' },
          { status: 400 }
        );
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('[check-duplicate] Erro:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar duplicados' },
        { status: 500 }
      );
    }

    if (data) {
      // Determinar qual campo é duplicado
      let duplicateField = 'email';
      if (type === 'professional' && data.cpf === cpf) {
        duplicateField = 'cpf';
      } else if (type === 'supplier' && data.cnpj === cnpj) {
        duplicateField = 'cnpj';
      }

      return NextResponse.json({
        isDuplicate: true,
        duplicateField,
        existingRecord: data,
      });
    }

    return NextResponse.json({
      isDuplicate: false,
    });
  } catch (error: any) {
    console.error('[check-duplicate] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
