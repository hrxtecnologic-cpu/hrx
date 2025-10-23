import Redis from 'ioredis';

// =====================================================
// Redis Client Singleton
// =====================================================

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL não configurado nas variáveis de ambiente');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on('error', (error) => {
      console.error('[Redis] Erro:', error);
    });

    redis.on('connect', () => {
      console.log('[Redis] Conectado');
    });
  }

  return redis;
}

// =====================================================
// Cache Utilities
// =====================================================

export interface CacheOptions {
  ttl?: number; // segundos
  prefix?: string;
}

/**
 * Salva dados no cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl, prefix = 'cache' } = options;
  const fullKey = `${prefix}:${key}`;
  const client = getRedisClient();

  const serialized = JSON.stringify(value);

  if (ttl) {
    await client.set(fullKey, serialized, 'EX', ttl);
  } else {
    await client.set(fullKey, serialized);
  }
}

/**
 * Recupera dados do cache
 */
export async function getCache<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const { prefix = 'cache' } = options;
  const fullKey = `${prefix}:${key}`;
  const client = getRedisClient();

  const data = await client.get(fullKey);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
}

/**
 * Remove dados do cache
 */
export async function deleteCache(
  key: string,
  options: CacheOptions = {}
): Promise<void> {
  const { prefix = 'cache' } = options;
  const fullKey = `${prefix}:${key}`;
  const client = getRedisClient();

  await client.del(fullKey);
}

/**
 * Remove múltiplas chaves por padrão
 */
export async function deleteCachePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<void> {
  const { prefix = 'cache' } = options;
  const fullPattern = `${prefix}:${pattern}`;
  const client = getRedisClient();

  const keys = await client.keys(fullPattern);

  if (keys.length > 0) {
    await client.del(...keys);
  }
}

// =====================================================
// Rate Limiting Utilities
// =====================================================

export interface RateLimitOptions {
  limit: number; // número de requisições
  window: number; // janela em segundos
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp Unix em segundos
}

/**
 * Implementa rate limiting usando sliding window
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, window, prefix = 'ratelimit' } = options;
  const key = `${prefix}:${identifier}`;
  const client = getRedisClient();

  const now = Date.now();
  const windowStart = now - window * 1000;

  // Remove requisições antigas da janela
  await client.zremrangebyscore(key, 0, windowStart);

  // Conta requisições na janela atual
  const count = await client.zcard(key);

  if (count >= limit) {
    // Busca o timestamp da requisição mais antiga
    const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
    const resetTime = oldest.length > 0
      ? Math.ceil((parseInt(oldest[1]) + window * 1000) / 1000)
      : Math.ceil((now + window * 1000) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Adiciona nova requisição
  await client.zadd(key, now, `${now}`);
  await client.expire(key, window);

  return {
    success: true,
    limit,
    remaining: limit - count - 1,
    reset: Math.ceil((now + window * 1000) / 1000),
  };
}

/**
 * Reseta rate limit para um identifier
 */
export async function resetRateLimit(
  identifier: string,
  prefix: string = 'ratelimit'
): Promise<void> {
  const key = `${prefix}:${identifier}`;
  const client = getRedisClient();
  await client.del(key);
}

// =====================================================
// Session/Lock Utilities
// =====================================================

/**
 * Implementa lock distribuído (mutex)
 */
export async function acquireLock(
  resource: string,
  ttl: number = 10
): Promise<boolean> {
  const key = `lock:${resource}`;
  const client = getRedisClient();

  const result = await client.set(key, '1', 'EX', ttl, 'NX');
  return result === 'OK';
}

/**
 * Libera lock distribuído
 */
export async function releaseLock(resource: string): Promise<void> {
  const key = `lock:${resource}`;
  const client = getRedisClient();
  await client.del(key);
}

// =====================================================
// Health Check
// =====================================================

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Redis Health] Erro:', error);
    return false;
  }
}
