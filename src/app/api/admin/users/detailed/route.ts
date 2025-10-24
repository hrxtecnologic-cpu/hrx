/**
 * API: Usuários detalhados (Clerk + Supabase)
 * GET /api/admin/users/detailed
 *
 * Retorna TODOS os usuários do Clerk cruzando com dados do Supabase
 * para mostrar status completo: cadastro, documentos, aprovação, etc.
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Emails com acesso admin
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0);

export async function GET(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const currentUserEmail = currentUser.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

    const publicMetadata = sessionClaims?.publicMetadata as { role?: string } | undefined;
    const isAdmin = ADMIN_EMAILS.includes(currentUserEmail) || publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar TODOS os usuários do Clerk (sem limite)
    const allUsers = [];
    let offset = 0;
    const limit = 500;
    let hasMore = true;

    while (hasMore) {
      const response = await client.users.getUserList({
        limit,
        offset,
        orderBy: '-created_at',
      });

      allUsers.push(...response.data);

      if (response.data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`🔍 Total de usuários no Clerk: ${allUsers.length}`);

    // Buscar todos os profissionais do Supabase
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('id, clerk_id, user_id, full_name, email, cpf, status, created_at, updated_at, documents, rg_photo_url, cpf_photo_url, proof_of_residence_url, profile_photo_url, rejection_reason, approved_at');

    if (profError) {
      console.error('Erro ao buscar profissionais:', profError);
    }

    // Buscar contratantes
    const { data: contractors, error: contractorError } = await supabase
      .from('contractors')
      .select('id, clerk_id, user_id, full_name, email, company_name, status, created_at, updated_at');

    if (contractorError) {
      console.error('Erro ao buscar contratantes:', contractorError);
    }

    // Buscar fornecedores
    const { data: suppliers, error: supplierError } = await supabase
      .from('equipment_suppliers')
      .select('id, clerk_id, company_name, contact_name, email, status, created_at, updated_at');

    if (supplierError) {
      console.error('Erro ao buscar fornecedores:', supplierError);
    }

    // Criar mapa de profissionais por clerk_id e user_id
    const professionalsByClerkId = new Map();
    const professionalsByUserId = new Map();
    const contractorsByClerkId = new Map();
    const suppliersByClerkId = new Map();

    professionals?.forEach(prof => {
      if (prof.clerk_id) {
        professionalsByClerkId.set(prof.clerk_id, { ...prof, type: 'professional' });
      }
      if (prof.user_id) {
        professionalsByUserId.set(prof.user_id, { ...prof, type: 'professional' });
      }
    });

    contractors?.forEach(contractor => {
      if (contractor.clerk_id) {
        contractorsByClerkId.set(contractor.clerk_id, { ...contractor, type: 'contractor' });
      }
    });

    suppliers?.forEach(supplier => {
      if (supplier.clerk_id) {
        suppliersByClerkId.set(supplier.clerk_id, { ...supplier, type: 'supplier' });
      }
    });

    // Enriquecer dados dos usuários
    const enrichedUsers = allUsers.map(user => {
      const clerkId = user.id;
      const professional = professionalsByClerkId.get(clerkId) || professionalsByUserId.get(clerkId);
      const contractor = contractorsByClerkId.get(clerkId);
      const supplier = suppliersByClerkId.get(clerkId);

      // Determinar o tipo primário do usuário (prioridade: professional > contractor > supplier)
      let userType = null;
      let profile = null;

      if (professional) {
        userType = 'professional';
        profile = professional;
      } else if (contractor) {
        userType = 'contractor';
        profile = contractor;
      } else if (supplier) {
        userType = 'supplier';
        profile = supplier;
      }

      // Contar documentos
      let documentsCount = 0;
      let hasDocuments = false;

      if (professional && professional.type === 'professional') {
        // Contar documentos no campo documents (JSONB)
        if (professional.documents && typeof professional.documents === 'object') {
          documentsCount = Object.keys(professional.documents).length;
        }

        // Checar URLs antigas também
        const oldDocs = [
          professional.rg_photo_url,
          professional.cpf_photo_url,
          professional.proof_of_residence_url,
          professional.profile_photo_url,
        ].filter(Boolean);

        documentsCount += oldDocs.length;
        hasDocuments = documentsCount > 0;
      }

      return {
        // Dados do Clerk
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || null,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
        role: (user.publicMetadata as any)?.role || null,
        clerkCreatedAt: user.createdAt,

        // Tipo de cadastro (professional/contractor/supplier)
        userType,

        // Dados do Supabase (Professional)
        hasProfessionalProfile: !!professional,
        professionalId: professional?.id || null,
        professionalStatus: professional?.status || null,
        professionalCreatedAt: professional?.created_at || null,
        professionalUpdatedAt: professional?.updated_at || null,
        professionalApprovedAt: professional?.approved_at || null,
        professionalRejectionReason: professional?.rejection_reason || null,

        // Dados do Contratante
        hasContractorProfile: !!contractor,
        contractorId: contractor?.id || null,
        contractorCompanyName: contractor?.company_name || null,

        // Dados do Fornecedor
        hasSupplierProfile: !!supplier,
        supplierId: supplier?.id || null,
        supplierCompanyName: supplier?.company_name || null,

        // Documentos
        hasDocuments,
        documentsCount,

        // Estado geral
        userState: getUserState(user, profile, hasDocuments),
      };
    });

    return NextResponse.json({
      success: true,
      total: enrichedUsers.length,
      users: enrichedUsers,
    });

  } catch (error: any) {
    console.error('Erro ao buscar usuários detalhados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Determina o estado do usuário baseado nos dados disponíveis
 */
function getUserState(clerkUser: any, professional: any, hasDocuments: boolean): string {
  // Se não tem perfil profissional
  if (!professional) {
    return 'clerk_only'; // Apenas cadastrado no Clerk
  }

  // Se tem perfil profissional
  const status = professional.status;

  if (status === 'approved') {
    return 'approved'; // Aprovado
  }

  if (status === 'rejected') {
    return 'rejected'; // Rejeitado
  }

  // Status = pending
  if (hasDocuments) {
    return 'pending_review'; // Documentos enviados, aguardando aprovação
  }

  return 'profile_incomplete'; // Perfil criado mas sem documentos
}
