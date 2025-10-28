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
 * GET: Buscar dados do fornecedor logado
 */
export const GET = withAuth(async (userId: string, req: Request) => {
  try{

    const supabase = await createClient();

    // Buscar fornecedor pelo clerk_id
    const { data: supplier, error } = await supabase
      .from('equipment_suppliers')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error || !supplier) {
      return notFoundResponse('Perfil de fornecedor não encontrado');
    }

    return successResponse(supplier);
  } catch (error) {
    logger.error('Erro ao buscar perfil do fornecedor', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao buscar perfil');
  }
});

/**
 * PATCH: Atualizar dados do fornecedor logado
 */
export const PATCH = withAuth(async (userId: string, req: Request) => {
  try {

    const body = await req.json();
    const {
      company_name,
      legal_name,
      contact_name,
      email,
      phone,
      whatsapp,
      cnpj,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      cep,
      address,
      zip_code,
      latitude,
      longitude,
      equipment_types,
      equipment_catalog,
      pricing,
      delivery_radius_km,
      delivery_policy,
      cancellation_policy,
      notes,
    } = body;

    // Validações básicas
    if (!company_name || !contact_name || !email || !phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: company_name, contact_name, email, phone' },
        { status: 400 }
      );
    }

    if (equipment_types && (!Array.isArray(equipment_types) || equipment_types.length === 0)) {
      return NextResponse.json(
        { error: 'equipment_types deve ser uma lista não-vazia' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar fornecedor existente
    const { data: existingSupplier } = await supabase
      .from('equipment_suppliers')
      .select('id, email')
      .eq('clerk_id', userId)
      .single();

    if (!existingSupplier) {
      return notFoundResponse('Fornecedor não encontrado');
    }

    // Se o email foi alterado, verificar se já existe outro fornecedor com esse email
    if (email !== existingSupplier.email) {
      const { data: emailExists } = await supabase
        .from('equipment_suppliers')
        .select('id, company_name')
        .eq('email', email)
        .neq('id', existingSupplier.id)
        .maybeSingle();

      if (emailExists) {
        return NextResponse.json(
          {
            error: 'Email já cadastrado',
            message: `Já existe um cadastro com este email: ${emailExists.company_name}`,
          },
          { status: 409 }
        );
      }
    }

    // Atualizar perfil do fornecedor
    const { data: supplier, error } = await supabase
      .from('equipment_suppliers')
      .update({
        company_name,
        legal_name: legal_name || null,
        contact_name,
        email,
        phone,
        whatsapp: whatsapp || null,
        cnpj: cnpj || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        cep: cep || null,
        address: address || null,
        zip_code: zip_code || null,
        latitude: latitude || null,
        longitude: longitude || null,
        equipment_types: equipment_types || null,
        equipment_catalog: equipment_catalog || null,
        pricing: pricing || null,
        delivery_radius_km: delivery_radius_km || null,
        delivery_policy: delivery_policy || null,
        cancellation_policy: cancellation_policy || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar perfil do fornecedor', error, {
        userId,
      });
      throw error;
    }

    logger.info('Perfil do fornecedor atualizado com sucesso', {
      supplierId: supplier.id,
      userId,
    });
    return successResponse({ supplier });
  } catch (error) {
    logger.error('Erro ao atualizar perfil do fornecedor', error instanceof Error ? error : undefined);
    return internalErrorResponse('Erro ao atualizar perfil');
  }
});
