import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { sendProfessionalRejectionEmail } from '@/lib/resend/emails';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem rejeitar profissionais.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { reason, documentsWithIssues } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar dados do profissional antes de rejeitar
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
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Enviar email de notificação ao profissional
    const emailResult = await sendProfessionalRejectionEmail({
      professionalName: professional.full_name,
      professionalEmail: professional.email,
      rejectionReason: reason,
      documentsWithIssues: documentsWithIssues || [],
    });

    if (!emailResult.success) {
      console.error('❌ Erro ao enviar email de rejeição:', emailResult.error);
      // Não falhar a operação se o email não for enviado
    } else {
      console.log(`✅ Profissional rejeitado e email enviado para: ${professional.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao rejeitar profissional:', error);
    return NextResponse.json(
      { error: 'Erro ao rejeitar profissional' },
      { status: 500 }
    );
  }
}
