# 🔍 Sistema de Busca Avançada - HRX Platform

> **Versão:** 1.0.0
> **Data:** 2025-10-21
> **Status:** Planejamento

Este documento descreve a implementação do sistema de busca avançada com filtros múltiplos e busca por proximidade geográfica.

---

## 📋 Requisitos

### Funcionalidades Necessárias

1. **Busca Textual Completa**
   - Nome do profissional
   - CPF
   - Email
   - Telefone
   - Endereço (rua, bairro, cidade, estado)
   - Categorias

2. **Filtros Avançados**
   - Status (pending, approved, rejected)
   - Categorias (múltiplas seleções)
   - Experiência (com/sem)
   - Anos de experiência
   - Disponibilidade (dias/horários)
   - Localização (cidade, estado)

3. **Busca por Proximidade**
   - Buscar profissionais próximos a uma localização
   - Ordenar por distância
   - Filtrar por raio (ex: 10km, 50km, 100km)

4. **Reutilizável**
   - Usar em: Profissionais, Fornecedores, Contratantes
   - Componente genérico
   - Fácil adicionar novos filtros

---

## 🏗️ Arquitetura

### 1. Backend - API de Busca

**Arquivo:** `src/app/api/admin/professionals/search/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import { calculateDistance } from '@/lib/geo-utils';

interface SearchParams {
  // Busca textual
  query?: string;

  // Filtros
  status?: string[];
  categories?: string[];
  hasExperience?: boolean;
  yearsOfExperience?: string;
  city?: string;
  state?: string;

  // Busca por proximidade
  latitude?: number;
  longitude?: number;
  radius?: number; // em km

  // Paginação
  page?: number;
  limit?: number;

  // Ordenação
  sortBy?: 'name' | 'distance' | 'createdAt' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { isAdmin: userIsAdmin } = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const params: SearchParams = await req.json();
    const supabase = await createClient();

    // Construir query base
    let query = supabase
      .from('professionals')
      .select('*', { count: 'exact' });

    // 1. BUSCA TEXTUAL (Full Text Search)
    if (params.query) {
      const searchTerm = `%${params.query}%`;

      query = query.or(
        `full_name.ilike.${searchTerm},` +
        `cpf.ilike.${searchTerm},` +
        `email.ilike.${searchTerm},` +
        `phone.ilike.${searchTerm},` +
        `street.ilike.${searchTerm},` +
        `neighborhood.ilike.${searchTerm},` +
        `city.ilike.${searchTerm},` +
        `state.ilike.${searchTerm}`
      );
    }

    // 2. FILTROS
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    if (params.categories && params.categories.length > 0) {
      // Busca em JSONB array
      query = query.contains('categories', params.categories);
    }

    if (params.hasExperience !== undefined) {
      query = query.eq('has_experience', params.hasExperience);
    }

    if (params.yearsOfExperience) {
      query = query.eq('years_of_experience', params.yearsOfExperience);
    }

    if (params.city) {
      query = query.ilike('city', `%${params.city}%`);
    }

    if (params.state) {
      query = query.eq('state', params.state);
    }

    // 3. PAGINAÇÃO
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    // 4. ORDENAÇÃO BÁSICA (distância é calculada no frontend)
    if (params.sortBy && params.sortBy !== 'distance') {
      const column = params.sortBy === 'name' ? 'full_name' :
                     params.sortBy === 'experience' ? 'years_of_experience' :
                     'created_at';

      query = query.order(column, { ascending: params.sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Executar query
    const { data: professionals, error, count } = await query;

    if (error) throw error;

    // 5. BUSCA POR PROXIMIDADE (pós-processamento)
    let results = professionals || [];

    if (params.latitude && params.longitude) {
      // Adicionar distância a cada profissional
      results = results.map(prof => {
        // Usar API de geocoding para converter endereço em coordenadas
        // Por enquanto, vamos usar cidade/estado como aproximação
        const distance = calculateDistance(
          params.latitude!,
          params.longitude!,
          prof.latitude || 0,  // TODO: adicionar campos lat/lng
          prof.longitude || 0
        );

        return {
          ...prof,
          distance: Math.round(distance * 10) / 10 // arredondar para 1 casa decimal
        };
      });

      // Filtrar por raio se especificado
      if (params.radius) {
        results = results.filter(prof => prof.distance <= params.radius!);
      }

      // Ordenar por distância se solicitado
      if (params.sortBy === 'distance') {
        results.sort((a, b) => {
          const order = params.sortOrder === 'asc' ? 1 : -1;
          return (a.distance - b.distance) * order;
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        professionals: results,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}
```

