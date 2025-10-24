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
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import { MapPin, User, Package } from 'lucide-react';

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

  // Filtrar markers
  const filteredMarkers = useMemo(() => {
    if (filter === 'all') return markers;
    return markers.filter(m => m.type === filter);
  }, [markers, filter]);

  // Handler para clique no marker
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [onMarkerClick]);

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

  return (
    <div className="space-y-4">
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
