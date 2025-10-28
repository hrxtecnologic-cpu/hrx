import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

/**
 * HOC para rotas que requerem autenticação E permissão de admin
 *
 * @example
 * export const GET = withAdmin(async (userId, req) => {
 *   // userId está garantido e é admin
 *   return NextResponse.json({ message: 'Admin only' });
 * });
 */
export function withAdmin<T extends any[] = []>(
  handler: (userId: string, req: Request, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    try {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: 'Não autenticado' },
          { status: 401 }
        );
      }

      const admin = await isAdmin(userId);

      if (!admin) {
        return NextResponse.json(
          { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
          { status: 403 }
        );
      }

      return await handler(userId, req, ...args);
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || 'Erro de autenticação' },
        { status: 500 }
      );
    }
  };
}
