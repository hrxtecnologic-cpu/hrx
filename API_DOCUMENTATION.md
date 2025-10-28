# 📚 HRX API Documentation

## 🚀 Visualizar Documentação Interativa

### Opção 1: Swagger UI (Recomendado)

```bash
# Instalar swagger-ui-watcher
npm install -g swagger-ui-watcher

# Rodar servidor local
swagger-ui-watcher openapi.yaml
```

Acesse: http://localhost:8000

### Opção 2: Redoc

```bash
# Instalar redoc-cli
npm install -g redoc-cli

# Gerar HTML
redoc-cli bundle openapi.yaml -o api-docs.html

# Abrir no navegador
open api-docs.html  # Mac/Linux
start api-docs.html # Windows
```

### Opção 3: Online (stoplight.io)

1. Acesse: https://stoplight.io/studio
2. Cole o conteúdo do `openapi.yaml`
3. Visualize a documentação interativa

---

## 🔑 Autenticação

Todas as rotas requerem autenticação via **Clerk**.

### Como obter o token:

```javascript
// No frontend (Next.js)
import { auth } from '@clerk/nextjs';

const { getToken } = auth();
const token = await getToken();

// Fazer requisição
fetch('/api/admin/professionals/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

---

## ⚡ Rotas Otimizadas

### 1. Professional Search (8x mais rápido)

**Endpoint:** `POST /api/admin/professionals/search`

**O que foi otimizado:**
- ✅ RPC do PostgreSQL para cálculo de distância
- ✅ Índices geográficos (lat/lng)
- ✅ Filtros JSONB para categorias
- ✅ Fallback automático se RPC falhar

**Exemplo:**
```bash
curl -X POST https://hrx.vercel.app/api/admin/professionals/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -23.5505,
    "longitude": -46.6333,
    "radius": 30,
    "categories": ["Fotografia", "Videomaker"],
    "status": ["active"],
    "page": 1,
    "limit": 20
  }'
```

**Resposta:**
```json
{
  "professionals": [
    {
      "id": "uuid",
      "full_name": "João Silva",
      "email": "joao@example.com",
      "phone": "(11) 99999-9999",
      "city": "São Paulo",
      "state": "SP",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "distance_km": 5.2,
      "categories": ["Fotografia"],
      "status": "active"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasMore": true
}
```

---

### 2. Event Projects List (4x mais rápido)

**Endpoint:** `GET /api/admin/event-projects`

**O que foi otimizado:**
- ✅ Select otimizado (apenas 16 campos necessários)
- ✅ Contadores calculados de JSONB
- ✅ Paginação eficiente

**Exemplo:**
```bash
curl "https://hrx.vercel.app/api/admin/event-projects?status=new&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Project Details (4x mais rápido)

**Endpoint:** `GET /api/admin/event-projects/{id}`

**O que foi otimizado:**
- ✅ 5 queries executadas em paralelo com `Promise.all()`
- ✅ 1 round-trip ao invés de 5

**Exemplo:**
```bash
curl "https://hrx.vercel.app/api/admin/event-projects/uuid-here" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Geocode Batch (6x mais rápido)

**Endpoint:** `POST /api/admin/geocode/batch`

**O que foi otimizado:**
- ✅ Fix N+1 query problem
- ✅ Batch fetch com `.in('id', ids)`
- ✅ 60s → 10s para 100 itens

**Exemplo:**
```bash
curl -X POST https://hrx.vercel.app/api/admin/geocode/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "professionals",
    "ids": ["uuid1", "uuid2", "uuid3"]
  }'
```

---

### 5. Map Data (4x mais rápido)

**Endpoint:** `GET /api/admin/map-data`

**O que foi otimizado:**
- ✅ Suporte a viewport (bounding box)
- ✅ Queries paralelas
- ✅ Filtro por tipos de marcadores
- ✅ Carrega apenas área visível

**Exemplo com viewport:**
```bash
curl "https://hrx.vercel.app/api/admin/map-data?\
minLat=-23.6&\
maxLat=-23.4&\
minLng=-46.7&\
maxLng=-46.5&\
types=professional,supplier" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "markers": [
    {
      "id": "uuid",
      "type": "professional",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "name": "João Silva",
      "city": "São Paulo",
      "state": "SP",
      "status": "active"
    }
  ],
  "total": 15,
  "viewport": {
    "minLat": -23.6,
    "maxLat": -23.4,
    "minLng": -46.7,
    "maxLng": -46.5
  }
}
```

---

## 🔒 Rate Limiting

| Tipo | Limite | Janela |
|------|--------|--------|
| Leitura (GET) | 100 requests | 1 minuto |
| Escrita (POST/PUT/DELETE) | 20 requests | 1 minuto |

**Headers de resposta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-28T12:00:00Z
```

