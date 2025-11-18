import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import {
  unauthorizedResponse,
  notFoundResponse,
  successResponse,
  internalErrorResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api';

/**
 * GET: Buscar dados do profissional logado
 */
export const GET = withAuth(async (userId: string, req: Request) => {
  try {

    const supabase = await createClient();

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!userData) {
      return notFoundResponse('Usuário não encontrado');
    }

    // Buscar dados do profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (error || !professional) {
      return notFoundResponse('Perfil profissional não encontrado');
    }

    return successResponse(professional);
  } catch (error) {
    logger.error('Erro ao buscar perfil profissional', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao buscar perfil');
  }
});

/**
 * PATCH: Atualizar dados do profissional logado
 */
export const PATCH = withAuth(async (userId: string, req: Request) => {
  try {

    const body = await req.json();
    const {
      fullName,
      full_name, // Aceitar ambos os formatos
      phone,
      cpf,
      birthDate,
      birth_date, // Aceitar ambos os formatos
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      cep,
      categories,
      subcategories,
      certifications,
      hasExperience,
      has_experience, // Aceitar ambos os formatos
      experienceYears,
      years_of_experience, // Aceitar ambos os formatos
      experienceDescription,
      experience_description, // Aceitar ambos os formatos
      availability,
      documents,
      portfolio,
      latitude,
      longitude,
      acceptsNotifications,
    } = body;

    // Normalizar campos (aceitar camelCase ou snake_case)
    const normalizedFullName = fullName || full_name;
    const normalizedBirthDate = birthDate || birth_date;
    const normalizedHasExperience = hasExperience !== undefined ? hasExperience : has_experience;
    const normalizedExperienceYears = experienceYears || years_of_experience;
    const normalizedExperienceDescription = experienceDescription || experience_description;

    const supabase = await createClient();

    // Buscar user_id no Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!userData) {
      return notFoundResponse('Usuário não encontrado');
    }

    // Atualizar perfil profissional
    const { data: professional, error } = await supabase
      .from('professionals')
      .update({
        full_name: normalizedFullName,
        phone,
        cpf,
        birth_date: normalizedBirthDate,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        cep,
        categories,
        subcategories,
        has_experience: normalizedHasExperience,
        experience_years: normalizedExperienceYears,
        experience_description: normalizedExperienceDescription,
        availability,
        documents,
        portfolio: portfolio, // Corrigido: portfolio_urls → portfolio
        latitude,
        longitude,
        accepts_notifications: acceptsNotifications,
        // Se foi rejeitado, voltar para pending após edição
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userData.id)
      .select()
      .maybeSingle();

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
});
