# Avaliação do Sistema de Notificações HRX

## Status: PARCIALMENTE COMPLETO

---

## ✅ O que JÁ EXISTE

### 1. Infraestrutura de Banco de Dados

**Tabela `notifications`** - Estrutura completa e bem definida:
```sql
- id (uuid)
- user_id (uuid) → FK para users
- user_type (admin | professional | supplier | client)
- notification_type (16 tipos diferentes)
- title, message
- action_url (link para ação)
- project_id, professional_id, supplier_id (FKs opcionais)
- is_read, read_at
- priority (low | normal | high | urgent)
- created_at, expires_at
- metadata (jsonb) → dados extras flexíveis
```

**Tabela `notification_stats`** - View materializada com estatísticas:
```sql
- user_id
- user_type
- total_notifications
- unread_count
- urgent_count
- high_count
- last_notification_at
```

**Tabela `notification_preferences`** (existe mas precisa verificar):
- Preferências de notificação por usuário
- Email, push, SMS habilitados
- Tipos de notificação que deseja receber
- Frequência de digest (instant, hourly, daily, weekly, never)

### 2. Funções RPC (Supabase)

**`create_notification()`** - Criação de notificação:
- Recebe todos os parâmetros necessários
- Validações internas
- Retorna ID da notificação criada

**`mark_notification_as_read()`** - Marcar como lida:
- Recebe notification_id
- Atualiza is_read e read_at

**`mark_all_notifications_as_read()`** - Marcar todas como lidas:
- Recebe user_id
- Retorna quantidade de notificações marcadas

### 3. API REST Completa

**GET `/api/notifications`**
- Busca notificações do usuário autenticado
- Filtros: unread_only, limit, offset
- Retorna notificações + estatísticas
- Paginação implementada

**POST `/api/notifications`**
- Criar notificação (apenas admin)
- Validações de campos obrigatórios
- Chama função RPC create_notification

**POST `/api/notifications/[id]/read`**
- Marcar notificação específica como lida
- Chama função RPC mark_notification_as_read

**POST `/api/notifications/mark-all-read`**
- Marcar todas as notificações como lidas
- Chama função RPC mark_all_notifications_as_read

### 4. Components UI Completos

**`NotificationBell` (src/components/NotificationBell.tsx)**
- Sino com badge de contador
- Dropdown com últimas 10 notificações
- Polling a cada 30 segundos (⚠️ deveria ser Realtime)
- Indicador visual de não lidas
- Botão "Marcar todas como lidas"
- Link para página completa de notificações

**Página de Notificações (src/app/notifications/page.tsx)**
- Lista completa de notificações
- Cards de estatísticas (Total, Não Lidas, Urgentes, Alta Prioridade)
- Filtros: Todas | Não Lidas
- Botão "Marcar todas como lidas"
- Ícones por tipo de notificação
- Badges de prioridade
- Links para ação

### 5. Sistema de Tipos (TypeScript)

**16 tipos de notificação definidos:**
```typescript
- project_created
- project_status_changed
- invitation_received, invitation_accepted, invitation_rejected
- quotation_received, quotation_accepted
- document_approved, document_rejected, document_expiring
- team_incomplete
- proposal_sent
- payment_received
- event_reminder
- system_alert
```

**Interfaces completas:**
- Notification
- NotificationPreferences
- NotificationStats
- CreateNotificationData
- NotificationPriority
- UserType

**Helper functions:**
- getNotificationIcon() - Emojis por tipo
- formatNotificationTime() - "5m atrás", "2h atrás"
- NOTIFICATION_TYPE_LABELS
- PRIORITY_LABELS
- PRIORITY_COLORS

### 6. Integração com Resend (Email)

**Resend configurado:**
- API key no .env
- Teste funcionando (src/app/api/send-test/route.ts)
- Email template básico
- Configuração de email templates no banco (email_template_config)
- Sistema de cores e textos customizáveis

---

## ❌ O que FALTA para Entregas (Delivery Tracking)

### 1. Novos Tipos de Notificação

**Precisa adicionar ao enum `notification_type`:**
```sql
- delivery_reminder_7_days
- delivery_reminder_2_days
- delivery_reminder_2_hours
- delivery_tracking_started
- delivery_approaching (5 min)
- delivery_completed
- delivery_delayed
- delivery_cancelled
```

### 2. Campos Adicionais na Tabela

**Adicionar à tabela `notifications`:**
```sql
- delivery_tracking_id (uuid) → FK para delivery_trackings
- estimated_arrival (timestamptz) → ETA calculado
- actual_arrival (timestamptz) → quando entregou de fato
- delay_minutes (integer) → atraso em minutos
```

### 3. Sistema de Agendamento (Cron Jobs)

**CRÍTICO - Não existe:**
- ❌ Sistema para agendar notificações futuras
- ❌ Cron jobs para verificar e enviar notificações
- ❌ Fila de notificações agendadas

