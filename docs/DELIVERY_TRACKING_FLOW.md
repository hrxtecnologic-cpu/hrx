# 📦 Fluxo Completo: Sistema de Tracking de Entregas HRX

## 🎯 Visão Geral

Sistema completo de rastreamento GPS em tempo real para entregas de equipamentos, com dashboards separados para **Fornecedores** e **Contratantes/Clientes**.

---

## 🏗️ Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUXO COMPLETO                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   FORNECEDOR     │         │    BACKEND       │         │   CONTRATANTE    │
│   (Supplier)     │         │   APIs + DB      │         │    (Client)      │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                             │                             │
        │ 1. Lista entregas           │                             │
        │ GET /api/deliveries         │                             │
        ├────────────────────────────>│                             │
        │                             │                             │
        │ 2. Inicia entrega           │                             │
        │ PATCH /deliveries/[id]      │                             │
        │    /status                  │                             │
        ├────────────────────────────>│                             │
        │                             │                             │
        │ 3. Envia GPS (watchPosition)│                             │
        │ POST /deliveries/[id]       │                             │
        │    /location                │                             │
        ├────────────────────────────>│                             │
        │                             │ 4. Salva no DB              │
        │                             │ UPDATE delivery_trackings   │
        │                             │ INSERT location_history     │
        │                             │                             │
        │                             │ 5. Realtime Event 🔥        │
        │                             ├────────────────────────────>│
        │                             │                             │
        │                             │ 6. Cliente vê no mapa       │
        │                             │    (atualização instantânea)│
        │                             │                             │
        │ 7. Confirma entrega         │                             │
        │ PATCH /deliveries/[id]      │                             │
        │    /status (delivered)      │                             │
        ├────────────────────────────>│────────────────────────────>│
        │                             │                             │
```

---

## 📁 Estrutura de Arquivos

### 🔵 Frontend - Fornecedor (Supplier)

```
src/app/fornecedor/entregas/page.tsx
├── useState: deliveries, trackingLocation
├── useEffect: polling (30s) + watchPosition GPS
├── Ações:
│   ├── updateStatus() → PATCH /api/deliveries/[id]/status
│   ├── startLocationTracking() → navigator.geolocation.watchPosition()
│   └── stopLocationTracking()
└── UI: Lista de entregas ativas/concluídas com botões de ação
```

**Status possíveis:**
1. `pending` → Botão "Iniciar Preparação"
2. `preparing` → Botão "Iniciar Entrega"
3. `in_transit` → Botão "Iniciar Rastreamento GPS" + "Confirmar Entrega"
4. `delivered` → Entrega concluída

### 🟢 Frontend - Cliente/Contratante

```
src/app/cliente/evento/[id]/tracking/page.tsx
├── useState: deliveries
├── useEffect: polling (10s) ❌ (ANTES)
├── AGORA: useRealtimeDeliveries() ✅ (TEMPO REAL)
└── Componentes:
    ├── <DeliveryTrackingMap /> → Mapa com marcadores
    ├── Lista de entregas ativas
    ├── Lista de entregas pendentes
    └── Lista de entregas concluídas
```

### 🗺️ Componente de Mapa

```
src/components/delivery/DeliveryTrackingMap.tsx
├── ANTES: props: deliveries (estático) ❌
├── AGORA: useRealtimeDeliveries(initialDeliveries) ✅
├── Marcadores:
│   ├── 🔴 Destino (MapPin vermelho)
│   └── 🔵 Veículo em trânsito (Navigation azul, animate-pulse)
├── Linhas: Rota tracejada (current → destination)
└── Popup: Detalhes da entrega
```

### 🔌 Hook de Realtime

```
src/hooks/useRealtimeDeliveries.ts
├── createClient() → Browser Supabase client
├── .channel('delivery-trackings-realtime')
├── .on('postgres_changes', callback)
└── Eventos:
    ├── UPDATE → Atualiza GPS/status
    ├── INSERT → Nova entrega
    └── DELETE → Remove entrega
