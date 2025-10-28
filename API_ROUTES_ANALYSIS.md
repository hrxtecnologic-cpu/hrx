# 📋 Análise Completa das APIs - HRX

**Total de rotas:** 75
**Data:** 2025-10-28

---

## 📊 Estatísticas Gerais

| Métrica | Valor |
|---------|-------|
| **Total de rotas** | 75 |
| **Com autenticação** | 62 |
| **Com rate limiting** | 56 |
| **Otimizadas** | 51 |
| **Categorias** | 5 |

---

## 🗂️ Rotas por Categoria

### Admin (43 rotas)

#### Categories (2)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/admin/categories` | GET - List all categories | ✅ | ✅ | - |
| PUT, DELETE | `/admin/categories/{id}` | PUT - Update category | ✅ | ✅ | Select otimizado |

#### Geral (3)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET | `/admin/counts` | GET /api/admin/counts | ✅ | ✅ | Select otimizado |
| GET, POST | `/admin/event-types` | GET - List all event types | ✅ | ✅ | - |
| PUT, DELETE | `/admin/event-types/{id}` | PUT - Update event type | ✅ | ✅ | Select otimizado |

#### Email (4)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST, PUT | `/admin/emails/config` | GET /api/admin/emails/config | ✅ | ✅ | - |
| POST | `/admin/emails/import` | POST /api/admin/emails/import | ✅ | ✅ | - |
| GET | `/admin/emails/preview` | GET /api/admin/emails/preview | ✅ | ✅ | - |
| GET | `/admin/emails` | GET /api/admin/emails | ✅ | ✅ | - |

#### Event Projects (16)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/admin/event-projects` | Force dynamic route | ✅ | ✅ | Select otimizado |
| POST, PATCH, DELETE | `/admin/event-projects/{id}/equipment` | Force dynamic route | ✅ | ✅ | Select otimizado |
| POST | `/admin/event-projects/{id}/equipment/{equipmentId}/request-quotes` | POST /api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes | ✅ | ✅ | Select otimizado |
| PATCH, DELETE | `/admin/event-projects/{id}/equipment/{equipmentId}` | API: Gerenciar Equipamento Individual do Projeto | ✅ | ✅ | - |
| GET | `/admin/event-projects/{id}/nearby-professionals` | GET /api/admin/event-projects/[id]/nearby-professionals | ✅ | ✅ | Select otimizado |
| GET | `/admin/event-projects/{id}/nearby-suppliers` | GET /api/admin/event-projects/[id]/nearby-suppliers | ✅ | ✅ | Select otimizado |
| GET | `/admin/event-projects/{id}/quotations` | GET /api/admin/event-projects/[id]/quotations | ✅ | ✅ | Select otimizado |
| POST | `/admin/event-projects/{id}/quotations/{quotationId}/accept` | POST /api/admin/projects/[id]/quotations/[quotationId]/accept | ✅ | ✅ | - |
| PATCH, DELETE | `/admin/event-projects/{id}/quotations/{quotationId}` | Force dynamic route | ✅ | ✅ | Select otimizado, Batch query |
| GET, PATCH, DELETE | `/admin/event-projects/{id}` | Force dynamic route | ✅ | ✅ | Queries paralelas |
| POST | `/admin/event-projects/{id}/send-proposal` | Force dynamic route | ✅ | ✅ | Batch query |
| GET | `/admin/event-projects/{id}/suggested-professionals` | ===================================================== | ❌ | ✅ | RPC otimizada, Select otimizado |
| GET | `/admin/event-projects/{id}/suggested-suppliers` | ===================================================== | ❌ | ✅ | RPC otimizada, Select otimizado |
| POST, DELETE | `/admin/event-projects/{id}/team` | Force dynamic route | ✅ | ✅ | Select otimizado |
| POST | `/admin/event-projects/{id}/team/{memberId}/invite` | =============================================== | ✅ | ✅ | RPC otimizada, Select otimizado |
| PATCH, DELETE | `/admin/event-projects/{id}/team/{memberId}` | API: Gerenciar Membro Individual da Equipe | ❌ | ✅ | - |

#### Geocoding (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/admin/geocode/batch` | API: Geocodificação em Batch | ❌ | ✅ | Select otimizado, Batch query |

#### Map Data (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET | `/admin/map-data` | Rate Limiting | ✅ | ✅ | Queries paralelas, Select otimizado |

