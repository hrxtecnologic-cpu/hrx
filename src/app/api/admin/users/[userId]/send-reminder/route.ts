/**
 * API: Enviar lembrete de cadastro incompleto
 * POST /api/admin/users/[userId]/send-reminder
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { sendIncompleteRegistrationReminder } from '@/lib/resend/emails';

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
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
    const { userId: targetUserId } = await context.params;
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

    // Buscar usuário alvo
    const targetUser = await client.users.getUser(targetUserId);
    const targetEmail = targetUser.emailAddresses[0]?.emailAddress;
    const targetName = targetUser.firstName || targetUser.lastName
      ? `${targetUser.firstName} ${targetUser.lastName}`.trim()
      : targetEmail?.split('@')[0] || 'Usuário';

    if (!targetEmail) {
      return NextResponse.json({ error: 'Usuário não possui email' }, { status: 400 });
    }

    // Buscar dados no Supabase
    const [profResult, contractorResult, supplierResult] = await Promise.all([
      supabase.from('professionals').select('*').eq('clerk_id', targetUserId).maybeSingle(),
      supabase.from('contractors').select('*').eq('clerk_id', targetUserId).maybeSingle(),
      supabase.from('equipment_suppliers').select('*').eq('clerk_id', targetUserId).maybeSingle(),
    ]);

    const professional = profResult.data;
    const contractor = contractorResult.data;
    const supplier = supplierResult.data;

    // Determinar tipo
    let userType: 'professional' | 'contractor' | 'supplier' | null = null;
    if (professional) userType = 'professional';
    else if (contractor) userType = 'contractor';
    else if (supplier) userType = 'supplier';

    // Verificar documentos
    let hasDocuments = false;
    if (professional) {
      const docsCount = professional.documents && typeof professional.documents === 'object'
        ? Object.keys(professional.documents).length
        : 0;
      const oldDocs = [
        professional.rg_photo_url,
        professional.cpf_photo_url,
        professional.proof_of_residence_url,
        professional.profile_photo_url,
      ].filter(Boolean).length;
      hasDocuments = (docsCount + oldDocs) > 0;
    }

    // Enviar email
    const result = await sendIncompleteRegistrationReminder({
      userName: targetName,
      userEmail: targetEmail,
      userType,
      hasProfessionalProfile: !!professional,
      hasContractorProfile: !!contractor,
      hasSupplierProfile: !!supplier,
      hasDocuments,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lembrete enviado com sucesso',
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Erro ao enviar lembrete', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
