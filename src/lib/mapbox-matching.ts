/**
 * Mapbox Proximity Matching
 *
 * Match automático de profissionais/fornecedores próximos a eventos
 * Usa Matrix API para calcular distâncias reais (não linha reta)
 */

import { getDistancesToMany, type Coordinate, type DistanceResult } from './mapbox-matrix';
import { logger } from './logger';

// =====================================================
// Types
// =====================================================

export interface ProfessionalMatch {
  id: string;
  name: string;
  type: 'professional' | 'supplier';
  coordinates: Coordinate;
  distance: DistanceResult;
  categories?: string[];
  status?: string;
  phone?: string;
  email?: string;
  isAvailable?: boolean;
  serviceRadiusKm?: number;
}

export interface MatchingOptions {
  /**
   * Raio máximo em quilômetros
   * @default 50
   */
  maxDistanceKm?: number;

  /**
   * Tempo máximo em minutos
   * @default 60
   */
  maxDurationMinutes?: number;

  /**
   * Limitar número de resultados
   * @default 20
   */
  limit?: number;

  /**
   * Ordenar por
   * @default 'distance'
   */
  sortBy?: 'distance' | 'duration';

  /**
   * Filtrar por categorias
   */
  categories?: string[];

  /**
   * Filtrar por status
   */
  status?: string[];

  /**
   * Incluir apenas disponíveis
   * @default true
   */
  onlyAvailable?: boolean;
}

export interface MatchingResult {
  event: {
    id: string;
    name: string;
    coordinates: Coordinate;
  };
  matches: ProfessionalMatch[];
  totalFound: number;
  searchRadius: number;
  executionTime: number;
}

// =====================================================
// Main Matching Function
// =====================================================

/**
 * Encontra profissionais/fornecedores próximos a um evento
 *
 * @param eventLocation - Coordenadas do evento
 * @param candidates - Lista de profissionais/fornecedores candidatos
 * @param options - Opções de filtro e ordenação
 * @returns Matches ordenados por proximidade
 */
