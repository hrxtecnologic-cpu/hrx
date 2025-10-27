# 📍 Raio de Atuação do Profissional - Guia de Uso

## O que é?

Sistema que permite profissionais definirem **o raio máximo de distância** que estão dispostos a viajar para eventos. Essa preferência é respeitada automaticamente no **matching** de profissionais.

## Arquivos Criados

### 1. Migration
- `supabase/migrations/020_add_service_radius.sql` - Adiciona campo `service_radius_km` na tabela `professionals`

### 2. Componente
- `src/components/ServiceRadiusSelector.tsx` - Componente visual para seleção do raio

### 3. UI Slider
- `src/components/ui/slider.tsx` - Componente base slider (Radix UI)

### 4. Integração
- `src/app/cadastro-profissional-wizard/page.tsx` - Adicionado no STEP 5 (Experiência e Disponibilidade)
- `src/lib/validations/professional.ts` - Schema atualizado com `serviceRadiusKm`
- `src/app/api/professionals/route.ts` - API salva o campo no banco
- `src/lib/mapbox-matching.ts` - Matching respeita o raio de atuação
- `src/app/api/mapbox/matching/route.ts` - API retorna profissionais dentro do raio

## Como Funciona

### 1. Cadastro do Profissional

No wizard de cadastro, step de "Experiência e Disponibilidade", o profissional define:

- **Raio padrão**: 50 km
- **Raio mínimo**: 5 km
- **Raio máximo**: 200 km

```typescript
<ServiceRadiusSelector
  value={watch('serviceRadiusKm') || 50}
  onChange={(value) => setValue('serviceRadiusKm', value)}
/>
```

**Features do Componente**:
- 📊 Slider de 5km a 200km (steps de 5km)
- ⚡ Presets rápidos (10km, 30km, 50km, 100km, 200km)
- ⏱️ Estimativa automática de tempo de viagem
- 💡 Dicas contextuais

### 2. Armazenamento

O valor é salvo na tabela `professionals`:

```sql
service_radius_km INTEGER DEFAULT 50 CHECK (service_radius_km >= 5 AND service_radius_km <= 500)
```

### 3. Matching Automático

Quando o sistema busca profissionais próximos a um evento, **o raio de atuação individual de cada profissional é respeitado**:

```typescript
// Profissional A: raio de 30km
// Profissional B: raio de 100km
// Evento X: localização específica

// Sistema filtra:
// - Profissional A: apenas se distância <= 30km
// - Profissional B: apenas se distância <= 100km
```

**Lógica no código** (`src/lib/mapbox-matching.ts:218-229`):

```typescript
.filter((match, index) => {
  const candidate = filteredCandidates[index];
  const withinDistance = match.distance.distanceKm <= maxDistanceKm;
  const withinTime = match.distance.durationMinutes <= maxDurationMinutes;

  // ✅ Respeitar o raio de atuação individual do profissional
  const withinServiceRadius = candidate.serviceRadiusKm
    ? match.distance.distanceKm <= candidate.serviceRadiusKm
    : true; // Se não definiu, aceita qualquer distância

  return withinDistance && withinTime && withinServiceRadius;
})
```

## Exemplo de Uso

### Cenário Real

**Evento**: Casamento na Barra da Tijuca, RJ

**Profissionais Cadastrados**:
1. **João (Fotógrafo)** - Copacabana, raio: 30km → ❌ Não aparece (distância: 35km)
2. **Maria (Fotógrafa)** - Recreio, raio: 50km → ✅ Aparece (distância: 12km)
3. **Carlos (Fotógrafo)** - Niterói, raio: 100km → ✅ Aparece (distância: 40km)

**API Call**:

```typescript
const response = await fetch('/api/mapbox/matching', {
  method: 'POST',
  body: JSON.stringify({
    eventId: 'casamento-barra-123',
    maxDistanceKm: 50,
    categories: ['Fotógrafo'],
  }),
});

// Resultado: Apenas Maria e Carlos
// João foi automaticamente filtrado (fora do raio dele)
```

## Benefícios

