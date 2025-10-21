import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

/**
 * GET: Buscar histórico completo de um profissional
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

    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Buscar histórico com informações do usuário que fez a ação
    const { data: history, error } = await supabase
      .from('professional_history')
      .select(`
        *,
        action_by_user:action_by (
          email,
          full_name
        )
      `)
      .eq('professional_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}
