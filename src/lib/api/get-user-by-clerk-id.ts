import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface SupabaseUser {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string | null;
  user_type: 'professional' | 'contractor' | 'supplier' | 'admin';
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  updated_at: string;
}

/**
 * Busca usuário do Supabase pelo clerk_id
 *
 * @param clerkId - ID do usuário no Clerk
 * @returns Dados do usuário do Supabase
 * @throws Error se usuário não for encontrado
 *
 * @example
 * const user = await getUserByClerkId(userId);
 * console.log(user.user_type); // 'professional' | 'contractor' | 'supplier' | 'admin'
 */
export async function getUserByClerkId(clerkId: string): Promise<SupabaseUser> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      logger.error('Erro ao buscar usuário por clerk_id', error, { clerkId });
      throw new Error('Erro ao buscar usuário');
    }

    if (!data) {
      logger.warn('Usuário não encontrado no Supabase', { clerkId });
      throw new Error('Usuário não encontrado. Por favor, complete seu cadastro.');
    }

    return data as SupabaseUser;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao buscar usuário');
  }
}

/**
 * Versão que retorna null ao invés de throw (para casos opcionais)
 */
export async function getUserByClerkIdOrNull(clerkId: string): Promise<SupabaseUser | null> {
  try {
    return await getUserByClerkId(clerkId);
  } catch {
    return null;
  }
}
