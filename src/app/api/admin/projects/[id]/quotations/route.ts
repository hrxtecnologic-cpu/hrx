import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/projects/[id]/quotations
 *
 * Lista orçamentos de um projeto
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const supabase = await createClient();

    const { data: quotations, error } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        supplier:equipment_suppliers(
          company_name,
          contact_name,
          email,
          phone
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar orçamentos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotations: quotations || [],
    });
  } catch (error: any) {
    console.error('Erro no endpoint quotations:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
