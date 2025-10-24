import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { Resend } from 'resend';
import { PendingDocumentsEmail } from '@/lib/resend/templates/PendingDocumentsEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST: Enviar email para profissional sobre documentos pendentes
 */
export async function POST(
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

    // Buscar dados do profissional
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', id)
      .single();

    if (professionalError || !professional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }


    // Buscar status de validações dos documentos
    const { data: validations } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', id)
      .order('document_type', { ascending: true })
      .order('version', { ascending: false });

    // Agrupar por tipo de documento (pegar apenas a última versão)
    const latestValidations = validations?.reduce((acc: any, val: any) => {
      if (!acc[val.document_type] || val.version > acc[val.document_type].version) {
        acc[val.document_type] = val;
      }
      return acc;
    }, {});

    // Definir documentos obrigatórios
    const requiredDocs = [
      { key: 'rg_front', name: 'RG (Frente)' },
      { key: 'rg_back', name: 'RG (Verso)' },
      { key: 'cpf', name: 'CPF' },
      { key: 'proof_of_address', name: 'Comprovante de Residência' },
    ];

    // Adicionar CNH se for motorista
    if (professional.categories?.includes('Motorista')) {
      requiredDocs.push({ key: 'cnh_photo', name: 'CNH (Foto)' });
    }

    // Identificar documentos pendentes (não enviados ou não aprovados)
    const pendingDocuments: string[] = [];
    const rejectedDocuments: Array<{ name: string; reason: string }> = [];

    requiredDocs.forEach((doc) => {
      const hasDocument = professional.documents?.[doc.key];
      const validation = latestValidations?.[doc.key];

      if (!hasDocument) {
        // Documento não foi enviado
        pendingDocuments.push(doc.name);
      } else if (validation?.status === 'rejected') {
        // Documento foi rejeitado
        rejectedDocuments.push({
          name: doc.name,
          reason: validation.rejection_reason || 'Documento não atende aos requisitos',
        });
      } else if (!validation || validation.status === 'pending') {
        // Documento enviado mas ainda não validado (não incluir na lista de pendentes)
        // O admin já está analisando
      }
    });

    // Verificar se há documentos para notificar
    if (pendingDocuments.length === 0 && rejectedDocuments.length === 0) {
      return NextResponse.json(
        {
          error: 'Não há documentos pendentes ou rejeitados para notificar',
          message: 'Todos os documentos já foram enviados e estão aguardando validação ou aprovados.',
        },
        { status: 400 }
      );
    }


    // URL do perfil do profissional
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.hrxeventos.com.br'}/cadastro-profissional`;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'HRX Eventos <onboarding@resend.dev>',
      to: [professional.email],
      subject: '⚠️ HRX - Documentos Pendentes no seu Cadastro',
      react: (
        <PendingDocumentsEmail
          professionalName={professional.full_name}
          professionalEmail={professional.email}
          pendingDocuments={pendingDocuments}
          rejectedDocuments={rejectedDocuments}
          profileUrl={profileUrl}
        />
      ),
    });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao enviar email', details: error },
        { status: 500 }
      );
    }


    // Registrar no histórico
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    await supabase.from('professional_history').insert({
      professional_id: id,
      action_type: 'notification_sent',
      action_by: adminUser?.id,
      description: `Email de documentos pendentes enviado. Pendentes: ${pendingDocuments.length}, Rejeitados: ${rejectedDocuments.length}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso',
      emailId: data?.id,
      pendingCount: pendingDocuments.length,
      rejectedCount: rejectedDocuments.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      {
        error: 'Erro ao enviar notificação',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
