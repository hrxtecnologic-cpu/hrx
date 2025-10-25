# 🔍 Análise Completa do Sistema HRX
**Data:** 25/10/2025
**Objetivo:** Avaliar estado atual vs documentação para implementação de entregas e notificações

---

## 📊 RESUMO EXECUTIVO

### ✅ O QUE ESTÁ PRONTO (75%)

**Backend/API:**
- ✅ Estrutura de banco de dados completa
- ✅ APIs REST funcionais (GET, POST, PATCH)
- ✅ Realtime habilitado (Supabase)
- ✅ Autenticação integrada (Clerk)

**Frontend:**
- ✅ Mapa com tracking em tempo real
- ✅ Dashboard cliente (visualização)
- ✅ Dashboard fornecedor (controle)
- ✅ Animação suave + rotas reais
- ✅ NotificationBell com Realtime

**Integrações:**
- ✅ Mapbox (tracking + rotas)
- ✅ Supabase (banco + realtime)
- ✅ Clerk (auth)
- ✅ Resend (email)
- ✅ Vercel Analytics (instalado)

### ❌ O QUE FALTA (25%)

1. **Sistema de Cron Jobs** (CRÍTICO)
2. **Link público de tracking** (/track/[token])
3. **Dashboard Admin de Entregas**
4. **Templates de email para delivery**
5. **Novos tipos de notificação**
6. **Triggers automáticos**

---

## 🗄️ BANCO DE DADOS - ANÁLISE DETALHADA

### ✅ **Tabelas Criadas e Funcionais**

#### `delivery_trackings`
```sql
✅ id (uuid, PK)
✅ event_project_id (FK → event_projects)
✅ supplier_id (FK → equipment_suppliers)
✅ supplier_user_id (FK → users)
✅ status (VARCHAR) - pending, preparing, in_transit, delivered, cancelled
✅ equipment_items (JSONB) - Array de equipamentos
✅ current_latitude, current_longitude (NUMERIC) - GPS atual
✅ last_location_update (TIMESTAMPTZ)
✅ origin_address, origin_latitude, origin_longitude
✅ destination_address, destination_latitude, destination_longitude (NOT NULL)
✅ scheduled_pickup_time, scheduled_delivery_time (TIMESTAMPTZ)
✅ actual_pickup_time, actual_delivery_time (TIMESTAMPTZ)
✅ estimated_distance_km, estimated_duration_minutes
✅ notes, delivery_notes (TEXT)
✅ created_at, updated_at (TIMESTAMPTZ)

❌ tracking_link_token (AUSENTE!) - Campo crítico para link público
❌ delivery_photo_url (AUSENTE) - Para comprovante
❌ delivery_signature_data (AUSENTE) - Para assinatura
❌ received_by_name (AUSENTE) - Quem recebeu
❌ was_late, delay_minutes (AUSENTE) - Métricas de atraso
```

**Índices:** ✅ Todos criados corretamente
**RLS:** ✅ Habilitado (mas não funciona com Clerk - desabilitar)
**Realtime:** ✅ Habilitado na publicação

#### `delivery_location_history`
```sql
✅ id (uuid, PK)
✅ delivery_tracking_id (FK → delivery_trackings)
✅ latitude, longitude (NUMERIC, NOT NULL)
✅ speed_kmh (NUMERIC)
✅ recorded_at (TIMESTAMPTZ)
```

**Funcionalidade:** Armazena breadcrumb trail do GPS
**Índice:** ✅ Otimizado para replay de rotas
**Realtime:** ✅ Habilitado

#### `delivery_status_updates`
```sql
✅ id (uuid, PK)
✅ delivery_tracking_id (FK → delivery_trackings)
✅ old_status, new_status (VARCHAR)
✅ updated_by_user_id (FK → users)
✅ notes (TEXT)
✅ created_at (TIMESTAMPTZ)
```

**Funcionalidade:** Auditoria de mudanças de status
**Índice:** ✅ Otimizado para histórico

### ❌ **O QUE FALTA NO BANCO**

#### 1. Campos Ausentes em `delivery_trackings`:
```sql
ALTER TABLE delivery_trackings ADD COLUMN IF NOT EXISTS
  tracking_link_token VARCHAR(100) UNIQUE,
  delivery_photo_url TEXT,
  delivery_signature_data TEXT,
  received_by_name VARCHAR(255),
  was_late BOOLEAN DEFAULT FALSE,
  delay_minutes INTEGER DEFAULT 0;

CREATE INDEX idx_delivery_tracking_token ON delivery_trackings(tracking_link_token)
  WHERE tracking_link_token IS NOT NULL;
```

