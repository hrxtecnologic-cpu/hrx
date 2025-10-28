/**
 * =====================================================
 * Mapbox API Integration
 * =====================================================
 * Serviços de geocodificação e rotas usando Mapbox API
 * =====================================================
 */

import { logger } from '@/lib/logger';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_ACCESS_TOKEN) {
  logger.warn('⚠️ NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
}

interface GeocodeResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  error?: string;
}

interface DirectionsResult {
  success: boolean;
  distance_km?: number;
  duration_minutes?: number;
  route?: any;
  error?: string;
}

/**
 * Geocodificar endereço para coordenadas
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.warn('Mapbox token não configurado, retornando coordenadas padrão');
    return {
      success: false,
      error: 'Mapbox token não configurado',
    };
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=BR&limit=1`;

    logger.info('🗺️ Geocodificando endereço', { address });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return {
        success: false,
        error: 'Endereço não encontrado',
      };
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    logger.info('✅ Endereço geocodificado', {
      address,
      latitude,
      longitude,
      formatted: feature.place_name,
    });

    return {
      success: true,
      latitude,
      longitude,
      formatted_address: feature.place_name,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao geocodificar endereço', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calcular rota entre dois pontos
 */
export async function getDirections(params: {
  origin: [number, number]; // [longitude, latitude]
  destination: [number, number]; // [longitude, latitude]
}): Promise<DirectionsResult> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.warn('Mapbox token não configurado, retornando valores estimados');

    // Cálculo simples de distância euclidiana como fallback
    const lat1 = params.origin[1];
    const lon1 = params.origin[0];
    const lat2 = params.destination[1];
    const lon2 = params.destination[0];

    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimar tempo baseado em 40km/h de média
    const duration = (distance / 40) * 60;

    return {
      success: true,
      distance_km: parseFloat(distance.toFixed(2)),
      duration_minutes: Math.round(duration),
    };
  }

  try {
    const { origin, destination } = params;
    const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;

    logger.info('🗺️ Calculando rota', { origin, destination });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox Directions API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Nenhuma rota encontrada');
    }

    const route = data.routes[0];
    const distance_km = (route.distance / 1000).toFixed(2);
    const duration_minutes = Math.round(route.duration / 60);

    logger.info('✅ Rota calculada', {
      distance_km,
      duration_minutes,
    });

    return {
      success: true,
      distance_km: parseFloat(distance_km),
      duration_minutes,
      route: route.geometry,
    };
  } catch (error: any) {
    logger.error('❌ Erro ao calcular rota', error);

    // Fallback para cálculo simples
    const lat1 = params.origin[1];
    const lon1 = params.origin[0];
    const lat2 = params.destination[1];
    const lon2 = params.destination[0];

    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const duration = (distance / 40) * 60;

    return {
      success: true,
      distance_km: parseFloat(distance.toFixed(2)),
      duration_minutes: Math.round(duration),
    };
  }
}
