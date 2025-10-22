# 🔍 Sistema de Busca Avançada - Guia de Uso

> **Versão:** 1.0.0
> **Data:** 2025-10-21
> **Status:** ✅ Implementado

Sistema completo de busca avançada para profissionais com suporte a filtros múltiplos, busca por proximidade geográfica e componentes reutilizáveis.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Componentes Criados](#componentes-criados)
4. [Como Usar](#como-usar)
5. [Configuração Necessária](#configuração-necessária)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

O sistema de busca avançada foi implementado para resolver o problema de seleção manual de profissionais, permitindo busca eficiente por:

- ✅ **Texto livre** - nome, CPF, email, telefone, endereço completo
- ✅ **Status** - pendente, aprovado, rejeitado, incompleto
- ✅ **Categorias** - múltiplas categorias simultâneas
- ✅ **Localização** - cidade, estado
- ✅ **Experiência** - com/sem experiência
- ✅ **Proximidade Geográfica** - busca por raio em km

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Client)                     │
│  ┌──────────────────┐     ┌──────────────────────────┐ │
│  │ AdvancedSearch   │────▶│ useAdvancedSearch Hook  │ │
│  │   Component      │     └──────────────────────────┘ │
│  └──────────────────┘              │                    │
│         │                           │                    │
│         │                           ▼                    │
│         │                  ┌─────────────────┐          │
│         └─────────────────▶│  geo-utils.ts   │          │
│                            └─────────────────┘          │
└──────────────────────────────────│───────────────────────┘
                                   │ HTTP POST
                                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (API)                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /api/admin/professionals/search/route.ts          │ │
│  └────────────────────────────────────────────────────┘ │
│         │                           │                    │
│         ▼                           ▼                    │
│  ┌──────────────┐          ┌──────────────────┐        │
│  │ geocoding.ts │          │  Supabase Query  │        │
│  └──────────────┘          └──────────────────┘        │
└──────────────────────────────────│───────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Database (Supabase)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  professionals table (com lat/lng)                 │ │
│  │  + calculate_distance() SQL function               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades

### 1. Busca Textual Multi-Campo

Busca simultânea em todos os campos:
- Nome completo
- CPF
- Email
- Telefone
- Rua
- Bairro
- Cidade
- Estado

**Exemplo:** Digite "João São Paulo" → encontra profissionais chamados João OU que moram em São Paulo

### 2. Filtros Múltiplos

#### Status
- Pendente
- Aprovado
- Rejeitado
- Incompleto

#### Categorias
Seleção múltipla de 13 categorias:
- Motorista
- Técnico de Iluminação
- Técnico de Som
- Técnico de Palco
- Operador de Empilhadeira
- Rigger
- Eletricista
- Segurança
- Produtor
- Assistente de Produção
- Runner
- Montador
- Técnico de Vídeo

#### Localização
- **Estado:** Dropdown com todos os estados brasileiros
- **Cidade:** Busca por nome da cidade

#### Experiência
- Todos
- Com experiência
- Sem experiência

### 3. Busca por Proximidade Geográfica

**Raios disponíveis:**
- 5 km
- 10 km
- 25 km
- 50 km
- 100 km
- 200 km

**Métodos de entrada:**
1. **Detecção automática** - usa GPS do dispositivo
2. **Manual** - insere latitude/longitude manualmente

**Como funciona:**
1. Sistema converte endereço em coordenadas (geocoding)
2. Calcula distância usando fórmula de Haversine
3. Filtra profissionais dentro do raio especificado
4. Ordena por distância (mais próximo primeiro)

### 4. Paginação e Ordenação

- **Paginação:** 20 resultados por página
- **Ordenação:**
  - Nome (A-Z ou Z-A)
  - Data de cadastro (mais recente ou mais antigo)
  - Experiência (mais ou menos experiente)
  - Distância (quando busca geográfica ativa)

---

## 🗂️ Componentes Criados

### Backend

#### 1. Migration: `006_add_geolocation_to_professionals.sql`
**Localização:** `supabase/migrations/`

Adiciona campos de geolocalização e função de cálculo de distância:

```sql
-- Campos adicionados
ALTER TABLE professionals
  ADD COLUMN latitude DECIMAL(10, 8),
  ADD COLUMN longitude DECIMAL(11, 8);

-- Função SQL para calcular distância
CREATE FUNCTION calculate_distance(lat1, lon1, lat2, lon2) RETURNS DECIMAL
```

**Status:** ⚠️ Precisa ser aplicado no Supabase

#### 2. API: `src/app/api/admin/professionals/search/route.ts`
**Endpoint:** `POST /api/admin/professionals/search`

**Request Body:**
```typescript
{
  query?: string;
  status?: string[];
  categories?: string[];
  hasExperience?: boolean;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'distance' | 'createdAt' | 'experience';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
{
  professionals: Array<Professional>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
```

#### 3. Geocoding Service: `src/lib/geocoding.ts`

Serviço para converter endereços em coordenadas:

- **OpenStreetMap Nominatim** (gratuito, padrão)
- **Google Maps Geocoding API** (opcional, requer API key)

**Funções:**
- `geocodeAddress()` - endereço → lat/lng
- `reverseGeocode()` - lat/lng → endereço

#### 4. Geo Utils: `src/lib/geo-utils.ts`

Utilitários geográficos:

- `calculateDistance()` - Haversine em JS
- `getBoundingBox()` - otimização de queries
- `isWithinRadius()` - verificar se ponto está no raio
- `formatDistance()` - formatar distância para exibição

### Frontend

#### 5. Hook: `src/hooks/useAdvancedSearch.ts`

Hook React reutilizável para busca:

```typescript
const {
  results,
  total,
  isLoading,
  error,
  search,
  setFilters,
  nextPage,
  previousPage,
} = useAdvancedSearch<Professional>(initialFilters, options);
```

**Features:**
- Debouncing automático para texto
- Gerenciamento de loading/error
- Paginação
- Cancelamento de requests anteriores

#### 6. Componente: `src/components/admin/AdvancedSearch.tsx`

Componente de busca completo com UI:

```tsx
<AdvancedSearch
  onResultsChange={(results) => setProfessionals(results)}
  showProximitySearch={true}
  showStatusFilter={true}
  showCategoryFilter={true}
  showExperienceFilter={true}
/>
```

**Props:**
- `onResultsChange` - callback com resultados
- `showProximitySearch` - mostrar/ocultar busca geográfica
- `showStatusFilter` - mostrar/ocultar filtro de status
- `showCategoryFilter` - mostrar/ocultar filtro de categorias
- `showExperienceFilter` - mostrar/ocultar filtro de experiência

#### 7. View Wrapper: `src/components/admin/ProfessionalsSearchView.tsx`

Wrapper que combina AdvancedSearch + tabela de resultados

---

## 🚀 Como Usar

### Passo 1: Aplicar Migration no Supabase

**Opção A: Via Supabase Dashboard**

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto HRX
3. Vá em **SQL Editor**
4. Copie o conteúdo de `supabase/migrations/006_add_geolocation_to_professionals.sql`
5. Cole e execute (RUN)

**Opção B: Via CLI do Supabase**

```bash
cd hrx
supabase db push
```

### Passo 2: (Opcional) Configurar Google Maps API

Se quiser usar Google Maps em vez de OpenStreetMap:

1. Obtenha API key em https://console.cloud.google.com/
2. Habilite "Geocoding API"
3. Adicione ao `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_api_key_aqui
```

### Passo 3: Popular Coordenadas dos Profissionais Existentes

**Opção A: Script Manual (Recomendado)**

Crie `scripts/geocode-professionals.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { geocodeAddress } from '../src/lib/geocoding';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function geocodeAllProfessionals() {
  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .is('latitude', null);

  console.log(`🔄 Geocodificando ${professionals?.length} profissionais...`);

  for (const prof of professionals || []) {
    const result = await geocodeAddress({
      street: prof.street,
      number: prof.number,
      neighborhood: prof.neighborhood,
      city: prof.city,
      state: prof.state,
      zipCode: prof.zip_code,
      country: 'Brasil',
    });

    if (result) {
      await supabase
        .from('professionals')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .eq('id', prof.id);

      console.log(`✅ ${prof.full_name} - ${result.latitude}, ${result.longitude}`);
    } else {
      console.log(`❌ ${prof.full_name} - Geocoding falhou`);
    }

    // Aguardar 1s entre requests (respeitar rate limit do Nominatim)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ Geocoding completo!');
}

geocodeAllProfessionals();
```

Execute:
```bash
npx tsx scripts/geocode-professionals.ts
```

**Opção B: Geocoding On-Demand**

Adicionar geocoding automático quando profissional atualizar endereço:

```typescript
// src/app/api/professionals/route.ts
import { geocodeAddress } from '@/lib/geocoding';

// Após salvar profissional
const geocodingResult = await geocodeAddress({
  street: validatedData.street,
  city: validatedData.city,
  state: validatedData.state,
  country: 'Brasil',
});

if (geocodingResult) {
  await supabase
    .from('professionals')
    .update({
      latitude: geocodingResult.latitude,
      longitude: geocodingResult.longitude,
    })
    .eq('id', professionalId);
}
```

### Passo 4: Testar no Admin

1. Acesse `/admin/profissionais`
2. Clique em "Filtros"
3. Experimente:
   - Busca por texto: "João"
   - Filtro de status: "Aprovado"
   - Filtro de cidade: "São Paulo"
   - Busca por proximidade: ative, detecte localização, escolha raio

---

## 📝 Exemplos de Uso

### Exemplo 1: Buscar Motoristas em São Paulo

```typescript
// Usando o hook diretamente
const { results, search } = useAdvancedSearch<Professional>();

search({
  categories: ['Motorista'],
  city: 'São Paulo',
  status: ['approved'],
});
```

### Exemplo 2: Buscar Profissionais Próximos a um Evento

```typescript
// Coordenadas do evento
const eventoLat = -23.5505;
const eventoLng = -46.6333;

search({
  latitude: eventoLat,
  longitude: eventoLng,
  radius: 25, // 25 km
  status: ['approved'],
}, {
  sortBy: 'distance', // Ordenar por distância
  sortOrder: 'asc',   // Mais próximo primeiro
});
```

### Exemplo 3: Buscar Técnicos com Experiência

```typescript
search({
  categories: ['Técnico de Som', 'Técnico de Iluminação', 'Técnico de Palco'],
  hasExperience: true,
  status: ['approved'],
}, {
  sortBy: 'experience',
  sortOrder: 'desc', // Mais experientes primeiro
});
```

### Exemplo 4: Reutilizar em Outra Página

```tsx
// src/app/eventos/[id]/alocar-profissionais/page.tsx
'use client';

import { AdvancedSearch } from '@/components/admin/AdvancedSearch';
import { useState } from 'react';

export default function AlocarProfissionaisPage() {
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);

  return (
    <div>
      <h1>Alocar Profissionais para o Evento</h1>

      <AdvancedSearch
        onResultsChange={(results) => {
          // Fazer algo com os resultados
          console.log('Profissionais encontrados:', results);
        }}
        showProximitySearch={true}
        initialFilters={{
          status: ['approved'], // Apenas aprovados
        }}
      />
    </div>
  );
}
```

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente

```env
# Obrigatório
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key

# Opcional (para Google Maps Geocoding)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_google_maps_key
```

### Permissões do Supabase

Certifique-se que a rota da API tem permissões de admin:

```typescript
// Já implementado em /api/admin/professionals/search/route.ts
const isAdmin = user.publicMetadata?.role === 'admin';
if (!isAdmin) {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}
```

---

## 📊 Performance

### Otimizações Implementadas

1. **Bounding Box First**
   - Antes de calcular distância exata, filtra por retângulo (muito mais rápido)

2. **Índices no Banco**
   ```sql
   CREATE INDEX idx_professionals_latitude ON professionals(latitude);
   CREATE INDEX idx_professionals_longitude ON professionals(longitude);
   CREATE INDEX idx_professionals_lat_lng ON professionals(latitude, longitude);
   ```

3. **Debouncing de Texto**
   - 500ms de delay antes de buscar (evita requests desnecessários)

4. **Cancelamento de Requests**
   - Cancela requests anteriores quando nova busca é iniciada

5. **Paginação**
   - Apenas 20 resultados por vez

### Métricas Esperadas

- Busca textual simples: **< 100ms**
- Busca com filtros: **< 200ms**
- Busca geográfica (< 1000 profissionais): **< 500ms**
- Geocoding de endereço: **1-2 segundos**

---

## 🐛 Troubleshooting

### Erro: "Could not find the 'latitude' column"

**Causa:** Migration não foi aplicada

**Solução:**
```bash
# Via Supabase Dashboard
SQL Editor → Execute migration 006

# OU via CLI
supabase db push
```

### Busca Geográfica Não Retorna Resultados

**Causa:** Profissionais não têm coordenadas populadas

**Solução:**
```bash
# Executar script de geocoding
npx tsx scripts/geocode-professionals.ts
```

### Geocoding Falha (OpenStreetMap)

**Causa:** Rate limit do Nominatim (1 request/segundo)

**Solução:**
- Aguardar 1 segundo entre requests
- OU usar Google Maps API (sem rate limit tão restritivo)

### Erro 403 ao Buscar

**Causa:** Usuário não é admin

**Solução:**
```sql
-- Atualizar role do usuário no Clerk
UPDATE users SET public_metadata = '{"role": "admin"}' WHERE id = 'user_id';
```

---

## 🎯 Próximos Passos

### Melhorias Futuras

1. **Mapa Interativo**
   - Mostrar profissionais no mapa
   - Clicar no mapa para definir localização de busca
   - Usar Google Maps ou Mapbox

2. **Busca Salva**
   - Salvar filtros favoritos
   - Buscar recentemente usadas

3. **Exportação de Resultados**
   - Excel
   - PDF
   - CSV

4. **Notificações**
   - Alertar quando novo profissional corresponder aos filtros

5. **Analytics**
   - Buscas mais comuns
   - Profissionais mais visualizados

---

## 📞 Suporte

Se tiver problemas:

1. Verifique este documento
2. Consulte `CODING_STANDARDS.md`
3. Consulte `ADVANCED_SEARCH_SYSTEM.md` (design técnico)

---

**Última atualização:** 2025-10-21
**Autor:** Claude Code
**Status:** ✅ Pronto para uso (após aplicar migration)
