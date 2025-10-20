import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendProfessionalApprovalEmail } from '@/lib/resend/emails';

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
    const supabase = await createClient();

    // Buscar dados do profissional antes de aprovar
    const { data: professional, error: fetchError } = await supabase
      .from('professionals')
      .select('full_name, email')
      .eq('id', id)
      .single();

    if (fetchError || !professional) {
      console.error('❌ Erro ao buscar profissional:', fetchError);
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status do profissional
    const { error } = await supabase
      .from('professionals')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Enviar email de notificação ao profissional
    const emailResult = await sendProfessionalApprovalEmail({
      professionalName: professional.full_name,
      professionalEmail: professional.email,
    });

    if (!emailResult.success) {
      console.error('❌ Erro ao enviar email de aprovação:', emailResult.error);
      // Não falhar a operação se o email não for enviado
    } else {
      console.log(`✅ Profissional aprovado e email enviado para: ${professional.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao aprovar profissional:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar profissional' },
      { status: 500 }
    );
  }
}
