import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import {
  unauthorizedResponse,
  notFoundResponse,
  successResponse,
  internalErrorResponse,
  forbiddenResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/professionals/me/documents
 * Buscar validações de documentos do profissional logado
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const supabase = await createClient();

    // Buscar profissional (suporta clerk_id direto ou via users)
    let professional = null;

    // Tenta buscar direto por clerk_id
    const { data: profByClerkId } = await supabase
      .from('professionals')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profByClerkId) {
      professional = profByClerkId;
    } else {
      // Tenta via users table (modelo antigo)
      const { data: userData } = await supabase
        .from('users')
        .select('id, user_type')
        .eq('clerk_id', userId)
        .single();

      if (userData && userData.user_type === 'professional') {
        const { data: profByUserId } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', userData.id)
          .single();

        if (profByUserId) {
          professional = profByUserId;
        }
      }
    }

    if (!professional) {
      return notFoundResponse('Perfil profissional não encontrado');
    }

    // Buscar todas as validações de documentos deste profissional
    const { data: validations, error } = await supabase
      .from('document_validations')
      .select('*')
      .eq('professional_id', professional.id)
      .order('document_type', { ascending: true })
      .order('version', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar validações de documentos', error, {
        professionalId: professional.id,
        userId
      });
      throw error;
    }

    // Agrupar por tipo de documento (pegar apenas a última versão)
    const latestValidations = validations?.reduce((acc: Record<string, any>, val: any) => {
      if (!acc[val.document_type] || val.version > acc[val.document_type].version) {
        acc[val.document_type] = val;
      }
      return acc;
    }, {});

    logger.debug('Validações de documentos recuperadas', {
      professionalId: professional.id,
      documentCount: Object.keys(latestValidations || {}).length,
      userId
    });

    return successResponse({
      validations: latestValidations || {},
      allVersions: validations || [],
    });
  } catch (error) {
    logger.error('Erro ao buscar validações de documentos', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao buscar validações');
  }
}
