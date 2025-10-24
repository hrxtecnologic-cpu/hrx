import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {

    // Teste 1: Tabela event_projects
    const { data: projects, error: projectsError } = await supabase
      .from('event_projects')
      .select('*')
      .limit(1);

    if (projectsError) {
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


    // Teste 2: View event_projects_summary
    const { data: summary, error: summaryError } = await supabase
      .from('event_projects_summary')
      .select('*')
      .limit(1);

    if (summaryError) {
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


    return NextResponse.json({
      success: true,
      projects_count: projects?.length || 0,
      summary_count: summary?.length || 0,
      projects: projects,
      summary: summary,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
