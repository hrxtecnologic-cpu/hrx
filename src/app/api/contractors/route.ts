import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { contractorRegistrationSchema } from '@/lib/validations/contractor-registration';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticação (seguindo padrão profissional)
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 2. Parse e valida o body
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

    // 3. Verificar se usuário já tem cadastro de contractor
    const { data: existing } = await supabase
      .from('contractors')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Você já possui um cadastro de contratante' },
        { status: 400 }
      );
    }

    // 4. Cria o contratante vinculado ao clerk_id
    const { data: newContractor, error: insertError } = await supabase
      .from('contractors')
      .insert({
        clerk_id: userId,  // Vincular ao usuário autenticado
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


    // 5. Retorna sucesso
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
