/**
 * =====================================================
 * API: Relatório de Período
 * =====================================================
 * GET - Gerar relatório para período específico
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verificar se é admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }

    // Parâmetros
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'start_date e end_date são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar relatório
    const { data: report, error: reportError } = await supabase.rpc('generate_period_report', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (reportError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar relatório' },
        { status: 500 }
      );
    }

    // Agrupar por categoria
    const grouped = (report || []).reduce((acc: any, item: any) => {
      const category = item.metric_category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        metrics: report || [],
        grouped: grouped,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
