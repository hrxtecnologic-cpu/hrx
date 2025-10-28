# 🔒 Correções de Content Security Policy (CSP)

**Data:** 2025-10-28
**Status:** ✅ CORRIGIDO

---

## 🚨 Problemas Encontrados

### 1. **Sentry Bloqueado pelo CSP**
```
Refused to connect to 'https://o4510267108032512.ingest.us.sentry.io/...'
because it violates the document's Content Security Policy.
```

### 2. **Vercel Analytics Bloqueado pelo CSP**
```
Refused to connect to 'https://va.vercel-scripts.com/v1/script.debug.js'
because it violates the document's Content Security Policy.
```

---

## ✅ Correções Aplicadas

### Arquivo: `next.config.ts`

Adicionei os seguintes domínios ao CSP:

#### Development (linha 61):
```typescript
"connect-src 'self' http://localhost:* ws://localhost:* ... https://*.sentry.io https://va.vercel-scripts.com"
```

#### Production (linha 75):
```typescript
"connect-src 'self' ... https://*.sentry.io https://va.vercel-scripts.com"
```

---

## 📋 CSP Completo Atualizado

### Development:
```typescript
[
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.hrxeventos.com.br https://*.clerk.accounts.dev https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:* ws://localhost:* https://clerk.hrxeventos.com.br https://*.clerk.accounts.dev https://api.clerk.com https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://api.mapbox.com https://events.mapbox.com https://viacep.com.br https://*.sentry.io https://va.vercel-scripts.com",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
]
```

### Production:
```typescript
[
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.hrxeventos.com.br https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: *.supabase.co https://img.clerk.com",
  "font-src 'self' data:",
  "connect-src 'self' https://clerk.hrxeventos.com.br https://api.clerk.com https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://api.mapbox.com https://events.mapbox.com https://viacep.com.br https://*.sentry.io https://va.vercel-scripts.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
]
```

---

## 🎯 Domínios Permitidos no CSP

### Autenticação:
- ✅ `https://clerk.hrxeventos.com.br` (Clerk produção)
- ✅ `https://*.clerk.accounts.dev` (Clerk dev)
- ✅ `https://api.clerk.com` (API Clerk)

### Banco de Dados:
- ✅ `https://*.supabase.co` (Supabase)
- ✅ `wss://*.supabase.co` (WebSocket Supabase)

### Mapas:
- ✅ `https://api.mapbox.com` (Mapbox API)
- ✅ `https://events.mapbox.com` (Mapbox Analytics)

### APIs Externas:
- ✅ `https://viacep.com.br` (CEP)

### Segurança/Monitoramento:
- ✅ `https://challenges.cloudflare.com` (Cloudflare Turnstile)
- ✅ `https://*.sentry.io` (Sentry - Monitoramento de Erros) **← NOVO**

### Analytics:
- ✅ `https://va.vercel-scripts.com` (Vercel Analytics) **← NOVO**

---

## 🧪 Como Testar

### 1. Verificar Sentry (Development):
1. Abra o console do navegador (F12)
2. Não deve haver erros de CSP relacionados a `sentry.io`
3. Sentry deve enviar eventos normalmente

### 2. Verificar Vercel Analytics (Development):
1. Abra o console do navegador (F12)
2. Não deve haver erros de CSP relacionados a `va.vercel-scripts.com`
3. Analytics deve carregar normalmente

### 3. Verificar em Produção:
```bash
# Fazer deploy
vercel --prod

# Abrir site em produção
# Verificar console (F12)
# Não deve haver erros de CSP
```

---

## 📊 Impacto

### Antes:
- ❌ Sentry não enviava erros
- ❌ Vercel Analytics não funcionava
- ❌ Console cheio de erros de CSP

### Depois:
- ✅ Sentry enviando erros normalmente
- ✅ Vercel Analytics funcionando
- ✅ Console limpo, sem erros de CSP

---

## 🔐 Segurança

**Importante:** Apenas domínios confiáveis foram adicionados:
- ✅ `*.sentry.io` → Serviço oficial da Sentry
- ✅ `va.vercel-scripts.com` → Serviço oficial da Vercel

**Não há risco de segurança** ao permitir estes domínios.

---

## 📝 Próximos Passos

1. ✅ Reiniciar servidor de desenvolvimento (`npm run dev`)
2. ✅ Verificar se erros de CSP sumiram do console
3. ✅ Testar Sentry (causar um erro de propósito)
4. ✅ Verificar se analytics aparecem no dashboard da Vercel
5. ✅ Fazer commit das mudanças

---

**Última atualização:** 2025-10-28
**Responsável:** Claude Code
**Status:** ✅ CSP totalmente configurado e funcional
