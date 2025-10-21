import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

/**
 * GET: Buscar status de todos os documentos de um profissional
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

    // Buscar todas as validações de documentos
    const { data: validations, error } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', id)
      .order('document_type', { ascending: true })
      .order('version', { ascending: false });

    if (error) throw error;

    // Agrupar por tipo de documento (pegar apenas a última versão)
    const latestValidations = validations?.reduce((acc: any, val: any) => {
      if (!acc[val.document_type] || val.version > acc[val.document_type].version) {
        acc[val.document_type] = val;
      }
      return acc;
    }, {});

    return NextResponse.json({
      validations: latestValidations || {},
      allVersions: validations || [],
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Validar um documento específico
 */
export async function PATCH(
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
    const { document_type, status, rejection_reason } = await req.json();

    if (!document_type || !status) {
      return NextResponse.json(
        { error: 'Tipo de documento e status são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar user_id do admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    // Buscar profissional para pegar URL do documento
    const { data: professional } = await supabase
      .from('professionals')
      .select('documents')
      .eq('id', id)
      .single();

    if (!professional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há URL do documento
    const documentUrl = professional.documents?.[document_type];
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Documento não foi enviado ainda' },
        { status: 404 }
      );
    }

    // Buscar a validação existente mais recente
    const { data: existingValidation } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', id)
      .eq('document_type', document_type)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingValidation) {
      // CRIAR nova validação se não existir
      console.log(`Criando nova validação para documento ${document_type}`);

      const { error: insertError } = await supabase
        .from('document_validations')
        .insert({
          professional_id: id,
          document_type,
          document_url: documentUrl,
          status,
          rejection_reason: status === 'rejected' ? rejection_reason : null,
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
          version: 1,
        });

      if (insertError) {
        console.error('Erro ao criar validação:', insertError);
        throw insertError;
      }
    } else {
      // ATUALIZAR validação existente
      const { error: updateError } = await supabase
        .from('document_validations')
        .update({
          status,
          rejection_reason: status === 'rejected' ? rejection_reason : null,
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingValidation.id);

      if (updateError) {
        console.error('Erro ao atualizar validação:', updateError);
        throw updateError;
      }
    }

    // Registrar no histórico
    await supabase.from('professional_history').insert({
      professional_id: id,
      action_type: `document_${status}`,
      action_by: adminUser?.id,
      field_changed: document_type,
      new_value: status,
      description: `Documento ${document_type} ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'em análise'}${
        rejection_reason ? `: ${rejection_reason}` : ''
      }`,
    });

    // Verificar se todos os documentos foram aprovados
    const { data: allValidations } = await supabase
      .from('document_validations')
      .select('status')
      .eq('professional_id', id);

    const allApproved = allValidations?.every((v) => v.status === 'approved');
    const anyRejected = allValidations?.some((v) => v.status === 'rejected');

    // Atualizar status geral do profissional
    if (allApproved) {
      await supabase
        .from('professionals')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } else if (anyRejected) {
      await supabase
        .from('professionals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao validar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao validar documento' },
      { status: 500 }
    );
  }
}
