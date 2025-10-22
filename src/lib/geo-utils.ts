/**
 * Geographic Utilities
 *
 * Funções para cálculos geográficos e manipulação de coordenadas
 *
 * Pode ser usado tanto no frontend quanto no backend
 */

// =====================================================
// Types
// =====================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

// =====================================================
// Constants
// =====================================================

const EARTH_RADIUS_KM = 6371; // Raio da Terra em km
const EARTH_RADIUS_MILES = 3959; // Raio da Terra em milhas

// =====================================================
// Distance Calculations
// =====================================================

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 *
 * Esta é a mesma fórmula implementada no SQL (calculate_distance)
 * Útil para cálculos no frontend sem precisar chamar o banco
 *
 * @param point1 - Primeiro ponto (latitude, longitude)
 * @param point2 - Segundo ponto (latitude, longitude)
 * @param unit - Unidade de medida ('km' ou 'miles')
 * @returns Distância entre os pontos na unidade especificada
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
  unit: 'km' | 'miles' = 'km'
): number {
  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;

  // Converter graus para radianos
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const dLatRad = toRadians(point2.latitude - point1.latitude);
  const dLonRad = toRadians(point2.longitude - point1.longitude);

  // Fórmula de Haversine
  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLonRad / 2) *
      Math.sin(dLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radius * c;
}

/**
 * Calcula bounding box (retângulo) ao redor de um ponto com raio especificado
 *
 * Útil para otimizar queries no banco: primeiro filtrar por bounding box
 * (operação rápida usando índices), depois calcular distância exata
 *
 * @param center - Ponto central
 * @param radiusKm - Raio em km
 * @returns Bounding box com min/max lat/lng
 */
export function getBoundingBox(center: Coordinates, radiusKm: number): BoundingBox {
  // Aproximação: 1 grau de latitude ≈ 111 km
  // 1 grau de longitude varia com latitude (usa cosseno)

  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(center.latitude)));

  return {
    minLatitude: center.latitude - latDelta,
    maxLatitude: center.latitude + latDelta,
    minLongitude: center.longitude - lonDelta,
    maxLongitude: center.longitude + lonDelta,
  };
}

/**
 * Verifica se um ponto está dentro de um raio especificado
 *
 * @param center - Ponto central
 * @param point - Ponto a verificar
 * @param radiusKm - Raio em km
 * @returns true se o ponto está dentro do raio
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point, 'km');
  return distance <= radiusKm;
}

// =====================================================
// Coordinate Validation
// =====================================================

/**
 * Valida se coordenadas estão dentro de limites válidos
 *
 * @param coords - Coordenadas a validar
 * @returns true se válido
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude)
  );
}

/**
 * Valida latitude
 */
export function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90 && !isNaN(lat);
}

/**
 * Valida longitude
 */
export function isValidLongitude(lon: number): boolean {
  return lon >= -180 && lon <= 180 && !isNaN(lon);
}

// =====================================================
// Coordinate Formatting
// =====================================================

/**
 * Formata coordenadas para exibição
 *
 * @param coords - Coordenadas
 * @param decimals - Número de casas decimais (padrão: 6)
 * @returns String formatada "lat, lng"
 */
export function formatCoordinates(coords: Coordinates, decimals: number = 6): string {
  return `${coords.latitude.toFixed(decimals)}, ${coords.longitude.toFixed(decimals)}`;
}

/**
 * Formata distância para exibição
 *
 * @param distanceKm - Distância em km
 * @returns String formatada (ex: "2.5 km", "1,234 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    // Menos de 1km: mostrar em metros
    return `${Math.round(distanceKm * 1000)} m`;
  } else if (distanceKm < 10) {
    // 1-10 km: uma casa decimal
    return `${distanceKm.toFixed(1)} km`;
  } else {
    // Mais de 10km: sem decimais
    return `${Math.round(distanceKm).toLocaleString('pt-BR')} km`;
  }
}

/**
 * Converte coordenadas DMS (Degrees, Minutes, Seconds) para decimal
 *
 * Exemplo: 23°33'16"S → -23.554444
 *
 * @param degrees - Graus
 * @param minutes - Minutos
 * @param seconds - Segundos
 * @param direction - Direção ('N', 'S', 'E', 'W')
 * @returns Coordenada decimal
 */
export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: 'N' | 'S' | 'E' | 'W'
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

/**
 * Converte coordenadas decimais para DMS
 *
 * @param decimal - Coordenada decimal
 * @param isLatitude - true para latitude, false para longitude
 * @returns Objeto com degrees, minutes, seconds, direction
 */
export function decimalToDMS(
  decimal: number,
  isLatitude: boolean
): { degrees: number; minutes: number; seconds: number; direction: string } {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  let direction: string;
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return { degrees, minutes, seconds, direction };
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Converte graus para radianos
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converte radianos para graus
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calcula o ponto médio entre dois pontos
 *
 * @param point1 - Primeiro ponto
 * @param point2 - Segundo ponto
 * @returns Ponto médio
 */
export function getMidpoint(point1: Coordinates, point2: Coordinates): Coordinates {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const lon1Rad = toRadians(point1.longitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const bx = Math.cos(lat2Rad) * Math.cos(dLon);
  const by = Math.cos(lat2Rad) * Math.sin(dLon);

  const lat3Rad = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + bx) ** 2 + by ** 2)
  );
  const lon3Rad = lon1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx);

  return {
    latitude: toDegrees(lat3Rad),
    longitude: toDegrees(lon3Rad),
  };
}

/**
 * Ordena array de pontos por distância de um ponto de referência
 *
 * @param points - Array de pontos com coordenadas
 * @param center - Ponto de referência
 * @returns Array ordenado com campo distance_km adicionado
 */
export function sortByDistance<T extends Coordinates>(
  points: T[],
  center: Coordinates
): Array<T & { distance_km: number }> {
  return points
    .map(point => ({
      ...point,
      distance_km: calculateDistance(center, point, 'km'),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);
}

// =====================================================
// Radius Presets (para UI)
// =====================================================

export const RADIUS_PRESETS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: '200 km', value: 200 },
  { label: 'Sem limite', value: 0 },
] as const;

/**
 * Obtém label para um raio
 */
export function getRadiusLabel(radiusKm: number): string {
  const preset = RADIUS_PRESETS.find(p => p.value === radiusKm);
  return preset?.label || `${radiusKm} km`;
}
