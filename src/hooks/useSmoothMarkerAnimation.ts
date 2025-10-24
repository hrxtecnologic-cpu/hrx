import { useState, useEffect, useRef } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Hook para animar suavemente a transição de marcadores no mapa
 * Usa interpolação linear para criar movimento fluido
 */
export function useSmoothMarkerAnimation(
  targetCoords: Coordinates | null,
  duration: number = 2000 // 2 segundos
) {
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(targetCoords);
  const animationRef = useRef<number | null>(null);
  const startCoordsRef = useRef<Coordinates | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Se não tem coordenadas alvo, não anima
    if (!targetCoords) {
      setCurrentCoords(null);
      return;
    }

    // Se é a primeira vez, define direto sem animar
    if (!currentCoords) {
      setCurrentCoords(targetCoords);
      return;
    }

    // Se as coordenadas não mudaram, não anima
    if (
      currentCoords.latitude === targetCoords.latitude &&
      currentCoords.longitude === targetCoords.longitude
    ) {
      return;
    }

    // Iniciar animação
    startCoordsRef.current = currentCoords;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1); // 0 a 1

      // Interpolação linear (lerp)
      const newLat =
        (startCoordsRef.current?.latitude || 0) +
        (targetCoords.latitude - (startCoordsRef.current?.latitude || 0)) * progress;

      const newLng =
        (startCoordsRef.current?.longitude || 0) +
        (targetCoords.longitude - (startCoordsRef.current?.longitude || 0)) * progress;

      setCurrentCoords({
        latitude: newLat,
        longitude: newLng,
      });

      // Continuar animação se não terminou
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Iniciar
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetCoords?.latitude, targetCoords?.longitude, duration]);

  return currentCoords;
}
