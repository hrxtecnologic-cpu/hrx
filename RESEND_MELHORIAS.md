# 📧 RESEND - Recursos Avançados e Melhorias para HRX

## 📊 Estado Atual do Sistema

### ✅ O que já temos implementado:
- ✅ 25 templates de email em React
- ✅ Logging de emails no banco de dados
- ✅ Envio transacional individual
- ✅ Interface de gerenciamento de templates
- ✅ Histórico de emails enviados

### ❌ O que NÃO temos:
- ❌ Webhooks para rastreamento de entregas/aberturas/cliques
- ❌ Email tracking (open/click tracking)
- ❌ Envio em lote (batch sending)
- ❌ Agendamento de emails
- ❌ Broadcasts para múltiplos destinatários
- ❌ Analytics avançado de performance
- ❌ Sistema de retry automático

---

## 🚀 RECURSOS AVANÇADOS DO RESEND (2025)

### 1. **Broadcast API** (Lançado Mar 2025)

**O que é:**
Sistema para enviar emails em massa com personalização, throttling inteligente e métricas de engajamento.

**Casos de uso no HRX:**
- ✅ Newsletters mensais para profissionais
- ✅ Avisos de novos projetos para categoria específica
- ✅ Comunicados gerais (atualizações de sistema, novos recursos)
- ✅ Campanhas de marketing para fornecedores inativos
- ✅ Lembretes de documentação pendente em massa

**Recursos:**
- Envio para milhões de emails
- Editor no-code para revisar antes de enviar
- Personalização com dados da audiência `{{{variavel}}}`
- Unsubscribe automático com `{{{RESEND_UNSUBSCRIBE_URL}}}`
- Métricas de engajamento (aberturas, cliques)

**Implementação estimada:** 2-3 dias

---

### 2. **Batch Sending API**

**O que é:**
Enviar até 100 emails em uma única chamada de API, com Resend gerenciando toda orquestração.

**Casos de uso no HRX:**
- ✅ Enviar convites para 50+ profissionais de um projeto
- ✅ Notificar múltiplos fornecedores sobre novo orçamento
- ✅ Enviar lembretes de documentação para vários profissionais
- ✅ Confirmações de agendamento para equipe inteira

**Limitações:**
- ⚠️ Não suporta `attachments` em batch
- ⚠️ Não suporta `scheduled_at` em batch (não pode agendar batch)

**Implementação estimada:** 1 dia

---

### 3. **Scheduling API**

**O que é:**
Agendar envio de emails transacionais para até 72h no futuro.

**Casos de uso no HRX:**
- ✅ Lembretes automáticos 24h antes do evento
- ✅ Follow-ups após 48h de convite sem resposta
- ✅ Lembretes de documentação pendente após 3 dias
- ✅ Emails de confirmação agendados para horário comercial
- ✅ Cobranças automáticas de orçamentos

**Formato:** ISO 8601 (ex: `2024-08-05T11:52:01.858Z`)

**Implementação estimada:** 1 dia

---

### 4. **Webhooks para Email Tracking**

**O que é:**
Receber notificações em tempo real sobre status de emails.

**Eventos disponíveis:**
- `email.sent` - API request foi bem-sucedido
- `email.delivered` - Email entregue no servidor do destinatário
- `email.delivery_delayed` - Entrega atrasada
- `email.bounced` - Email rejeitado permanentemente
- `email.complained` - Marcado como spam
- `email.opened` - Email foi aberto (requer tracking)
- `email.clicked` - Link foi clicado (requer tracking)
- `email.failed` - Falha no envio

**Casos de uso no HRX:**
- ✅ Atualizar status de email no banco em tempo real
- ✅ Alertas automáticos para bounces/spam
- ✅ Métricas de abertura de convites de profissionais
- ✅ Tracking de cliques em links de orçamento
- ✅ Retry automático para emails com delivery_delayed
- ✅ Notificar admin quando fornecedor não abre orçamento

**Implementação estimada:** 2 dias

---

### 5. **Open & Click Tracking**

**O que é:**
Rastreamento automático de aberturas e cliques nos emails.