#### 2. Função para Gerar Token Único:
```sql
CREATE OR REPLACE FUNCTION generate_tracking_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN := TRUE;
BEGIN
  WHILE exists LOOP
    -- Gera token de 12 caracteres alfanuméricos
    token := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));

    -- Verifica se já existe
    SELECT EXISTS(
      SELECT 1 FROM delivery_trackings WHERE tracking_link_token = token
    ) INTO exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Trigger para Detectar Atraso:
```sql
CREATE OR REPLACE FUNCTION check_delivery_delay()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está em trânsito e passou do horário
  IF NEW.status = 'in_transit'
     AND NOW() > NEW.scheduled_delivery_time
     AND NEW.was_late = FALSE THEN

    NEW.was_late := TRUE;
    NEW.delay_minutes := EXTRACT(EPOCH FROM (NOW() - NEW.scheduled_delivery_time)) / 60;

    -- TODO: Criar notificação de atraso
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_delay_detector
  BEFORE UPDATE ON delivery_trackings
  FOR EACH ROW
  EXECUTE FUNCTION check_delivery_delay();
```

#### 4. Tabela `scheduled_notifications` (para Cron):
```sql
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type VARCHAR(50) NOT NULL,
  delivery_tracking_id UUID REFERENCES delivery_trackings(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_pending
  ON scheduled_notifications(scheduled_for)
  WHERE status = 'pending';
```

---

## 🔌 APIs - ANÁLISE DETALHADA

### ✅ **APIs Existentes e Funcionais**

#### **GET /api/deliveries**
```typescript
Funcionalidade: Lista entregas filtradas por role
Filtros: eventId, status
Retorna: Array de deliveries com joins (event_project, supplier)
Segurança: ✅ Verifica role (client vê só suas, supplier só suas, admin vê tudo)
Status: FUNCIONANDO
```

#### **POST /api/deliveries**
```typescript
Funcionalidade: Cria nova entrega (admin apenas)
Valida: Campos obrigatórios
Busca: Localização do fornecedor automaticamente
Cria: Delivery com status 'pending'
Status: FUNCIONANDO
❌ Problema: Não gera tracking_link_token
```

#### **PATCH /api/deliveries/[id]/status**
```typescript
Funcionalidade: Atualiza status da entrega
Validação: Status válidos (pending, preparing, in_transit, delivered, cancelled)
Permissão: Fornecedor ou admin
Automação:
  - Se 'in_transit' → Define actual_pickup_time
  - Se 'delivered' → Define actual_delivery_time
Status: FUNCIONANDO
```

#### **POST /api/deliveries/[id]/location**
```typescript
Funcionalidade: Atualiza GPS da entrega
Valida: latitude, longitude obrigatórios
Atualiza: delivery_trackings.current_* + last_location_update
Cria: Registro em delivery_location_history
Status: FUNCIONANDO
```

#### **GET /api/deliveries/[id]/location**
```typescript
Funcionalidade: Busca histórico de localizações
Limit: 100 últimas posições
Ordem: Mais recente primeiro
Status: FUNCIONANDO
```

### ❌ **APIs QUE FALTAM**

#### 1. **GET /api/track/[token]** (CRÍTICO)
```typescript
// Link público sem autenticação
// Exemplo: https://hrx.com/track/ABC123XYZ

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient();

  const { data: delivery, error } = await supabase
    .from('delivery_trackings')
    .select(`
      id,
      status,
      equipment_items,
      current_latitude,
      current_longitude,
      destination_address,
      destination_latitude,
      destination_longitude,
      scheduled_delivery_time,
      actual_delivery_time,
      estimated_distance_km,
      supplier:equipment_suppliers(company_name, phone),
      event_project:event_projects(event_name, venue_address)
    `)
    .eq('tracking_link_token', params.token)
    .single();

  if (error || !delivery) {
    return NextResponse.json(
      { error: 'Link de rastreamento inválido' },
      { status: 404 }
    );
  }

  return NextResponse.json({ delivery });
}
```

#### 2. **POST /api/track/[token]/start** (CRÍTICO)
```typescript
// Motorista inicia GPS via link público

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient();

  // Atualizar status para 'in_transit'
  const { error } = await supabase
    .from('delivery_trackings')
    .update({
      status: 'in_transit',
      actual_pickup_time: new Date().toISOString()
    })
    .eq('tracking_link_token', params.token);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Criar notificação para cliente

  return NextResponse.json({ success: true });
}
```

#### 3. **POST /api/track/[token]/location** (CRÍTICO)
```typescript
// Atualizar GPS via link público (sem auth)

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient();
  const { latitude, longitude, speed_kmh } = await req.json();

  // Buscar delivery_id pelo token
  const { data: delivery } = await supabase
    .from('delivery_trackings')
    .select('id')
    .eq('tracking_link_token', params.token)
    .single();

  if (!delivery) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
  }

  // Atualizar localização
  await supabase
    .from('delivery_trackings')
    .update({
      current_latitude: latitude,
      current_longitude: longitude,
      last_location_update: new Date().toISOString()
    })
    .eq('id', delivery.id);

  // Criar histórico
  await supabase
    .from('delivery_location_history')
    .insert({
      delivery_tracking_id: delivery.id,
      latitude,
      longitude,
      speed_kmh
    });

  return NextResponse.json({ success: true });
}
```

#### 4. **POST /api/track/[token]/complete**
```typescript
// Confirmar entrega com foto + assinatura

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const {
    delivery_photo,     // Base64
    signature_data,     // Base64
    received_by_name,
    notes
  } = await req.json();

  // Upload de foto (se fornecida)
  let photo_url = null;
  if (delivery_photo) {
    // TODO: Upload para Supabase Storage
    // photo_url = await uploadToStorage(delivery_photo);
  }

  // Atualizar entrega
  await supabase
    .from('delivery_trackings')
    .update({
      status: 'delivered',
      actual_delivery_time: new Date().toISOString(),
      delivery_photo_url: photo_url,
      delivery_signature_data: signature_data,
      received_by_name,
      delivery_notes: notes
    })
    .eq('tracking_link_token', params.token);

  // TODO: Criar notificação + enviar email

  return NextResponse.json({ success: true });
}
```

#### 5. **GET /api/cron/check-deliveries** (CRÍTICO)
```typescript
// Chamado pelo Vercel Cron a cada minuto

