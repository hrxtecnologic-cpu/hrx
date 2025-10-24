/**
 * Rate Limiting System usando Supabase
 *
 * Protege endpoints contra abuso limitando requisições por usuário/IP
 * Storage: Supabase (tabela rate_limits)
 */

import { createClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitConfig {
  limit: number;
  window: number; // em milissegundos
  prefix: string;
}

/**
 * Rate limiting usando Supabase como storage
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const supabase = await createClient();
    const key = `${config.prefix}:${identifier}`;
    const now = new Date();
    const windowSeconds = config.window / 1000;
    const expiresAt = new Date(now.getTime() + config.window);

    // Buscar registro atual
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('count, window_start')
      .eq('identifier', key)
      .maybeSingle();

    if (fetchError) {
      console.error('[Rate Limit] Erro ao buscar:', fetchError);
      // Fail open - permitir em caso de erro
      return { success: true, remaining: config.limit - 1, reset: expiresAt.getTime(), limit: config.limit };
    }

    if (existing) {
      const windowStart = new Date(existing.window_start);
      const elapsed = (now.getTime() - windowStart.getTime()) / 1000;

      if (elapsed < windowSeconds) {
        // Dentro da janela atual
        if (existing.count >= config.limit) {
          // Limite excedido
          const resetTime = windowStart.getTime() + config.window;
          return {
            success: false,
            remaining: 0,
            reset: resetTime,
            limit: config.limit,
          };
        }

        // Incrementar contador
        await supabase
          .from('rate_limits')
          .update({
            count: existing.count + 1,
            expires_at: expiresAt,
          })
          .eq('identifier', key);

        return {
          success: true,
          remaining: config.limit - existing.count - 1,
          reset: windowStart.getTime() + config.window,
          limit: config.limit,
        };
      }
    }

    // Nova janela
    await supabase
      .from('rate_limits')
      .upsert({
        identifier: key,
        count: 1,
        window_start: now,
        expires_at: expiresAt,
      }, {
        onConflict: 'identifier'
      });

    return {
      success: true,
      remaining: config.limit - 1,
      reset: expiresAt.getTime(),
      limit: config.limit,
    };
  } catch (error) {
    console.error('[Rate Limit] Erro:', error);
    // Fail open - permitir em caso de erro
    const expiresAt = new Date(Date.now() + config.window);
    return { success: true, remaining: config.limit - 1, reset: expiresAt.getTime(), limit: config.limit };
  }
}

/**
 * Presets de rate limiting
 */
export const RateLimitPresets = {
  UPLOAD: {
    limit: 20,
    window: 60000, // 1 minuto
    prefix: 'upload',
  },
  REGISTRATION: {
    limit: 20,
    window: 3600000, // 1 hora
    prefix: 'registration',
  },
  API_READ: {
    limit: 100,
    window: 60000,
    prefix: 'api-read',
  },
  API_WRITE: {
    limit: 30,
    window: 60000,
    prefix: 'api-write',
  },
  AUTH: {
    limit: 5,
    window: 900000, // 15 minutos
    prefix: 'auth',
  },
  PUBLIC_API: {
    limit: 20,
    window: 60000, // 1 minuto
    prefix: 'public-api',
  },
} as const;

/**
 * Helper para criar resposta de erro
 */
export function createRateLimitError(result: RateLimitResult) {
  const resetDate = new Date(result.reset);

  return {
    error: 'Too many requests',
    message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
    limit: result.limit,
    remaining: result.remaining,
    reset: resetDate.toISOString(),
    retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
  };
}
