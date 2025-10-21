/**
 * Rate Limiting System
 *
 * Protege endpoints contra abuso limitando requisições por usuário/IP
 * Usa memória em desenvolvimento e pode ser adaptado para Redis em produção
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store em memória (para desenvolvimento e pequena escala)
const store: RateLimitStore = {};

// Limpar registros expirados a cada 1 minuto
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

interface RateLimitConfig {
  /**
   * Número máximo de requisições permitidas
   */
  limit: number;

  /**
   * Janela de tempo em milissegundos
   * @example 60000 = 1 minuto
   */
  window: number;

  /**
   * Prefixo para a chave (identifica o endpoint)
   */
  prefix: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Verifica se a requisição está dentro do rate limit
 *
 * @param identifier - Identificador único (userId, IP, etc)
 * @param config - Configuração do rate limit
 * @returns Resultado do rate limit
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();

  // Buscar ou criar registro
  let record = store[key];

  if (!record || record.resetTime < now) {
    // Criar novo registro
    record = {
      count: 0,
      resetTime: now + config.window,
    };
    store[key] = record;
  }

  // Incrementar contador
  record.count++;

  // Verificar se excedeu o limite
  const success = record.count <= config.limit;
  const remaining = Math.max(0, config.limit - record.count);

  return {
    success,
    limit: config.limit,
    remaining,
    reset: record.resetTime,
  };
}

/**
 * Presets de rate limiting para diferentes casos de uso
 */
export const RateLimitPresets = {
  /**
   * Upload de arquivos: 20 uploads por minuto (aumentado para cadastros completos)
   */
  UPLOAD: {
    limit: 20,
    window: 60000, // 1 minuto
    prefix: 'upload',
  },

  /**
   * Cadastro de profissional: 3 cadastros por hora
   */
  REGISTRATION: {
    limit: 3,
    window: 3600000, // 1 hora
    prefix: 'registration',
  },

  /**
   * APIs de consulta: 100 requisições por minuto
   */
  API_READ: {
    limit: 100,
    window: 60000, // 1 minuto
    prefix: 'api-read',
  },

  /**
   * APIs de escrita: 30 requisições por minuto
   */
  API_WRITE: {
    limit: 30,
    window: 60000, // 1 minuto
    prefix: 'api-write',
  },

  /**
   * Login/Auth: 5 tentativas por 15 minutos
   */
  AUTH: {
    limit: 5,
    window: 900000, // 15 minutos
    prefix: 'auth',
  },
} as const;

/**
 * Helper para criar resposta de erro de rate limit
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
