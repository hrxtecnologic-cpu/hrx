# 🧹 ANÁLISE DE APIs - LIMPEZA PARA PRODUÇÃO

**Data:** 2025-10-26
**Total de APIs:** 98
**Objetivo:** Identificar e remover APIs antigas/não utilizadas antes de produção

---

## 📊 RESUMO EXECUTIVO

| Categoria | Quantidade | Ação |
|-----------|------------|------|
| ✅ **EM USO (manter)** | **77 APIs** | Manter e proteger |
| ❌ **REMOVER (teste/debug)** | **10 APIs** | Deletar antes produção |
| ⚠️ **DUPLICADAS** | **6 APIs** | Revisar e decidir |
| ⚠️ **DELIVERY (não implementado)** | **3 APIs** | Remover ou implementar |
| ⚠️ **OUTRAS SUSPEITAS** | **2 APIs** | Revisar |

---

## ❌ APIs PARA REMOVER DEFINITIVAMENTE (10)

### APIs de TESTE/DEBUG - DELETAR ANTES DE PRODUÇÃO

**CRÍTICO:** Estas APIs NÃO devem ir para produção!

```
1. src/app/api/debug/check-admin/route.ts
2. src/app/api/debug/check-professionals/route.ts
3. src/app/api/debug/check-user/route.ts
4. src/app/api/debug-auth/route.ts
5. src/app/api/send/route.ts
6. src/app/api/send-test/route.ts
7. src/app/api/test/event-request/route.ts
8. src/app/api/test/professional-signup/route.ts
9. src/app/api/test-simple/route.ts
10. src/app/api/test-supabase-view/route.ts
```

**Status:** ✅ CONFIRMADO - Nenhuma é usada no frontend

**Ação:**
```bash
# Remover todas APIs de teste/debug
rm -rf src/app/api/debug
rm -rf src/app/api/test
rm -f src/app/api/debug-auth/route.ts
rm -f src/app/api/send/route.ts
rm -f src/app/api/send-test/route.ts
rm -f src/app/api/test-simple/route.ts
rm -f src/app/api/test-supabase-view/route.ts
```

---

## ⚠️ APIs DUPLICADAS - Sistema Antigo vs Novo (6)

### Problema: Dois sistemas de orçamentos/cotações

**SISTEMA ANTIGO** (admin/quotes + admin/projects):
```
1. src/app/api/admin/quotes/route.ts
2. src/app/api/admin/quotes/[id]/route.ts
3. src/app/api/admin/quotes/[id]/send/route.ts
4. src/app/api/admin/projects/[id]/quotations/route.ts
5. src/app/api/admin/projects/[id]/quotations/[quotationId]/accept/route.ts
6. src/app/api/admin/projects/[id]/request-quotes/route.ts
```

**SISTEMA NOVO** (admin/event-projects):
```
✓ src/app/api/admin/event-projects/[id]/quotations/route.ts
✓ src/app/api/admin/event-projects/[id]/quotations/[quotationId]/accept/route.ts
✓ src/app/api/admin/event-projects/[id]/quotations/[quotationId]/route.ts
✓ src/app/api/admin/event-projects/[id]/request-quotes/route.ts
✓ src/app/api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes/route.ts
```

### Análise:

**SISTEMA ANTIGO é USADO EM:**
```typescript
// src/app/admin/orcamentos/novo/page.tsx
const response = await fetch('/api/admin/quotes', { ... });

// src/app/admin/orcamentos/page.tsx
const response = await fetch(`/api/admin/quotes?${params.toString()}`);

// src/app/admin/orcamentos/[id]/page.tsx
const response = await fetch(`/api/admin/quotes/${quoteId}`);
const response = await fetch(`/api/admin/quotes/${quoteId}/send`, { ... });
```

**Páginas que usam sistema antigo:**
- `/admin/orcamentos` (listagem)
- `/admin/orcamentos/novo` (criar)
- `/admin/orcamentos/[id]` (detalhes)

### Decisão Necessária:

**OPÇÃO 1: Migrar para sistema novo**
- Atualizar páginas `/admin/orcamentos` para usar `/admin/event-projects`
- Remover APIs antigas
- Mais trabalho, mas código limpo

**OPÇÃO 2: Manter ambos temporariamente**
- Deixar sistema antigo funcionando
- Avisar que está deprecated
- Migrar gradualmente

**RECOMENDAÇÃO:** OPÇÃO 1 - Migrar tudo para `event-projects`

**Razão:**
- `event-projects` é o sistema atual e completo
- `quotes` parece ser sistema anterior
- Evita confusão e duplicação
- Facilita manutenção

---

## ⚠️ APIs de DELIVERY - Sistema Não Implementado (3)

```
1. src/app/api/deliveries/route.ts
2. src/app/api/deliveries/[id]/location/route.ts
3. src/app/api/deliveries/[id]/status/route.ts
```

### Status:

**❌ PROBLEMA:** API é usada mas sistema não está implementado!

```typescript
// src/app/cliente/evento/[id]/tracking/page.tsx
const response = await fetch(`/api/deliveries?eventId=${eventId}`);
```

### Decisão Necessária:

**OPÇÃO 1: Remover tudo**
- Deletar APIs de delivery
- Deletar página de tracking
- Sistema não será usado

**OPÇÃO 2: Implementar sistema**
- Implementar lógica de delivery tracking
- Conectar com banco (tabelas delivery_* existem)
- Mais trabalho

**RECOMENDAÇÃO:** OPÇÃO 1 - Remover

**Razão:**
- Tabelas `delivery_*` estão vazias (órfãs)
- Sistema aparenta ser feature não finalizada
- Pode ser implementado no futuro se necessário

**Ação:**
```bash
# Remover APIs de delivery
rm -rf src/app/api/deliveries

# Remover página de tracking
rm -rf src/app/cliente/evento/[id]/tracking
```

---

## ⚠️ Outras APIs Suspeitas (2)

### 1. `admin/set-admin-metadata`

```
src/app/api/admin/set-admin-metadata/route.ts
```

**Suspeita:** Nome genérico, pode estar duplicado com `user/metadata`

**Verificar:**
- É usada no código?
- Faz algo diferente de `user/metadata`?

### 2. `professionals` (raiz)

```
src/app/api/professionals/route.ts
```

**Conflito possível com:**
- `admin/professionals`
- `professionals/me`

**Verificar:**
- É API pública de cadastro?
- Qual a diferença das outras?

---

## ✅ APIs EM USO - MANTER (77)

### Admin (49 APIs)

**Gestão de Projetos (27):**
```
✓ admin/event-projects/route.ts (listar, criar)
✓ admin/event-projects/[id]/route.ts (detalhes, editar, deletar)
✓ admin/event-projects/[id]/send-proposal/route.ts
✓ admin/event-projects/[id]/team/route.ts (adicionar profissional)
✓ admin/event-projects/[id]/team/[memberId]/route.ts (editar, remover)
✓ admin/event-projects/[id]/team/[memberId]/invite/route.ts
✓ admin/event-projects/[id]/equipment/route.ts (adicionar)
✓ admin/event-projects/[id]/equipment/[equipmentId]/route.ts
✓ admin/event-projects/[id]/equipment/[equipmentId]/request-quotes/route.ts
✓ admin/event-projects/[id]/quotations/route.ts (solicitar cotações)
✓ admin/event-projects/[id]/quotations/[quotationId]/route.ts
✓ admin/event-projects/[id]/quotations/[quotationId]/accept/route.ts
✓ admin/event-projects/[id]/request-quotes/route.ts
✓ admin/event-projects/[id]/nearby-professionals/route.ts
✓ admin/event-projects/[id]/nearby-suppliers/route.ts
✓ admin/event-projects/[id]/suggested-professionals/route.ts
✓ admin/event-projects/[id]/suggested-suppliers/route.ts
```