**Necessário implementar:**
```
Opção 1: Supabase Edge Functions + pg_cron
Opção 2: Vercel Cron Jobs
Opção 3: Trigger + pg_cron no Supabase
```

**Notificações que precisam de agendamento:**
- 7 dias antes do evento
- 2 dias antes da entrega
- 2 horas antes da entrega

### 4. Triggers Automáticos

**Não existem triggers para delivery tracking:**

**Precisam ser criados:**
```sql
-- Quando delivery_tracking.status muda para 'in_transit'
→ Notificar Contratante: "Entrega iniciada"
→ Enviar email com link de tracking

-- Quando motorista atualiza GPS (a cada X segundos)
→ Calcular ETA com Mapbox
→ Se ETA < 5 min e ainda não notificou
   → Notificar: "Entrega chegando em 5 min"

-- Quando delivery_tracking.status muda para 'delivered'
→ Notificar: "Entrega concluída"
→ Enviar email de confirmação

-- Quando atraso detectado (scheduled_delivery_time + 15min)
→ Notificar: "Entrega atrasada"
→ Notificar admin também
```

### 5. Notificações Push (Navegador)

**Não implementado:**
- ❌ Service Worker para push notifications
- ❌ Permissão do navegador
- ❌ Registro de subscription
- ❌ Backend para enviar push

**Seria importante para:**
- Motorista em trânsito (alertas)
- Cliente acompanhando entrega (tempo real)
- Admin monitorando múltiplas entregas

### 6. Sistema de Email Automatizado

**Existe Resend, mas falta:**
- ❌ Templates específicos de entrega
- ❌ Envio automático via trigger
- ❌ Email com link de tracking
- ❌ Email de confirmação de entrega
- ❌ Email de atraso

**Templates necessários:**
```
- delivery-started.tsx
- delivery-approaching.tsx
- delivery-completed.tsx
- delivery-delayed.tsx
- delivery-reminder-7-days.tsx
- delivery-reminder-2-days.tsx
- delivery-reminder-2-hours.tsx
```

### 7. Integração com Realtime

**NotificationBell usa polling (30s):**
```typescript
// ❌ Ruim (atual):
setInterval(loadNotifications, 30000);

// ✅ Ideal (Realtime):
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    setNotifications(prev => [payload.new, ...prev]);
    playSound(); // opcional
    showToast(payload.new.title);
  })
  .subscribe();
```

---

## 🔧 Comparação: Sistema Atual vs Necessário para Entregas

| Recurso | Status Atual | Necessário |
|---------|-------------|------------|
| Tabela de notificações | ✅ Completo | ⚠️ Adicionar campos de delivery |
| Tipos de notificação | ⚠️ 16 tipos gerais | ❌ Adicionar 8 tipos de delivery |
| API REST | ✅ Completo | ✅ Pode reutilizar |
| UI Components | ✅ Completo | ✅ Pode reutilizar |
| Polling vs Realtime | ⚠️ Polling 30s | ❌ Implementar Realtime |
| Triggers automáticos | ❌ Não existe | ❌ Precisa criar |
| Agendamento (Cron) | ❌ Não existe | ❌ Precisa criar |
| Email templates | ⚠️ Básico | ❌ Templates de delivery |
| Push notifications | ❌ Não existe | ⚠️ Recomendado |
| SMS | ❌ Não existe | ⚠️ Opcional (Twilio) |

---

## 📋 Plano de Implementação

### FASE 1: Preparação da Infraestrutura (1-2 dias)

**1.1 - Atualizar Schema do Banco**
```sql
-- Adicionar novos tipos de notificação
ALTER TYPE notification_type ADD VALUE 'delivery_reminder_7_days';
ALTER TYPE notification_type ADD VALUE 'delivery_reminder_2_days';
ALTER TYPE notification_type ADD VALUE 'delivery_reminder_2_hours';
ALTER TYPE notification_type ADD VALUE 'delivery_tracking_started';
ALTER TYPE notification_type ADD VALUE 'delivery_approaching';
ALTER TYPE notification_type ADD VALUE 'delivery_completed';
ALTER TYPE notification_type ADD VALUE 'delivery_delayed';
ALTER TYPE notification_type ADD VALUE 'delivery_cancelled';

-- Adicionar campos à tabela notifications
ALTER TABLE notifications
  ADD COLUMN delivery_tracking_id UUID REFERENCES delivery_trackings(id),
  ADD COLUMN estimated_arrival TIMESTAMPTZ,
  ADD COLUMN actual_arrival TIMESTAMPTZ,
  ADD COLUMN delay_minutes INTEGER;

-- Criar tabela de notificações agendadas
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_data JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_pending
  ON scheduled_notifications(scheduled_for)
  WHERE status = 'pending';
```