#### Professionals (9)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET | `/admin/professionals` | GET - List professionals with filters | ✅ | ✅ | Select otimizado |
| POST | `/admin/professionals/search` | Advanced Search API for Professionals | ✅ | ✅ | RPC otimizada, Select otimizado, Batch query |
| GET | `/admin/professionals/unified` | API: Profissionais Unificados (Query Otimizada) | ✅ | ✅ | RPC otimizada |
| POST | `/admin/professionals/{id}/approve` | ========== Rate Limiting ========== | ✅ | ✅ | Select otimizado |
| GET, PATCH | `/admin/professionals/{id}/documents` | GET: Buscar status de todos os documentos de um profissional | ✅ | ✅ | - |
| PATCH | `/admin/professionals/{id}/edit` | PATCH: Admin edita dados de um profissional | ✅ | ✅ | Select otimizado |
| GET | `/admin/professionals/{id}/history` | GET: Buscar histórico completo de um profissional | ✅ | ✅ | Select otimizado |
| POST | `/admin/professionals/{id}/reject` | ========== Rate Limiting ========== | ✅ | ✅ | Select otimizado |
| GET, PATCH, DELETE | `/admin/professionals/{id}` | GET /api/admin/professionals/[id] | ✅ | ✅ | - |

#### Suppliers (3)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/admin/suppliers` | GET - List all suppliers | ✅ | ✅ | Queries paralelas |
| POST | `/admin/suppliers/search` | POST /api/admin/suppliers/search | ✅ | ✅ | Select otimizado, Batch query |
| GET, PUT, DELETE | `/admin/suppliers/{id}` | GET - Get single supplier | ✅ | ✅ | - |

#### Users (4)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET | `/admin/users/detailed` | API: Usuários detalhados (Clerk + Supabase) | ✅ | ✅ | Select otimizado, Batch query |
| GET | `/admin/users` | ========== Rate Limiting ========== | ✅ | ✅ | - |
| PUT | `/admin/users/{userId}/role` | Emails com acesso admin | ✅ | ✅ | - |
| POST | `/admin/users/{userId}/send-reminder` | API: Enviar lembrete de cadastro incompleto | ✅ | ✅ | Queries paralelas |

### Outros (21 rotas)

#### Geral (13)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| POST | `/contact` | 1. Rate Limiting - Proteção contra abuse (20 req/min) | ❌ | ✅ | - |
| GET | `/contratante/meus-projetos` | GET /api/contratante/meus-projetos | ✅ | ❌ | Select otimizado |
| GET, PATCH | `/contratante/meus-projetos/{id}` | GET /api/contratante/meus-projetos/[id] | ✅ | ❌ | Select otimizado |
| POST | `/mapbox/directions` | R$ 2.50/km padrão | ❌ | ✅ | - |
| POST | `/mapbox/isochrone` | Sem descrição | ❌ | ✅ | - |
| POST | `/mapbox/matching` | POST /api/mapbox/matching | ✅ | ✅ | Select otimizado |
| GET | `/proposals/{id}/accept` | ============================================= | ❌ | ✅ | Select otimizado |
| GET | `/proposals/{id}/reject` | ============================================= | ❌ | ✅ | Select otimizado |
|  | `/sentry-example-api` | A faulty API route to test Sentry's error monitoring | ❌ | ❌ | - |
| POST | `/upload` | Force dynamic route | ✅ | ✅ | - |
| GET | `/user/check-registration` | Buscar user_id no Supabase | ✅ | ❌ | Select otimizado |
| PATCH | `/user/metadata` | Verificar autenticação com retry (timing issue após login) | ✅ | ❌ | - |
| GET, POST | `/webhooks/clerk` | Para testes | ✅ | ✅ | Select otimizado |

#### Deliveries (3)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/deliveries` | GET /api/deliveries | ✅ | ❌ | Select otimizado |
| GET, POST | `/deliveries/{id}/location` | POST /api/deliveries/[id]/location | ✅ | ❌ | - |
| PATCH | `/deliveries/{id}/status` | PATCH /api/deliveries/[id]/status | ✅ | ❌ | Select otimizado |

#### Notifications (3)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| POST | `/notifications/mark-all-read` | ===================================================== | ✅ | ❌ | RPC otimizada, Select otimizado |
| GET, POST | `/notifications` | ===================================================== | ✅ | ❌ | RPC otimizada |
| POST | `/notifications/{id}/read` | ===================================================== | ✅ | ❌ | Select otimizado |

#### Professionals (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| POST | `/professionals` | IMPORTANTE: Força Node.js runtime para usar Resend | ✅ | ✅ | Select otimizado |

