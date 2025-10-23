# Estrutura de Endereços no Banco - HRX

## Resumo das Colunas por Tabela

### 1. `professionals`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `street` | varchar | Nome da rua |
| `number` | varchar | Número |
| `complement` | varchar | Complemento |
| `neighborhood` | varchar | Bairro |
| `city` | varchar | Cidade ✅ obrigatório |
| `state` | varchar | Estado ✅ obrigatório |
| `cep` | varchar | CEP (não `zip_code`) |
| `latitude` | numeric | Latitude (geocodificação) |
| `longitude` | numeric | Longitude (geocodificação) |

### 2. `equipment_suppliers`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `address` | text | Endereço completo (sem separação) |
| `city` | text | Cidade ✅ obrigatório |
| `state` | text | Estado ✅ obrigatório |
| `zip_code` | text | CEP |
| `latitude` | numeric | Latitude (geocodificação) |
| `longitude` | numeric | Longitude (geocodificação) |

**⚠️ Diferença**: Fornecedores têm `address` como texto completo, não separado.

### 3. `event_projects`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `venue_name` | varchar | Nome do local |
| `venue_address` | text | Endereço completo (não separado) |
| `venue_city` | varchar | Cidade ✅ obrigatório |
| `venue_state` | varchar | Estado ✅ obrigatório |
| `venue_zip` | varchar | CEP |
| `latitude` | numeric | Latitude (adicionada na migration 024) |
| `longitude` | numeric | Longitude (adicionada na migration 024) |

**⚠️ Diferenças**:
- Prefixo `venue_` em todas as colunas
- `venue_address` é texto completo (não `venue_street`, `venue_number`, etc)
- `latitude/longitude` **foram adicionadas** na migration 024

## Como Geocodificar Cada Tipo

### Profissionais
```typescript
const address = {
  street: prof.street,
  number: prof.number,
  neighborhood: prof.neighborhood,
  city: prof.city,        // obrigatório
  state: prof.state,      // obrigatório
  zipCode: prof.cep,
  country: 'br'
};
```

### Fornecedores
```typescript
const address = {
  street: supplier.address,  // endereço completo
  city: supplier.city,       // obrigatório
  state: supplier.state,     // obrigatório
  zipCode: supplier.zip_code,
  country: 'br'
};
```

### Eventos
```typescript
const address = {
  street: event.venue_address, // endereço completo
  city: event.venue_city,      // obrigatório
  state: event.venue_state,    // obrigatório
  zipCode: event.venue_zip,
  country: 'br'
};
```

## Migration 024: O que foi adicionado

1. **Colunas em `event_projects`**:
   ```sql
   ALTER TABLE event_projects ADD COLUMN latitude NUMERIC;
   ALTER TABLE event_projects ADD COLUMN longitude NUMERIC;
   ```

2. **Views de registros pendentes**:
   - `professionals_pending_geocoding` - usa `cep`
   - `suppliers_pending_geocoding` - usa `address` + `zip_code`
   - `events_pending_geocoding` - usa `venue_address` + `venue_zip`

3. **Função de estatísticas**:
   - `get_geocoding_stats()` - retorna % de registros geocodificados por tipo

## API de Geocoding Batch

### Buscar pendentes
```bash
GET /api/admin/geocode/batch?type=professionals
GET /api/admin/geocode/batch?type=suppliers
GET /api/admin/geocode/batch?type=events
```

### Geocodificar múltiplos
```bash
POST /api/admin/geocode/batch
{
  "type": "professionals", // ou "suppliers" ou "events"
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

## Campos Obrigatórios para Geocoding

| Tabela | Obrigatórios |
|--------|--------------|
| `professionals` | `city`, `state` |
| `equipment_suppliers` | `city`, `state` |
| `event_projects` | `venue_city`, `venue_state` |

Se `city` ou `state` estiverem `NULL`, o geocoding falhará.

## Troubleshooting

### ❌ "column zip_code does not exist"
- `professionals` usa `cep`, não `zip_code`
- Corrigir para usar `prof.cep`

### ❌ "column venue_street does not exist"
- `event_projects` não tem campos separados
- Usar `venue_address` (texto completo)

### ❌ "column street does not exist" (suppliers)
- `equipment_suppliers` usa `address` (texto completo)
- Não tem `street`, `number`, `neighborhood` separados
