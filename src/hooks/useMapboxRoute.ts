import { useState, useEffect } from 'react';

interface RouteData {
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  distance: number; // metros
  duration: number; // segundos
}

/**
 * Hook para buscar rota real usando Mapbox Directions API
 * Retorna geometria da rota, distância e tempo estimado
 */
export function useMapboxRoute(
  origin: [number, number] | null, // [lng, lat]
  destination: [number, number] | null
) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setRoute(null);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          throw new Error('Mapbox token não configurado');
        }

        // Mapbox Directions API com trânsito em tempo real
        // driving-traffic = considera trânsito atual
        // alternatives=true = retorna rotas alternativas
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&alternatives=true&overview=full&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRoute({
            geometry: route.geometry,
            distance: route.distance, // metros
            duration: route.duration, // segundos
          });
        } else {
          setRoute(null);
        }
      } catch (err: any) {
        console.error('Erro ao buscar rota:', err);
        setError(err.message);
        setRoute(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [origin?.[0], origin?.[1], destination?.[0], destination?.[1]]);

  return { route, loading, error };
}
