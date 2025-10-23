/**
 * Mapbox Geocoding Service
 *
 * Substitui Nominatim/Google Maps por Mapbox para geocoding profissional
 * - Geocoding API: endereço → coordenadas
 * - Reverse Geocoding: coordenadas → endereço
 * - 100k requests/mês GRÁTIS
 */

import { logger } from './logger';
import { withCache, CachePresets } from './cache';

// =====================================================
// Types
// =====================================================

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  provider: 'mapbox';
  accuracy?: string; // 'rooftop', 'street', 'place', etc
  bbox?: [number, number, number, number]; // bounding box
}

export interface Address {
  street?: string;
  number?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
}

interface MapboxFeature {
  center: [number, number]; // [longitude, latitude]
  place_name: string;
  relevance: number;
  bbox?: [number, number, number, number];
  place_type: string[];
}

// =====================================================
// Configuration
// =====================================================

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// =====================================================
// Mapbox Geocoding
// =====================================================

/**
 * Geocodifica endereço usando Mapbox
 *
 * @param address - Objeto com dados do endereço
 * @returns Coordenadas geográficas ou null se não encontrado
 */
export async function geocodeWithMapbox(address: Address): Promise<GeocodingResult | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.error('NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
    return null;
  }

  try {
    // Construir query string
    const query = buildAddressString(address);

    // Mapbox requer query encodada na URL
    const encodedQuery = encodeURIComponent(query);
    const url = `${MAPBOX_GEOCODING_URL}/${encodedQuery}.json`;

    // Parâmetros da API
    const params = new URLSearchParams({
      access_token: MAPBOX_ACCESS_TOKEN,
      country: address.country || 'br', // Limitar ao Brasil
      language: 'pt', // Respostas em português
      limit: '1', // Apenas melhor resultado
      types: 'address,place,postcode', // Tipos de resultados
    });

    const fullUrl = `${url}?${params.toString()}`;

    logger.debug('Geocoding com Mapbox', { query, url: fullUrl });

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Erro na resposta do Mapbox', {
        status: response.status,
        statusText: response.statusText
      });
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      logger.warn('Endereço não encontrado pelo Mapbox', { query });
      return null;
    }

    const feature: MapboxFeature = data.features[0];
    const [longitude, latitude] = feature.center;

    logger.info('Geocoding bem-sucedido (Mapbox)', {
      query,
      latitude,
      longitude,
      relevance: feature.relevance,
    });

    return {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      provider: 'mapbox',
      accuracy: feature.place_type[0],
      bbox: feature.bbox,
    };
  } catch (error) {
    logger.error('Erro ao geocodificar com Mapbox', error);
    return null;
  }
}

// =====================================================
// Main Geocoding Function
// =====================================================

/**
 * Geocodifica endereço usando Mapbox com cache
 *
 * @param address - Objeto com dados do endereço
 * @returns Coordenadas geográficas ou null se não encontrado
 */
export async function geocodeAddress(address: Address): Promise<GeocodingResult | null> {
  // Validar endereço mínimo
  if (!address.city || !address.state) {
    logger.error('Endereço inválido: cidade e estado são obrigatórios', { address });
    return null;
  }

  // Usar cache para evitar chamadas repetidas à API
  return withCache(
    CachePresets.GEOCODING,
    address,
    async () => {
      logger.info('Geocoding cache miss, consultando Mapbox', { address });

      const result = await geocodeWithMapbox(address);

      if (!result) {
        logger.error('Geocoding falhou', { address });
        return null;
      }

      logger.info('Geocoding bem-sucedido, salvando no cache', {
        address,
        provider: result.provider
      });

      return result;
    }
  );
}

// =====================================================
// Reverse Geocoding (Coordenadas → Endereço)
// =====================================================

/**
 * Reverse geocoding: converte coordenadas em endereço usando Mapbox
 *
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Endereço formatado ou null se não encontrado
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    logger.error('NEXT_PUBLIC_MAPBOX_TOKEN não configurado');
    return null;
  }

  const cacheKey = { latitude, longitude };

  return withCache(
    { prefix: 'reverse-geocoding', ttl: CachePresets.GEOCODING.ttl },
    cacheKey,
    async () => {
      try {
        logger.info('Reverse geocoding cache miss, consultando Mapbox', {
          latitude,
          longitude
        });

        // Mapbox reverse geocoding: {longitude},{latitude}
        const url = `${MAPBOX_GEOCODING_URL}/${longitude},${latitude}.json`;

        const params = new URLSearchParams({
          access_token: MAPBOX_ACCESS_TOKEN,
          language: 'pt',
          types: 'address,place,postcode',
        });

        const fullUrl = `${url}?${params.toString()}`;

        logger.debug('Reverse geocoding com Mapbox', { latitude, longitude });

        const response = await fetch(fullUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          logger.error('Erro no reverse geocoding', { status: response.status });
          return null;
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          logger.warn('Endereço não encontrado', { latitude, longitude });
          return null;
        }

        const feature: MapboxFeature = data.features[0];

        logger.info('Reverse geocoding bem-sucedido', {
          latitude,
          longitude,
          address: feature.place_name,
        });

        return feature.place_name;
      } catch (error) {
        logger.error('Erro no reverse geocoding', error);
        return null;
      }
    }
  );
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Constrói string de endereço para geocoding
 */
function buildAddressString(address: Address): string {
  const parts: string[] = [];

  if (address.street) {
    if (address.number) {
      parts.push(`${address.street}, ${address.number}`);
    } else {
      parts.push(address.street);
    }
  }

  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state) {
    parts.push(address.state);
  }

  if (address.zipCode) {
    parts.push(address.zipCode);
  }

  return parts.join(', ');
}

/**
 * Valida se coordenadas estão dentro de limites válidos
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Formata coordenadas para exibição
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Calcula bounding box de um raio ao redor de um ponto
 * Útil para filtrar resultados em área específica
 *
 * @param latitude - Latitude central
 * @param longitude - Longitude central
 * @param radiusKm - Raio em quilômetros
 * @returns Bounding box [minLon, minLat, maxLon, maxLat]
 */
export function getBoundingBox(
  latitude: number,
  longitude: number,
  radiusKm: number
): [number, number, number, number] {
  // Aproximação: 1 grau ≈ 111km
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

  return [
    longitude - lonDelta, // minLon
    latitude - latDelta,  // minLat
    longitude + lonDelta, // maxLon
    latitude + latDelta,  // maxLat
  ];
}
