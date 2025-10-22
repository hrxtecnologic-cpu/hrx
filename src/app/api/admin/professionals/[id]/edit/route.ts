import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import {
  unauthorizedResponse,
  forbiddenResponse,
  successResponse,
  handleError,
} from '@/lib/api-response';
import { logger, logDataChange } from '@/lib/logger';

/**
 * PATCH: Admin edita dados de um profissional
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedResponse();
    }

    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await req.json();

    const {
      full_name,
      cpf,
      birth_date,
      email,
      phone,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      cep,
    } = body;

    const supabase = await createClient();

    // Buscar user_id do admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single();

    // Buscar dados antigos para comparação
    const { data: oldData } = await supabase
      .from('professionals')
      .select('full_name, cpf, birth_date, email, phone, city, state')
      .eq('id', id)
      .single();

    // Atualizar profissional
    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        full_name,
        cpf,
        birth_date,
        email,
        phone,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        cep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Erro ao atualizar profissional', updateError, { professionalId: id });
      throw updateError;
    }

    // Registrar no histórico
    const changedFields = [];
    if (oldData.full_name !== full_name) changedFields.push('nome');
    if (oldData.cpf !== cpf) changedFields.push('CPF');
    if (oldData.birth_date !== birth_date) changedFields.push('data de nascimento');
    if (oldData.email !== email) changedFields.push('email');
    if (oldData.phone !== phone) changedFields.push('telefone');
    if (oldData.city !== city) changedFields.push('cidade');
    if (oldData.state !== state) changedFields.push('estado');

    if (changedFields.length > 0) {
      await supabase.from('professional_history').insert({
        professional_id: id,
        action_type: 'updated',
        action_by: adminUser?.id,
        description: `Dados atualizados pelo admin (${changedFields.join(', ')})`,
        metadata: {
          changed_by: adminUser?.email,
          fields: changedFields,
        },
      });

      logDataChange('professional', id, adminUser?.id || userId, {
        fields: changedFields
      });
    }

    return successResponse(undefined, 'Profissional atualizado com sucesso');
  } catch (error) {
    logger.error('Erro ao editar profissional', error instanceof Error ? error : undefined, { professionalId: id });
    return handleError(error, 'Erro ao editar profissional');
  }
}
