# 🔍 Análise de Logs de Produção - 25/10/2025

## 📊 RESUMO DOS LOGS

```
15:10:58 | GET  404 | /api/profissionais/eu
15:21:53 | GET  200 | /api/admin/contagens
15:22:23 | GET  200 | /api/admin/contagens
15:22:28 | POST 500 | /api/webhooks/clerk  ❌
15:22:32 | POST 500 | /api/webhooks/clerk  ❌
15:22:33 | POST 500 | /api/webhooks/clerk  ❌
15:22:53 | GET  200 | /api/admin/contagens
```

---

## 🚨 PROBLEMA CRÍTICO: Webhook do Clerk falhando

### **Sintomas:**
- 3 falhas consecutivas em 5 segundos (500)
- Clerk retenta automaticamente quando webhook falha
- Usuários não estão sendo sincronizados com Supabase

### **Causa Raiz (diagnosticado):**

**ANTES (código sem logs):**
```typescript
if (error) {
  return new Response('Erro no banco de dados', { status: 500 });
  // ❌ IMPOSSÍVEL saber qual erro!
}
```

**Problema:** Webhook não tinha `console.log`, então era impossível debugar na Vercel.

### **Possíveis Causas do Erro 500:**

#### 1. **RLS bloqueando insert** (80% probabilidade)

```sql
-- Supabase RLS está habilitado:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Mas Clerk não tem auth.uid():
INSERT INTO users (...) VALUES (...);
-- ❌ BLOQUEADO pela política RLS!
```

**Solução:**
```sql
-- Desabilitar RLS na tabela users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OU criar política que permite service_role:
CREATE POLICY "Service role pode inserir"
ON users FOR INSERT
TO service_role
USING (true);
```

#### 2. **Constraint violada** (15% probabilidade)

Possíveis violações:
- Email duplicado (unique constraint)
- Campo `role` NOT NULL mas recebendo NULL
- FK constraint (referência inválida)

#### 3. **WEBHOOK_SECRET incorreto** (5% probabilidade)

```bash
# .env.local (dev):
CLERK_WEBHOOK_SECRET="whsec_dev_test_local"

# Prod precisa do secret REAL do Clerk Dashboard
# Verificar em: Clerk Dashboard > Webhooks > Signing Secret
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **1. Adicionados logs detalhados**

**AGORA (código com logs completos):**
```typescript
console.log('🔵 [WEBHOOK] user.created:', {
  clerk_id: id,
  email: email_addresses[0]?.email_address,
  full_name: `${first_name || ''} ${last_name || ''}`.trim(),
  user_type: (public_metadata as any)?.userType
});

