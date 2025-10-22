import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint para verificar status de admin do usuário
 * GET /api/debug/check-admin
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        message: 'Usuário não autenticado',
      });
    }

    // Buscar informações do usuário no Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || '';

    // Verificar admin usando o helper
    const adminCheck = await isAdmin();

    // Verificar ADMIN_EMAILS
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    // Verificar role no Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, clerk_id, email, role, user_type')
      .eq('clerk_id', userId)
      .single();

    return NextResponse.json({
      authenticated: true,
      userId,
      email: userEmail,
      isAdmin: adminCheck.isAdmin,
      checks: {
        inAdminEmails: ADMIN_EMAILS.includes(userEmail.toLowerCase()),
        adminEmailsList: ADMIN_EMAILS,
        supabaseRole: dbUser?.role || null,
        supabaseUserType: dbUser?.user_type || null,
        clerkPublicMetadata: clerkUser.publicMetadata,
      },
      supabaseUser: dbUser,
      howToFix: adminCheck.isAdmin
        ? '✅ Você já é admin!'
        : `❌ Para se tornar admin, faça uma das seguintes ações:

1. Adicione seu email (${userEmail}) à variável ADMIN_EMAILS no arquivo .env.local
   Atual: ADMIN_EMAILS=${ADMIN_EMAILS.join(',')}
   Novo: ADMIN_EMAILS=${ADMIN_EMAILS.join(',')},${userEmail}

2. OU atualize o role no Supabase:
   UPDATE users SET role = 'admin' WHERE clerk_id = '${userId}';

Depois, reinicie o servidor Next.js.`,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao verificar admin',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