---

## 🗺️ Geolocalização - Busca por Proximidade

### Opção 1: Adicionar Coordenadas no Banco (RECOMENDADO)

**Migration:** `006_add_geolocation_to_professionals.sql`

```sql
-- Adicionar campos de geolocalização
ALTER TABLE professionals
  ADD COLUMN latitude DECIMAL(10, 8),
  ADD COLUMN longitude DECIMAL(11, 8);

-- Criar índice para buscas espaciais
CREATE INDEX idx_professionals_location
  ON professionals (latitude, longitude);

-- Função para calcular distância (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);

  a := SIN(dlat/2) * SIN(dlat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon/2) * SIN(dlon/2);

  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Query otimizada com distância:**

```sql
SELECT
  *,
  calculate_distance(
    -23.5505, -- latitude de referência
    -46.6333, -- longitude de referência
    latitude,
    longitude
  ) AS distance
FROM professionals
WHERE
  -- Filtro básico por bounding box (performance)
  latitude BETWEEN -24.0 AND -23.0
  AND longitude BETWEEN -47.0 AND -46.0
  -- Filtro exato por raio
  AND calculate_distance(-23.5505, -46.6333, latitude, longitude) <= 50 -- 50km
ORDER BY distance ASC;
```

### Opção 2: Geocoding em Tempo Real

**Serviço recomendado:** Google Maps Geocoding API

**Arquivo:** `src/lib/geocoding.ts`

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Converte endereço em coordenadas usando Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key não configurada');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }

    return null;
  } catch (error) {
    console.error('Erro no geocoding:', error);
    return null;
  }
}

/**
 * Atualizar coordenadas de um profissional baseado no endereço
 */
export async function updateProfessionalCoordinates(professionalId: string) {
  const supabase = await createClient();

  // Buscar endereço
  const { data: prof } = await supabase
    .from('professionals')
    .select('street, number, city, state, cep')
    .eq('id', professionalId)
    .single();

  if (!prof) return;

  // Montar endereço completo
  const fullAddress = `${prof.street}, ${prof.number}, ${prof.city} - ${prof.state}, ${prof.cep}, Brasil`;

  // Geocodificar
  const coords = await geocodeAddress(fullAddress);

  if (coords) {
    // Atualizar no banco
    await supabase
      .from('professionals')
      .update({
        latitude: coords.latitude,
        longitude: coords.longitude
      })
      .eq('id', professionalId);
  }
}
```

**Alternativas GRATUITAS:**

1. **OpenStreetMap Nominatim** (grátis, sem API key)
```typescript
const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
```

2. **PostGIS** (extensão PostgreSQL para dados geoespaciais)
```sql
-- Instalar extensão
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adicionar coluna geométrica
ALTER TABLE professionals
  ADD COLUMN location GEOMETRY(Point, 4326);

-- Criar índice espacial
CREATE INDEX idx_professionals_location_gist
  ON professionals USING GIST (location);

-- Buscar por proximidade
SELECT *
FROM professionals
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326), -- ponto de referência
  50000 -- raio em metros (50km)
)
ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326));
```

---

## 🎨 Frontend - Componente de Busca

