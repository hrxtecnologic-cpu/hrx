/**
 * Mapbox Isochrone API
 *
 * Calcula área alcançável em determinado tempo de viagem
 * Útil para filtrar profissionais/fornecedores por tempo de deslocamento
 */

import { logger } from './logger';

// =====================================================
// Types
// =====================================================

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface IsochroneOptions {
  /** Tempo em minutos (5, 10, 15, 30, 45, 60) */
  minutes: number;
  /** Perfil de roteamento */
  profile?: 'driving' | 'walking' | 'cycling';
  /** Cores do polígono */
  colors?: string[];
}

export interface IsochroneResult {
  /** GeoJSON do polígono */
  polygon: any;
  /** Tempo em minutos */
  minutes: number;
  /** Centro do isochrone */
  center: Coordinate;
}

// =====================================================
// Configuration
// =====================================================

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_ISOCHRONE_URL = 'https://api.mapbox.com/isochrone/v1/mapbox';

// =====================================================
// Isochrone API
// =====================================================

/**
 * Calcula isochrone (área alcançável em X minutos)
 *
 * Retorna um polígono GeoJSON que pode ser desenhado no mapa
 *
 * @param center - Ponto central
 * @param options - Opções de isochrone
 * @returns Polígono GeoJSON
 */
export async function getIsochrone(
  center: Coordinate,
  options: IsochroneOptions
): Promise<IsochroneResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.error('NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
    return null;
  }

  try {
    const { minutes, profile = 'driving' } = options;

    // Validar tempo (Mapbox aceita: 5, 10, 15, 30, 45, 60)
    const validMinutes = [5, 10, 15, 30, 45, 60];
    if (!validMinutes.includes(minutes)) {
      logger.error('Tempo inválido para isochrone', {
        minutes,
        valid: validMinutes,
      });
      return null;
    }

    // Construir URL
    const coords = `${center.longitude},${center.latitude}`;
    const url = `${MAPBOX_ISOCHRONE_URL}/${profile}/${coords}`;

    const params = new URLSearchParams({
      access_token: MAPBOX_ACCESS_TOKEN,
      contours_minutes: minutes.toString(),
      polygons: 'true', // Retornar polígonos (não linhas)
      denoise: '1', // Suavizar bordas
    });

    const fullUrl = `${url}?${params.toString()}`;

    logger.debug('Calculando isochrone', {
      center,
      minutes,
      profile,
    });

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Erro na Isochrone API', {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      logger.error('Isochrone API não retornou features');
      return null;
    }

    logger.info('Isochrone calculado com sucesso', {
      minutes,
      profile,
    });

    return {
      polygon: data,
      minutes,
      center,
    };
  } catch (error) {
    logger.error('Erro ao calcular isochrone', error);
    return null;
  }
}

/**
 * Calcula múltiplos isochrones (por exemplo: 15min, 30min, 45min)
 *
 * @param center - Ponto central
 * @param minutesArray - Array de tempos em minutos
 * @param profile - Perfil de roteamento
 * @returns Array de isochrones
 */
export async function getMultipleIsochrones(
  center: Coordinate,
  minutesArray: number[],
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<IsochroneResult[]> {
  const results: IsochroneResult[] = [];

  for (const minutes of minutesArray) {
    const isochrone = await getIsochrone(center, { minutes, profile });

    if (isochrone) {
      results.push(isochrone);
    }
  }

  return results;
}

/**
 * Verifica se um ponto está dentro de um isochrone
 *
 * @param point - Ponto a verificar
 * @param isochrone - Resultado do isochrone
 * @returns true se o ponto está dentro da área
 */
export function isPointInsideIsochrone(
  point: Coordinate,
  isochrone: IsochroneResult
): boolean {
  try {
    const polygon = isochrone.polygon.features[0].geometry;

    if (polygon.type !== 'Polygon') {
      return false;
    }

    // Ray casting algorithm para verificar se ponto está dentro do polígono
    const coords = polygon.coordinates[0]; // Primeiro anel
    let inside = false;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i][0];
      const yi = coords[i][1];
      const xj = coords[j][0];
      const yj = coords[j][1];

      const intersect =
        yi > point.latitude !== yj > point.latitude &&
        point.longitude <
          ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  } catch (error) {
    logger.error('Erro ao verificar ponto no isochrone', error);
    return false;
  }
}
