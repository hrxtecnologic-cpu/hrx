import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { contractorRegistrationSchema } from '@/lib/validations/contractor-registration';
import { z } from 'zod';

// Cliente Supabase com service_role para bypass do RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Parse e valida o body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = contractorRegistrationSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }


    // 2. Verifica se o CNPJ já está cadastrado
    const { data: existingContractor } = await supabase
      .from('contractors')
      .select('id, company_name')
      .eq('cnpj', validatedData.cnpj)
      .single();

    if (existingContractor) {
      return NextResponse.json(
        {
          error: 'CNPJ já cadastrado',
          message: `Já existe um cadastro com este CNPJ: ${existingContractor.company_name}`,
        },
        { status: 409 }
      );
    }

    // 3. Cria o contratante
    const { data: newContractor, error: insertError } = await supabase
      .from('contractors')
      .insert({
        company_name: validatedData.companyName,
        cnpj: validatedData.cnpj,
        responsible_name: validatedData.responsibleName,
        responsible_role: validatedData.responsibleRole || null,
        email: validatedData.email,
        phone: validatedData.phone,
        company_address: validatedData.companyAddress || null,
        website: validatedData.website || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error('Erro ao criar cadastro no banco de dados');
    }


    // 4. Retorna sucesso
    return NextResponse.json({
      success: true,
      contractorId: newContractor.id,
      message: 'Cadastro realizado com sucesso!',
    });

  } catch (error) {

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao processar cadastro',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
