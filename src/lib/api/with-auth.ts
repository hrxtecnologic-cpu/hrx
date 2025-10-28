import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * HOC para rotas que requerem autenticação
 *
 * @example
 * export const GET = withAuth(async (userId, req) => {
 *   // userId está garantido aqui
 *   return NextResponse.json({ userId });
 * });
 */
export function withAuth<T extends any[] = []>(
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

      return await handler(userId, req, ...args);
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || 'Erro de autenticação' },
        { status: 500 }
      );
    }
  };
}
