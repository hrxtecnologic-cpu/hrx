import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verifica se o usuário autenticado é um administrador
 *
 * Verifica tanto:
 * 1. ADMIN_EMAILS environment variable (lista de emails de admin)
 * 2. role = 'admin' na tabela users do Supabase
 *
 * @returns {Promise<{isAdmin: boolean, userId: string | null}>}
 */
export async function isAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  // Verificar se está na lista de ADMIN_EMAILS
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const userEmail = (sessionClaims?.email as string)?.toLowerCase() || '';

  // Se está na lista de emails admin, é admin
  if (ADMIN_EMAILS.includes(userEmail)) {
    return { isAdmin: true, userId };
  }

  // Verificar role no Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', userId)
    .single();

  if (user && user.role === 'admin') {
    return { isAdmin: true, userId };
  }

  return { isAdmin: false, userId };
}

/**
 * Cria um cliente Supabase com service_role para bypass do RLS
 * Deve ser usado APENAS em APIs do lado do servidor
 *
 * ⚠️ ATENÇÃO: Este cliente tem permissões totais e ignora RLS
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