### Para o Profissional
- ✅ Controle total sobre área de atuação
- ✅ Não recebe convites de eventos longe demais
- ✅ Economiza tempo de deslocamento
- ✅ Reduz custos de viagem

### Para o Sistema
- ✅ Matching mais preciso
- ✅ Reduz rejeições de profissionais
- ✅ Otimiza alocação automática
- ✅ Melhora satisfação do profissional

### Para o Contratante
- ✅ Recebe apenas profissionais disponíveis para a região
- ✅ Menos tempo esperando respostas
- ✅ Maior chance de aceitação

## Integração com Outros Sistemas

### 1. Matching API

```typescript
POST /api/mapbox/matching
{
  "eventId": "uuid-do-evento",
  "maxDistanceKm": 50,
  "type": "professional"
}

// Retorna apenas profissionais dentro do raio deles E do raio do evento
```

### 2. Dashboard Profissional (Futuro)

**Implementação sugerida**:
- Mostrar mapa com círculo de cobertura
- Estatísticas: "X eventos disponíveis na sua área"
- Opção de expandir temporariamente o raio

```typescript
// Visualizar área de atuação no mapa
<Map>
  <Circle
    center={[prof.longitude, prof.latitude]}
    radius={prof.service_radius_km * 1000} // metros
    fillColor="blue"
    fillOpacity={0.2}
  />
</Map>
```

### 3. Notificações Inteligentes (Futuro)

**Sugestão**:
- Notificar profissional apenas de eventos dentro do raio
- Webhook ao criar evento: buscar profissionais na área

```typescript
// Ao criar evento
const matches = await findNearbyProfessionals(eventLocation, professionals);

// Enviar notificação push apenas para matches
matches.forEach(prof => {
  sendPushNotification(prof.id, {
    title: 'Novo evento na sua área!',
    body: `${prof.distance.distanceKm}km de distância`,
  });
});
```

## Configurações Recomendadas por Categoria

| Categoria | Raio Sugerido | Motivo |
|-----------|---------------|--------|
| **Fotógrafo** | 30-50 km | Equipamento pesado, muitas opções locais |
| **DJ** | 50-100 km | Equipamento portátil, mercado competitivo |
| **Segurança** | 10-30 km | Trabalho local, turnos longos |
| **Motorista** | 50-200 km | Já está acostumado a dirigir |
| **Montador** | 30-50 km | Equipamento pesado, trabalho físico |
| **Garçom** | 10-30 km | Turnos longos, transporte público |

## Roadmap Futuro

### Fase 1 (Implementado) ✅
- Seleção de raio no cadastro
- Armazenamento no banco
- Filtro automático no matching
- Validação de limites (5-200km)

### Fase 2 (Próximos)
- Visualização do raio no mapa (dashboard)
- Edição do raio sem refazer cadastro
- Estatísticas: eventos disponíveis na área
- Notificações inteligentes por proximidade

### Fase 3 (Futuro)
- Raio dinâmico por categoria (fotógrafo: 30km, DJ: 50km)
- Expansão temporária de raio ("aceito viajar mais hoje")
- Sugestão inteligente de raio baseada em histórico
- Heatmap de cobertura geográfica (admin)

## Manutenção

### Alterar Raio de um Profissional

**Via SQL** (admin):
```sql
UPDATE professionals
SET service_radius_km = 100
WHERE id = 'uuid-do-profissional';
```

**Via API** (futuro endpoint PATCH):
```typescript
PATCH /api/professional/profile
{
  "serviceRadiusKm": 100
}
```

### Verificar Profissionais por Raio

```sql
-- Profissionais com raio grande (>100km)
SELECT full_name, city, service_radius_km
FROM professionals
WHERE service_radius_km > 100
ORDER BY service_radius_km DESC;

-- Profissionais com raio pequeno (<20km)
SELECT full_name, city, service_radius_km
FROM professionals
WHERE service_radius_km < 20
ORDER BY service_radius_km ASC;
```

## Status

✅ **IMPLEMENTADO E FUNCIONANDO**

- Migration criada
- Componente visual pronto
- Integração no wizard completa
- API salvando corretamente
- Matching respeitando raio individual
- Validação implementada

---

**Pronto para uso em produção!** 🚀
