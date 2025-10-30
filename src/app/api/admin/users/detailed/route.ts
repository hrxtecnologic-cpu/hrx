/**
 * API: Usuários detalhados (Clerk + Supabase)
 * GET /api/admin/users/detailed
 *
 * Retorna TODOS os usuários do Clerk cruzando com dados do Supabase
 * para mostrar status completo: cadastro, documentos, aprovação, etc.
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { checkMultipleUsersDocuments } from '@/lib/supabase/storage-helper';

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

export async function GET(req: NextRequest) {
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

    // Buscar TODOS os usuários do Clerk (com limite de segurança)
    const allUsers = [];
    let offset = 0;
    const limit = 500;
    let hasMore = true;
    const MAX_ITERATIONS = 100; // Máximo de 50.000 usuários (500 * 100)
    let iterations = 0;

    while (hasMore && iterations < MAX_ITERATIONS) {
      try {
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
          iterations++;
        }

        // Log de progresso a cada 5 iterações (2500 usuários)
        if (iterations > 0 && iterations % 5 === 0) {
          console.log(`[users/detailed] Progresso: ${allUsers.length} usuários carregados`);
        }
      } catch (clerkError: any) {
        console.error('[users/detailed] Erro ao buscar usuários do Clerk:', clerkError.message);
        // Se houver erro na API do Clerk, parar o loop
        hasMore = false;
      }
    }

    // Avisar se atingiu o limite
    if (iterations >= MAX_ITERATIONS) {
      console.warn('[users/detailed] Limite de iterações atingido. Alguns usuários podem não ter sido carregados.');
    }

    // Verificar documentos no storage para TODOS os usuários (detectar órfãos)
    const allClerkIds = allUsers.map(u => u.id);
    const storageDocuments = await checkMultipleUsersDocuments(allClerkIds);

    // Buscar todos os profissionais do Supabase
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, clerk_id, user_id, full_name, email, cpf, status, created_at, updated_at, documents, rg_photo_url, cpf_photo_url, proof_of_residence_url, profile_photo_url, rejection_reason, approved_at');

    // Buscar contratantes
    const { data: contractors } = await supabase
      .from('contractors')
      .select('id, clerk_id, user_id, full_name, email, company_name, status, created_at, updated_at');

    // Buscar fornecedores
    const { data: suppliers } = await supabase
      .from('equipment_suppliers')
      .select('id, clerk_id, company_name, contact_name, email, status, created_at, updated_at');

    // OTIMIZAÇÃO: Buscar último email usando RPC function (10-20x mais rápido)
    const recipientEmails = allUsers
      .map(u => u.emailAddresses[0]?.emailAddress)
      .filter(Boolean);

    const { data: emailLogs } = await supabase
      .rpc('get_latest_emails_by_recipients', {
        recipient_emails: recipientEmails
      });

    // Criar mapa de último email por email do usuário
    const lastEmailByUserEmail = new Map();
    (emailLogs || []).forEach(log => {
      lastEmailByUserEmail.set(log.recipient_email, {
        sent_at: log.sent_at,
        subject: log.subject
      });
    });

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
      let hasOrphanDocuments = false;
      let orphanDocumentsCount = 0;
      let orphanDocumentsFiles: string[] = [];

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

      // Verificar documentos órfãos (no storage mas sem cadastro)
      const storageCheck = storageDocuments.get(clerkId);
      if (!professional && storageCheck && storageCheck.hasDocuments) {
        hasOrphanDocuments = true;
        orphanDocumentsCount = storageCheck.documentsCount;
        orphanDocumentsFiles = storageCheck.files;
      }

      // Buscar último email enviado
      const userEmail = user.emailAddresses[0]?.emailAddress;
      const lastEmail = userEmail ? lastEmailByUserEmail.get(userEmail) : null;

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

        // Documentos órfãos (no storage mas sem cadastro)
        hasOrphanDocuments,
        orphanDocumentsCount,
        orphanDocumentsFiles,

        // Último email enviado
        lastEmailSent: lastEmail?.sent_at || null,
        lastEmailSubject: lastEmail?.subject || null,

        // Estado geral
        userState: getUserState(user, profile, hasDocuments, hasOrphanDocuments),
      };
    });

    return NextResponse.json({
      success: true,
      total: enrichedUsers.length,
      users: enrichedUsers,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Determina o estado do usuário baseado nos dados disponíveis
 */
function getUserState(clerkUser: any, professional: any, hasDocuments: boolean, hasOrphanDocuments: boolean): string {
  // Se não tem perfil profissional
  if (!professional) {
    // Mas tem documentos no storage (órfãos)
    if (hasOrphanDocuments) {
      return 'documents_orphan'; // Documentos enviados mas cadastro não completado
    }
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
