/**
 * Cache Service
 *
 * Sistema de cache genérico e reutilizável
 * Usa Redis em produção e fallback para memória em desenvolvimento
 */

import { logger } from './logger';
import crypto from 'crypto';
import { getCache as redisGet, setCache as redisSet, deleteCache as redisDelete, deleteCachePattern as redisDeletePattern } from './redis';

// =====================================================
// Types
// =====================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStore {
  [key: string]: CacheEntry<any>;
}

export interface CacheConfig {
  /**
   * Prefixo para a chave (identifica o tipo de cache)
   * @example 'geocoding', 'api', 'session'
   */
  prefix: string;

  /**
   * TTL (Time To Live) em milissegundos
   * @example 86400000 = 24 horas
   * @example 2592000000 = 30 dias
   */
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  totalKeys: number;
  hitRate: string;
}

// =====================================================
// In-Memory Store (Fallback)
// =====================================================

const memoryStore: CacheStore = {};
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
};

// Limpar registros expirados a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    Object.keys(memoryStore).forEach(key => {
      if (memoryStore[key].expiresAt < now) {
        delete memoryStore[key];
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.debug('Cache cleanup executado', { cleaned, remaining: Object.keys(memoryStore).length });
    }
  }, 300000); // 5 minutos
}

// =====================================================
// Cache Operations
// =====================================================

/**
 * Gera uma chave de cache consistente
 *
 * @param prefix - Prefixo do cache
 * @param identifier - Identificador único (string ou objeto)
 * @returns Chave de cache hashada
 */
export function generateCacheKey(prefix: string, identifier: string | object): string {
  const data = typeof identifier === 'string' ? identifier : JSON.stringify(identifier);

  // Usar hash MD5 para chaves mais curtas e consistentes
  const hash = crypto.createHash('md5').update(data).digest('hex');

  return `${prefix}:${hash}`;
}

/**
 * Cache em memória (fallback)
 */
async function cacheGetMemory<T>(key: string): Promise<T | null> {
  const entry = memoryStore[key];

  if (!entry) {
    stats.misses++;
    logger.debug('Cache miss (memory)', { key });
    return null;
  }

  const now = Date.now();

  if (entry.expiresAt < now) {
    delete memoryStore[key];
    stats.misses++;
    logger.debug('Cache expired (memory)', { key });
    return null;
  }

  stats.hits++;
  logger.debug('Cache hit (memory)', { key, ttlRemaining: entry.expiresAt - now });
  return entry.value as T;
}

async function cacheSetMemory<T>(key: string, value: T, ttl: number): Promise<void> {
  const now = Date.now();

  memoryStore[key] = {
    value,
    expiresAt: now + ttl,
  };

  stats.sets++;
  logger.debug('Cache set (memory)', { key, ttl, expiresAt: new Date(now + ttl).toISOString() });
}

async function cacheDeleteMemory(key: string): Promise<void> {
  if (memoryStore[key]) {
    delete memoryStore[key];
    stats.deletes++;
    logger.debug('Cache delete (memory)', { key });
  }
}

async function cacheClearMemory(prefix?: string): Promise<number> {
  let cleared = 0;

  if (prefix) {
    Object.keys(memoryStore).forEach(key => {
      if (key.startsWith(prefix)) {
        delete memoryStore[key];
        cleared++;
      }
    });
    logger.info('Cache parcial limpo (memory)', { prefix, cleared });
  } else {
    cleared = Object.keys(memoryStore).length;
    Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
    logger.info('Cache completamente limpo (memory)', { cleared });
  }

  return cleared;
}

/**
 * Busca valor no cache (Redis ou memória)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (process.env.REDIS_URL) {
    try {
      const value = await redisGet<T>(key);
      if (value !== null) {
        stats.hits++;
        logger.debug('Cache hit (Redis)', { key });
      } else {
        stats.misses++;
        logger.debug('Cache miss (Redis)', { key });
      }
      return value;
    } catch (error) {
      logger.warn('Redis falhou, usando memória', { error });
      return cacheGetMemory<T>(key);
    }
  }

  return cacheGetMemory<T>(key);
}

/**
 * Armazena valor no cache (Redis ou memória)
 */
