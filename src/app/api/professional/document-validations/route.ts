import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET: Buscar validações de documentos do profissional logado
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

    // Buscar professional_id
    const { data: professional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (!professional) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      );
    }

    // Buscar todas as validações de documentos deste profissional
    const { data: validations, error } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', professional.id)
      .order('document_type', { ascending: true })
      .order('version', { ascending: false });

    if (error) throw error;

    // Agrupar por tipo de documento (pegar apenas a última versão)
    const latestValidations = validations?.reduce((acc: any, val: any) => {
      if (!acc[val.document_type] || val.version > acc[val.document_type].version) {
        acc[val.document_type] = val;
      }
      return acc;
    }, {});

    return NextResponse.json({
      validations: latestValidations || {},
      allVersions: validations || [],
    });
  } catch (error) {
    console.error('Erro ao buscar validações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar validações' },
      { status: 500 }
    );
  }
}
