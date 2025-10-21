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
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      {
        error: 'Erro ao buscar documentos',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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
    console.log('[PATCH] Iniciando validação de documento');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    console.log('[PATCH] userId:', userId);

    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const { document_type, status, rejection_reason } = await req.json();
    console.log('[PATCH] Validando documento:', { id, document_type, status });

    if (!document_type || !status) {
      return NextResponse.json(
        { error: 'Tipo de documento e status são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar user_id do admin
    console.log('[PATCH] Buscando adminUser...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (adminError) {
      console.error('[PATCH] Erro ao buscar admin:', adminError);
      throw adminError;
    }
    console.log('[PATCH] adminUser encontrado:', adminUser?.id);

    // Buscar profissional para pegar URL do documento
    console.log('[PATCH] Buscando profissional...');
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('documents')
      .eq('id', id)
      .single();

    if (professionalError) {
      console.error('[PATCH] Erro ao buscar profissional:', professionalError);
      throw professionalError;
    }

    if (!professional) {
      console.error('[PATCH] Profissional não encontrado');
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }
    console.log('[PATCH] Profissional encontrado, documents:', professional.documents);

    // Verificar se há URL do documento
    const documentUrl = professional.documents?.[document_type];
    if (!documentUrl) {
      console.error('[PATCH] Documento não enviado:', document_type);
      return NextResponse.json(
        { error: 'Documento não foi enviado ainda' },
        { status: 404 }
      );
    }
    console.log('[PATCH] documentUrl:', documentUrl);

    // Buscar a validação existente mais recente
    console.log('[PATCH] Buscando validação existente...');
    const { data: existingValidation, error: validationError } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', id)
      .eq('document_type', document_type)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (validationError) {
      console.error('[PATCH] Erro ao buscar validação:', validationError);
      throw validationError;
    }
    console.log('[PATCH] existingValidation:', existingValidation?.id);

    if (!existingValidation) {
      // CRIAR nova validação se não existir
      console.log(`[PATCH] Criando nova validação para documento ${document_type}`);

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
        console.error('[PATCH] Erro ao criar validação:', insertError);
        throw insertError;
      }
      console.log('[PATCH] Validação criada com sucesso');
    } else {
      // ATUALIZAR validação existente
      console.log('[PATCH] Atualizando validação existente:', existingValidation.id);

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
        console.error('[PATCH] Erro ao atualizar validação:', updateError);
        throw updateError;
      }
      console.log('[PATCH] Validação atualizada com sucesso');
    }

    // Registrar no histórico
    console.log('[PATCH] Registrando no histórico...');
    const { error: historyError } = await supabase.from('professional_history').insert({
      professional_id: id,
      action_type: `document_${status}`,
      action_by: adminUser?.id,
      field_changed: document_type,
      new_value: status,
      description: `Documento ${document_type} ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'em análise'}${
        rejection_reason ? `: ${rejection_reason}` : ''
      }`,
    });

    if (historyError) {
      console.error('[PATCH] Erro ao registrar histórico:', historyError);
      throw historyError;
    }
    console.log('[PATCH] Histórico registrado com sucesso');

    // Verificar se todos os documentos foram aprovados
    console.log('[PATCH] Verificando status de todos os documentos...');
    const { data: allValidations, error: allValidationsError } = await supabase
      .from('document_validations')
      .select('status')
      .eq('professional_id', id);

    if (allValidationsError) {
      console.error('[PATCH] Erro ao buscar validações:', allValidationsError);
      throw allValidationsError;
    }

    const allApproved = allValidations?.every((v) => v.status === 'approved');
    const anyRejected = allValidations?.some((v) => v.status === 'rejected');
    console.log('[PATCH] Status das validações:', { allApproved, anyRejected, total: allValidations?.length });

    // Atualizar status geral do profissional
    if (allApproved) {
      console.log('[PATCH] Todos documentos aprovados, atualizando profissional para approved');
      const { error: updateStatusError } = await supabase
        .from('professionals')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateStatusError) {
        console.error('[PATCH] Erro ao atualizar status do profissional:', updateStatusError);
        throw updateStatusError;
      }
    } else if (anyRejected) {
      console.log('[PATCH] Algum documento rejeitado, atualizando profissional para rejected');
      const { error: updateStatusError } = await supabase
        .from('professionals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateStatusError) {
        console.error('[PATCH] Erro ao atualizar status do profissional:', updateStatusError);
        throw updateStatusError;
      }
    }

    console.log('[PATCH] Validação concluída com sucesso!');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao validar documento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      {
        error: 'Erro ao validar documento',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
