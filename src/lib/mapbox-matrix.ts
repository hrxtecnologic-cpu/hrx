/**
 * Mapbox Matrix API
 *
 * Calcula distâncias e tempos de viagem entre múltiplos pontos
 * Substitui cálculo Haversine amador por dados reais de rota
 */

import { logger } from './logger';

// =====================================================
// Types
// =====================================================

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MatrixResult {
  distances: number[][]; // em metros
  durations: number[][]; // em segundos
  sources: Coordinate[];
  destinations: Coordinate[];
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  durationHours: number;
}

// =====================================================
// Configuration
// =====================================================

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_MATRIX_URL = 'https://api.mapbox.com/directions-matrix/v1/mapbox';

// Perfis de roteamento
type RoutingProfile = 'driving' | 'driving-traffic' | 'walking' | 'cycling';

// =====================================================
// Matrix API
// =====================================================

/**
 * Calcula matriz de distâncias entre pontos usando Mapbox
 *
 * Limites da API:
 * - Máximo 25 coordenadas (sources + destinations)
 * - Para driving: max 25x25
 * - Para walking/cycling: max 25x25
 *
 * @param sources - Pontos de origem
 * @param destinations - Pontos de destino (se null, usa sources)
 * @param profile - Perfil de roteamento (padrão: driving)
 * @returns Matriz de distâncias e durações
 */
export async function getMatrix(
  sources: Coordinate[],
  destinations?: Coordinate[],
  profile: RoutingProfile = 'driving'
): Promise<MatrixResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.error('NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
    return null;
  }

  try {
    // Se destinations não fornecido, usar sources
    const dests = destinations || sources;

    // Validar limites
    if (sources.length + dests.length > 25) {
      logger.error('Matrix API: máximo 25 coordenadas no total', {
        sources: sources.length,
        destinations: dests.length,
      });
      return null;
    }

    // Formatar coordenadas: longitude,latitude
    const coordinates = [...sources, ...dests]
      .map(c => `${c.longitude},${c.latitude}`)
      .join(';');

    // Índices de sources e destinations
    const sourceIndices = Array.from({ length: sources.length }, (_, i) => i).join(';');
    const destIndices = Array.from(
      { length: dests.length },
      (_, i) => i + sources.length
    ).join(';');

    // Construir URL
    const url = `${MAPBOX_MATRIX_URL}/${profile}/${coordinates}`;

    const params = new URLSearchParams({
      access_token: MAPBOX_ACCESS_TOKEN,
      sources: sourceIndices,
      destinations: destIndices,
      annotations: 'distance,duration', // Retornar ambos
    });

    const fullUrl = `${url}?${params.toString()}`;

    logger.debug('Calculando matriz de distâncias', {
      profile,
      sources: sources.length,
      destinations: dests.length,
    });

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Erro na Matrix API', {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok') {
      logger.error('Matrix API retornou erro', { code: data.code });
      return null;
    }

    logger.info('Matriz calculada com sucesso', {
      profile,
      sources: sources.length,
      destinations: dests.length,
    });

    return {
      distances: data.distances, // metros
      durations: data.durations, // segundos
      sources,
      destinations: dests,
    };
  } catch (error) {
    logger.error('Erro ao calcular matriz', error);
    return null;
  }
}

// =====================================================
// Simplified Distance Calculation
// =====================================================

/**
 * Calcula distância e tempo entre dois pontos
 *
 * @param from - Ponto de origem
 * @param to - Ponto de destino
 * @param profile - Perfil de roteamento
 * @returns Distância e duração
 */
export async function getDistance(
  from: Coordinate,
  to: Coordinate,
  profile: RoutingProfile = 'driving'
): Promise<DistanceResult | null> {
  const matrix = await getMatrix([from], [to], profile);

  if (!matrix || !matrix.distances[0] || !matrix.durations[0]) {
    logger.error('Falha ao calcular distância');
    return null;
  }

  const distanceMeters = matrix.distances[0][0];
  const durationSeconds = matrix.durations[0][0];

  return {
    distanceKm: distanceMeters / 1000,
    durationMinutes: durationSeconds / 60,
    durationHours: durationSeconds / 3600,
  };
}

/**
 * Calcula distâncias de um ponto para múltiplos destinos
 *
 * Útil para:
 * - Encontrar profissionais próximos de um evento
 * - Ordenar por distância real (não linha reta)
 * - Considerar tempo de viagem
 *
 * @param origin - Ponto de origem
 * @param destinations - Lista de destinos
 * @param profile - Perfil de roteamento
 * @returns Array de distâncias indexadas pelos destinos
 */
export async function getDistancesToMany(
  origin: Coordinate,
  destinations: Coordinate[],
  profile: RoutingProfile = 'driving'
): Promise<DistanceResult[] | null> {
  if (destinations.length === 0) {
    return [];
  }

  // Mapbox Matrix API limita 25 pontos
  if (destinations.length > 24) {
    logger.warn('Matrix API limitada a 24 destinos, usando batch');
    // Dividir em batches de 24
    const results: DistanceResult[] = [];

    for (let i = 0; i < destinations.length; i += 24) {
      const batch = destinations.slice(i, i + 24);
      const batchResults = await getDistancesToMany(origin, batch, profile);

      if (!batchResults) {
        logger.error('Falha em batch', { batch: i / 24 });
        return null;
      }

      results.push(...batchResults);
    }

    return results;
  }

  const matrix = await getMatrix([origin], destinations, profile);

  if (!matrix || !matrix.distances[0] || !matrix.durations[0]) {
    logger.error('Falha ao calcular distâncias');
    return null;
  }

  return destinations.map((_, index) => {
    const distanceMeters = matrix.distances[0][index];
    const durationSeconds = matrix.durations[0][index];

    return {
      distanceKm: distanceMeters / 1000,
      durationMinutes: durationSeconds / 60,
      durationHours: durationSeconds / 3600,
    };
  });
}

// =====================================================
// Haversine Fallback (estimativa rápida)
// =====================================================

/**
 * Calcula distância em linha reta (Haversine)
 * Útil como fallback se Matrix API não estiver disponível
 *
 * @param from - Ponto de origem
 * @param to - Ponto de destino
 * @returns Distância em quilômetros
 */
export function calculateHaversineDistance(
  from: Coordinate,
  to: Coordinate
): number {
  const R = 6371; // Raio da Terra em km

  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula distância com fallback automático
 *
 * Tenta Matrix API primeiro, se falhar usa Haversine
 *
 * @param from - Ponto de origem
 * @param to - Ponto de destino
 * @param profile - Perfil de roteamento
 * @returns Distância e duração (ou estimativa)
 */
export async function getDistanceWithFallback(
  from: Coordinate,
  to: Coordinate,
  profile: RoutingProfile = 'driving'
): Promise<DistanceResult> {
  if (MAPBOX_ACCESS_TOKEN) {
    const result = await getDistance(from, to, profile);

    if (result) {
      return result;
    }

    logger.warn('Matrix API falhou, usando Haversine como fallback');
  }

  // Fallback: Haversine + estimativa de tempo
  const distanceKm = calculateHaversineDistance(from, to);

  // Estimativa de tempo assumindo velocidade média
  const avgSpeedKmh = profile === 'driving' ? 50 : profile === 'cycling' ? 15 : 5;
  const durationHours = distanceKm / avgSpeedKmh;

  return {
    distanceKm,
    durationMinutes: durationHours * 60,
    durationHours,
  };
}