```

---

## 🌐 APIs (Backend)

### 1️⃣ **GET /api/deliveries**
```typescript
Arquivo: src/app/api/deliveries/route.ts

Query Params:
  - eventId?: string (filtro para cliente)
  - status?: string (filtro de status)

Lógica:
  1. Autentica usuário via Clerk
  2. Busca role no Supabase (supplier/client)
  3. Filtra entregas baseado no role:
     - Supplier: deliveries do próprio fornecedor
     - Client: deliveries do evento específico
  4. JOIN com event_projects, equipment_suppliers, users

Response:
  {
    success: true,
    deliveries: [
      {
        id, status, equipment_items,
        current_latitude, current_longitude,
        destination_latitude, destination_longitude,
        scheduled_delivery_time, actual_delivery_time,
        event_project: { ... },
        supplier: { ... },
        driver: { ... }
      }
    ]
  }
```

### 2️⃣ **POST /api/deliveries/[id]/location**
```typescript
Arquivo: src/app/api/deliveries/[id]/location/route.ts

Body:
  {
    latitude: number,
    longitude: number,
    speed_kmh?: number
  }

Lógica:
  1. Valida autenticação
  2. UPDATE delivery_trackings:
     - current_latitude
     - current_longitude
     - last_location_update = NOW()
  3. INSERT delivery_location_history:
     - Salva ponto GPS no histórico
     - Usado para replay da rota
  4. 🔥 TRIGGER Realtime → Clientes conectados recebem update

Response:
  {
    success: true,
    message: 'Localização atualizada'
  }
```

### 3️⃣ **PATCH /api/deliveries/[id]/status**
```typescript
Arquivo: src/app/api/deliveries/[id]/status/route.ts

Body:
  {
    status: 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled'
  }

Lógica:
  1. Valida transição de status
  2. UPDATE delivery_trackings.status
  3. Se delivered: salva actual_delivery_time
  4. INSERT delivery_status_updates (audit trail)
  5. 🔥 TRIGGER Realtime

Response:
  {
    success: true,
    status: 'in_transit'
  }