**Gestão de Profissionais (8):**
```
✓ admin/professionals/route.ts (listar)
✓ admin/professionals/[id]/route.ts (detalhes)
✓ admin/professionals/[id]/approve/route.ts
✓ admin/professionals/[id]/reject/route.ts
✓ admin/professionals/[id]/edit/route.ts
✓ admin/professionals/[id]/documents/route.ts
✓ admin/professionals/[id]/history/route.ts
✓ admin/professionals/search/route.ts
```

**Gestão de Fornecedores (4):**
```
✓ admin/suppliers/route.ts
✓ admin/suppliers/[id]/route.ts
✓ admin/suppliers/[id]/equipment/route.ts
✓ admin/suppliers/search/route.ts
```

**Gestão de Usuários (4):**
```
✓ admin/users/route.ts
✓ admin/users/detailed/route.ts
✓ admin/users/[userId]/role/route.ts
✓ admin/users/[userId]/send-reminder/route.ts
```

**Configurações (10):**
```
✓ admin/categories/route.ts
✓ admin/categories/[id]/route.ts
✓ admin/event-types/route.ts
✓ admin/event-types/[id]/route.ts
✓ admin/emails/route.ts
✓ admin/emails/config/route.ts
✓ admin/emails/preview/route.ts
✓ admin/emails/stats/route.ts
✓ admin/emails/import/route.ts
✓ admin/counts/route.ts
```

**Ferramentas (6):**
```
✓ admin/geocode/batch/route.ts
✓ admin/map-data/route.ts
✓ admin/cache/clear/route.ts
✓ admin/cache/stats/route.ts
✓ admin/reports/metrics/route.ts
✓ admin/reports/period/route.ts
```

---

### APIs Públicas (2)

```
✓ public/event-requests/route.ts (solicitar evento - wizard)
✓ public/quotations/[token]/route.ts (visualizar cotação pública)
```

---

### APIs Professional (6)

```
✓ professional/confirm/[token]/route.ts (confirmar participação)
✓ professional/dashboard/route.ts
✓ professional/document-validations/route.ts
✓ professional/events/[id]/route.ts
✓ professional/events/[id]/action/route.ts
✓ professional/profile/route.ts
```

---

### APIs Contractor (Cliente) (2)

```
✓ contratante/meus-projetos/route.ts
✓ contratante/meus-projetos/[id]/route.ts
```

---

### APIs Supplier (2)

```
✓ supplier/dashboard/route.ts
✓ supplier/quotations/[id]/route.ts
```

---

### APIs Core (16)

**Formulários Públicos:**
```
✓ contact/route.ts (formulário contato)
✓ proposals/[id]/accept/route.ts (cliente aceitar proposta)
✓ proposals/[id]/reject/route.ts (cliente rejeitar proposta)
✓ quotations/[id]/respond/route.ts (fornecedor responder cotação)
```

**Cadastros:**
```
✓ professionals/route.ts (cadastro público profissional?)
✓ professionals/me/route.ts (perfil do profissional)
✓ professionals/me/documents/route.ts
✓ contractors/route.ts
```

**Infraestrutura:**
```
✓ webhooks/clerk/route.ts (sincronizar usuários)
✓ upload/route.ts (upload de arquivos)
✓ notifications/route.ts
✓ notifications/[id]/read/route.ts
✓ notifications/mark-all-read/route.ts
✓ user/metadata/route.ts
✓ user/check-registration/route.ts
```

**Serviços Externos:**
```
✓ mapbox/directions/route.ts
✓ mapbox/isochrone/route.ts
```

---

## 📋 PLANO DE AÇÃO

### FASE 1: Limpeza Imediata (30 min)

**1.1 Remover APIs de Teste/Debug (10 APIs)**

```bash
# EXECUTAR ANTES DE PRODUÇÃO!
cd /c/Users/erick/HRX_OP/hrx

# Remover diretórios inteiros
rm -rf src/app/api/debug
rm -rf src/app/api/test

# Remover arquivos individuais
rm -f src/app/api/debug-auth/route.ts
rm -f src/app/api/send/route.ts
rm -f src/app/api/send-test/route.ts
rm -f src/app/api/test-simple/route.ts
rm -f src/app/api/test-supabase-view/route.ts

echo "✅ APIs de teste/debug removidas!"
```