export async function findNearbyProfessionals(
  eventLocation: Coordinate,
  candidates: Array<{
    id: string;
    name: string;
    type: 'professional' | 'supplier';
    latitude: number;
    longitude: number;
    categories?: string[];
    status?: string;
    phone?: string;
    email?: string;
    isAvailable?: boolean;
    serviceRadiusKm?: number;
  }>,
  options: MatchingOptions = {}
): Promise<MatchingResult> {
  const startTime = Date.now();

  const {
    maxDistanceKm = 50,
    maxDurationMinutes = 60,
    limit = 20,
    sortBy = 'distance',
    categories,
    status,
    onlyAvailable = true,
  } = options;

  try {
    logger.info('Iniciando matching por proximidade', {
      eventLocation,
      totalCandidates: candidates.length,
      options,
    });

    // Filtrar candidatos por status
    let filteredCandidates = candidates;

    if (onlyAvailable) {
      filteredCandidates = filteredCandidates.filter(
        c => c.isAvailable !== false && c.status !== 'inactive'
      );
    }

    if (status && status.length > 0) {
      filteredCandidates = filteredCandidates.filter(
        c => c.status && status.includes(c.status)
      );
    }

    if (categories && categories.length > 0) {
      filteredCandidates = filteredCandidates.filter(c => {
        if (!c.categories) return false;
        return categories.some(cat => c.categories!.includes(cat));
      });
    }

    logger.info('Candidatos após filtros', {
      afterFilters: filteredCandidates.length,
    });

    if (filteredCandidates.length === 0) {
      return {
        event: {
          id: '',
          name: '',
          coordinates: eventLocation,
        },
        matches: [],
        totalFound: 0,
        searchRadius: maxDistanceKm,
        executionTime: Date.now() - startTime,
      };
    }

    // Converter para coordenadas
    const candidateCoordinates: Coordinate[] = filteredCandidates.map(c => ({
      latitude: c.latitude,
      longitude: c.longitude,
    }));

    // Calcular distâncias reais usando Mapbox Matrix API
    logger.info('Calculando distâncias com Mapbox Matrix API');
    const distances = await getDistancesToMany(
      eventLocation,
      candidateCoordinates,
      'driving'
    );

    if (!distances) {
      logger.error('Falha ao calcular distâncias');
      return {
        event: {
          id: '',
          name: '',
          coordinates: eventLocation,
        },
        matches: [],
        totalFound: 0,
        searchRadius: maxDistanceKm,
        executionTime: Date.now() - startTime,
      };
    }

    // Criar matches com distâncias
    const matches: ProfessionalMatch[] = filteredCandidates
      .map((candidate, index) => ({
        id: candidate.id,
        name: candidate.name,
        type: candidate.type,
        coordinates: {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        },
        distance: distances[index],
        categories: candidate.categories,
        status: candidate.status,
        phone: candidate.phone,
        email: candidate.email,
        isAvailable: candidate.isAvailable,
        serviceRadiusKm: candidate.serviceRadiusKm,
      }))
      // Filtrar por distância e tempo
      .filter((match, index) => {
        const candidate = filteredCandidates[index];
        const withinDistance = match.distance.distanceKm <= maxDistanceKm;
        const withinTime = match.distance.durationMinutes <= maxDurationMinutes;

        // Respeitar o raio de atuação individual do profissional
        const withinServiceRadius = candidate.serviceRadiusKm
          ? match.distance.distanceKm <= candidate.serviceRadiusKm
          : true;

        return withinDistance && withinTime && withinServiceRadius;
      })
      // Ordenar
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return a.distance.distanceKm - b.distance.distanceKm;
        } else {
          return a.distance.durationMinutes - b.distance.durationMinutes;
        }
      })
      // Limitar resultados
      .slice(0, limit);

    const executionTime = Date.now() - startTime;

    logger.info('Matching concluído', {
      matchesFound: matches.length,
      executionTime: `${executionTime}ms`,
    });

    return {
      event: {
        id: '',
        name: '',
        coordinates: eventLocation,
      },
      matches,
      totalFound: matches.length,
      searchRadius: maxDistanceKm,
      executionTime,
    };
  } catch (error) {
    logger.error('Erro no matching', error);
    throw error;
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Calcula custo de deslocamento para cada match
 *
 * @param matches - Resultados do matching
 * @param costPerKm - Custo por quilômetro (padrão: R$ 2.50)
 * @returns Matches com custo calculado
 */
export function calculateTravelCosts(
  matches: ProfessionalMatch[],
  costPerKm: number = 2.5
): Array<ProfessionalMatch & { travelCost: number }> {
  return matches.map(match => ({
    ...match,
    travelCost: match.distance.distanceKm * costPerKm,
  }));
}

/**
 * Agrupa matches por categoria
 *
 * @param matches - Resultados do matching
 * @returns Objeto com matches agrupados por categoria
 */
export function groupByCategory(
  matches: ProfessionalMatch[]
): Record<string, ProfessionalMatch[]> {
  const grouped: Record<string, ProfessionalMatch[]> = {};

  matches.forEach(match => {
    if (!match.categories || match.categories.length === 0) {
      if (!grouped['Outros']) grouped['Outros'] = [];
      grouped['Outros'].push(match);
    } else {
      match.categories.forEach(category => {
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(match);
      });
    }
  });

  return grouped;
}

/**
 * Encontra o melhor match por categoria
 *
 * @param matches - Resultados do matching
 * @param category - Categoria desejada
 * @returns Melhor match da categoria (mais próximo)
 */
export function findBestByCategory(
  matches: ProfessionalMatch[],
  category: string
): ProfessionalMatch | null {
  const filtered = matches.filter(
    match => match.categories && match.categories.includes(category)
  );

  if (filtered.length === 0) return null;

  // Retornar o mais próximo
  return filtered.reduce((best, current) =>
    current.distance.distanceKm < best.distance.distanceKm ? current : best
  );
}

/**
 * Estatísticas do matching
 *
 * @param matches - Resultados do matching
 * @returns Estatísticas úteis
 */
export function getMatchingStats(matches: ProfessionalMatch[]) {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      averageDistance: 0,
      averageDuration: 0,
      closestDistance: 0,
      farthestDistance: 0,
      totalTravelCost: 0,
    };
  }

  const distances = matches.map(m => m.distance.distanceKm);
  const durations = matches.map(m => m.distance.durationMinutes);

  return {
    totalMatches: matches.length,
    averageDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
    averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    closestDistance: Math.min(...distances),
    farthestDistance: Math.max(...distances),
    totalTravelCost: distances.reduce((sum, d) => sum + d * 2.5, 0),
  };
}