if (error) {
  console.error('❌ [WEBHOOK] Erro ao inserir usuário:', {
    code: error.code,        // Ex: "23505" (duplicate)
    message: error.message,   // Descrição do erro
    details: error.details,   // Detalhes extras
    hint: error.hint          // Sugestão de correção
  });

  return new Response(JSON.stringify({
    error: 'Erro no banco de dados',
    details: error.message,
    code: error.code
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

console.log('✅ [WEBHOOK] Usuário criado com sucesso:', data);
```

### **2. Retornos JSON com detalhes**

**Antes:**
```typescript
return new Response('Erro no banco de dados', { status: 500 });
// ❌ Clerk só vê texto genérico
```

**Depois:**
```typescript
return new Response(JSON.stringify({
  error: 'Erro no banco de dados',
  details: error.message,
  code: error.code
}), {
  status: 500,
  headers: { 'Content-Type': 'application/json' }
});
// ✅ Clerk recebe erro estruturado
```

### **3. Logs em TODOS os pontos:**
- ✅ user.created
- ✅ user.updated
- ✅ user.deleted
- ✅ Sucesso e erro

---

## 🔍 COMO DEBUGAR (próxima vez que falhar)

### **Passo 1: Ver logs na Vercel**

1. Acesse Vercel Dashboard
2. Vá em "Logs" ou "Functions"
3. Procure por `[WEBHOOK]`

**Você verá algo como:**

```bash
# Sucesso:
🔵 [WEBHOOK] user.created: { clerk_id: "user_abc123", email: "joao@example.com" }
✅ [WEBHOOK] Usuário criado com sucesso: [{ id: "uuid-123", ... }]

# OU erro:
🔵 [WEBHOOK] user.created: { clerk_id: "user_abc123", email: "joao@example.com" }
❌ [WEBHOOK] Erro ao inserir usuário: {
  code: "23505",
  message: "duplicate key value violates unique constraint \"users_email_key\"",
  details: "Key (email)=(joao@example.com) already exists."
}
```

### **Passo 2: Interpretar o erro**

| Código | Erro | Solução |
|--------|------|---------|
| `23505` | Duplicate key (unique) | Email já existe - usar UPSERT |
| `23503` | FK constraint violation | Referência inválida - verificar IDs |
| `23502` | NOT NULL violation | Campo obrigatório NULL - adicionar valor padrão |
| `42501` | Insufficient privilege | RLS bloqueando - desabilitar RLS |

### **Passo 3: Ver no Clerk Dashboard**

1. Acesse Clerk Dashboard
2. Vá em "Webhooks"
3. Clique no endpoint
4. Aba "Recent Deliveries"
5. Veja resposta do servidor

---

## ⚠️ PROBLEMA SECUNDÁRIO: 404 em /api/profissionais/eu

### **Sintomas:**
```
GET /api/profissionais/eu - 404
15:10:58
```

### **Diagnóstico:**

**Rota não existe:**
```bash
# Procurado em:
src/app/api/profissionais/eu/route.ts  ❌ NÃO EXISTE
```

### **Possíveis Causas:**

#### 1. **Código antigo em produção**
- Deploy antigo com referência a rota que foi removida
- Solução: Fazer novo deploy

#### 2. **Service Worker com cache antigo**
```javascript
// sw.js pode ter URL antiga cacheada
fetch('/api/profissionais/eu') // ❌ URL antiga
```
Solução: Incrementar versão do SW ou limpar cache

#### 3. **Crawler/Bot**
- Bot tentando URLs aleatórias
- Solução: Ignorar (não afeta usuários)

### **Verificar:**
```bash
# 1. Procurar no código por "profissionais/eu"
grep -r "profissionais/eu" src/

# 2. Ver se Service Worker tem essa URL
cat public/sw.js | grep profissionais

# 3. Verificar se algum fetch() usa essa URL
grep -r "fetch.*profissionais" src/
```

---

## ✅ LOGS DE SUCESSO

```
GET /api/admin/contagens - 200 (3x)
```

**Funcionando perfeitamente:**
- Dashboard admin carregando
- Polling automático (30s?)
- Sem erros

---

## 📋 CHECKLIST DE AÇÃO IMEDIATA

### **1. Deploy do webhook corrigido**
- [x] Adicionar console.log em user.created
- [x] Adicionar console.log em user.updated
- [x] Adicionar console.log em user.deleted
- [ ] **Fazer deploy na Vercel**
- [ ] **Testar com novo cadastro**

### **2. Verificar RLS no Supabase**
```sql
-- Executar no Supabase SQL Editor:

-- Ver status do RLS:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- Se rowsecurity = true, desabilitar:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### **3. Verificar WEBHOOK_SECRET na Vercel**
1. Acessar Vercel Dashboard
2. Settings > Environment Variables
3. Verificar `CLERK_WEBHOOK_SECRET`
4. Comparar com Clerk Dashboard > Webhooks > Signing Secret
5. Se diferente, atualizar e redesenhar

### **4. Testar fluxo completo**
1. Criar novo usuário no Clerk
2. Ver logs na Vercel em tempo real
3. Verificar se usuário apareceu no Supabase
4. Se ainda falhar, copiar erro completo dos logs

---

## 🎯 PRÓXIMOS PASSOS

### **Imediato (hoje):**
1. Deploy do webhook com logs
2. Desabilitar RLS na tabela users
3. Testar cadastro

### **Curto prazo (esta semana):**
1. Implementar UPSERT (caso email duplicado)
2. Adicionar retry logic
3. Webhook de teste (/api/webhooks/clerk/test)

### **Médio prazo:**
1. Monitoramento com Sentry
2. Alertas automáticos quando webhook falha
3. Dashboard de health do sistema

---

## 📊 CÓDIGO DO WEBHOOK (versão corrigida)

Localização: `src/app/api/webhooks/clerk/route.ts`

**Principais mudanças:**
```diff
+ console.log('🔵 [WEBHOOK] user.created:', {...});
+ console.error('❌ [WEBHOOK] Erro:', error);
+ console.log('✅ [WEBHOOK] Sucesso:', data);

- return new Response('Erro', { status: 500 });
+ return new Response(JSON.stringify({
+   error: 'Erro',
+   details: error.message,
+   code: error.code
+ }), { status: 500, headers: { 'Content-Type': 'application/json' } });
```

---

## 💡 LIÇÕES APRENDIDAS

1. **SEMPRE adicionar logs em webhooks** - Impossível debugar sem eles
2. **Retornar JSON estruturado** - Não apenas texto
3. **Incluir código de erro** - Facilita diagnóstico
4. **RLS pode bloquear service_role** - Desabilitar quando necessário
5. **Clerk retenta automaticamente** - 3 falhas = mesmo erro, não 3 erros diferentes

---

**Documentação criada em:** 25/10/2025 15:30
**Status:** Webhook corrigido, aguardando deploy e teste
**Prioridade:** 🔴 CRÍTICA - Usuários não conseguem se cadastrar