**1.2 Remover Sistema de Delivery (3 APIs + 1 página)**

```bash
# Remover APIs
rm -rf src/app/api/deliveries

# Remover página de tracking
rm -rf src/app/cliente/evento/[id]/tracking

echo "✅ Sistema de delivery removido!"
```

**Resultado:** 13 APIs removidas, ficam **85 APIs**

---

### FASE 2: Migração de Sistema Antigo (2-3 horas)

**2.1 Migrar páginas de /admin/orcamentos para /admin/event-projects**

**Páginas a migrar:**
- `src/app/admin/orcamentos/page.tsx` → Usar `/api/admin/event-projects`
- `src/app/admin/orcamentos/novo/page.tsx` → Usar `/api/admin/event-projects` (POST)
- `src/app/admin/orcamentos/[id]/page.tsx` → Usar `/api/admin/event-projects/[id]`

**Ou renomear:**
- Mover `/admin/orcamentos` → `/admin/projetos` (já existe?)

**2.2 Remover APIs antigas (6 APIs)**

```bash
# Após migração do frontend
rm -rf src/app/api/admin/quotes
rm -rf src/app/api/admin/projects

echo "✅ Sistema antigo de quotes removido!"
```

**Resultado:** 6 APIs removidas, ficam **79 APIs**

---

### FASE 3: Revisar Suspeitas (30 min)

**3.1 Verificar `admin/set-admin-metadata`**

```bash
# Verificar se é usada
grep -r "api/admin/set-admin-metadata" src/app --include="*.tsx" --include="*.ts"

# Se NÃO for usada:
rm -f src/app/api/admin/set-admin-metadata/route.ts
```

**3.2 Verificar `professionals` (raiz)**

```bash
# Verificar se é usada
grep -r 'api/professionals"' src/app --include="*.tsx" --include="*.ts" | grep -v "admin/professionals" | grep -v "professionals/me"

# Determinar se é cadastro público ou está duplicada
```

---

### FASE 4: Proteger APIs que Ficarem

**4.1 Adicionar Rate Limiting (todas APIs públicas)**

APIs prioritárias:
- ✅ `public/event-requests` (já tem validação Zod ✓)
- ✅ `contact` (já tem validação Zod ✓)
- ✅ `quotations/[id]/respond`
- ✅ `proposals/[id]/accept`
- ✅ `proposals/[id]/reject`
- ✅ `professional/confirm/[token]`
- ✅ `webhooks/clerk`
- ✅ `mapbox/*`

**4.2 Adicionar Validação Zod (APIs críticas)**

APIs sem validação:
- ❌ `quotations/[id]/respond`
- ❌ `proposals/[id]/accept`
- ❌ `admin/event-projects` (POST, PATCH)
- ❌ `admin/event-projects/[id]/team` (POST)
- ❌ `admin/event-projects/[id]/equipment` (POST)

---

## 📊 RESULTADO FINAL ESTIMADO

| Antes | Depois | Removidas |
|-------|--------|-----------|
| 98 APIs | **~77-79 APIs** | **19-21 APIs** |

**Redução:** ~20% menos código para manter!

**Benefícios:**
- ✅ Código mais limpo e organizado
- ✅ Menos APIs para proteger (rate limiting, validação)
- ✅ Menos confusão (sem duplicatas)
- ✅ Deploy mais leve
- ✅ Mais fácil de documentar

---

## 🎯 DECISÕES PENDENTES

**Decisão 1: Sistema de Orçamentos**
- [ ] Migrar `/admin/orcamentos` para usar `event-projects`
- [ ] Remover APIs antigas `admin/quotes` e `admin/projects`

**Decisão 2: Sistema de Delivery**
- [x] DECIDIDO: Remover (não implementado, tabelas vazias)

**Decisão 3: APIs Suspeitas**
- [ ] Verificar se `admin/set-admin-metadata` é usada
- [ ] Verificar se `professionals` (raiz) está duplicada

---

**Próximo Passo:** Aguardar aprovação para executar FASE 1 (remoção de teste/debug)
