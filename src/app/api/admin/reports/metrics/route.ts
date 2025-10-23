/**
 * =====================================================
 * API: Métricas do Sistema
 * =====================================================
 * GET - Buscar métricas gerais e KPIs
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

    // Buscar métricas gerais
    const { data: systemMetrics, error: metricsError } = await supabase
      .from('system_metrics')
      .select('*')
      .single();

    if (metricsError) {
      console.error('Erro ao buscar métricas:', metricsError);
    }

    // Buscar KPIs do mês
    const { data: kpis, error: kpisError } = await supabase
      .rpc('get_current_month_kpis');

    if (kpisError) {
      console.error('Erro ao buscar KPIs:', kpisError);
    }

    // Buscar pipeline de vendas
    const { data: salesPipeline, error: pipelineError } = await supabase
      .from('sales_pipeline')
      .select('*');

    if (pipelineError) {
      console.error('Erro ao buscar pipeline:', pipelineError);
    }

    // Buscar eventos próximos
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('upcoming_events')
      .select('*')
      .limit(10);

    if (eventsError) {
      console.error('Erro ao buscar eventos:', eventsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        systemMetrics: systemMetrics || {},
        kpis: kpis || [],
        salesPipeline: salesPipeline || [],
        upcomingEvents: upcomingEvents || [],
      },
    });
  } catch (error) {
    console.error('Erro na API de métricas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
