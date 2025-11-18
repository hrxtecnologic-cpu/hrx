'use client';

/**
 * Mapbox Autocomplete Component
 *
 * Autocomplete de endereços usando Mapbox Search API
 * - Sugestões enquanto digita
 * - Seleção rápida
 * - Preenche coordenadas automaticamente
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

export interface AddressSuggestion {
  id: string;
  placeName: string;
  address?: string;
  city?: string;
  state?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface MapboxAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MapboxAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Digite um endereço...',
  className = '',
  disabled = false,
}: MapboxAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar sugestões no Mapbox
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`;

      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'br',
        language: 'pt',
        limit: '5',
        types: 'address,place,poi',
      });

      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const parsed = data.features.map((feature) => {
          // Extrair componentes do endereço
          const context = feature.context || [];
          const cityContext = context.find((c) => c.id.startsWith('place'));
          const stateContext = context.find((c) => c.id.startsWith('region'));

          return {
            id: feature.id,
            placeName: feature.place_name,
            address: feature.text,
            city: cityContext?.text,
            state: stateContext?.short_code?.replace('BR-', ''),
            coordinates: {
              longitude: feature.center[0],
              latitude: feature.center[1],
            },
          };
        });

        setSuggestions(parsed);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce da busca
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Selecionar sugestão
  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.placeName);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Limpar campo
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />

        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        />

        {/* Loading ou Clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          ) : value && !disabled ? (
            <button
              onClick={handleClear}
              className="text-zinc-400 hover:text-white transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                index === selectedIndex ? 'bg-zinc-800' : ''
              }`}
              type="button"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {suggestion.address || suggestion.placeName.split(',')[0]}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {suggestion.city && suggestion.state
                      ? `${suggestion.city}, ${suggestion.state}`
                      : suggestion.placeName}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && !isLoading && value.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 text-center">
          <p className="text-sm text-zinc-400">Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  );
}
