import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/lib/api';

/**
 * GET: Buscar validações de documentos do profissional logado
 */
export const GET = withAuth(async (userId: string, req: Request) => {
  try {

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
    const latestValidations = validations?.reduce((acc: Record<string, unknown>, val: Record<string, unknown>) => {
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
    return NextResponse.json(
      { error: 'Erro ao buscar validações' },
      { status: 500 }
    );
  }
});
