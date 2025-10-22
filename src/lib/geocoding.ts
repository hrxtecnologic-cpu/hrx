/**
 * Geocoding Service
 *
 * Converte endereços em coordenadas geográficas (latitude/longitude)
 *
 * Provedores suportados:
 * - OpenStreetMap Nominatim (gratuito, sem API key)
 * - Google Maps Geocoding API (opcional, requer API key)
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
  provider: 'nominatim' | 'google';
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

// =====================================================
// Configuration
// =====================================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GOOGLE_GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// User agent for Nominatim (required by OSM usage policy)
const USER_AGENT = 'HRX-Platform/1.0';

// Rate limiting (Nominatim: max 1 request per second)
let lastNominatimRequest = 0;
const NOMINATIM_MIN_DELAY = 1000; // 1 second

// =====================================================
// OpenStreetMap Nominatim Geocoding
// =====================================================

/**
 * Geocodifica endereço usando OpenStreetMap Nominatim (gratuito)
 *
 * @param address - Objeto com dados do endereço
 * @returns Coordenadas geográficas ou null se não encontrado
 */
export async function geocodeWithNominatim(address: Address): Promise<GeocodingResult | null> {
  try {
    // Rate limiting (respeitar política de uso do OSM)
    const now = Date.now();
    const timeSinceLastRequest = now - lastNominatimRequest;
    if (timeSinceLastRequest < NOMINATIM_MIN_DELAY) {
      await new Promise(resolve => setTimeout(resolve, NOMINATIM_MIN_DELAY - timeSinceLastRequest));
    }
    lastNominatimRequest = Date.now();

    // Construir query string
    const query = buildAddressString(address);

    // Fazer request para Nominatim
    const url = new URL('/search', NOMINATIM_BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', address.country || 'br');

    logger.debug('Geocoding com Nominatim', { query, url: url.toString() });

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Erro na resposta do Nominatim', { status: response.status });
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      logger.warn('Endereço não encontrado pelo Nominatim', { query });
      return null;
    }

    const result = data[0];

    logger.info('Geocoding bem-sucedido (Nominatim)', {
      query,
      latitude: result.lat,
      longitude: result.lon,
    });

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      provider: 'nominatim',
    };
  } catch (error) {
    logger.error('Erro ao geocodificar com Nominatim', error);
    return null;
  }
}

// =====================================================
// Google Maps Geocoding (Opcional)
// =====================================================

/**
 * Geocodifica endereço usando Google Maps Geocoding API
 *
 * Requer: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no .env
 *
 * @param address - Objeto com dados do endereço
 * @returns Coordenadas geográficas ou null se não encontrado
 */
export async function geocodeWithGoogle(address: Address): Promise<GeocodingResult | null> {
  if (!GOOGLE_GEOCODING_API_KEY) {
    logger.warn('Google Maps API key não configurada');
    return null;
  }

  try {
    const query = buildAddressString(address);

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', query);
    url.searchParams.set('key', GOOGLE_GEOCODING_API_KEY);
    url.searchParams.set('region', 'br'); // Priorizar resultados do Brasil

    logger.debug('Geocoding com Google Maps', { query });

    const response = await fetch(url.toString());

    if (!response.ok) {
      logger.error('Erro na resposta do Google Maps', { status: response.status });
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      logger.warn('Endereço não encontrado pelo Google Maps', { query, status: data.status });
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    logger.info('Geocoding bem-sucedido (Google Maps)', {
      query,
      latitude: location.lat,
      longitude: location.lng,
    });

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      provider: 'google',
    };
  } catch (error) {
    logger.error('Erro ao geocodificar com Google Maps', error);
    return null;
  }
}

// =====================================================
// Main Geocoding Function
// =====================================================

/**
 * Geocodifica endereço usando o melhor provedor disponível
 *
 * Estratégia:
 * 1. Busca no cache (30 dias de TTL)
 * 2. Se não encontrado, tenta OpenStreetMap Nominatim (gratuito)
 * 3. Se falhar e Google API key estiver disponível, tenta Google Maps
 * 4. Armazena resultado no cache
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
      logger.info('Geocoding cache miss, consultando API', { address });

      // Tentar com Nominatim primeiro (gratuito)
      let result = await geocodeWithNominatim(address);

      // Se falhou e Google está configurado, tentar com Google
      if (!result && GOOGLE_GEOCODING_API_KEY) {
        logger.info('Nominatim falhou, tentando Google Maps');
        result = await geocodeWithGoogle(address);
      }

      if (!result) {
        logger.error('Geocoding falhou com todos os provedores', { address });
        return null;
      }

      logger.info('Geocoding bem-sucedido, salvando no cache', { address, provider: result.provider });
      return result;
    }
  );
}

// =====================================================
// Reverse Geocoding (Coordenadas → Endereço)
// =====================================================

/**
 * Reverse geocoding: converte coordenadas em endereço
 *
 * Usa cache de 30 dias para evitar chamadas repetidas
 *
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Endereço formatado ou null se não encontrado
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  // Usar cache para reverse geocoding
  const cacheKey = { latitude, longitude };

  return withCache(
    { prefix: 'reverse-geocoding', ttl: CachePresets.GEOCODING.ttl },
    cacheKey,
    async () => {
      try {
        logger.info('Reverse geocoding cache miss, consultando API', { latitude, longitude });

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - lastNominatimRequest;
        if (timeSinceLastRequest < NOMINATIM_MIN_DELAY) {
          await new Promise(resolve => setTimeout(resolve, NOMINATIM_MIN_DELAY - timeSinceLastRequest));
        }
        lastNominatimRequest = Date.now();

        const url = new URL('/reverse', NOMINATIM_BASE_URL);
        url.searchParams.set('lat', latitude.toString());
        url.searchParams.set('lon', longitude.toString());
        url.searchParams.set('format', 'json');

        logger.debug('Reverse geocoding com Nominatim', { latitude, longitude });

        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          logger.error('Erro no reverse geocoding', { status: response.status });
          return null;
        }

        const data = await response.json();

        if (!data || !data.display_name) {
          logger.warn('Endereço não encontrado', { latitude, longitude });
          return null;
        }

        logger.info('Reverse geocoding bem-sucedido, salvando no cache', {
          latitude,
          longitude,
          address: data.display_name,
        });

        return data.display_name;
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

  if (address.country) {
    parts.push(address.country);
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