export async function GET(req: Request) {
  // Verificar Vercel Cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();

  // 1. Buscar entregas que precisam de notificação 7 dias antes
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: deliveries7d } = await supabase
    .from('delivery_trackings')
    .select('id, event_project_id, scheduled_delivery_time')
    .gte('scheduled_delivery_time', sevenDaysFromNow.toISOString())
    .lt('scheduled_delivery_time', new Date(sevenDaysFromNow.getTime() + 60000).toISOString())
    .eq('status', 'scheduled');

  // Criar notificações agendadas
  for (const delivery of deliveries7d || []) {
    await createNotification({
      type: 'delivery_reminder_7_days',
      delivery_id: delivery.id,
      scheduled_for: now
    });
  }

  // 2. Repetir para 2 dias, 2 horas, etc...

  // 3. Verificar atrasos
  const { data: lateDeliveries } = await supabase
    .from('delivery_trackings')
    .select('*')
    .eq('status', 'in_transit')
    .lt('scheduled_delivery_time', now.toISOString())
    .eq('was_late', false);

  // Marcar como atrasadas + notificar

  return NextResponse.json({
    success: true,
    processed: {
      reminders_7d: deliveries7d?.length || 0,
      late_detected: lateDeliveries?.length || 0
    }
  });
}
```

#### 6. **POST /api/cron/send-scheduled-notifications**
```typescript
// Processa fila de notificações agendadas

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  for (const notif of pending || []) {
    try {
      // Enviar notificação
      await sendNotification(notif);

      // Marcar como enviada
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notif.id);
    } catch (error: any) {
      // Marcar como falha
      await supabase
        .from('scheduled_notifications')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', notif.id);
    }
  }

  return NextResponse.json({ processed: pending?.length || 0 });
}
```

---

## 🎨 FRONTEND - ANÁLISE DETALHADA

### ✅ **Páginas Existentes**

#### **/cliente/evento/[id]/tracking**
```
Funcionalidade: Cliente acompanha entregas do evento
Componentes:
  ✅ DeliveryTrackingMap (mapa com Realtime)
  ✅ Lista de entregas separadas por status
  ✅ Cards com detalhes (equipamentos, horário, fornecedor)