#### Quotations (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/quotations/{id}/respond` | ============================================= | ❌ | ✅ | Select otimizado |

### Professional (6 rotas)

#### Geral (6)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/professional/confirm/{token}` | ==================================== | ❌ | ✅ | Select otimizado |
| GET | `/professional/dashboard` | ==================================== | ✅ | ❌ | Select otimizado |
| GET | `/professional/document-validations` | GET: Buscar validações de documentos do profissional logado | ✅ | ❌ | - |
| POST | `/professional/events/{id}/action` | ==================================== | ✅ | ❌ | Select otimizado |
| GET | `/professional/events/{id}` | ==================================== | ✅ | ❌ | Select otimizado |
| GET, PATCH | `/professional/profile` | GET: Buscar dados do profissional logado | ✅ | ❌ | - |

### Public (2 rotas)

#### Geral (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| POST | `/public/event-requests` | API PÚBLICA para receber: | ✅ | ✅ | Queries paralelas, Select otimizado |

#### Quotations (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET, POST | `/public/quotations/{token}` | GET /api/public/quotations/[token] | ❌ | ✅ | Select otimizado |

### Supplier (3 rotas)

#### Geral (2)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET | `/supplier/dashboard` | ==================================== | ✅ | ❌ | Select otimizado |
| GET, PATCH | `/supplier/profile` | GET: Buscar dados do fornecedor logado | ✅ | ❌ | - |

#### Quotations (1)

| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |
|--------|------|-----------|------|------------|-------------|
| GET | `/supplier/quotations/{id}` | ==================================== | ✅ | ❌ | Select otimizado |

---

## ⚠️ Rotas SEM Otimizações

**Total:** 24 rotas

| Rota | Métodos | Sugestões |
|------|---------|----------|
| `/admin/categories` | GET, POST | N/A |
| `/admin/emails/config` | GET, POST, PUT | N/A |
| `/admin/emails/import` | POST | N/A |
| `/admin/emails/preview` | GET | N/A |
| `/admin/emails` | GET | N/A |
| `/admin/event-projects/{id}/equipment/{equipmentId}` | PATCH, DELETE | N/A |
| `/admin/event-projects/{id}/quotations/{quotationId}/accept` | POST | N/A |
| `/admin/event-projects/{id}/team/{memberId}` | PATCH, DELETE | N/A |
| `/admin/event-types` | GET, POST | N/A |
| `/admin/professionals/{id}/documents` | GET, PATCH | Verificar se usa select específico |
| `/admin/professionals/{id}` | GET, PATCH, DELETE | Verificar se usa select específico |
| `/admin/suppliers/{id}` | GET, PUT, DELETE | Verificar se usa select específico |
| `/admin/users` | GET | N/A |
| `/admin/users/{userId}/role` | PUT | N/A |
| `/contact` | POST | N/A |
| `/deliveries/{id}/location` | GET, POST | Verificar se usa select específico; ⚠️ Adicionar rate limiting |
| `/mapbox/directions` | POST | N/A |
| `/mapbox/isochrone` | POST | N/A |
| `/professional/document-validations` | GET | ⚠️ Adicionar rate limiting |
| `/professional/profile` | GET, PATCH | ⚠️ Adicionar rate limiting |
| `/sentry-example-api` |  | ⚠️ Adicionar rate limiting |
| `/supplier/profile` | GET, PATCH | ⚠️ Adicionar rate limiting |
| `/upload` | POST | N/A |
| `/user/metadata` | PATCH | ⚠️ Adicionar rate limiting |

---

## 🔓 Rotas SEM Autenticação

**Total:** 13 rotas

| Rota | Métodos | Ação Recomendada |
|------|---------|------------------|
| `/admin/event-projects/{id}/suggested-professionals` | GET | ⚠️ **CRÍTICO**: Admin deve ter auth |
| `/admin/event-projects/{id}/suggested-suppliers` | GET | ⚠️ **CRÍTICO**: Admin deve ter auth |
| `/admin/event-projects/{id}/team/{memberId}` | PATCH, DELETE | ⚠️ **CRÍTICO**: Admin deve ter auth |
| `/admin/geocode/batch` | GET, POST | ⚠️ **CRÍTICO**: Admin deve ter auth |
| `/contact` | POST | Verificar se deve ser pública |
| `/mapbox/directions` | POST | Verificar se deve ser pública |
| `/mapbox/isochrone` | POST | Verificar se deve ser pública |
| `/professional/confirm/{token}` | GET, POST | ⚠️ Adicionar autenticação |
| `/proposals/{id}/accept` | GET | Verificar se deve ser pública |
| `/proposals/{id}/reject` | GET | Verificar se deve ser pública |
| `/public/quotations/{token}` | GET, POST | Verificar se deve ser pública |
| `/quotations/{id}/respond` | GET, POST | Verificar se deve ser pública |
| `/sentry-example-api` |  | Verificar se deve ser pública |