**Como funciona:**
- Resend injeta pixel invisível para rastreio de aberturas
- Links são substituídos por redirects através do servidor Resend
- Eventos enviados via webhook

**Configuração:**
Precisa ativar tracking no domínio usado para envio.

**Casos de uso no HRX:**
- ✅ Medir engajamento de profissionais com convites
- ✅ Identificar fornecedores que não abrem orçamentos
- ✅ A/B testing de subject lines
- ✅ Métricas de performance de templates
- ✅ Dashboard de analytics de comunicação

**Implementação estimada:** 1 dia (após configurar domínio)

---

## 💡 MELHORIAS PROPOSTAS PARA HRX

### **FASE 1: Fundamentos (1 semana)**

#### 1.1 Implementar Webhooks
**Prioridade:** 🔴 Alta

```typescript
// Nova rota: /api/webhooks/resend
POST /api/webhooks/resend
```

**Benefícios:**
- Status de emails atualizado automaticamente
- Alertas de bounces/spam em tempo real
- Base para analytics avançado

**Arquivos a criar:**
- `src/app/api/webhooks/resend/route.ts`
- `src/lib/resend/webhook-handler.ts`

---

#### 1.2 Ativar Email Tracking
**Prioridade:** 🟡 Média

**Requisitos:**
- Configurar tracking no domínio `@hrxeventos.com.br`
- Adicionar colunas no banco: `opened_at`, `first_clicked_at`, `clicks_count`

**Benefícios:**
- Métricas de engajamento
- Identificar emails não lidos
- Melhorar estratégia de comunicação

---

#### 1.3 Sistema de Retry Automático
**Prioridade:** 🟡 Média

**Lógica:**
- Se `email.delivery_delayed` → Esperar 1h e verificar status
- Se `email.bounced` (soft bounce) → Tentar reenviar após 24h
- Se `email.failed` → Alertar admin

**Implementação:**
- Usar webhooks + cron job ou background worker

---

### **FASE 2: Automações (2 semanas)**

#### 2.1 Batch Sending para Convites
**Prioridade:** 🔴 Alta

**Exemplo de uso:**
```typescript
// Enviar convites para 50 profissionais
await resend.batch.send([
  { to: 'prof1@example.com', ... },
  { to: 'prof2@example.com', ... },
  // ... até 100
]);
```

**Casos:**
- Convites de projeto para múltiplos profissionais
- Lembretes de documentação em massa
- Notificações de novos projetos por categoria

---

#### 2.2 Agendamento de Emails
**Prioridade:** 🟡 Média

**Novos recursos:**
- Lembrete 24h antes do evento
- Follow-up automático após 48h
- Emails agendados para horário comercial

**Interface:**
```typescript
await resend.emails.send({
  ...emailData,
  scheduled_at: '2025-11-01T09:00:00Z'
});
```

---

#### 2.3 Sistema de Follow-ups Automáticos
**Prioridade:** 🟢 Baixa

**Fluxos:**
1. Convite enviado → Se não aberto em 48h → Reenviar
2. Orçamento solicitado → Se não respondido em 72h → Lembrete
3. Documentação pendente → Lembrar a cada 7 dias

---

### **FASE 3: Marketing & Broadcasts (3 semanas)**

#### 3.1 Broadcast API para Newsletters
**Prioridade:** 🟢 Baixa

**Casos de uso:**
- Newsletter mensal para profissionais
- Avisos de novos recursos
- Comunicados gerais

**Interface Admin:**
- Criar broadcast
- Selecionar audiência (profissionais ativos, fornecedores, etc)
- Personalizar template
- Preview antes de enviar
- Agendar envio

---

#### 3.2 Dashboard de Analytics
**Prioridade:** 🟡 Média

**Métricas:**
- Taxa de abertura por template
- Taxa de cliques
- Bounces e complaints
- Performance por categoria de usuário
- Melhores horários de envio

---

#### 3.3 Sistema de Unsubscribe
**Prioridade:** 🟡 Média

**Recursos:**
- Link de descadastro em todos os emails
- Central de preferências de email
- Gerenciamento de tipos de notificação

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Estrutura de Arquivos Sugerida

