# Mapbox Setup - HRX Eventos

## Resumo

Mapbox foi integrado para substituir Nominatim/ViaCEP por geocoding profissional:
- ✅ Geocoding API: endereço → coordenadas
- ✅ Reverse Geocoding: coordenadas → endereço
- ✅ Matrix API: distâncias reais de rota (não linha reta)
- ✅ Mapa interativo no admin
- ✅ 100k requests/mês GRÁTIS

## Como configurar

### 1. Criar conta Mapbox (GRÁTIS)

1. Acesse: https://account.mapbox.com/auth/signup/
2. Crie conta gratuita
3. Confirme email

### 2. Obter tokens

1. Acesse: https://account.mapbox.com/access-tokens/
2. Você terá um **Default Public Token** (pk.xxx)
3. Criar um **Secret Token**:
   - Clique em "Create a token"
   - Nome: "HRX Backend"
   - Scopes: marque todas as opções de "Geocoding" e "Directions"
   - Clique em "Create token"
   - COPIE o token (sk.xxx) - só aparece uma vez!

### 3. Configurar variáveis de ambiente

Adicione no `.env.local`:

```env
# Token público (usado no frontend)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXh5ejN6NjBhbXEyaXBjbnF4OXJlcmQifQ.xxxxx

# Token secreto (usado no backend - OPCIONAL)
MAPBOX_SECRET_TOKEN=sk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXh5ejN6NjBhbXEyaXBjbnF4OXJlcmQifQ.xxxxx
```

> **Nota**: O token público é suficiente para todas as funcionalidades atuais. O secreto é opcional.

## Funcionalidades Implementadas

### 1. Geocoding Automático

**Arquivo**: `src/lib/mapbox-geocoding.ts`

Converte endereços em coordenadas:

```typescript
import { geocodeAddress } from '@/lib/mapbox-geocoding';

const coords = await geocodeAddress({
  street: 'Av. Paulista',
  number: '1578',
  city: 'São Paulo',
  state: 'SP',
});

// { latitude: -23.5617, longitude: -46.6560, ... }
```

### 2. Matrix API (Distâncias Reais)

**Arquivo**: `src/lib/mapbox-matrix.ts`

Calcula distância de rota (não linha reta):

```typescript
import { getDistance } from '@/lib/mapbox-matrix';

const result = await getDistance(
  { latitude: -23.5505, longitude: -46.6333 },
  { latitude: -23.5617, longitude: -46.6560 }
);

// { distanceKm: 2.3, durationMinutes: 8, durationHours: 0.13 }
```

### 3. Mapa Admin Interativo

**Página**: `/admin/mapa`

Visualize no mapa:
- Profissionais (azul)
- Fornecedores (verde)
- Eventos (vermelho)

Filtros por tipo, clique nos markers para detalhes.

### 4. Geocoding em Batch

**API**: `POST /api/admin/geocode/batch`

Geocodifica múltiplos registros de uma vez:

```bash
# Buscar profissionais sem coordenadas
GET /api/admin/geocode/batch?type=professionals

# Geocodificar IDs específicos
POST /api/admin/geocode/batch
{
  "type": "professionals",
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

## Como usar no projeto

### Geocodificar profissionais/fornecedores

1. **Via API Admin**:
   ```bash
   # Ver quantos faltam
   GET /api/admin/geocode/batch?type=professionals

   # Geocodificar todos
   POST /api/admin/geocode/batch
   {
     "type": "professionals",
     "ids": [...] # IDs retornados acima
   }
   ```

2. **Via SQL** (Migration 024):
   ```sql
   -- Ver estatísticas
   SELECT * FROM get_geocoding_stats();

   -- Ver pendentes
   SELECT * FROM professionals_pending_geocoding LIMIT 10;
   SELECT * FROM suppliers_pending_geocoding LIMIT 10;
   SELECT * FROM events_pending_geocoding LIMIT 10;
   ```

### Usar no sistema de sugestões

A função SQL `get_suggested_professionals()` já usa Haversine (linha reta).

Para usar distância REAL de rota, você pode:
1. Chamar Matrix API no backend após buscar sugestões
2. Re-ordenar por distância real
3. Filtrar por tempo de viagem (ex: máx 1h)

Exemplo:

```typescript
// 1. Buscar sugestões (usa Haversine)
const { data } = await fetch(`/api/admin/event-projects/${projectId}/suggested-professionals`);

// 2. Enriquecer com distâncias reais
import { getDistancesToMany } from '@/lib/mapbox-matrix';

const eventCoords = { latitude: project.latitude, longitude: project.longitude };
const profCoords = professionals.map(p => ({ latitude: p.latitude, longitude: p.longitude }));

const realDistances = await getDistancesToMany(eventCoords, profCoords);

// 3. Re-ordenar por distância real
professionals.forEach((prof, i) => {
  prof.realDistance = realDistances[i];
});

professionals.sort((a, b) => a.realDistance.distanceKm - b.realDistance.distanceKm);
```

## Limites da API (Free Tier)

### Geocoding API
- **100.000 requests/mês** = GRÁTIS
- Acima: $0.50 por 1.000 requests

### Directions/Matrix API
- **100.000 requests/mês** = GRÁTIS
- Acima: $0.50 por 1.000 requests

### Maps (Visualizações)
- **200.000 map loads/mês** = GRÁTIS
- Acima: $0.25 por 1.000 loads

**Estimativa HRX**:
- ~5k geocoding/mês (cadastros novos)
- ~10k matrix API/mês (sugestões)
- ~2k map loads/mês (admin)
- **Total: ~17k requests/mês = 100% GRÁTIS**

## Migrações SQL

Execute no Supabase:

```sql
-- Migration 024: Views e funções auxiliares
-- Ver: supabase/migrations/024_improve_suggestions_with_real_distance.sql
```

Isso cria:
- `professionals_pending_geocoding` - Profissionais sem coordenadas
- `suppliers_pending_geocoding` - Fornecedores sem coordenadas
- `events_pending_geocoding` - Eventos sem coordenadas
- `get_geocoding_stats()` - Estatísticas de geocodificação

## Troubleshooting

### Mapa não aparece

1. Verificar se token está configurado:
   ```bash
   echo $NEXT_PUBLIC_MAPBOX_TOKEN
   ```

2. Ver console do navegador - deve aparecer erro se token inválido

3. Verificar se token tem permissões corretas no Mapbox Dashboard

### Geocoding falha

1. Verificar se endereço tem cidade + estado (obrigatório)
2. Ver logs do servidor para detalhes do erro
3. Testar manualmente: https://docs.mapbox.com/playground/geocoding/

### Matrix API retorna null

1. Verificar se coordenadas são válidas (lat/lon)
2. Limite de 25 pontos simultâneos
3. Ver logs para detalhes

## Próximos Passos

1. ✅ Executar migration 024 no Supabase
2. ✅ Configurar tokens Mapbox
3. ✅ Geocodificar registros existentes via API batch
4. ✅ Testar mapa admin em `/admin/mapa`
5. 🔜 (Opcional) Integrar Matrix API no fluxo de sugestões

## Referências

- Geocoding API: https://docs.mapbox.com/api/search/geocoding/
- Matrix API: https://docs.mapbox.com/api/navigation/matrix/
- react-map-gl: https://visgl.github.io/react-map-gl/
- Pricing: https://www.mapbox.com/pricing