Atualização: Realtime via useRealtimeDeliveries
Status: FUNCIONANDO
⚠️ Polling em 10s na lista (mas mapa tem Realtime)
```

#### **/fornecedor/entregas**
```
Funcionalidade: Fornecedor gerencia suas entregas
Features:
  ✅ Lista de entregas ativas e concluídas
  ✅ Botões de mudança de status
  ✅ Ativação de GPS (watchPosition)
  ✅ Envio de localização para API
Status: FUNCIONANDO
⚠️ Polling em 30s (deveria ser Realtime)
❌ Não tem botão "Enviar Link para Motorista"
```

#### **/admin/mapa**
```
Funcionalidade: Mapa geral de profissionais, fornecedores, eventos
Componentes: MapView com filtros
Status: FUNCIONANDO
❌ NÃO É O MAPA DE ENTREGAS!
❌ Não mostra delivery_trackings
```

### ❌ **Páginas que FALTAM**

#### 1. **/track/[token]** (CRÍTICO - Página Pública)
```tsx
// Página pública sem login
// Motorista acessa para iniciar GPS

interface TrackingPageProps {
  params: { token: string };
}

export default function PublicTrackingPage({ params }: TrackingPageProps) {
  const [delivery, setDelivery] = useState(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    // Buscar delivery pelo token
    fetch(`/api/track/${params.token}`)
      .then(res => res.json())
      .then(data => setDelivery(data.delivery));
  }, [params.token]);

  const startTracking = async () => {
    // Mudar status para in_transit
    await fetch(`/api/track/${params.token}/start`, { method: 'POST' });

    // Ativar GPS
    setTracking(true);
    navigator.geolocation.watchPosition((position) => {
      fetch(`/api/track/${params.token}/location`, {
        method: 'POST',
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed_kmh: position.coords.speed ? position.coords.speed * 3.6 : null
        })
      });
    });
  };

  return (
    <div>
      <h1>Rastreamento - {delivery?.event_project.event_name}</h1>
      <DeliveryTrackingMap deliveries={[delivery]} />

      {!tracking && (
        <button onClick={startTracking}>
          Iniciar Entrega
        </button>
      )}

      {tracking && (
        <>
          <p>GPS Ativo - Cliente está acompanhando</p>
          <button onClick={() => router.push(`/track/${params.token}/complete`)}>
            Confirmar Entrega
          </button>
        </>
      )}
    </div>
  );
}
```

#### 2. **/track/[token]/complete** (Confirmação)
```tsx
// Página para foto + assinatura

