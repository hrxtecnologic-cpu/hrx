import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  unauthorizedResponse,
  notFoundResponse,
  successResponse,
  internalErrorResponse,
  forbiddenResponse,
  noContentResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/professionals/[id]
 * Buscar dados de um profissional específico (apenas admin)
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const user = await currentUser();
    const userRole = user?.publicMetadata?.role;

    if (userRole !== 'admin') {
      return forbiddenResponse('Apenas administradores podem acessar esta rota');
    }

    const professionalId = params.id;

    // Buscar profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', professionalId)
      .single();

    if (error || !professional) {
      logger.warn('Profissional não encontrado', {
        professionalId,
        adminUserId: userId
      });
      return notFoundResponse('Profissional não encontrado');
    }

    logger.debug('Profissional recuperado por admin', {
      professionalId,
      adminUserId: userId
    });

    return successResponse(professional);
  } catch (error) {
    logger.error('Erro ao buscar profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao buscar profissional');
  }
}

/**
 * PATCH /api/admin/professionals/[id]
 * Atualizar dados de um profissional (apenas admin)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const user = await currentUser();
    const userRole = user?.publicMetadata?.role;

    if (userRole !== 'admin') {
      return forbiddenResponse('Apenas administradores podem acessar esta rota');
    }

    const professionalId = params.id;
    const body = await req.json();

    // Buscar profissional existente
    const { data: existingProfessional, error: fetchError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', professionalId)
      .single();

    if (fetchError || !existingProfessional) {
      logger.warn('Profissional não encontrado para atualização', {
        professionalId,
        adminUserId: userId
      });
      return notFoundResponse('Profissional não encontrado');
    }

    // Atualizar profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar profissional', error, {
        professionalId,
        adminUserId: userId
      });
      throw error;
    }

    logger.info('Profissional atualizado por admin', {
      professionalId,
      adminUserId: userId,
      changes: Object.keys(body)
    });

    return successResponse(
      { professional },
      'Profissional atualizado com sucesso'
    );
  } catch (error) {
    logger.error('Erro ao atualizar profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao atualizar profissional');
  }
}

/**
 * DELETE /api/admin/professionals/[id]
 * Deletar um profissional (apenas admin)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const user = await currentUser();
    const userRole = user?.publicMetadata?.role;

    if (userRole !== 'admin') {
      return forbiddenResponse('Apenas administradores podem acessar esta rota');
    }

    const professionalId = params.id;

    // Verificar se profissional existe
    const { data: existingProfessional, error: fetchError } = await supabase
      .from('professionals')
      .select('id, full_name')
      .eq('id', professionalId)
      .single();

    if (fetchError || !existingProfessional) {
      logger.warn('Profissional não encontrado para exclusão', {
        professionalId,
        adminUserId: userId
      });
      return notFoundResponse('Profissional não encontrado');
    }

    // Deletar profissional
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', professionalId);

    if (error) {
      logger.error('Erro ao deletar profissional', error, {
        professionalId,
        adminUserId: userId
      });
      throw error;
    }

    logger.warn('Profissional deletado por admin', {
      professionalId,
      professionalName: existingProfessional.full_name,
      adminUserId: userId
    });

    return noContentResponse();
  } catch (error) {
    logger.error('Erro ao deletar profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao deletar profissional');
  }
}
