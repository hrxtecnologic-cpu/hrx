# 📊 Guia de Configuração do Sentry para Monitoring

## O que é Sentry?

Sentry é uma plataforma de **monitoring de erros em tempo real** que ajuda a:
- Detectar bugs em produção automaticamente
- Rastrear performance da aplicação
- Receber alertas quando algo quebrar
- Ver stack traces completos de erros

---

## 📦 Instalação

### 1. Criar conta no Sentry

1. Acesse https://sentry.io
2. Crie uma conta gratuita (10k eventos/mês grátis)
3. Crie um novo projeto Next.js
4. Copie o DSN fornecido

### 2. Instalar dependências

```bash
npm install @sentry/nextjs --save
```

### 3. Executar wizard de configuração

```bash
npx @sentry/wizard@latest -i nextjs
```

Isso criará automaticamente:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Modificará `next.config.ts`

---

## ⚙️ Configuração Manual

### 1. Criar `sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% das transações

  // Session Replay
  replaysOnErrorSampleRate: 1.0, // 100% quando há erro
  replaysSessionSampleRate: 0.1, // 10% de sessões normais

  // Filtros
  beforeSend(event, hint) {
    // Não enviar erros de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filtrar erros conhecidos/irrelevantes
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }

    return event;
  },

  // Configurações adicionais
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

### 2. Criar `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    // Não expor dados sensíveis
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    return event;
  },

  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

### 3. Adicionar ao `.env.local`

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=sua-org
SENTRY_PROJECT=hrx-eventos
SENTRY_AUTH_TOKEN=seu-token-de-autenticacao
```

### 4. Adicionar ao `.gitignore`

```
# Sentry
.sentryclirc
sentry.properties
```

---

## 🔧 Integração com o Sistema de Logging

### Atualizar `src/lib/logger.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

class Logger {
  // ... código existente ...

  error(message: string, error?: Error, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error,
      context,
    };

    console.error(this.formatLog(entry));

    // 🔥 INTEGRAÇÃO COM SENTRY
    if (!this.isDevelopment && error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        tags: {
          userId: context?.userId,
        },
      });
    }
  }

  security(message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'security',
      message,
      context,
    };

    console.warn(this.formatLog(entry));

    // 🔥 ALERTAR SENTRY PARA EVENTOS DE SEGURANÇA
    if (!this.isDevelopment) {
      Sentry.captureMessage(message, {
        level: 'warning',
        contexts: {
          security: context,
        },
      });
    }
  }
}
```

---

## 📊 Métricas e Alertas Recomendados

### 1. Configurar Alertas no Sentry

No dashboard do Sentry:

**Alert 1: Erro Crítico**
- Condição: Qualquer erro novo em produção
- Notificar: Slack + Email
- Frequência: Imediata

**Alert 2: Taxa de Erro Alta**
- Condição: > 10 erros/minuto
- Notificar: Slack + Email
- Frequência: A cada 5 minutos

**Alert 3: Evento de Segurança**
- Condição: Tag "security" detectada
- Notificar: Email para equipe
- Frequência: Imediata

### 2. Dashboards Importantes

**Dashboard de Saúde da Aplicação**:
- Taxa de erros por hora
- Usuários afetados
- Páginas com mais erros
- Performance de APIs

**Dashboard de Segurança**:
- Tentativas de acesso não autorizado
- Rate limits excedidos
- Uploads suspeitos
- Mudanças de roles

---

## 🎯 Eventos para Monitorar

### Erros Críticos

```typescript
// Em qualquer try/catch importante
try {
  // código
} catch (error) {
  logger.error('Falha crítica em X', error, {
    userId,
    action: 'cadastro',
  });
}
```

### Performance

```typescript
// Medir performance de operações
const transaction = Sentry.startTransaction({
  op: 'upload',
  name: 'Upload de Documento',
});

try {
  await uploadDocument(file);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### Eventos de Segurança

```typescript
// Tentativa de acesso não autorizado
logAuthEvent('unauthorized', userId, {
  ip: request.ip,
  path: request.url,
});

// Rate limit excedido
Sentry.captureMessage('Rate limit exceeded', {
  level: 'warning',
  tags: { userId, endpoint: '/api/upload' },
});
```

---

## 🔍 Debugging com Source Maps

Para ver o código original (não minificado) no Sentry:

### 1. Habilitar source maps no `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // ... outras configs ...

  productionBrowserSourceMaps: true, // Para client
  experimental: {
    serverSourceMaps: true, // Para server
  },
};
```

### 2. Upload automático ao fazer deploy

```json
// package.json
{
  "scripts": {
    "build": "next build && sentry-cli sourcemaps upload --org sua-org --project hrx-eventos .next"
  }
}
```

---

## 📱 Integração com Slack

### Configurar Webhook

1. No Sentry, vá em **Settings** → **Integrations**
2. Encontre **Slack** e clique em **Add to Slack**
3. Autorize e escolha o canal (ex: `#hrx-alerts`)
4. Configure quais alertas enviar

**Exemplo de mensagem no Slack**:
```
🚨 [ERRO CRÍTICO] Falha no upload de documento
Usuário: user_123
Erro: File size exceeds limit
URL: /api/upload
Ocorrências: 5 nos últimos 5 minutos
```

---

## 🧪 Testando a Integração

### Testar erro no cliente

```typescript
// Em qualquer componente
<button onClick={() => {
  throw new Error('Teste de erro do Sentry');
}}>
  Testar Sentry
</button>
```

### Testar erro no servidor

```typescript
// Em qualquer API route
export async function GET() {
  throw new Error('Teste de erro do servidor');
}
```

### Verificar no Dashboard

1. Acesse https://sentry.io
2. Vá no seu projeto "HRX Eventos"
3. Deve aparecer o erro nos últimos minutos
4. Clique para ver stack trace completo

---

## 💰 Planos e Custos

| Plano | Eventos/mês | Custo |
|-------|-------------|-------|
| **Developer** (Grátis) | 10.000 | $0 |
| **Team** | 50.000 | $26/mês |
| **Business** | 100.000+ | $80+/mês |

**Recomendação para HRX**:
- Começar com **Developer** (grátis)
- Monitorar uso
- Upgrade se passar de 10k eventos/mês

---

## ✅ Checklist de Configuração

- [ ] Conta no Sentry criada
- [ ] DSN adicionado ao `.env.local`
- [ ] Sentry instalado com `npx @sentry/wizard`
- [ ] Logs integrados com Sentry
- [ ] Source maps habilitados
- [ ] Alertas configurados
- [ ] Integração com Slack ativa
- [ ] Teste de erro executado com sucesso

---

## 🆘 Troubleshooting

**Problema**: Eventos não aparecem no Sentry
- Verificar se `NEXT_PUBLIC_SENTRY_DSN` está definido
- Verificar se está em produção (`NODE_ENV=production`)
- Verificar logs do console para erros do Sentry

**Problema**: Source maps não funcionam
- Verificar se `productionBrowserSourceMaps: true`
- Verificar se upload de source maps está funcionando
- Verificar token de autenticação do Sentry CLI

**Problema**: Muitos eventos sendo enviados
- Ajustar `tracesSampleRate` para valor menor (ex: 0.05)
- Adicionar mais filtros no `beforeSend`
- Filtrar erros conhecidos

---

**Última atualização**: {{ DATA_DO_COMMIT }}
**Documentação oficial**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