```

---

## 🗄️ Banco de Dados (Supabase)

### Tabela: `delivery_trackings`
```sql
CREATE TABLE delivery_trackings (
  id UUID PRIMARY KEY,
  event_project_id UUID REFERENCES event_projects(id),
  supplier_id UUID REFERENCES equipment_suppliers(id),
  supplier_user_id UUID REFERENCES users(id),

  -- Status
  status VARCHAR(20) CHECK (status IN (
    'pending', 'preparing', 'in_transit', 'delivered', 'cancelled'
  )),

  -- Equipamentos
  equipment_items JSONB, -- [{ name, quantity, category }]

  -- GPS em Tempo Real 🔥
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  last_location_update TIMESTAMP,

  -- Origem/Destino
  origin_address VARCHAR(500),
  origin_latitude DECIMAL(10,8),
  origin_longitude DECIMAL(11,8),
  destination_address VARCHAR(500),
  destination_latitude DECIMAL(10,8),
  destination_longitude DECIMAL(11,8),

  -- Horários
  scheduled_pickup_time TIMESTAMP,
  scheduled_delivery_time TIMESTAMP,
  actual_pickup_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,

  -- Estimativas
  estimated_distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 🔥 Realtime habilitado!
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_trackings;
```

### Tabela: `delivery_location_history`
```sql
CREATE TABLE delivery_location_history (
  id UUID PRIMARY KEY,
  delivery_tracking_id UUID REFERENCES delivery_trackings(id),

  -- GPS
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed_kmh DECIMAL(5,2),

  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX idx_location_history_delivery
  ON delivery_location_history(delivery_tracking_id, recorded_at DESC);

-- 🔥 Realtime habilitado!
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_location_history;
```

### Tabela: `delivery_status_updates`
```sql
CREATE TABLE delivery_status_updates (
  id UUID PRIMARY KEY,
  delivery_tracking_id UUID REFERENCES delivery_trackings(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger automático para auditoria
CREATE TRIGGER track_status_changes
  AFTER UPDATE OF status ON delivery_trackings
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();
```

---

## ⚡ Realtime: ANTES vs AGORA

### ❌ ANTES (Polling)

**Fornecedor:**
```typescript
// src/app/fornecedor/entregas/page.tsx (linha 38-39)
const interval = setInterval(fetchDeliveries, 30000); // 30 segundos
```

**Cliente:**
```typescript
// src/app/cliente/evento/[id]/tracking/page.tsx (linha 62)
const interval = setInterval(fetchDeliveries, 10000); // 10 segundos
```

**Problemas:**
- 🐌 Latência de 10-30 segundos
- 🔄 Requisições desnecessárias ao servidor
- 💸 Custo de API calls alto
- ⚡ Não é "tempo real"

### ✅ AGORA (Supabase Realtime)

**Implementação:**
```typescript
// src/hooks/useRealtimeDeliveries.ts
const channel = supabase
  .channel('delivery-trackings-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'delivery_trackings',
  }, (payload) => {
    // Atualiza estado automaticamente
    if (payload.eventType === 'UPDATE') {
      setDeliveries(prev => prev.map(d =>
        d.id === payload.new.id ? { ...d, ...payload.new } : d
      ));
    }
  })
  .subscribe();
```

**Vantagens:**
- ⚡ Latência de 1-2 segundos
- 🔌 WebSocket persistente
- 💰 Menos custos de API
- 🎯 Atualização instantânea

**UI Feedback:**
```typescript
// Badge visual no mapa
{isConnected ? (
  <><Wifi /> Tempo Real</>
) : (
  <><WifiOff /> Conectando...</>
)}
```

---

## 🔄 Fluxo Detalhado: Jornada do Usuário

### 🚚 Lado do Fornecedor

1. **Login** → Acessa `/fornecedor/entregas`
2. **Lista entregas** → GET `/api/deliveries` (filtradas pelo supplier_id)
3. **Vê entrega pendente** → Status: `pending`
4. **Clica "Iniciar Preparação"** → PATCH `/api/deliveries/[id]/status` (`preparing`)
5. **Prepara equipamentos** → Carrega no caminhão
6. **Clica "Iniciar Entrega"** → PATCH `/api/deliveries/[id]/status` (`in_transit`)
7. **Clica "Iniciar Rastreamento GPS"** → `navigator.geolocation.watchPosition()`
8. **GPS envia coordenadas** → POST `/api/deliveries/[id]/location` (a cada 5-10s)
9. **Chega no destino** → Clica "Confirmar Entrega"
10. **Finaliza** → PATCH `/api/deliveries/[id]/status` (`delivered`)

### 👤 Lado do Cliente/Contratante

1. **Login** → Acessa `/cliente/evento/[eventId]/tracking`
2. **Vê mapa** → `<DeliveryTrackingMap>` carrega entregas do evento
3. **Badge verde "Tempo Real"** → Realtime conectado ✅
4. **Fornecedor liga GPS** → 🔥 Recebe update via Realtime
5. **Marcador azul aparece** → Posição inicial do caminhão
6. **Caminhão se move** → Marcador atualiza automaticamente (1-2s)
7. **Linha tracejada** → Mostra distância até destino
8. **Fornecedor entrega** → Marcador fica verde, status muda para "Entregue"

---

## 🎨 UI/UX Detalhes

### Página do Fornecedor
```
┌─────────────────────────────────────────────────────────┐
│  Minhas Entregas                                        │
├─────────────────────────────────────────────────────────┤
│  📦 Entregas Ativas (2)                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🎪 Festa de Aniversário                           │ │
│  │ 📍 Rua das Flores, 123 - São Paulo               │ │
│  │ 🟡 Preparando                                     │ │
│  │                                                   │ │
│  │ Equipamentos: 2x Caixa de Som, 1x Mesa DJ        │ │
│  │ ⏰ Previsto: 24/10/2025 14:00                     │ │
│  │                                                   │ │
│  │ [Iniciar Entrega]                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🎉 Casamento - João & Maria                       │ │
│  │ 📍 Chácara Bela Vista - Campinas                 │ │
│  │ 🔵 Em Trânsito                                    │ │
│  │                                                   │ │
│  │ [🔴 Parar Rastreamento] [✅ Confirmar Entrega]    │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Página do Cliente
```
┌─────────────────────────────────────────────────────────┐
│  Rastreamento de Entregas                               │
│  🟢 Tempo Real (badge)                                  │
├─────────────────────────────────────────────────────────┤
│  🗺️ Entregas em Andamento                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │           🔵 (caminhão pulsando)                  │ │
│  │              ↓ (linha tracejada)                  │ │
│  │           🔴 (destino)                            │ │
│  │                                                   │ │
│  │  Legenda:                                         │ │
│  │  🔵 Veículo em trânsito                           │ │
│  │  🔴 Destino                                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  📋 Status das Entregas                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🔵 Som & Iluminação Ltda     Em Trânsito         │ │
│  │    Equipamentos: 3x Caixa, 2x Microfone          │ │
│  │    Motorista: Carlos • (11) 98765-4321           │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança & Permissões

### Row Level Security (RLS)

```sql
-- Fornecedores só veem suas entregas
CREATE POLICY "Suppliers view own deliveries"
  ON delivery_trackings FOR SELECT
  USING (supplier_user_id = auth.uid());

-- Clientes só veem entregas dos seus eventos
CREATE POLICY "Clients view event deliveries"
  ON delivery_trackings FOR SELECT
  USING (
    event_project_id IN (
      SELECT id FROM event_projects WHERE contractor_id = auth.uid()
    )
  );

-- Apenas fornecedor pode atualizar GPS
CREATE POLICY "Suppliers update own tracking"
  ON delivery_trackings FOR UPDATE
  USING (supplier_user_id = auth.uid());
```

---

## 📊 Métricas & Monitoramento

### Console Logs

**Fornecedor (GPS tracking):**
```javascript
console.log('Localização atualizada:', { latitude, longitude });
// A cada 5-10 segundos
```

**Cliente (Realtime):**
```javascript
console.log('🔄 Realtime update received:', payload);
console.log('📡 Realtime status: SUBSCRIBED');
console.log('✅ Conectado ao Realtime!');
```

### Dashboard Supabase

- **Realtime Connections:** Ver quantos clients conectados
- **Database Activity:** Queries por segundo
- **API Logs:** Erros e performance

---

## 🚀 Próximos Passos (Melhorias Futuras)

1. **Animação Suave de Movimento**
   - Interpolar entre pontos GPS para movimento fluido
   - Library: `mapbox-gl-js` interpolation

2. **ETA Dinâmico**
   - Calcular tempo estimado de chegada baseado em velocidade
   - API: Mapbox Directions API com traffic data

3. **Notificações Push**
   - Avisar cliente quando entrega está próxima (5min)
   - Service Workers + Push API

4. **Histórico de Rota (Replay)**
   - Visualizar rota completa após entrega
   - Usar `delivery_location_history`

5. **Múltiplos Veículos**
   - Dashboard admin com todas as entregas simultâneas
   - Heatmap de atividade

---

## 🐛 Troubleshooting

### Problema: GPS não atualiza no mapa do cliente

**Checklist:**
- [ ] Migration 027 foi executada? (Realtime habilitado)
- [ ] Badge mostra "Tempo Real" verde?
- [ ] Console mostra "✅ Conectado ao Realtime!"?
- [ ] Fornecedor clicou em "Iniciar Rastreamento GPS"?
- [ ] Permissão de localização foi concedida pelo fornecedor?

### Problema: Erro "permission denied" ao atualizar GPS

**Solução:** Verificar RLS policies no Supabase
```sql
-- Ver policies ativas
SELECT * FROM pg_policies WHERE tablename = 'delivery_trackings';
```

---

## 📚 Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [React Map GL](https://visgl.github.io/react-map-gl/)
