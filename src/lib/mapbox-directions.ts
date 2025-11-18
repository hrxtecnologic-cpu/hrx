/**
 * Mapbox Directions API
 *
 * Calcula rotas detalhadas entre pontos
 * Útil para calcular custo de deslocamento e mostrar rotas visuais
 */

import { logger } from './logger';

// =====================================================
// Types
// =====================================================

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DirectionsOptions {
  /** Perfil de roteamento */
  profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
  /** Incluir geometria da rota */
  geometry?: boolean;
  /** Incluir instruções turn-by-turn */
  steps?: boolean;
}

export interface RouteStep {
  distance: number; // metros
  duration: number; // segundos
  instruction: string;
  name: string;
}

export interface DirectionsResult {
  /** Distância total em metros */
  distance: number;
  /** Duração total em segundos */
  duration: number;
  /** Distância em km (conveniência) */
  distanceKm: number;
  /** Duração em minutos (conveniência) */
  durationMinutes: number;
  /** Duração em horas (conveniência) */
  durationHours: number;
  /** Geometria da rota (GeoJSON) */
  geometry?: GeoJSON.Geometry;
  /** Passos da rota (turn-by-turn) */
  steps?: RouteStep[];
  /** Coordenadas de origem e destino */
  origin: Coordinate;
  destination: Coordinate;
}

// =====================================================
// Configuration
// =====================================================

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox';

// =====================================================
// Directions API
// =====================================================

/**
 * Calcula rota entre dois pontos
 *
 * @param origin - Ponto de origem
 * @param destination - Ponto de destino
 * @param options - Opções de roteamento
 * @returns Informações da rota
 */
export async function getRoute(
  origin: Coordinate,
  destination: Coordinate,
  options: DirectionsOptions = {}
): Promise<DirectionsResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.error('NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
    return null;
  }

  try {
    const {
      profile = 'driving',
      geometry = true,
      steps = false,
    } = options;

    // Construir coordenadas
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `${MAPBOX_DIRECTIONS_URL}/${profile}/${coords}`;

    const params = new URLSearchParams({
      access_token: MAPBOX_ACCESS_TOKEN,
      geometries: 'geojson', // Formato GeoJSON
      overview: 'full', // Geometria completa
      steps: steps.toString(),
    });

    const fullUrl = `${url}?${params.toString()}`;

    logger.debug('Calculando rota', {
      origin,
      destination,
      profile,
    });

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Erro na Directions API', {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      logger.error('Directions API não retornou rotas', { code: data.code });
      return null;
    }

    const route = data.routes[0]; // Melhor rota

    logger.info('Rota calculada com sucesso', {
      distance: route.distance,
      duration: route.duration,
      profile,
    });

    const result: DirectionsResult = {
      distance: route.distance, // metros
      duration: route.duration, // segundos
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      durationHours: route.duration / 3600,
      origin,
      destination,
    };

    // Adicionar geometria se solicitado
    if (geometry && route.geometry) {
      result.geometry = {
        type: 'Feature',
        geometry: route.geometry,
        properties: {
          distance: route.distance,
          duration: route.duration,
        },
      };
    }

    // Adicionar steps se solicitado
    if (steps && route.legs && route.legs[0].steps) {
      result.steps = route.legs[0].steps.map((step: { distance: number; duration: number; instruction: string }) => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver?.instruction || '',
        name: step.name || '',
      }));
    }

    return result;
  } catch (error) {
    logger.error('Erro ao calcular rota', error);
    return null;
  }
}

/**
 * Calcula custo de deslocamento baseado na distância
 *
 * @param route - Resultado da rota
 * @param costPerKm - Custo por quilômetro (padrão: R$ 2.50)
 * @returns Custo total do deslocamento
 */
export function calculateTravelCost(
  route: DirectionsResult,
  costPerKm: number = 2.5
): number {
  return route.distanceKm * costPerKm;
}

/**
 * Calcula múltiplas rotas (otimização de entregas)
 *
 * @param waypoints - Array de pontos (origem, destinos..., retorno)
 * @param profile - Perfil de roteamento
 * @returns Rota otimizada passando por todos os pontos
 */
export async function getOptimizedRoute(
  waypoints: Coordinate[],
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving'
): Promise<DirectionsResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.error('NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
    return null;
  }

  if (waypoints.length < 2) {
    logger.error('Rota otimizada precisa de pelo menos 2 pontos');
    return null;
  }

  if (waypoints.length > 25) {
    logger.error('Máximo 25 waypoints permitidos');
    return null;
  }

  try {
    // Construir coordenadas
    const coords = waypoints
      .map(w => `${w.longitude},${w.latitude}`)
      .join(';');

    const url = `${MAPBOX_DIRECTIONS_URL}/${profile}/${coords}`;

    const params = new URLSearchParams({
      access_token: MAPBOX_ACCESS_TOKEN,
      geometries: 'geojson',
      overview: 'full',
    });

    const fullUrl = `${url}?${params.toString()}`;

    logger.debug('Calculando rota otimizada', {
      waypoints: waypoints.length,
      profile,
    });

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Erro na Directions API (otimizada)', {
        status: response.status,
      });
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      logger.error('Directions API não retornou rotas otimizadas');
      return null;
    }

    const route = data.routes[0];

    logger.info('Rota otimizada calculada', {
      distance: route.distance,
      duration: route.duration,
      waypoints: waypoints.length,
    });

    return {
      distance: route.distance,
      duration: route.duration,
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      durationHours: route.duration / 3600,
      geometry: {
        type: 'Feature',
        geometry: route.geometry,
        properties: {
          distance: route.distance,
          duration: route.duration,
        },
      },
      origin: waypoints[0],
      destination: waypoints[waypoints.length - 1],
    };
  } catch (error) {
    logger.error('Erro ao calcular rota otimizada', error);
    return null;
  }
}