**1.2 - Atualizar Types TypeScript**
- Adicionar novos tipos ao enum NotificationType
- Adicionar labels e ícones correspondentes
- Atualizar interface Notification

### FASE 2: Triggers e Automações (2-3 dias)

**2.1 - Criar Triggers SQL**
```sql
-- Trigger: Quando status muda para 'in_transit'
CREATE OR REPLACE FUNCTION notify_delivery_started()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_transit' AND OLD.status != 'in_transit' THEN
    -- Criar notificação para o contratante
    -- Agendar email
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Detectar atraso
CREATE OR REPLACE FUNCTION check_delivery_delay()
RETURNS void AS $$
-- Buscar entregas atrasadas (15+ minutos)
-- Criar notificações de atraso
$$ LANGUAGE plpgsql;
```

**2.2 - Sistema de Cron Jobs**
```typescript
// Opção 1: Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/check-deliveries",
      "schedule": "* * * * *" // A cada minuto
    },
    {
      "path": "/api/cron/send-scheduled-notifications",
      "schedule": "*/5 * * * *" // A cada 5 minutos
    }
  ]
}

// src/app/api/cron/check-deliveries/route.ts
export async function GET() {
  // 1. Buscar entregas próximas (2h, 2d, 7d)
  // 2. Criar notificações agendadas se não existem
  // 3. Verificar atrasos
  // 4. Calcular ETA e notificar se < 5min
}
```

### FASE 3: Templates de Email (1 dia)

**3.1 - Criar Templates React**
```tsx
// src/emails/delivery-started.tsx
export function DeliveryStartedEmail({ delivery, trackingLink }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Entrega Iniciada 🚚</Heading>
          <Text>
            A entrega do fornecedor {delivery.supplier.company_name}
            foi iniciada!
          </Text>
          <Button href={trackingLink}>
            Acompanhar em Tempo Real
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

**3.2 - Integrar com Triggers**
```typescript
async function sendDeliveryEmail(type, delivery) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  let template;
  switch(type) {
    case 'started':
      template = DeliveryStartedEmail;
      break;
    // ... outros casos
  }

  await resend.emails.send({
    from: 'HRX <entregas@hrx.com.br>',
    to: delivery.contratante.email,
    subject: `Atualização da Entrega - ${delivery.supplier.company_name}`,
    react: template({ delivery, trackingLink })
  });
}
```

### FASE 4: Notificações Realtime (1 dia)

**4.1 - Substituir Polling por Realtime**
```typescript
// src/hooks/useRealtimeNotifications.ts
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        toast.info(payload.new.title);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? payload.new : n)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return notifications;
}
```

**4.2 - Atualizar NotificationBell**
```typescript
// Trocar de:
useEffect(() => {
  const interval = setInterval(loadNotifications, 30000);
  return () => clearInterval(interval);
}, []);

// Para:
const realtimeNotifications = useRealtimeNotifications(userId);
```

### FASE 5: Push Notifications (Opcional - 2 dias)

**5.1 - Service Worker**
```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/logo.png',
    badge: '/badge.png',
    data: { url: data.action_url }
  });
});
```

**5.2 - Registro de Push**
```typescript
// src/lib/push-notifications.ts
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  });

  // Salvar subscription no banco
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription)
  });
}
```

---

## 🎯 Resumo Executivo

### O que está pronto? (70%)
✅ Banco de dados bem estruturado
✅ API REST completa
✅ UI components funcionais
✅ Sistema de tipos TypeScript
✅ Integração básica com Resend

### O que falta? (30%)
❌ Tipos e campos específicos de delivery
❌ Triggers automáticos
❌ Sistema de agendamento (Cron)
❌ Templates de email para delivery
❌ Notificações Realtime (no lugar de polling)
❌ Push notifications (opcional)

### Esforço Estimado Total: 5-7 dias úteis

**MVP (Entregas funcionando):** 3-4 dias
- Fase 1: Schema (0.5 dia)
- Fase 2: Triggers + Cron (2 dias)
- Fase 3: Email templates (1 dia)
- Fase 4: Realtime (0.5 dia)

**Sistema Completo:** +2-3 dias
- Fase 5: Push notifications

---

## 🚀 Próximos Passos Recomendados

1. **Decidir sobre Push Notifications**
   - É crítico para o MVP?
   - Ou pode ser fase 2?

2. **Escolher sistema de Cron**
   - Vercel Cron (mais simples)
   - ou Supabase Edge Functions + pg_cron (mais robusto)

3. **Definir prioridades de notificação**
   - Quais DEVEM ter email?
   - Quais DEVEM ter push?
   - Quais são apenas in-app?

4. **Começar pela Fase 1**
   - Atualizar banco de dados
   - Adicionar novos tipos
   - Preparar infraestrutura

---

**Conclusão:** O sistema de notificações está 70% pronto. A base é sólida, mas precisa de customizações específicas para delivery tracking e sistema de agendamento automático.
