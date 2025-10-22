import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  unauthorizedResponse,
  notFoundResponse,
  successResponse,
  internalErrorResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET: Buscar dados do profissional logado
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const supabase = await createClient();

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return notFoundResponse('Usuário não encontrado');
    }

    // Buscar dados do profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (error || !professional) {
      return notFoundResponse('Perfil profissional não encontrado');
    }

    return successResponse(professional);
  } catch (error) {
    logger.error('Erro ao buscar perfil profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao buscar perfil');
  }
}

/**
 * PATCH: Atualizar dados do profissional logado
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const {
      full_name,
      phone,
      cpf,
      birth_date,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      cep,
      categories,
      has_experience,
      years_of_experience,
      availability,
      documents,
    } = body;

    const supabase = await createClient();

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return notFoundResponse('Usuário não encontrado');
    }

    // Atualizar perfil profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .update({
        full_name,
        phone,
        cpf,
        birth_date,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        cep,
        categories,
        has_experience,
        years_of_experience,
        availability,
        documents,
        // Se foi rejeitado, voltar para pending após edição
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userData.id)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar perfil profissional', error, {
        userId: userData.id
      });
      throw error;
    }

    logger.info('Perfil profissional atualizado com sucesso', {
      professionalId: professional.id,
      userId: userData.id
    });
    return successResponse({ professional });
  } catch (error) {
    logger.error('Erro ao atualizar perfil profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao atualizar perfil');
  }
}
