import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({
        hasProfessionalRegistration: false,
        hasContractorRegistration: false,
      });
    }

    // Verificar se tem cadastro profissional
    const { data: professional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    return NextResponse.json({
      hasProfessionalRegistration: !!professional,
      hasContractorRegistration: false, // Contratantes não precisam cadastro prévio
    });
  } catch (error) {
    console.error('Erro ao verificar cadastro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar cadastro' },
      { status: 500 }
    );
  }
}
