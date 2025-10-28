/**
 * API Helpers - Utilitários para rotas de API
 *
 * Este módulo exporta helpers para:
 * - Autenticação (withAuth, withAdmin)
 * - Busca de usuários (getUserByClerkId)
 * - Respostas padronizadas (já existe em api-response.ts)
 */

export { withAuth } from './with-auth';
export { withAdmin } from './with-admin';
export { getUserByClerkId, getUserByClerkIdOrNull } from './get-user-by-clerk-id';
export type { SupabaseUser } from './get-user-by-clerk-id';
