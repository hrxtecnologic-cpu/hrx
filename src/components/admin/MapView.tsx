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
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer, FullscreenControl } from 'react-map-gl/mapbox';
import { MapPin, User, Package, Clock, Route, X, DollarSign, Maximize2, Minimize2, Phone, Mail, Home } from 'lucide-react';

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
  address?: string;
  phone?: string;
  email?: string;
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
  // IMPORTANT: All hooks must be called before any conditional returns
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [viewState, setViewState] = useState({
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    zoom: initialZoom,
  });

  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [filter, setFilter] = useState<'all' | 'professional' | 'supplier' | 'event'>('all');
  const [showIsochrone, setShowIsochrone] = useState(false);
  const [isochroneMinutes, setIsochroneMinutes] = useState(30);
  const [isochroneData, setIsochroneData] = useState<unknown>(null);
  const [selectedEventForIsochrone, setSelectedEventForIsochrone] = useState<MapMarker | null>(null);
  const [isLoadingIsochrone, setIsLoadingIsochrone] = useState(false);
  const [isochroneCache, setIsochroneCache] = useState<Record<string, unknown>>({});
  const [filterByIsochrone, setFilterByIsochrone] = useState(false);

  // Estados para rotas
  const [showRoute, setShowRoute] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState<MapMarker | null>(null);
  const [routeDestination, setRouteDestination] = useState<MapMarker | null>(null);
  const [routeData, setRouteData] = useState<unknown>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeCache, setRouteCache] = useState<Record<string, unknown>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Estado para clustering
  const [enableClustering, setEnableClustering] = useState(true);

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

  // Converter markers para GeoJSON para clustering
  const markersGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredMarkers.map(marker => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [marker.longitude, marker.latitude]
        },
        properties: {
          id: marker.id,
          type: marker.type,
          name: marker.name,
          city: marker.city,
          state: marker.state,
          status: marker.status,
          categories: marker.categories,
          address: marker.address,
          phone: marker.phone,
          email: marker.email,
        }
      }))
    };
  }, [filteredMarkers]);

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

  // Check for Mapbox token after all hooks
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

      {/* Toggle Clustering */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-200">Agrupar Marcadores</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enableClustering}
            onChange={(e) => setEnableClustering(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Filtros - Grid responsivo: 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-6 py-2.5 rounded-md font-medium transition-all whitespace-nowrap text-sm ${
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
          className={`px-3 sm:px-6 py-2.5 rounded-md font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm ${
            filter === 'professional'
              ? 'bg-zinc-800 text-blue-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
          <span className="hidden sm:inline">Profissionais</span>
          <span className="sm:hidden">Prof.</span>
          <span className="ml-1 text-sm font-bold">{markers.filter(m => m.type === 'professional').length}</span>
        </button>
        <button
          onClick={() => setFilter('supplier')}
          className={`px-3 sm:px-6 py-2.5 rounded-md font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm ${
            filter === 'supplier'
              ? 'bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></div>
          <span className="hidden sm:inline">Fornecedores</span>
          <span className="sm:hidden">Forn.</span>
          <span className="ml-1 text-sm font-bold">{markers.filter(m => m.type === 'supplier').length}</span>
        </button>
        <button
          onClick={() => setFilter('event')}
          className={`px-3 sm:px-6 py-2.5 rounded-md font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm ${
            filter === 'event'
              ? 'bg-zinc-800 text-rose-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0"></div>
          <span className="hidden sm:inline">Eventos</span>
          <span className="sm:hidden">Event.</span>
          <span className="ml-1 text-sm font-bold">{markers.filter(m => m.type === 'event').length}</span>
        </button>
      </div>

      {/* Mapa - Altura responsiva com fullscreen */}
      <div className={`rounded-lg overflow-hidden border border-zinc-800 transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen'
          : 'h-[400px] sm:h-[500px] lg:h-[600px] relative'
      }`}>
        {/* Botão Fullscreen customizado */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 right-4 z-10 bg-zinc-900/90 hover:bg-zinc-800 text-white p-2 rounded-lg border border-zinc-700 transition-colors shadow-lg backdrop-blur-sm"
          title={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={mapboxToken}
          interactiveLayerIds={enableClustering ? ['clusters', 'unclustered-point'] : undefined}
          onClick={(event) => {
            if (!enableClustering) return;

            const feature = event.features?.[0];
            if (!feature) return;

            // Se clicou em um cluster, fazer zoom
            if (feature.layer.id === 'clusters') {
              const clusterId = feature.properties?.cluster_id;
              const source = event.target.getSource('markers');

              if (source && 'getClusterExpansionZoom' in source) {
                (source as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
                  if (err) return;

                  setViewState({
                    ...viewState,
                    longitude: (feature.geometry as GeoJSON.Point).coordinates[0],
                    latitude: (feature.geometry as GeoJSON.Point).coordinates[1],
                    zoom: zoom,
                  });
                });
              }
            }

            // Se clicou em um ponto individual, mostrar popup
            if (feature.layer.id === 'unclustered-point') {
              const markerId = feature.properties?.id;
              const marker = filteredMarkers.find(m => m.id === markerId);
              if (marker) {
                handleMarkerClick(marker);
              }
            }
          }}
        >
          {/* Controles */}
          <NavigationControl position="top-right" style={{ marginTop: isFullscreen ? '60px' : '10px' }} />
          <GeolocateControl position="top-right" style={{ marginTop: isFullscreen ? '110px' : '60px' }} />

          {/* Markers com Clustering */}
          {enableClustering ? (
            <Source
              id="markers"
              type="geojson"
              data={markersGeoJSON}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              {/* Clusters (círculos com números) */}
              <Layer
                id="clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#3b82f6', // azul para poucos
                    10,
                    '#10b981', // verde para médio
                    25,
                    '#f59e0b', // laranja para muitos
                    50,
                    '#ef4444', // vermelho para muito muitos
                  ],
                  'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20, // tamanho base
                    10,
                    25, // cresce com quantidade
                    25,
                    30,
                    50,
                    35,
                  ],
                  'circle-opacity': 0.8,
                  'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                }}
              />

              {/* Número dentro do cluster */}
              <Layer
                id="cluster-count"
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': '{point_count_abbreviated}',
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-size': 14,
                }}
                paint={{
                  'text-color': '#ffffff',
                }}
              />

              {/* Pontos individuais (quando não clusterizados) */}
              <Layer
                id="unclustered-point"
                type="circle"
                filter={['!', ['has', 'point_count']]}
                paint={{
                  'circle-color': [
                    'match',
                    ['get', 'type'],
                    'professional', '#3b82f6', // azul
                    'supplier', '#10b981', // verde
                    'event', '#ef4444', // vermelho
                    '#6b7280' // cinza default
                  ],
                  'circle-radius': 8,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fff',
                }}
              />

              {/* Ícone no ponto individual */}
              <Layer
                id="unclustered-icon"
                type="symbol"
                filter={['!', ['has', 'point_count']]}
                layout={{
                  'icon-image': [
                    'match',
                    ['get', 'type'],
                    'professional', 'marker-15', // Mapbox tem ícones built-in
                    'supplier', 'marker-15',
                    'event', 'marker-15',
                    'marker-15'
                  ],
                  'icon-size': 0.5,
                }}
              />
            </Source>
          ) : (
            // Modo sem clustering (original)
            filteredMarkers.map((marker) => {
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
                    <div className={`${bgColor} rounded-full p-1.5 shadow-lg border border-zinc-700`}>
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                </Marker>
              );
            })
          )}

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
              <div className="min-w-[220px] max-w-[280px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                {/* Header com gradiente de acordo com o tipo */}
                <div className={`px-4 py-3 ${
                  selectedMarker.type === 'professional' ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-b border-blue-500/30' :
                  selectedMarker.type === 'supplier' ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-b border-emerald-500/30' :
                  'bg-gradient-to-r from-rose-600/20 to-rose-500/10 border-b border-rose-500/30'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`${getMarkerBgColor(selectedMarker.type)} rounded-lg p-2 shadow-lg mt-0.5`}>
                      {(() => {
                        const Icon = getMarkerIcon(selectedMarker.type);
                        return <Icon className="w-4 h-4 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base leading-tight mb-1 truncate">
                        {selectedMarker.name}
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedMarker.city}, {selectedMarker.state}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3 space-y-3">
                  {selectedMarker.status && (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {selectedMarker.status}
                      </span>
                    </div>
                  )}

                  {/* Endereço */}
                  {selectedMarker.address && (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-400 mb-0.5">Endereço</p>
                        <p className="text-xs text-white leading-relaxed">
                          {selectedMarker.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Telefone */}
                  {selectedMarker.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-400 mb-0.5">Telefone</p>
                        <a
                          href={`https://wa.me/55${selectedMarker.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                        >
                          {selectedMarker.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {selectedMarker.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-400 mb-0.5">Email</p>
                        <a
                          href={`mailto:${selectedMarker.email}`}
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors truncate block"
                        >
                          {selectedMarker.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Categorias */}
                  {selectedMarker.categories && selectedMarker.categories.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
                        Categorias
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMarker.categories.slice(0, 3).map((cat, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                              selectedMarker.type === 'professional' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              selectedMarker.type === 'supplier' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {cat}
                          </span>
                        ))}
                        {selectedMarker.categories.length > 3 && (
                          <span className="text-xs px-2.5 py-1 text-zinc-500 bg-zinc-800 rounded-md border border-zinc-700 font-medium">
                            +{selectedMarker.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
