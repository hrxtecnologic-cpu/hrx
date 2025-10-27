/**
 * API: Profissionais Unificados (Query Otimizada)
 * GET /api/admin/professionals/unified
 *
 * Retorna todos os profissionais com dados completos em uma única query:
 * - Dados do Clerk (role, email, nome)
 * - Dados do professional (status, categorias, endereço)
 * - Documentos validados/pendentes/órfãos
 * - Histórico de emails
 * - Última alocação/projeto
 *
 * Performance: 1-2s (vs 15-20s da API antiga)
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
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

export interface UnifiedProfessional {
  // Dados básicos
  id: string;
  clerk_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  cpf: string;
  phone: string | null;

  // Localização
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number | null;

  // Categorias
  categories: string[];
  subcategories: string[];

  // Status e aprovação
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  rejection_reason: string | null;

  // Dados do Clerk
  clerk_role: 'admin' | 'professional' | 'contractor' | null;
  clerk_created_at: number;

  // Documentos
  total_documents: number;
  validated_documents: number;
  pending_documents: number;
  rejected_documents: number;
  has_orphan_documents: boolean;
  orphan_documents_count: number;

  // Emails
  total_emails_sent: number;
  last_email_sent_at: string | null;
  last_email_subject: string | null;

  // Alocações
  total_allocations: number;
  active_allocations: number;
  last_allocation_date: string | null;
  last_project_name: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

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

    console.log('🔍 Buscando profissionais com query unificada...');
    const startTime = Date.now();

    // ========== QUERY OTIMIZADA COM JOINS ==========
    const { data: professionals, error } = await supabase.rpc('get_unified_professionals_data');

    if (error) {
      console.error('❌ Erro na query:', error);
      return NextResponse.json({ error: 'Erro ao buscar profissionais', details: error.message }, { status: 500 });
    }

    // Buscar dados do Clerk para todos os profissionais (em lote)
    const clerkIds = professionals?.map((p: any) => p.clerk_id).filter(Boolean) || [];
    const clerkDataMap = new Map();

    if (clerkIds.length > 0) {
      console.log(`📞 Buscando dados do Clerk para ${clerkIds.length} profissionais...`);

      // Buscar em lotes de 100 para evitar timeout
      const batchSize = 100;
      for (let i = 0; i < clerkIds.length; i += batchSize) {
        const batch = clerkIds.slice(i, i + batchSize);

        try {
          const usersData = await client.users.getUserList({
            userId: batch,
          });

          usersData.data.forEach(user => {
            clerkDataMap.set(user.id, {
              role: (user.publicMetadata as any)?.role || null,
              clerk_created_at: user.createdAt,
              email: user.emailAddresses[0]?.emailAddress || null,
            });
          });
        } catch (clerkError) {
          console.error('❌ Erro ao buscar lote do Clerk:', clerkError);
        }
      }
    }

    // Enriquecer com dados do Clerk
    const enrichedProfessionals: UnifiedProfessional[] = (professionals || []).map((prof: any) => {
      const clerkData = clerkDataMap.get(prof.clerk_id) || {};

      return {
        // Dados básicos
        id: prof.id,
        clerk_id: prof.clerk_id,
        user_id: prof.user_id,
        full_name: prof.full_name,
        email: clerkData.email || prof.email,
        cpf: prof.cpf,
        phone: prof.phone,

        // Localização
        city: prof.city,
        state: prof.state,
        latitude: prof.latitude,
        longitude: prof.longitude,
        service_radius_km: prof.service_radius_km,

        // Categorias
        categories: prof.categories || [],
        subcategories: prof.subcategories || [],

        // Status e aprovação
        status: prof.status,
        approved_at: prof.approved_at,
        rejection_reason: prof.rejection_reason,

        // Dados do Clerk
        clerk_role: clerkData.role || null,
        clerk_created_at: clerkData.clerk_created_at || 0,

        // Documentos
        total_documents: prof.total_documents || 0,
        validated_documents: prof.validated_documents || 0,
        pending_documents: prof.pending_documents || 0,
        rejected_documents: prof.rejected_documents || 0,
        has_orphan_documents: prof.has_orphan_documents || false,
        orphan_documents_count: prof.orphan_documents_count || 0,

        // Emails
        total_emails_sent: prof.total_emails_sent || 0,
        last_email_sent_at: prof.last_email_sent_at,
        last_email_subject: prof.last_email_subject,

        // Alocações
        total_allocations: prof.total_allocations || 0,
        active_allocations: prof.active_allocations || 0,
        last_allocation_date: prof.last_allocation_date,
        last_project_name: prof.last_project_name,

        // Timestamps
        created_at: prof.created_at,
        updated_at: prof.updated_at,
      };
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Query concluída em ${duration}s (${enrichedProfessionals.length} profissionais)`);

    return NextResponse.json({
      success: true,
      total: enrichedProfessionals.length,
      professionals: enrichedProfessionals,
      performance: {
        duration_seconds: parseFloat(duration),
        total_records: enrichedProfessionals.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar profissionais unificados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais', details: error.message },
      { status: 500 }
    );
  }
}
