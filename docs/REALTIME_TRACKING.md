# 📡 Sistema de Tracking em Tempo Real - HRX

## 🎯 Visão Geral

Sistema de rastreamento GPS em tempo real para entregas de equipamentos usando **Supabase Realtime** + **Mapbox GL**.

### ✅ Implementado

- Cliente Supabase browser (`src/lib/supabase/client.ts`)
- Hook customizado `useRealtimeDeliveries` com subscriptions
- Componente `DeliveryTrackingMap` atualizado
- Indicador visual de conexão em tempo real
- Migration SQL para habilitar Realtime

## 🚀 Como Funciona

### Fluxo de Dados

```
Fornecedor (App) → API /deliveries/[id]/location → Supabase DB
                                                         ↓
                                                    Realtime Event
                                                         ↓
Cliente (Browser) ← Subscription ← Supabase Realtime ←
```

### Latência

- **Antes (Polling):** 30 segundos
- **Agora (Realtime):** 1-2 segundos ⚡

## 📝 Configuração

### 1. Habilitar Realtime no Supabase

Execute a migration no Supabase Dashboard > SQL Editor:

```bash
cat supabase/migrations/027_enable_realtime_delivery_tracking.sql
```

Ou manualmente:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_trackings;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_location_history;
```

### 2. Verificar Variáveis de Ambiente

Certifique-se que o `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

## 🧪 Como Testar

### Teste 1: Verificar Conexão

1. Abra o Dashboard do Cliente com o mapa de entregas
2. Abra o DevTools (F12) → Console
3. Procure por: `✅ Conectado ao Realtime!`
4. Deve aparecer badge verde "Tempo Real" no canto superior esquerdo do mapa

### Teste 2: Simular Atualização GPS

Abra duas janelas lado a lado:

**Janela 1 - Cliente:**
- Acesse: `http://localhost:3000/cliente/evento/[id]/tracking`
- Veja o mapa com entregas

**Janela 2 - Fornecedor:**
- Acesse: `http://localhost:3000/fornecedor/entregas`
- Clique em "Iniciar Entrega"
- O GPS será atualizado automaticamente

**Resultado Esperado:**
- Marcador azul (caminhão) deve se mover **instantaneamente** na Janela 1
- Sem necessidade de refresh!

### Teste 3: Console do Supabase

No DevTools, execute:

```javascript
// Ver mensagens do Realtime
console.log('🔄 Realtime update received:', payload);
```

## 🔧 Arquivos Modificados/Criados

### Novos Arquivos

- `src/lib/supabase/client.ts` - Cliente browser
- `src/hooks/useRealtimeDeliveries.ts` - Hook de subscriptions
- `supabase/migrations/027_enable_realtime_delivery_tracking.sql` - Migration

### Arquivos Modificados

- `src/components/delivery/DeliveryTrackingMap.tsx` - Adicionado Realtime + indicador visual

## 📊 Estrutura do Evento Realtime

```typescript
{
  eventType: 'UPDATE',
  new: {
    id: 'uuid',
    current_latitude: -23.5505,
    current_longitude: -46.6333,
    status: 'in_transit',
    last_location_update: '2025-10-24T19:30:00Z'
  },
  old: { ... }
}
```

## 🎨 UI Indicadores

### Conectado
```
🟢 [Wifi Icon] Tempo Real
```

### Desconectado
```
⚪ [WifiOff Icon] Conectando...
```

## 🐛 Troubleshooting

### Problema: Badge mostra "Conectando..." sempre

**Solução:**
1. Verifique se a migration foi executada
2. Verifique console: `📡 Realtime status: SUBSCRIBED`
3. Teste conexão: `curl https://seu-projeto.supabase.co/realtime/v1/health`

### Problema: Não recebe updates

**Solução:**
1. Verifique filtros RLS (podem bloquear Realtime)
2. Confirme que `NEXT_PUBLIC_SUPABASE_ANON_KEY` está correta
3. Veja logs no Supabase Dashboard > Logs > Realtime

### Problema: Delay grande (> 5 segundos)

**Possíveis causas:**
- Rede lenta
- Muitos clients conectados (limite do plano gratuito: 200 concurrent)
- Throttling do fornecedor (GPS atualiza a cada 5s)

## 📈 Próximos Passos

- [ ] Adicionar suavização de movimento (interpolação entre pontos GPS)
- [ ] Mostrar velocidade do veículo
- [ ] ETA (Estimated Time of Arrival) dinâmico
- [ ] Notificações push quando entrega se aproxima
- [ ] Histórico de rota (replay)
- [ ] Múltiplos veículos em um único mapa

## 🔐 Segurança

O sistema usa **ANON_KEY** que respeita Row Level Security (RLS). Certifique-se que:

- Clientes só vejam entregas dos seus próprios eventos
- Fornecedores só atualizem GPS das suas próprias entregas
- Admins vejam tudo

Exemplo de RLS (já configurado):

```sql
CREATE POLICY "Contractors view own deliveries"
  ON delivery_trackings FOR SELECT
  USING (event_project_id IN (
    SELECT id FROM event_projects WHERE contractor_id = auth.uid()
  ));
```

## 📞 Suporte

- Documentação Supabase Realtime: https://supabase.com/docs/guides/realtime
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/