```
src/
├── app/api/
│   ├── webhooks/resend/route.ts           # ✨ NOVO
│   └── admin/
│       ├── broadcasts/
│       │   ├── route.ts                   # ✨ NOVO
│       │   ├── [id]/route.ts              # ✨ NOVO
│       │   └── [id]/send/route.ts         # ✨ NOVO
│       └── email-analytics/route.ts       # ✨ NOVO
├── lib/resend/
│   ├── webhook-handler.ts                 # ✨ NOVO
│   ├── batch-sender.ts                    # ✨ NOVO
│   ├── broadcast-manager.ts               # ✨ NOVO
│   └── analytics.ts                       # ✨ NOVO
└── app/admin/comunicacao/
    ├── broadcasts/
    │   ├── page.tsx                       # ✨ NOVO
    │   ├── novo/page.tsx                  # ✨ NOVO
    │   └── [id]/page.tsx                  # ✨ NOVO
    └── analytics/page.tsx                 # ✨ NOVO
```

### Tabelas do Banco Necessárias

```sql
-- Adicionar colunas à tabela email_logs existente
ALTER TABLE email_logs ADD COLUMN opened_at TIMESTAMP;
ALTER TABLE email_logs ADD COLUMN first_clicked_at TIMESTAMP;
ALTER TABLE email_logs ADD COLUMN clicks_count INTEGER DEFAULT 0;
ALTER TABLE email_logs ADD COLUMN bounced_at TIMESTAMP;
ALTER TABLE email_logs ADD COLUMN bounce_type TEXT;

-- Nova tabela para broadcasts
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_used TEXT NOT NULL,
  audience_filter JSONB,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nova tabela para tracking de clicks
CREATE TABLE email_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id UUID REFERENCES email_logs(id),
  url TEXT NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Nova tabela para preferências de email
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  unsubscribed_from_all BOOLEAN DEFAULT FALSE,
  unsubscribed_from_marketing BOOLEAN DEFAULT FALSE,
  unsubscribed_from_notifications BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 PRIORIDADES RECOMENDADAS

### Curto Prazo (1-2 semanas):
1. ✅ Webhooks (tracking de status)
2. ✅ Batch sending (convites em massa)
3. ✅ Email tracking (aberturas/cliques)

### Médio Prazo (1 mês):
4. ✅ Agendamento de emails
5. ✅ Dashboard de analytics
6. ✅ Sistema de retry

### Longo Prazo (2-3 meses):
7. ✅ Broadcast API
8. ✅ Follow-ups automáticos
9. ✅ Sistema de unsubscribe

---

## 💰 CUSTOS

**Resend Pricing:**
- Free: 3,000 emails/mês + 100 emails/dia
- Pro ($20/mês): 50,000 emails/mês + domínios ilimitados
- Business ($250/mês): 500,000 emails/mês + suporte prioritário

**Recomendação para HRX:**
- Iniciar com **Free Tier**
- Migrar para **Pro** quando passar de 3k emails/mês
- Broadcast API disponível em todos os planos

---

## 🎯 QUICK WINS (Implementar Hoje)

### 1. Batch Sending para Convites (2-3 horas)
Substituir loop de envios individuais por batch quando convidar múltiplos profissionais.

### 2. Agendamento de Lembretes (1-2 horas)
Agendar email de lembrete 24h antes do evento usando `scheduled_at`.

### 3. Webhook Endpoint Básico (2-3 horas)
Criar endpoint para receber webhooks e atualizar status de emails.

---

## 📚 Recursos e Documentação

- [Broadcast API](https://resend.com/blog/broadcast-api)
- [Batch Emails API](https://resend.com/blog/introducing-the-batch-emails-api)
- [Schedule Email API](https://resend.com/blog/introducing-the-schedule-email-api)
- [Webhooks](https://resend.com/blog/webhooks)
- [Open & Click Tracking](https://resend.com/blog/open-and-click-tracking)
- [Event Types](https://resend.com/docs/dashboard/webhooks/event-types)

---

**Documento gerado em:** 29/10/2025
**Responsável:** Claude (Análise de Recursos Resend)
