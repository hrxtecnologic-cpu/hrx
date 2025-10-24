'use client';

import { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import { MapPin, Package, Navigation } from 'lucide-react';

interface DeliveryItem {
  id: string;
  status: string;
  current_latitude: number | null;
  current_longitude: number | null;
  destination_latitude: number;
  destination_longitude: number;
  supplier: {
    company_name: string;
  };
  driver: {
    name: string;
  } | null;
}

interface DeliveryTrackingMapProps {
  deliveries: DeliveryItem[];
}

export function DeliveryTrackingMap({ deliveries }: DeliveryTrackingMapProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -46.6333,
    latitude: -23.5505,
    zoom: 12,
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-96 bg-zinc-800 rounded-lg">
        <p className="text-zinc-400">Mapbox não configurado</p>
      </div>
    );
  }

  // Calcular centro do mapa baseado nas entregas
  useEffect(() => {
    if (deliveries.length === 0) return;

    // Pegar todas as coordenadas válidas
    const coords: Array<[number, number]> = [];

    deliveries.forEach((d) => {
      if (d.current_latitude && d.current_longitude) {
        coords.push([d.current_longitude, d.current_latitude]);
      }
      coords.push([d.destination_longitude, d.destination_latitude]);
    });

    if (coords.length === 0) return;

    // Calcular centro
    const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

    setViewState({
      longitude: avgLng,
      latitude: avgLat,
      zoom: 12,
    });
  }, [deliveries]);

  // Criar rotas para deliveries em trânsito
  const routes = useMemo(() => {
    return deliveries
      .filter(d => d.status === 'in_transit' && d.current_latitude && d.current_longitude)
      .map(d => ({
        id: d.id,
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [d.current_longitude!, d.current_latitude!],
            [d.destination_longitude, d.destination_latitude],
          ],
        },
      }));
  }, [deliveries]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Controles */}
        <NavigationControl position="top-right" />

        {/* Destinos (sempre visíveis) */}
        {deliveries.map((delivery) => (
          <Marker
            key={`dest-${delivery.id}`}
            latitude={delivery.destination_latitude}
            longitude={delivery.destination_longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedDelivery(delivery);
            }}
          >
            <div className="cursor-pointer hover:scale-110 transition-transform">
              <div className="bg-rose-500 rounded-full p-3 shadow-lg border-2 border-zinc-700">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Veículos em trânsito */}
        {deliveries.map((delivery) => {
          if (!delivery.current_latitude || !delivery.current_longitude) return null;

          return (
            <Marker
              key={`vehicle-${delivery.id}`}
              latitude={delivery.current_latitude}
              longitude={delivery.current_longitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedDelivery(delivery);
              }}
            >
              <div className="cursor-pointer hover:scale-110 transition-transform">
                <div className="bg-blue-500 rounded-full p-3 shadow-lg border-2 border-zinc-700 animate-pulse">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Linhas de rota */}
        {routes.map((route) => (
          <Source key={route.id} id={route.id} type="geojson" data={route}>
            <Layer
              id={`route-${route.id}`}
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-dasharray': [2, 2],
                'line-opacity': 0.6,
              }}
            />
          </Source>
        ))}

        {/* Popup */}
        {selectedDelivery && (
          <Popup
            latitude={selectedDelivery.current_latitude || selectedDelivery.destination_latitude}
            longitude={selectedDelivery.current_longitude || selectedDelivery.destination_longitude}
            onClose={() => setSelectedDelivery(null)}
            closeButton={true}
            closeOnClick={false}
            className="delivery-popup"
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-sm">
                  {selectedDelivery.supplier.company_name}
                </h3>
              </div>

              {selectedDelivery.driver && (
                <p className="text-xs text-zinc-600 mb-1">
                  Motorista: {selectedDelivery.driver.name}
                </p>
              )}

              <div className="mt-2">
                {selectedDelivery.current_latitude && selectedDelivery.current_longitude ? (
                  <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded">
                    Em Trânsito
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs rounded">
                    Aguardando
                  </span>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-lg p-3 text-sm">
        <h4 className="font-semibold text-white mb-2">Legenda</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 rounded-full p-1.5">
              <Navigation className="w-3 h-3 text-white" />
            </div>
            <span className="text-zinc-300">Veículo em trânsito</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 rounded-full p-1.5">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className="text-zinc-300">Destino</span>
          </div>
        </div>
      </div>
    </div>
  );
}
