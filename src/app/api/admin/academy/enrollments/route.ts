import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/academy/enrollments
 * Lista todas as matrículas (admin)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (userData?.is_admin !== true) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar todas as matrículas com informações de aluno e curso
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        professionals:professional_id (
          id,
          full_name,
          email
        ),
        courses:course_id (
          id,
          title,
          category
        )
      `)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar matrículas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar matrículas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollments || [],
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
