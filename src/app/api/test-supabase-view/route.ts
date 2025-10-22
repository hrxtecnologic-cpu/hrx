import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida ✅' : 'FALTANDO ❌');

    // Teste 1: Tabela event_projects
    console.log('\n📊 Teste 1: Consultando tabela event_projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('event_projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      console.log('❌ Erro na tabela event_projects:', projectsError);
      return NextResponse.json({
        test: 'event_projects',
        success: false,
        error: projectsError,
        message: projectsError.message,
        details: projectsError.details,
        hint: projectsError.hint,
        code: projectsError.code,
      });
    }

    console.log('✅ Tabela event_projects OK:', projects);

    // Teste 2: View event_projects_summary
    console.log('\n📊 Teste 2: Consultando view event_projects_summary...');
    const { data: summary, error: summaryError } = await supabase
      .from('event_projects_summary')
      .select('*')
      .limit(1);

    if (summaryError) {
      console.log('❌ Erro na view event_projects_summary:', summaryError);
      return NextResponse.json({
        test: 'event_projects_summary',
        success: false,
        error: summaryError,
        message: summaryError.message,
        details: summaryError.details,
        hint: summaryError.hint,
        code: summaryError.code,
      });
    }

    console.log('✅ View event_projects_summary OK:', summary);

    return NextResponse.json({
      success: true,
      projects_count: projects?.length || 0,
      summary_count: summary?.length || 0,
      projects: projects,
      summary: summary,
    });
  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
