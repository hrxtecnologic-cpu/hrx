'use client';

/**
 * MapView Component
 *
 * Mapa interativo usando Mapbox GL JS + react-map-gl
 * - Visualizar profissionais e fornecedores no mapa
 * - Filtrar por categoria/status
 * - Clique no marker para ver detalhes
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/mapbox';
import { MapPin, User, Package, Clock, Route, X, DollarSign } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface MapMarker {
  id: string;
  type: 'professional' | 'supplier' | 'event';
  latitude: number;
  longitude: number;
  name: string;
  status?: string;
  categories?: string[];
  city?: string;
  state?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
}

// =====================================================
// Component
// =====================================================

export function MapView({
  markers,
  initialCenter = [-46.6333, -23.5505], // São Paulo
  initialZoom = 10,
  onMarkerClick,
}: MapViewProps) {
  const [viewState, setViewState] = useState({
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    zoom: initialZoom,
  });

  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [filter, setFilter] = useState<'all' | 'professional' | 'supplier' | 'event'>('all');
  const [showIsochrone, setShowIsochrone] = useState(false);
  const [isochroneMinutes, setIsochroneMinutes] = useState(30);
  const [isochroneData, setIsochroneData] = useState<any>(null);
  const [selectedEventForIsochrone, setSelectedEventForIsochrone] = useState<MapMarker | null>(null);
  const [isLoadingIsochrone, setIsLoadingIsochrone] = useState(false);
  const [isochroneCache, setIsochroneCache] = useState<Record<string, any>>({});
  const [filterByIsochrone, setFilterByIsochrone] = useState(false);

  // Estados para rotas
  const [showRoute, setShowRoute] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState<MapMarker | null>(null);
  const [routeDestination, setRouteDestination] = useState<MapMarker | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeCache, setRouteCache] = useState<Record<string, any>>({});

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-96 bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-700">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto text-zinc-500 mb-2" />
          <p className="text-zinc-300 font-medium">
            Mapbox não configurado
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Adicione NEXT_PUBLIC_MAPBOX_TOKEN no .env
          </p>
        </div>
      </div>
    );
  }

  // Verificar se ponto está dentro do isochrone (ray casting)
  const isPointInIsochrone = useCallback((lat: number, lon: number) => {
    if (!isochroneData || !isochroneData.features || isochroneData.features.length === 0) {
      return false;
    }

    const polygon = isochroneData.features[0].geometry;
    if (polygon.type !== 'Polygon') return false;

    const coords = polygon.coordinates[0];
    let inside = false;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i][0];
      const yi = coords[i][1];
      const xj = coords[j][0];
      const yj = coords[j][1];

      const intersect =
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }, [isochroneData]);

  // Filtrar markers
  const filteredMarkers = useMemo(() => {
    let filtered = markers;

    // Filtro por tipo
    if (filter !== 'all') {
      filtered = filtered.filter(m => m.type === filter);
    }

    // Filtro por isochrone (mostrar apenas dentro da área)
    if (filterByIsochrone && showIsochrone && isochroneData) {
      filtered = filtered.filter(m => {
        // Sempre mostrar o evento selecionado
        if (m.type === 'event' && m.id === selectedEventForIsochrone?.id) {
          return true;
        }
        // Filtrar profissionais e fornecedores por distância
        return isPointInIsochrone(m.latitude, m.longitude);
      });
    }

    return filtered;
  }, [markers, filter, filterByIsochrone, showIsochrone, isochroneData, selectedEventForIsochrone, isPointInIsochrone]);

  // Handler para clique no marker
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [onMarkerClick]);

  // Calcular isochrone para evento selecionado (com cache)
  const calculateIsochrone = useCallback(async (event: MapMarker, minutes?: number) => {
    if (event.type !== 'event') return;

    const targetMinutes = minutes || isochroneMinutes;
    const cacheKey = `${event.id}-${targetMinutes}`;

    setSelectedEventForIsochrone(event);
    setShowIsochrone(true);

    // Verificar cache primeiro
    if (isochroneCache[cacheKey]) {
      setIsochroneData(isochroneCache[cacheKey]);
      return;
    }

    setIsLoadingIsochrone(true);

    try {
      const response = await fetch('/api/mapbox/isochrone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: event.latitude,
          longitude: event.longitude,
          minutes: targetMinutes,
          profile: 'driving',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsochroneData(data.polygon);

        // Guardar no cache
        setIsochroneCache(prev => ({
          ...prev,
          [cacheKey]: data.polygon,
        }));
      }
    } catch (error) {
      console.error('Erro ao calcular isochrone:', error);
    } finally {
      setIsLoadingIsochrone(false);
    }
  }, [isochroneMinutes, isochroneCache]);

  // Calcular rota entre dois pontos (com cache)
  const calculateRoute = useCallback(async (origin: MapMarker, destination: MapMarker) => {
    const cacheKey = `${origin.id}-${destination.id}`;

    setRouteOrigin(origin);
    setRouteDestination(destination);
    setShowRoute(true);

    // Verificar cache primeiro
    if (routeCache[cacheKey]) {
      setRouteData(routeCache[cacheKey]);
      return;
    }

    setIsLoadingRoute(true);

    try {
      const response = await fetch('/api/mapbox/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          profile: 'driving',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRouteData(data.route);

        // Guardar no cache
        setRouteCache(prev => ({
          ...prev,
          [cacheKey]: data.route,
        }));

        // Ajustar viewport para mostrar a rota completa
        const bounds = [
          [Math.min(origin.longitude, destination.longitude), Math.min(origin.latitude, destination.latitude)],
          [Math.max(origin.longitude, destination.longitude), Math.max(origin.latitude, destination.latitude)]
        ];

        // Calcular centro e zoom apropriado
        const centerLng = (origin.longitude + destination.longitude) / 2;
        const centerLat = (origin.latitude + destination.latitude) / 2;

        setViewState({
          longitude: centerLng,
          latitude: centerLat,
          zoom: 11, // Zoom adequado para ver a rota
        });
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [routeCache]);

  // Cor do marker por tipo (mais vibrantes)
  const getMarkerColor = (type: MapMarker['type']) => {
    switch (type) {
      case 'professional':
        return 'text-blue-500';
      case 'supplier':
        return 'text-emerald-500';
      case 'event':
        return 'text-rose-500';
      default:
        return 'text-gray-600';
    }
  };

  // Cor de fundo do marker
  const getMarkerBgColor = (type: MapMarker['type']) => {
    switch (type) {
      case 'professional':
        return 'bg-blue-500';
      case 'supplier':
        return 'bg-emerald-500';
      case 'event':
        return 'bg-rose-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Ícone do marker
  const getMarkerIcon = (type: MapMarker['type']) => {
    switch (type) {
      case 'professional':
        return User;
      case 'supplier':
        return Package;
      case 'event':
        return MapPin;
      default:
        return MapPin;
    }
  };

  // Eventos disponíveis para isochrone
  const eventMarkers = useMemo(() => {
    return markers.filter(m => m.type === 'event');
  }, [markers]);

  return (
    <div className="space-y-4">
      {/* Controles de Isochrone */}
      {eventMarkers.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-zinc-200">Raio de Atuação</span>
            </div>

            <select
              value={selectedEventForIsochrone?.id || ''}
              onChange={(e) => {
                const event = eventMarkers.find(m => m.id === e.target.value);
                if (event) calculateIsochrone(event);
              }}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2"
            >
              <option value="">Selecione um evento</option>
              {eventMarkers.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {event.city}, {event.state}
                </option>
              ))}
            </select>

            <select
              value={isochroneMinutes}
              onChange={(e) => {
                const newMinutes = Number(e.target.value);
                setIsochroneMinutes(newMinutes);
                if (selectedEventForIsochrone) {
                  calculateIsochrone(selectedEventForIsochrone, newMinutes);
                }
              }}
              disabled={isLoadingIsochrone}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2 disabled:opacity-50"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>

            {isLoadingIsochrone && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                Calculando área...
              </div>
            )}

            {showIsochrone && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterByIsochrone}
                    onChange={(e) => setFilterByIsochrone(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                  />
                  <span className="text-sm text-zinc-300">Filtrar por distância</span>
                </label>

                <button
                  onClick={() => {
                    setShowIsochrone(false);
                    setIsochroneData(null);
                    setSelectedEventForIsochrone(null);
                    setFilterByIsochrone(false);
                  }}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Limpar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Controles de Rota */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-zinc-200">Calcular Rota</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Origem */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Origem</label>
              <select
                value={routeOrigin?.id || ''}
                onChange={(e) => {
                  const origin = markers.find(m => m.id === e.target.value);
                  setRouteOrigin(origin || null);
                  if (origin && routeDestination) {
                    calculateRoute(origin, routeDestination);
                  }
                }}
                className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2"
              >
                <option value="">Selecione origem</option>
                <optgroup label="Eventos">
                  {markers.filter(m => m.type === 'event').map(marker => (
                    <option key={marker.id} value={marker.id}>
                      {marker.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Profissionais">
                  {markers.filter(m => m.type === 'professional').map(marker => (
                    <option key={marker.id} value={marker.id}>
                      {marker.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Fornecedores">
                  {markers.filter(m => m.type === 'supplier').map(marker => (
                    <option key={marker.id} value={marker.id}>
                      {marker.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Destino */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Destino</label>
              <select
                value={routeDestination?.id || ''}
                onChange={(e) => {
                  const destination = markers.find(m => m.id === e.target.value);
                  setRouteDestination(destination || null);
                  if (routeOrigin && destination) {
                    calculateRoute(routeOrigin, destination);
                  }
                }}
                className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2"
              >
                <option value="">Selecione destino</option>
                <optgroup label="Eventos">
                  {markers.filter(m => m.type === 'event').map(marker => (
                    <option key={marker.id} value={marker.id}>
                      {marker.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Profissionais">
                  {markers.filter(m => m.type === 'professional').map(marker => (
                    <option key={marker.id} value={marker.id}>
                      {marker.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Fornecedores">
                  {markers.filter(m => m.type === 'supplier').map(marker => (
                    <option key={marker.id} value={marker.id}>
                      {marker.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Informações da Rota */}
          {isLoadingRoute && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg p-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
              Calculando rota...
            </div>
          )}

          {showRoute && routeData && !isLoadingRoute && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-zinc-200">
                    {routeOrigin?.name} → {routeDestination?.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowRoute(false);
                    setRouteData(null);
                    setRouteOrigin(null);
                    setRouteDestination(null);
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-zinc-500">Distância</div>
                  <div className="text-white font-semibold">
                    {routeData.distanceKm.toFixed(1)} km
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Tempo</div>
                  <div className="text-white font-semibold">
                    {routeData.durationMinutes.toFixed(0)} min
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Custo estimado</div>
                  <div className="text-emerald-400 font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    R$ {routeData.cost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Perfil</div>
                  <div className="text-white font-semibold">Carro</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros - Tabs responsivos com scroll horizontal */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg w-fit min-w-min border border-zinc-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 sm:px-6 py-2.5 rounded-md font-medium transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos
            <span className="ml-2 text-sm font-bold">{markers.length}</span>
          </button>
          <button
            onClick={() => setFilter('professional')}
            className={`px-4 sm:px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              filter === 'professional'
                ? 'bg-zinc-800 text-blue-500 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
            <span className="hidden xs:inline">Profissionais</span>
            <span className="xs:hidden">Prof.</span>
            <span className="ml-1 text-sm font-bold">{markers.filter(m => m.type === 'professional').length}</span>
          </button>
          <button
            onClick={() => setFilter('supplier')}
            className={`px-4 sm:px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              filter === 'supplier'
                ? 'bg-zinc-800 text-emerald-500 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></div>
            <span className="hidden xs:inline">Fornecedores</span>
            <span className="xs:hidden">Forn.</span>
            <span className="ml-1 text-sm font-bold">{markers.filter(m => m.type === 'supplier').length}</span>
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-4 sm:px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              filter === 'event'
                ? 'bg-zinc-800 text-rose-500 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0"></div>
            Eventos
            <span className="ml-1 text-sm font-bold">{markers.filter(m => m.type === 'event').length}</span>
          </button>
        </div>
      </div>

      {/* Mapa - Altura responsiva */}
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg overflow-hidden border border-zinc-800">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={mapboxToken}
        >
          {/* Controles */}
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />

          {/* Markers */}
          {filteredMarkers.map((marker) => {
            const Icon = getMarkerIcon(marker.type);
            const bgColor = getMarkerBgColor(marker.type);

            return (
              <Marker
                key={marker.id}
                longitude={marker.longitude}
                latitude={marker.latitude}
                anchor="bottom"
                onClick={() => handleMarkerClick(marker)}
              >
                <div className="cursor-pointer transform hover:scale-125 transition-all duration-200">
                  <div className={`${bgColor} rounded-full p-2 shadow-lg border-2 border-zinc-700`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Isochrone Layer */}
          {showIsochrone && isochroneData && (
            <Source id="isochrone" type="geojson" data={isochroneData}>
              <Layer
                id="isochrone-fill"
                type="fill"
                paint={{
                  'fill-color': '#3b82f6',
                  'fill-opacity': 0.2,
                }}
              />
              <Layer
                id="isochrone-outline"
                type="line"
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 2,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          )}

          {/* Route Layer */}
          {showRoute && routeData?.geometry && (
            <Source id="route" type="geojson" data={routeData.geometry}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': '#10b981',
                  'line-width': 4,
                  'line-opacity': 0.8,
                }}
              />
              <Layer
                id="route-outline"
                type="line"
                paint={{
                  'line-color': '#059669',
                  'line-width': 6,
                  'line-opacity': 0.4,
                }}
              />
            </Source>
          )}

          {/* Popup */}
          {selectedMarker && (
            <Popup
              longitude={selectedMarker.longitude}
              latitude={selectedMarker.latitude}
              anchor="bottom"
              onClose={() => setSelectedMarker(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-2 min-w-[200px] bg-zinc-900 border border-zinc-800 rounded">
                <h3 className="font-semibold text-white mb-1">
                  {selectedMarker.name}
                </h3>
                <p className="text-sm text-zinc-400 mb-2">
                  {selectedMarker.city}, {selectedMarker.state}
                </p>
                {selectedMarker.status && (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-zinc-800 text-zinc-300">
                    {selectedMarker.status}
                  </span>
                )}
                {selectedMarker.categories && selectedMarker.categories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-zinc-500 mb-1">
                      Categorias:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedMarker.categories.slice(0, 3).map((cat, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                      {selectedMarker.categories.length > 3 && (
                        <span className="text-xs text-zinc-500">
                          +{selectedMarker.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* Estatísticas - Responsivo: 1 coluna no mobile, 3 no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-zinc-200">
              Profissionais
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-500">
            {markers.filter(m => m.type === 'professional').length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-zinc-200">
              Fornecedores
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">
            {markers.filter(m => m.type === 'supplier').length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-medium text-zinc-200">
              Eventos
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-500">
            {markers.filter(m => m.type === 'event').length}
          </p>
        </div>
      </div>
    </div>
  );
}
