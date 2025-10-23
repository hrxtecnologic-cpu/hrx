# Redis Setup - HRX Eventos

## Resumo

O projeto foi migrado para usar **Redis** como cache distribuído e rate limiter, com **fallback automático** para memória caso Redis não esteja disponível.

## O que foi migrado

### 1. Rate Limiting (`src/lib/rate-limit.ts`)
- ✅ Usa Redis com sliding window algorithm
- ✅ Fallback para memória se Redis não disponível
- ✅ Mantém mesma interface pública

### 2. Cache System (`src/lib/cache.ts`)
- ✅ Migrado para Redis
- ✅ Fallback para memória
- ✅ Mantém estatísticas
- ✅ Suporta TTL e prefixos

### 3. Utilitários Redis (`src/lib/redis.ts`)
- `getRedisClient()` - Singleton do cliente Redis
- `setCache()`, `getCache()`, `deleteCache()` - Operações de cache
- `rateLimit()` - Rate limiting com sliding window
- `acquireLock()`, `releaseLock()` - Locks distribuídos
- `checkRedisHealth()` - Health check

## Como usar

### Desenvolvimento Local (sem Redis)

Não precisa fazer nada! O sistema usa memória automaticamente.

```bash
npm run dev
```

### Desenvolvimento com Redis Local

1. **Instalar Redis**:
   - Windows: https://github.com/microsoftarchive/redis/releases
   - Mac: `brew install redis`
   - Linux: `sudo apt-get install redis-server`

2. **Iniciar Redis**:
   ```bash
   redis-server
   ```

3. **Configurar .env**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

4. **Rodar app**:
   ```bash
   npm run dev
   ```

### Produção (Upstash Redis - RECOMENDADO)

**Upstash** é Redis serverless, grátis até 10k comandos/dia.

1. **Criar conta**: https://console.upstash.com

2. **Criar database Redis**:
   - Region: escolher próximo ao seu deploy
   - TLS habilitado

3. **Copiar URL**:
   ```
   redis://default:xxxx@yyy.upstash.io:6379
   ```

4. **Configurar variável de ambiente** (Vercel/Railway/etc):
   ```
   REDIS_URL=redis://default:xxxx@yyy.upstash.io:6379
   ```

### Alternativas (Produção)

- **Redis Labs**: https://redis.com/try-free/
- **AWS ElastiCache**: Redis gerenciado na AWS
- **Railway**: https://railway.app/ (tem Redis add-on)

## Verificar se Redis está ativo

```typescript
import { checkRedisHealth } from '@/lib/redis';

const isHealthy = await checkRedisHealth();
console.log('Redis ativo?', isHealthy);
```

## Monitoramento

### Stats do Cache
```bash
GET /api/admin/cache/stats
```

Retorna:
```json
{
  "hits": 1250,
  "misses": 320,
  "sets": 320,
  "deletes": 45,
  "totalKeys": 275,
  "hitRate": "79.62%"
}
```

### Limpar Cache
```bash
POST /api/admin/cache/clear
```

## Estrutura de Chaves Redis

### Rate Limit
```
ratelimit:{prefix}:{identifier}
Exemplo: ratelimit:upload:user_123
```

### Cache
```
cache:{prefix}:{hash}
Exemplo: cache:geocoding:a3f2bc1d...
```

### Locks
```
lock:{resource}
Exemplo: lock:project_123_update
```

## Performance

### Antes (Memória)
- ❌ Cache perdido a cada restart
- ❌ Não funciona com múltiplas instâncias
- ✅ Latência ~1ms

### Depois (Redis)
- ✅ Cache persistente
- ✅ Compartilhado entre instâncias
- ✅ Latência ~5-15ms (local) / ~30-50ms (Upstash)
- ✅ Fallback automático

## Próximos Passos

1. **Configurar Redis em produção** (Upstash recomendado)
2. **Monitorar performance** via `/api/admin/cache/stats`
3. **Ajustar TTLs** conforme necessidade
4. **Implementar cache warming** para dados críticos (opcional)

## Custos Upstash (Free Tier)

- 10.000 comandos/dia = **GRÁTIS**
- 100MB storage = **GRÁTIS**
- Comandos extras: $0.20 por 100k

**Estimativa HRX**:
- ~5k requisições/dia
- ~2-3k comandos Redis/dia
- **= 100% dentro do free tier**
