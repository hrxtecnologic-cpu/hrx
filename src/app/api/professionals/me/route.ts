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
 * GET /api/professionals/me
 * Buscar dados do profissional logado
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
      .select('*')
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
          .select('*')
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

    logger.debug('Perfil profissional recuperado', {
      professionalId: professional.id,
      userId
    });

    return successResponse(professional);
  } catch (error) {
    logger.error('Erro ao buscar perfil profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao buscar perfil');
  }
}

/**
 * PATCH /api/professionals/me
 * Atualizar dados do profissional logado
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
      cnh_number,
      cnh_validity,
      cnv_validity,
      nr10_validity,
      nr35_validity,
      drt_validity,
      portfolio,
      subcategories,
      certifications,
      // Document URLs
      rg_photo_url,
      cpf_photo_url,
      proof_of_residence_url,
      cnh_photo_url,
      cnv_photo_url,
      nr10_certificate_url,
      nr35_certificate_url,
      drt_photo_url,
      profile_photo_url,
    } = body;

    const supabase = await createClient();

    // Buscar profissional (suporta clerk_id direto ou via users)
    let professionalId = null;

    // Tenta buscar direto por clerk_id
    const { data: profByClerkId } = await supabase
      .from('professionals')
      .select('id, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (profByClerkId) {
      professionalId = profByClerkId.id;
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
          professionalId = profByUserId.id;
        }
      }
    }

    if (!professionalId) {
      return notFoundResponse('Profissional não encontrado');
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
        cnh_number,
        cnh_validity,
        cnv_validity,
        nr10_validity,
        nr35_validity,
        drt_validity,
        portfolio,
        subcategories,
        certifications,
        // Document URLs
        rg_photo_url,
        cpf_photo_url,
        proof_of_residence_url,
        cnh_photo_url,
        cnv_photo_url,
        nr10_certificate_url,
        nr35_certificate_url,
        drt_photo_url,
        profile_photo_url,
        // Se foi rejeitado, voltar para pending após edição
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar perfil profissional', error, {
        professionalId
      });
      throw error;
    }

    logger.info('Perfil profissional atualizado com sucesso', {
      professionalId: professional.id,
      userId
    });

    return successResponse(
      { professional },
      'Perfil atualizado e enviado para nova análise'
    );
  } catch (error) {
    logger.error('Erro ao atualizar perfil profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao atualizar perfil');
  }
}
