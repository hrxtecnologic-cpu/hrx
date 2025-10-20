import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // TODO: Verificar se é admin (em produção)

    const { id } = await params;
    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Atualizar status do profissional
    const { error } = await supabase
      .from('professionals')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // TODO: Enviar email de notificação ao profissional

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao rejeitar profissional:', error);
    return NextResponse.json(
      { error: 'Erro ao rejeitar profissional' },
      { status: 500 }
    );
  }
}
