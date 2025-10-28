import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Rota de teste do Sentry - APENAS PARA DESENVOLVIMENTO
 * Esta rota gera um erro proposital para testar se o Sentry está capturando erros
 */
export async function GET() {
  try {
    // Captura um erro com contexto
    Sentry.captureMessage('Teste manual do Sentry - Rota de API', {
      level: 'info',
      tags: {
        test: 'manual',
        type: 'api-route',
      },
      extra: {
        timestamp: new Date().toISOString(),
        route: '/api/test-sentry-error',
      },
    });

    // Agora vamos causar um erro de verdade
    // @ts-ignore
    const resultado = funcaoQueNaoExiste();

    return NextResponse.json({
      success: true,
      message: 'Este código nunca será executado',
    });
  } catch (error) {
    // Captura o erro com detalhes
    Sentry.captureException(error, {
      tags: {
        test: 'manual',
        type: 'api-error',
      },
      extra: {
        message: 'Erro de teste gerado propositalmente na API',
        timestamp: new Date().toISOString(),
      },
    });

    // Re-throw para deixar o Sentry capturar naturalmente também
    throw error;
  }
}