---

## ✅ Rotas COM Otimizações

**Total:** 51 rotas

| Rota | Otimizações |
|------|-------------|
| `/admin/categories/{id}` | Select otimizado |
| `/admin/counts` | Select otimizado |
| `/admin/event-projects` | Select otimizado |
| `/admin/event-projects/{id}/equipment` | Select otimizado |
| `/admin/event-projects/{id}/equipment/{equipmentId}/request-quotes` | Select otimizado |
| `/admin/event-projects/{id}/nearby-professionals` | Select otimizado |
| `/admin/event-projects/{id}/nearby-suppliers` | Select otimizado |
| `/admin/event-projects/{id}/quotations` | Select otimizado |
| `/admin/event-projects/{id}/quotations/{quotationId}` | Select otimizado, Batch query |
| `/admin/event-projects/{id}` | Queries paralelas |
| `/admin/event-projects/{id}/send-proposal` | Batch query |
| `/admin/event-projects/{id}/suggested-professionals` | RPC otimizada, Select otimizado |
| `/admin/event-projects/{id}/suggested-suppliers` | RPC otimizada, Select otimizado |
| `/admin/event-projects/{id}/team` | Select otimizado |
| `/admin/event-projects/{id}/team/{memberId}/invite` | RPC otimizada, Select otimizado |
| `/admin/event-types/{id}` | Select otimizado |
| `/admin/geocode/batch` | Select otimizado, Batch query |
| `/admin/map-data` | Queries paralelas, Select otimizado |
| `/admin/professionals` | Select otimizado |
| `/admin/professionals/search` | RPC otimizada, Select otimizado, Batch query |
| `/admin/professionals/unified` | RPC otimizada |
| `/admin/professionals/{id}/approve` | Select otimizado |
| `/admin/professionals/{id}/edit` | Select otimizado |
| `/admin/professionals/{id}/history` | Select otimizado |
| `/admin/professionals/{id}/reject` | Select otimizado |
| `/admin/suppliers` | Queries paralelas |
| `/admin/suppliers/search` | Select otimizado, Batch query |
| `/admin/users/detailed` | Select otimizado, Batch query |
| `/admin/users/{userId}/send-reminder` | Queries paralelas |
| `/contratante/meus-projetos` | Select otimizado |
| `/contratante/meus-projetos/{id}` | Select otimizado |
| `/deliveries` | Select otimizado |
| `/deliveries/{id}/status` | Select otimizado |
| `/mapbox/matching` | Select otimizado |
| `/notifications/mark-all-read` | RPC otimizada, Select otimizado |
| `/notifications` | RPC otimizada |
| `/notifications/{id}/read` | Select otimizado |
| `/professional/confirm/{token}` | Select otimizado |
| `/professional/dashboard` | Select otimizado |
| `/professional/events/{id}/action` | Select otimizado |
| `/professional/events/{id}` | Select otimizado |
| `/professionals` | Select otimizado |
| `/proposals/{id}/accept` | Select otimizado |
| `/proposals/{id}/reject` | Select otimizado |
| `/public/event-requests` | Queries paralelas, Select otimizado |
| `/public/quotations/{token}` | Select otimizado |
| `/quotations/{id}/respond` | Select otimizado |
| `/supplier/dashboard` | Select otimizado |
| `/supplier/quotations/{id}` | Select otimizado |
| `/user/check-registration` | Select otimizado |
| `/webhooks/clerk` | Select otimizado |

---

## 💡 Recomendações

### 🔴 CRÍTICO (fazer imediatamente)

- **4 rotas admin sem autenticação**
- **6 rotas POST sem rate limiting**

### 🟡 IMPORTANTE (fazer esta semana)

- Otimizar 24 rotas sem otimizações
- Adicionar rate limiting em 19 rotas
- Revisar 13 rotas sem autenticação

### 🟢 OPCIONAL (melhorias futuras)

- Adicionar caching em rotas de leitura frequente
- Implementar GraphQL para queries complexas
- Adicionar WebSockets para updates em tempo real

---

## 🗑️ Candidatas a Remoção/Consolidação

Rotas que podem ser desnecessárias ou duplicadas:

✅ Nenhuma duplicação óbvia encontrada.
