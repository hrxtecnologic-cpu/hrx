'use client';

/**
 * LocationPicker Component
 *
 * Componente para selecionar localização no mapa
 * - Usuário clica no mapa para selecionar sua localização
 * - Retorna latitude e longitude
 * - Busca endereço via geocoding reverso
 */

import { useState, useCallback, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface ParsedAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress: string;
}

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address?: string, parsedAddress?: ParsedAddress) => void;
  disabled?: boolean;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  disabled = false,
}: LocationPickerProps) {
  const [viewState, setViewState] = useState({
    longitude: longitude || -46.6333, // São Paulo
    latitude: latitude || -23.5505,
    zoom: latitude && longitude ? 14 : 10,
  });

  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  const [loadingAddress, setLoadingAddress] = useState(false);
  const [address, setAddress] = useState<string>('');

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Atualizar marker quando props mudarem
  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition({ lat: latitude, lng: longitude });
      setViewState({
        longitude,
        latitude,
        zoom: 14,
      });
    }
  }, [latitude, longitude]);

  // Parsear endereço do Mapbox
  const parseMapboxAddress = (feature: any): ParsedAddress => {
    const fullAddress = feature.place_name || '';
    const parsed: ParsedAddress = { fullAddress };

    // O Mapbox retorna o endereço em "context" com tipos específicos
    const context = feature.context || [];

    // Extrair informações do contexto
    context.forEach((item: any) => {
      const id = item.id || '';

      if (id.startsWith('postcode')) {
        parsed.postalCode = item.text;
      } else if (id.startsWith('place')) {
        parsed.city = item.text;
      } else if (id.startsWith('region')) {
        // Estado pode vir como "São Paulo" ou sigla "SP"
        parsed.state = item.short_code?.replace('BR-', '') || item.text;
      } else if (id.startsWith('neighborhood') || id.startsWith('locality')) {
        parsed.neighborhood = item.text;
      }
    });

    // Extrair rua do feature.text (nome principal do lugar)
    // feature.text geralmente contém o nome da rua sem o número
    if (feature.text) {
      parsed.street = feature.text;
    }

    // Tentar extrair número do address_number se disponível
    if (feature.properties?.address || feature.address) {
      const addr = feature.properties?.address || feature.address;
      // Se addr for apenas número, é o número da rua
      if (/^\d+$/.test(addr)) {
        parsed.number = addr;
      }
    }

    // Se ainda não tem número, tentar extrair do place_name
    // Procura padrão: "número rua" ou "rua, número"
    if (!parsed.number && fullAddress) {
      // Procura por padrão: vírgula seguida de número
      const numberAfterComma = fullAddress.match(/,\s*(\d+)(?:\s|,|$)/);
      if (numberAfterComma) {
        parsed.number = numberAfterComma[1];
      } else {
        // Procura por número no início do endereço (antes do nome da rua)
        const numberBeforeStreet = fullAddress.match(/^(\d+)\s+/);
        if (numberBeforeStreet && parsed.street && !parsed.street.startsWith(numberBeforeStreet[1])) {
          parsed.number = numberBeforeStreet[1];
        }
      }
    }

    return parsed;
  };

  // Geocoding reverso - buscar endereço a partir de coordenadas
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi&access_token=${mapboxToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const placeName = feature.place_name;
        const parsedAddress = parseMapboxAddress(feature);

        setAddress(placeName);

        return { placeName, parsedAddress };
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    } finally {
      setLoadingAddress(false);
    }
    return undefined;
  }, [mapboxToken]);

  // Handler para clique no mapa
  const handleMapClick = useCallback(
    async (event: any) => {
      if (disabled) return;

      const { lngLat } = event;
      const lat = lngLat.lat;
      const lng = lngLat.lng;

      setMarkerPosition({ lat, lng });

      // Buscar endereço
      const addressResult = await reverseGeocode(lat, lng);

      // Notificar parent com endereço parseado
      if (addressResult) {
        onLocationSelect(lat, lng, addressResult.placeName, addressResult.parsedAddress);
      } else {
        onLocationSelect(lat, lng);
      }
    },
    [disabled, onLocationSelect, reverseGeocode]
  );

  // Handler para usar localização atual
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setViewState({
          longitude: lng,
          latitude: lat,
          zoom: 14,
        });

        // Buscar endereço
        const addressResult = await reverseGeocode(lat, lng);

        // Notificar parent com endereço parseado
        if (addressResult) {
          onLocationSelect(lat, lng, addressResult.placeName, addressResult.parsedAddress);
        } else {
          onLocationSelect(lat, lng);
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Não foi possível obter sua localização. Clique no mapa para selecionar.');
      }
    );
  }, [onLocationSelect, reverseGeocode]);

  if (!mapboxToken) {
    return (
      <Card className="border-red-900/20 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Mapbox não configurado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            Configure NEXT_PUBLIC_MAPBOX_TOKEN no arquivo .env para usar o mapa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Localização no Mapa
            </CardTitle>
            <CardDescription className="mt-1">
              Clique no mapa para marcar sua localização exata
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="border-zinc-700 hover:bg-zinc-800 text-white"
          >
            <MapPin className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Usar minha localização</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mapa */}
        <div className="relative w-full h-96 rounded-lg overflow-hidden border border-zinc-700">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={mapboxToken}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Controles de navegação */}
            <NavigationControl position="top-right" />
            <GeolocateControl
              position="top-right"
              trackUserLocation
              onGeolocate={(e) => {
                const lat = e.coords.latitude;
                const lng = e.coords.longitude;
                setMarkerPosition({ lat, lng });
                reverseGeocode(lat, lng).then((result) => {
                  if (result) {
                    onLocationSelect(lat, lng, result.placeName, result.parsedAddress);
                  } else {
                    onLocationSelect(lat, lng);
                  }
                });
              }}
            />

            {/* Marker da posição selecionada */}
            {markerPosition && (
              <Marker
                longitude={markerPosition.lng}
                latitude={markerPosition.lat}
                anchor="bottom"
              >
                <div className="relative">
                  <MapPin className="h-8 w-8 text-red-600 fill-red-600/20 drop-shadow-lg" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full animate-ping" />
                </div>
              </Marker>
            )}
          </Map>

          {/* Overlay de loading */}
          {loadingAddress && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-700 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
              <span className="text-sm text-zinc-300">Buscando endereço...</span>
            </div>
          )}
        </div>

        {/* Informações da localização selecionada */}
        {markerPosition && (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2">
            <Label className="text-sm font-medium text-zinc-200">Localização Selecionada</Label>

            {address && (
              <p className="text-sm text-zinc-400">{address}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>Latitude: {markerPosition.lat.toFixed(6)}</span>
              <span>Longitude: {markerPosition.lng.toFixed(6)}</span>
            </div>
          </div>
        )}

        {/* Instruções */}
        {!markerPosition && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-950/20 border border-blue-900/40">
            <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-500">Como usar:</p>
              <p className="text-blue-600 text-xs mt-1">
                Clique em qualquer ponto do mapa para marcar sua localização, ou use o botão
                "Usar minha localização" para detectar automaticamente.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
