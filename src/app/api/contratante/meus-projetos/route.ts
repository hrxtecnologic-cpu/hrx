import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/contratante/meus-projetos
 *
 * Lista todos os projetos criados pelo contratante logado
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Buscar projetos do contratante usando created_by
    const { data: projects, error } = await supabase
      .from('event_projects')
      .select(`
        id,
        project_number,
        event_name,
        event_type,
        event_date,
        event_description,
        venue_city,
        venue_state,
        status,
        is_urgent,
        expected_attendance,
        total_client_price,
        created_at,
        updated_at,
        quoted_at,
        approved_at,
        completed_at
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar projetos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      total: projects?.length || 0,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