**Resposta 429:**
```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "remaining": 0,
  "reset": "2025-10-28T12:00:00Z"
}
```

---

## 📊 Performance Benchmarks

| Endpoint | Antes | Depois | Ganho |
|----------|-------|--------|-------|
| Professional Search (geo) | 2-3s | 300ms | 8x |
| Geocode Batch (100 items) | 60s | 10s | 6x |
| Event Projects List | 800ms | 200ms | 4x |
| Project Details | 600ms | 150ms | 4x |
| Map Data (1000 markers) | 4s | 1s | 4x |

---

## 🧪 Testando APIs

### Postman Collection

Importe o arquivo `openapi.yaml` no Postman:
1. File → Import
2. Selecione `openapi.yaml`
3. Configure a variável `{{baseUrl}}`
4. Configure a variável `{{authToken}}`

### Bruno/Insomnia

Cole o conteúdo do `openapi.yaml` para gerar a collection automaticamente.

### cURL Examples

```bash
# Set token
export TOKEN="your-clerk-token-here"

# Search professionals
curl -X POST https://hrx.vercel.app/api/admin/professionals/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "João"}'

# List projects
curl https://hrx.vercel.app/api/admin/event-projects \
  -H "Authorization: Bearer $TOKEN"

# Get project details
curl https://hrx.vercel.app/api/admin/event-projects/uuid \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Debugging

### Logger Estruturado

Todos os endpoints logam automaticamente:

```typescript
logger.info('Busca avançada iniciada', {
  userId,
  params: { query, filters }
});
```

### Sentry Integration

Erros são automaticamente enviados ao Sentry em produção:
- Contexto completo (userId, requestId, etc)
- Stack traces
- Breadcrumbs

### Development Mode

Em desenvolvimento, erros incluem stack trace:
```json
{
  "error": "Erro ao realizar busca",
  "details": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ..."
}
```

---

## 📈 Monitoramento

### Métricas Disponíveis

- **Response Time**: Tempo de resposta de cada endpoint
- **Error Rate**: Taxa de erros (4xx, 5xx)
- **Request Count**: Número de requisições
- **Database Queries**: Tempo das queries

### Acessar Métricas

1. **Sentry**: https://sentry.io
2. **Vercel Analytics**: Dashboard do Vercel
3. **Supabase**: Database Insights

---

## 🔄 Versionamento

A API usa versionamento semântico:

**Versão atual:** `1.0.0`

**Breaking changes** serão comunicados com antecedência mínima de 30 dias.

---

## 📞 Suporte

- **Email**: contato@hrxeventos.com.br
- **Issues**: GitHub Issues
- **Slack**: #hrx-api (interno)

---

## 📝 Changelog

### v1.0.0 (2025-10-28)
- ✅ Otimizações de performance implementadas
- ✅ RPC para busca geográfica
- ✅ Queries paralelas
- ✅ Viewport loading para mapas
- ✅ Fix N+1 queries
- ✅ Documentação OpenAPI completa
