import { useMemo } from 'react';
import { Marker, Source, Layer } from 'react-map-gl/mapbox';
import { Navigation, Clock, MapPin as MapPinIcon } from 'lucide-react';
import { useSmoothMarkerAnimation } from '@/hooks/useSmoothMarkerAnimation';
import { useMapboxRoute } from '@/hooks/useMapboxRoute';

interface AnimatedDeliveryMarkerProps {
  delivery: {
    id: string;
    current_latitude: number;
    current_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    supplier: {
      company_name: string;
    };
  };
  onClick: () => void;
}

export function AnimatedDeliveryMarker({ delivery, onClick }: AnimatedDeliveryMarkerProps) {
  // Animação suave do marcador
  const animatedPosition = useSmoothMarkerAnimation(
    {
      latitude: delivery.current_latitude,
      longitude: delivery.current_longitude,
    },
    2000 // 2 segundos de animação
  );

  // Buscar rota real
  const { route } = useMapboxRoute(
    [delivery.current_longitude, delivery.current_latitude],
    [delivery.destination_longitude, delivery.destination_latitude]
  );

  // Formatar distância
  const distanceKm = route ? (route.distance / 1000).toFixed(1) : null;

  // Calcular ETA
  const eta = route ? Math.ceil(route.duration / 60) : null; // minutos

  // GeoJSON da rota real
  const routeGeoJSON = useMemo(() => {
    if (!route) return null;
    return {
      type: 'Feature' as const,
      geometry: route.geometry,
    };
  }, [route]);

  if (!animatedPosition) return null;

  return (
    <>
      {/* Rota real pelas ruas */}
      {routeGeoJSON && (
        <Source id={`route-${delivery.id}`} type="geojson" data={routeGeoJSON}>
          <Layer
            id={`route-layer-${delivery.id}`}
            type="line"
            paint={{
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      )}

      {/* Marcador do veículo (animado) */}
      <Marker
        latitude={animatedPosition.latitude}
        longitude={animatedPosition.longitude}
        anchor="center"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onClick();
        }}
      >
        <div className="cursor-pointer hover:scale-110 transition-transform relative">
          <div className="bg-blue-500 rounded-full p-3 shadow-lg border-2 border-zinc-700 animate-pulse">
            <Navigation className="w-5 h-5 text-white" />
          </div>

          {/* Badge com ETA e distância */}
          {(eta || distanceKm) && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap shadow-lg">
              {eta && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>{eta} min</span>
                </div>
              )}
              {distanceKm && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3 text-blue-400" />
                  <span>{distanceKm} km</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Marker>
    </>
  );
}