export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      await redisSet(key, value, { ttl: Math.floor(ttl / 1000) }); // ms para segundos
      stats.sets++;
      logger.debug('Cache set (Redis)', { key, ttl });
      return;
    } catch (error) {
      logger.warn('Redis falhou, usando memória', { error });
      return cacheSetMemory(key, value, ttl);
    }
  }

  return cacheSetMemory(key, value, ttl);
}

/**
 * Remove valor do cache (Redis ou memória)
 */
export async function cacheDelete(key: string): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      await redisDelete(key);
      stats.deletes++;
      logger.debug('Cache delete (Redis)', { key });
      return;
    } catch (error) {
      logger.warn('Redis falhou, usando memória', { error });
      return cacheDeleteMemory(key);
    }
  }

  return cacheDeleteMemory(key);
}

/**
 * Limpa cache por prefixo (Redis ou memória)
 */
export async function cacheClear(prefix?: string): Promise<number> {
  if (process.env.REDIS_URL) {
    try {
      if (prefix) {
        await redisDeletePattern(`${prefix}*`);
      } else {
        await redisDeletePattern('*');
      }
      logger.info('Cache limpo (Redis)', { prefix });
      return 0; // Redis não retorna count
    } catch (error) {
      logger.warn('Redis falhou, usando memória', { error });
      return cacheClearMemory(prefix);
    }
  }

  return cacheClearMemory(prefix);
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats(): CacheStats {
  const totalKeys = Object.keys(memoryStore).length;
  const totalRequests = stats.hits + stats.misses;
  const hitRate = totalRequests > 0
    ? ((stats.hits / totalRequests) * 100).toFixed(2)
    : '0.00';

  return {
    hits: stats.hits,
    misses: stats.misses,
    sets: stats.sets,
    deletes: stats.deletes,
    totalKeys,
    hitRate: `${hitRate}%`,
  };
}

// =====================================================
// Helper Wrapper
// =====================================================

/**
 * Wrapper conveniente para operações de cache
 *
 * Busca no cache, se não encontrado executa a função e armazena o resultado
 *
 * @param config - Configuração do cache
 * @param identifier - Identificador único
 * @param fetchFn - Função assíncrona para buscar o valor se não estiver em cache
 * @returns Valor (do cache ou da função)
 *
 * @example
 * const result = await withCache(
 *   { prefix: 'geocoding', ttl: 30 * 24 * 60 * 60 * 1000 },
 *   address,
 *   () => geocodeWithNominatim(address)
 * );
 */
export async function withCache<T>(
  config: CacheConfig,
  identifier: string | object,
  fetchFn: () => Promise<T | null>
): Promise<T | null> {
  const key = generateCacheKey(config.prefix, identifier);

  // Tentar buscar do cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Não encontrado, executar função
  const value = await fetchFn();

  // Armazenar resultado se não for null
  if (value !== null) {
    await cacheSet(key, value, config.ttl);
  }

  return value;
}

// =====================================================
// Cache Presets
// =====================================================

/**
 * Presets de cache para diferentes casos de uso
 */
export const CachePresets = {
  /**
   * Geocoding: 30 dias (endereços raramente mudam coordenadas)
   */
  GEOCODING: {
    prefix: 'geocoding',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 dias
  },

  /**
   * API responses: 5 minutos (dados frequentes mas podem mudar)
   */
  API_SHORT: {
    prefix: 'api-short',
    ttl: 5 * 60 * 1000, // 5 minutos
  },

  /**
   * API responses: 1 hora (dados menos frequentes)
   */
  API_MEDIUM: {
    prefix: 'api-medium',
    ttl: 60 * 60 * 1000, // 1 hora
  },

  /**
   * API responses: 24 horas (dados estáticos)
   */
  API_LONG: {
    prefix: 'api-long',
    ttl: 24 * 60 * 60 * 1000, // 24 horas
  },

  /**
   * Session data: 15 minutos
   */
  SESSION: {
    prefix: 'session',
    ttl: 15 * 60 * 1000, // 15 minutos
  },
} as const;
