import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/contratante/meus-projetos/[id]
 *
 * Retorna detalhes de um projeto específico do contratante
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Buscar projeto do contratante
    const { data: project, error } = await supabase
      .from('event_projects')
      .select(`
        *,
        project_team (
          id,
          role,
          category,
          subcategory,
          quantity,
          duration_days,
          daily_rate,
          total_cost,
          client_price,
          status,
          external_name,
          professionals (
            id,
            full_name,
            categories
          )
        ),
        project_equipment (
          id,
          equipment_type,
          category,
          subcategory,
          name,
          description,
          quantity,
          duration_days,
          total_cost,
          client_price,
          status
        )
      `)
      .eq('id', id)
      .eq('created_by', userId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar projeto:', error);
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado ou você não tem permissão para visualizá-lo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error('❌ Erro no endpoint meus-projetos/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
