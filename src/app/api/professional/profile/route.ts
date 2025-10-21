import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET: Buscar dados do profissional logado
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados do profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (error || !professional) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Atualizar dados do profissional logado
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      full_name,
      phone,
      cpf,
      birth_date,
      gender,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      cep,
      categories,
      has_experience,
      years_of_experience,
      availability,
      bio,
      documents,
    } = body;

    const supabase = await createClient();

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar perfil profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .update({
        full_name,
        phone,
        cpf,
        birth_date,
        gender,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        cep,
        categories,
        has_experience,
        years_of_experience,
        availability,
        bio,
        documents,
        // Se foi rejeitado, voltar para pending após edição
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userData.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }

    console.log(`✅ Perfil atualizado: ${professional.email}`);
    return NextResponse.json({ success: true, professional });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