export default function CompleteDeliveryPage({ params }) {
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');

  const handleComplete = async () => {
    await fetch(`/api/track/${params.token}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        delivery_photo: photo,
        signature_data: signature,
        received_by_name: receivedBy,
        notes: notesRef.current.value
      })
    });

    router.push(`/track/${params.token}/success`);
  };

  return (
    <div>
      <h2>Confirmar Entrega</h2>

      {/* Upload de foto */}
      <input type="file" accept="image/*" capture="environment" />

      {/* Canvas para assinatura */}
      <SignatureCanvas onSave={setSignature} />

      {/* Nome de quem recebeu */}
      <input
        placeholder="Nome de quem recebeu"
        value={receivedBy}
        onChange={e => setReceivedBy(e.target.value)}
      />

      <button onClick={handleComplete}>Finalizar Entrega</button>
    </div>
  );
}
```

#### 3. **/admin/entregas** (Dashboard Centralizado)
```tsx
// Dashboard admin com TODAS as entregas

export default function AdminDeliveriesPage() {
  return (
    <div>
      <h1>Central de Entregas</h1>

      {/* Sidebar com filtros */}
      <FilterSidebar
        filters={['Período', 'Status', 'Fornecedor', 'Região']}
      />

      {/* Mapa principal */}
      <DeliveryTrackingMap
        deliveries={allDeliveries}
        showFilters={true}
      />

      {/* Estatísticas */}
      <Stats
        today={8}
        inTransit={3}
        completed={5}
        late={1}
      />

      {/* Lista lateral de entregas ativas */}
      <ActiveDeliveriesList />
    </div>
  );
}
```

---

## 🔔 NOTIFICAÇÕES - ANÁLISE DETALHADA

### ✅ **Sistema Atual**

```
Tabela: notifications ✅
Tipos: 16 tipos gerais ✅
API: GET, POST, PATCH ✅
UI: NotificationBell ✅
Realtime: ✅ Implementado agora
Stats: notification_stats ✅
Preferences: notification_preferences ✅
```

### ❌ **O que FALTA para Delivery**

#### 1. Novos Tipos de Notificação
```typescript
// Adicionar ao enum notification_type:
'delivery_reminder_7_days'
'delivery_reminder_2_days'
'delivery_reminder_2_hours'
'delivery_tracking_started'
'delivery_approaching'      // 5 min
'delivery_completed'
'delivery_delayed'
'delivery_cancelled'
```

#### 2. Triggers de Notificação
```sql
-- Quando status muda para 'in_transit'
CREATE OR REPLACE FUNCTION notify_delivery_started()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_transit' AND OLD.status != 'in_transit' THEN
    -- Buscar cliente
    PERFORM create_notification(
      p_user_id := (SELECT created_by FROM event_projects WHERE id = NEW.event_project_id),
      p_notification_type := 'delivery_tracking_started',
      p_title := 'Entrega iniciada!',
      p_message := 'O fornecedor está a caminho.',
      p_delivery_tracking_id := NEW.id,
      p_action_url := '/cliente/evento/' || NEW.event_project_id || '/tracking'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_started_notification
  AFTER UPDATE ON delivery_trackings
  FOR EACH ROW
  EXECUTE FUNCTION notify_delivery_started();
```

---

## 📧 EMAILS - ANÁLISE DETALHADA

### ✅ **Infraestrutura Existente**

```
Resend: ✅ Configurado
API Key: ✅ Funcionando
From Email: noreply@hrxeventos.com.br ✅
Teste: /api/send-test ✅ Funciona
Templates: ⚠️ Sistema existe, mas sem templates de delivery
```

### ❌ **Templates que FALTAM**

#### 1. delivery-started.tsx
```tsx
export function DeliveryStartedEmail({ delivery, trackingLink }) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <h1>Entrega Iniciada! 🚚</h1>
        <p>
          A entrega do fornecedor <strong>{delivery.supplier.company_name}</strong> foi iniciada!
        </p>
        <p>Previsão de chegada: {delivery.scheduled_delivery_time}</p>

        <a href={trackingLink} style={buttonStyle}>
          Acompanhar em Tempo Real
        </a>
      </Body>
    </Html>
  );
}
```

#### 2. delivery-approaching.tsx
```tsx
export function DeliveryApproachingEmail({ delivery, eta }) {
  return (
    <Html>
      <Body>
        <h1>Entrega Chegando! ⏰</h1>
        <p>
          A entrega está a apenas <strong>{eta} minutos</strong> de distância!
        </p>
      </Body>
    </Html>
  );
}
```

#### 3. delivery-completed.tsx
```tsx
export function DeliveryCompletedEmail({ delivery, photoUrl, signature }) {
  return (
    <Html>
      <Body>
        <h1>Entrega Concluída! ✅</h1>
        <p>
          Recebido por: <strong>{delivery.received_by_name}</strong><br/>
          Horário: {delivery.actual_delivery_time}
        </p>

        {photoUrl && <img src={photoUrl} alt="Comprovante" />}
        {signature && <img src={signature} alt="Assinatura" />}
      </Body>
    </Html>
  );
}
```

---

## ⚙️ INTEGRAÇÕES - STATUS

### ✅ **Tudo Configurado**

```env
✅ CLERK_SECRET_KEY
✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ RESEND_API_KEY
✅ NEXT_PUBLIC_MAPBOX_TOKEN
✅ NEXT_SECRET_MAPBOX_TOKEN
```

### ❌ **Variáveis que FALTAM**

```env
# Para Vercel Cron (segurança)
CRON_SECRET=seu_secret_aleatorio_aqui

# Para Supabase Storage (upload de fotos)
# (Já tem acesso via SUPABASE_SERVICE_ROLE_KEY)

# Para WhatsApp (futuro - opcional)
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_WHATSAPP_NUMBER=
```

### 📝 **vercel.json** (Criar)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-deliveries",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/send-scheduled-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 📋 CHECKLIST COMPLETO

### 🗄️ BANCO DE DADOS

- [ ] Adicionar campos faltantes em delivery_trackings
  - [ ] tracking_link_token
  - [ ] delivery_photo_url
  - [ ] delivery_signature_data
  - [ ] received_by_name
  - [ ] was_late
  - [ ] delay_minutes
- [ ] Criar função generate_tracking_token()
- [ ] Criar trigger check_delivery_delay()
- [ ] Criar tabela scheduled_notifications
- [ ] Adicionar novos tipos ao enum notification_type
- [ ] Criar trigger notify_delivery_started()
- [ ] Desabilitar RLS (Clerk incompatibilidade)

### 🔌 BACKEND/API

- [ ] POST /api/deliveries - Gerar tracking_token
- [ ] GET /api/track/[token]
- [ ] POST /api/track/[token]/start
- [ ] POST /api/track/[token]/location
- [ ] POST /api/track/[token]/complete
- [ ] GET /api/cron/check-deliveries
- [ ] POST /api/cron/send-scheduled-notifications
- [ ] Criar vercel.json com crons
- [ ] Adicionar CRON_SECRET ao .env

### 🎨 FRONTEND

- [ ] Página /track/[token]
- [ ] Página /track/[token]/complete
- [ ] Página /admin/entregas (dashboard)
- [ ] Componente SignatureCanvas
- [ ] Componente PhotoUpload
- [ ] Trocar polling por Realtime em:
  - [ ] /cliente/evento/[id]/tracking
  - [ ] /fornecedor/entregas
- [ ] Botão "Enviar Link para Motorista" (WhatsApp)

### 📧 EMAILS

- [ ] Template delivery-started.tsx
- [ ] Template delivery-approaching.tsx
- [ ] Template delivery-completed.tsx
- [ ] Template delivery-delayed.tsx
- [ ] Template delivery-reminder-7-days.tsx
- [ ] Template delivery-reminder-2-days.tsx
- [ ] Template delivery-reminder-2-hours.tsx
- [ ] Integrar templates com triggers

### 🔔 NOTIFICAÇÕES

- [ ] Atualizar tipos no TypeScript
- [ ] Criar labels e ícones para novos tipos
- [ ] Implementar triggers de notificação

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **SPRINT 1 - MVP Funcional** (3-4 dias)

**Dia 1: Banco de Dados**
- Adicionar campos em delivery_trackings
- Criar função generate_tracking_token()
- Criar tabela scheduled_notifications
- Criar triggers

**Dia 2: APIs Essenciais**
- /api/track/[token] (GET, POST start, POST location, POST complete)
- Atualizar POST /api/deliveries para gerar token
- Criar vercel.json

**Dia 3: Frontend Público**
- Página /track/[token]
- Página /track/[token]/complete
- Componentes SignatureCanvas + PhotoUpload

**Dia 4: Testes + Deploy**
- Testar fluxo completo
- Deploy Vercel
- Configurar Cron

### **SPRINT 2 - Notificações** (2 dias)

**Dia 5: Sistema de Notificações**
- Novos tipos
- Triggers automáticos
- API de Cron para agendamento

**Dia 6: Templates de Email**
- Criar 7 templates
- Integrar com triggers
- Testar envios

### **SPRINT 3 - Dashboard Admin** (1-2 dias)

**Dia 7: Dashboard de Entregas**
- Página /admin/entregas
- Filtros + Mapa + Stats
- Lista lateral de entregas ativas

---

## 📊 ESTIMATIVA FINAL

| Categoria | Pronto | Faltando | % Completo |
|-----------|--------|----------|------------|
| Banco de Dados | 3 tabelas | 4 campos + 3 funções + 1 tabela | 65% |
| APIs | 5 endpoints | 7 endpoints | 42% |
| Frontend | 2 páginas | 3 páginas | 40% |
| Notificações | Base pronta | 8 tipos + triggers | 30% |
| Emails | Resend OK | 7 templates | 20% |
| **TOTAL** | **75%** | **25%** | **75%** |

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Começar pelo SPRINT 1** - MVP funcional em 4 dias
2. **Testar com 1 entrega real** - Validar fluxo completo
3. **SPRINT 2** - Notificações automáticas
4. **SPRINT 3** - Dashboard admin

**Conclusão:** O sistema está 75% pronto. A base está sólida e bem arquitetada. O que falta é principalmente:
- Link público de tracking (/track/[token])
- Sistema de Cron para notificações agendadas
- Dashboard admin de entregas
- Templates de email

**Tempo estimado para 100%:** 7-9 dias úteis.
