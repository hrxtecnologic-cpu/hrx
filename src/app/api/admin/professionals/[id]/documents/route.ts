import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { isAdmin } from '@/lib/auth';
import { DocumentType, DocumentValidationStatus } from '@/types';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  successResponse,
  badRequestResponse,
  handleError,
} from '@/lib/api-response';
import { logger, logDocumentOperation } from '@/lib/logger';

interface DocumentValidationRecord {
  id: string;
  professional_id: string;
  document_type: DocumentType;
  status: DocumentValidationStatus;
  message?: string;
  rejection_reason?: string;
  validated_by: string;
  validated_at: string;
  version: number;
  created_at: string;
}

/**
 * GET: Buscar status de todos os documentos de um profissional
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return forbiddenResponse();
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
    const latestValidations = validations?.reduce((acc: Record<string, DocumentValidationRecord>, val: DocumentValidationRecord) => {
      if (!acc[val.document_type] || val.version > acc[val.document_type].version) {
        acc[val.document_type] = val;
      }
      return acc;
    }, {} as Record<string, DocumentValidationRecord>);

    return successResponse({
      validations: latestValidations || {},
      allVersions: validations || [],
    });
  } catch (error) {
    logger.error('Erro ao buscar documentos do profissional', error instanceof Error ? error : undefined, { professionalId: id });
    return handleError(error, 'Erro ao buscar documentos');
  }
}

/**
 * PATCH: Validar um documento específico
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return forbiddenResponse();
    }

    const { id } = await params;
    const { document_type, status, rejection_reason } = await req.json();

    logger.info('Iniciando validação de documento', {
      professionalId: id,
      documentType: document_type,
      status,
      adminUserId: userId
    });

    if (!document_type || !status) {
      return badRequestResponse('Tipo de documento e status são obrigatórios');
    }

    const supabase = await createClient();

    // Buscar user_id do admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (adminError) {
      logger.error('Erro ao buscar admin no banco', adminError, { userId });
      throw adminError;
    }

    // Buscar profissional para pegar URL do documento
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('documents')
      .eq('id', id)
      .single();

    if (professionalError) {
      logger.error('Erro ao buscar profissional', professionalError, { professionalId: id });
      throw professionalError;
    }

    if (!professional) {
      return notFoundResponse('Profissional não encontrado');
    }

    // Verificar se há URL do documento
    const documentUrl = professional.documents?.[document_type];
    if (!documentUrl) {
      logger.warn('Tentativa de validar documento não enviado', {
        professionalId: id,
        documentType: document_type
      });
      return notFoundResponse('Documento não foi enviado ainda');
    }

    // Buscar a validação existente mais recente
    const { data: existingValidation, error: validationError } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', id)
      .eq('document_type', document_type)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (validationError) {
      logger.error('Erro ao buscar validação existente', validationError, {
        professionalId: id,
        documentType: document_type
      });
      throw validationError;
    }

    if (!existingValidation) {
      // CRIAR nova validação se não existir
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
        logger.error('Erro ao criar validação de documento', insertError, {
          professionalId: id,
          documentType: document_type
        });
        throw insertError;
      }

      logDocumentOperation(status === 'approved' ? 'approve' : 'reject', userId, document_type, {
        professionalId: id,
        action: 'create_validation'
      });
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
        logger.error('Erro ao atualizar validação de documento', updateError, {
          professionalId: id,
          documentType: document_type,
          validationId: existingValidation.id
        });
        throw updateError;
      }

      logDocumentOperation(status === 'approved' ? 'approve' : 'reject', userId, document_type, {
        professionalId: id,
        action: 'update_validation'
      });
    }

    // Registrar no histórico
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
      logger.error('Erro ao registrar histórico', historyError, {
        professionalId: id,
        documentType: document_type
      });
      throw historyError;
    }

    // Verificar se todos os documentos foram aprovados
    const { data: allValidations, error: allValidationsError } = await supabase
      .from('document_validations')
      .select('status')
      .eq('professional_id', id);

    if (allValidationsError) {
      logger.error('Erro ao buscar validações', allValidationsError, { professionalId: id });
      throw allValidationsError;
    }

    const allApproved = allValidations?.every((v) => v.status === 'approved');
    const anyRejected = allValidations?.some((v) => v.status === 'rejected');

    // Atualizar status geral do profissional
    if (allApproved) {
      const { error: updateStatusError } = await supabase
        .from('professionals')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateStatusError) {
        logger.error('Erro ao atualizar status do profissional', updateStatusError, { professionalId: id });
        throw updateStatusError;
      }

      logger.info('Profissional aprovado - todos documentos validados', {
        professionalId: id,
        documentCount: allValidations?.length
      });
    } else if (anyRejected) {
      const { error: updateStatusError } = await supabase
        .from('professionals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateStatusError) {
        logger.error('Erro ao atualizar status do profissional', updateStatusError, { professionalId: id });
        throw updateStatusError;
      }

      logger.warn('Profissional rejeitado - documentos com problemas', {
        professionalId: id,
        documentCount: allValidations?.length
      });
    }

    return successResponse(undefined, 'Documento validado com sucesso');
  } catch (error) {
    logger.error('Erro ao validar documento', error instanceof Error ? error : undefined, {
      professionalId: id,
      documentType: document_type
    });
    return handleError(error, 'Erro ao validar documento');
  }
}