**Arquivo:** `src/components/admin/AdvancedSearch.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AdvancedSearchProps {
  onSearch: (params: SearchParams) => void;
  categories?: string[];
  showLocationSearch?: boolean;
}

interface SearchParams {
  query?: string;
  status?: string[];
  categories?: string[];
  hasExperience?: boolean;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export function AdvancedSearch({
  onSearch,
  categories = [],
  showLocationSearch = true
}: AdvancedSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);

  // Obter localização atual do usuário
  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchParams(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setUseMyLocation(true);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização');
        }
      );
    } else {
      alert('Geolocalização não suportada pelo navegador');
    }
  };

  const handleSearch = () => {
    onSearch(searchParams);
  };

  return (
    <div className="space-y-4">
      {/* Busca Textual */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar por nome, CPF, email, telefone, endereço..."
            value={searchParams.query || ''}
            onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Filtros Avançados */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, status: [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cidade */}
            <div>
              <Label>Cidade</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={searchParams.city || ''}
                onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              />
            </div>

            {/* Estado */}
            <div>
              <Label>Estado</Label>
              <Select
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, state: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  {/* ... outros estados */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <Label>Categorias</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    onCheckedChange={(checked) => {
                      const current = searchParams.categories || [];
                      const updated = checked
                        ? [...current, category]
                        : current.filter(c => c !== category);
                      setSearchParams({ ...searchParams, categories: updated });
                    }}
                  />
                  <label htmlFor={category} className="text-sm">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Busca por Proximidade */}
          {showLocationSearch && (
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Buscar por Proximidade
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetMyLocation}
                  className="w-full"
                >
                  {useMyLocation ? '✓ Usando Minha Localização' : 'Usar Minha Localização'}
                </Button>

                <div>
                  <Label>Raio (km)</Label>
                  <Select
                    onValueChange={(value) =>
                      setSearchParams({ ...searchParams, radius: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                      <SelectItem value="100">100 km</SelectItem>
                      <SelectItem value="200">200 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchParams({});
                setUseMyLocation(false);
              }}
            >
              Limpar Filtros
            </Button>
            <Button onClick={handleSearch}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Uso do Componente

```typescript
// Em qualquer página admin
'use client';

import { useState } from 'react';
import { AdvancedSearch } from '@/components/admin/AdvancedSearch';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);

    const response = await fetch('/api/admin/professionals/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const result = await response.json();
    setProfessionals(result.data.professionals);
    setLoading(false);
  };

  return (
    <div>
      <AdvancedSearch
        onSearch={handleSearch}
        categories={['Motorista', 'Segurança', 'Garçom', 'Barman']}
        showLocationSearch={true}
      />

      {/* Resultados */}
      <div className="mt-4">
        {loading ? (
          <p>Carregando...</p>
        ) : (
          professionals.map(prof => (
            <div key={prof.id}>
              {prof.full_name}
              {prof.distance && ` - ${prof.distance}km de distância`}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Busca Textual (2 dias)
- [ ] Criar API `/api/admin/professionals/search`
- [ ] Implementar busca textual em múltiplos campos
- [ ] Adicionar filtros básicos (status, cidade, categoria)
- [ ] Criar componente `AdvancedSearch`

### Fase 2: Geolocalização (3 dias)
- [ ] Adicionar campos `latitude` e `longitude` no banco
- [ ] Implementar geocoding automático ao salvar endereço
- [ ] Criar função de cálculo de distância
- [ ] Integrar busca por proximidade na API

### Fase 3: Reutilização (1 dia)
- [ ] Adaptar para Fornecedores
- [ ] Adaptar para Contratantes
- [ ] Criar hook `useAdvancedSearch` genérico

---

## 💡 Melhorias Futuras

1. **Cache de Coordenadas**
   - Cachear resultados de geocoding
   - Reduzir chamadas à API externa

2. **Mapa Interativo**
   - Mostrar profissionais em um mapa
   - Permitir seleção visual de área

3. **Filtros Salvos**
   - Salvar buscas frequentes
   - Criar "buscas favoritas"

4. **Export de Resultados**
   - Exportar CSV/Excel
   - Relatórios de busca

---

**Próximos Passos:** Implementar Fase 1 primeiro, depois expandir para geolocalização.
