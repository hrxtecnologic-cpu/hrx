/**
 * Advanced Search Hook
 *
 * React hook reutilizável para busca avançada de profissionais
 *
 * Features:
 * - Gerenciamento de estado de busca
 * - Debouncing para texto
 * - Paginação
 * - Filtros múltiplos
 * - Busca por proximidade geográfica
 * - Loading e error states
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// =====================================================
// Types
// =====================================================

export interface SearchFilters {
  query?: string;
  status?: string[];
  categories?: string[];
  hasExperience?: boolean;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'distance' | 'createdAt' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = unknown> {
  professionals: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UseAdvancedSearchReturn<T = unknown> {
  // Estado
  results: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;

  // Filtros atuais
  filters: SearchFilters;
  options: SearchOptions;

  // Ações
  search: (newFilters?: Partial<SearchFilters>, newOptions?: Partial<SearchOptions>) => Promise<void>;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setOptions: (options: Partial<SearchOptions>) => void;
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
}

// =====================================================
// Hook Configuration
// =====================================================

const DEFAULT_OPTIONS: SearchOptions = {
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc',
};

const DEBOUNCE_DELAY = 500; // ms

// =====================================================
// useAdvancedSearch Hook
// =====================================================

export function useAdvancedSearch<T = unknown>(
  initialFilters: SearchFilters = {},
  initialOptions: SearchOptions = DEFAULT_OPTIONS,
  autoSearch: boolean = false
): UseAdvancedSearchReturn<T> {
  // ========== Estado ==========
  const [results, setResults] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFiltersState] = useState<SearchFilters>(initialFilters);
  const [options, setOptionsState] = useState<SearchOptions>({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  });

  // Refs para debouncing
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // ========== Função de Busca ==========
  const search = useCallback(
    async (
      newFilters?: Partial<SearchFilters>,
      newOptions?: Partial<SearchOptions>
    ) => {
      // Cancelar request anterior se existir
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      // Merge filters e options
      const searchFilters = { ...filters, ...newFilters };
      const searchOptions = { ...options, ...newOptions };

      setIsLoading(true);
      setError(null);

      logger.debug('Iniciando busca', { searchFilters, searchOptions });

      try {
        const response = await fetch('/api/admin/professionals/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...searchFilters,
            ...searchOptions,
          }),
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}`);
        }

        const data: SearchResult<T> = await response.json();

        setResults(data.professionals);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setHasMore(data.hasMore);

        // Atualizar estado de filtros e options se mudaram
        if (newFilters) {
          setFiltersState(prev => ({ ...prev, ...newFilters }));
        }
        if (newOptions) {
          setOptionsState(prev => ({ ...prev, ...newOptions }));
        }

        logger.info('Busca concluída', {
          total: data.total,
          returned: data.professionals.length,
        });
      } catch (err: unknown) {
        if (err.name === 'AbortError') {
          logger.debug('Busca cancelada');
          return;
        }

        const errorMessage = err.message || 'Erro ao realizar busca';
        setError(errorMessage);
        logger.error('Erro na busca', err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, options]
  );

  // ========== Debounced Search ==========
  const debouncedSearch = useCallback(
    (newFilters?: Partial<SearchFilters>, newOptions?: Partial<SearchOptions>) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        search(newFilters, newOptions);
      }, DEBOUNCE_DELAY);
    },
    [search]
  );

  // ========== Setters com Auto-Search ==========
  const setFilters = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      setFiltersState(prev => ({ ...prev, ...newFilters }));

      // Resetar para página 1 quando filtros mudarem
      setOptionsState(prev => ({ ...prev, page: 1 }));

      // Auto-search com debounce (para texto) ou imediato (para outros filtros)
      if (newFilters.query !== undefined) {
        debouncedSearch({ ...filters, ...newFilters }, { ...options, page: 1 });
      } else if (autoSearch) {
        search({ ...filters, ...newFilters }, { ...options, page: 1 });
      }
    },
    [filters, options, autoSearch, search, debouncedSearch]
  );

  const setOptions = useCallback(
    (newOptions: Partial<SearchOptions>) => {
      setOptionsState(prev => ({ ...prev, ...newOptions }));

      if (autoSearch) {
        search(filters, { ...options, ...newOptions });
      }
    },
    [filters, options, autoSearch, search]
  );

  // ========== Paginação ==========
  const nextPage = useCallback(() => {
    if (hasMore) {
      setOptions({ page: (options.page || 1) + 1 });
    }
  }, [hasMore, options.page, setOptions]);

  const previousPage = useCallback(() => {
    if ((options.page || 1) > 1) {
      setOptions({ page: (options.page || 1) - 1 });
    }
  }, [options.page, setOptions]);

  // ========== Reset ==========
  const reset = useCallback(() => {
    setFiltersState(initialFilters);
    setOptionsState({ ...DEFAULT_OPTIONS, ...initialOptions });
    setResults([]);
    setTotal(0);
    setTotalPages(0);
    setHasMore(false);
    setError(null);
  }, [initialFilters, initialOptions]);

  // ========== Auto-Search on Mount ==========
  useEffect(() => {
    if (autoSearch) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Apenas uma vez no mount

  // ========== Cleanup ==========
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // ========== Return ==========
  return {
    // Estado
    results,
    total,
    page: options.page || 1,
    totalPages,
    hasMore,
    isLoading,
    error,

    // Filtros e options atuais
    filters,
    options,

    // Ações
    search,
    setFilters,
    setOptions,
    nextPage,
    previousPage,
    reset,
  };
}

// =====================================================
// Hook Específico para Busca por Proximidade
// =====================================================

export interface UseProximitySearchOptions {
  autoDetectLocation?: boolean;
  defaultRadius?: number;
}

export function useProximitySearch<T = unknown>(
  baseFilters: SearchFilters = {},
  searchOptions: SearchOptions = DEFAULT_OPTIONS,
  options: UseProximitySearchOptions = {}
) {
  const { autoDetectLocation = false, defaultRadius = 50 } = options;

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  // Detectar localização do usuário
  useEffect(() => {
    if (autoDetectLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          logger.info('Localização detectada', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          setLocationError('Não foi possível obter sua localização');
          logger.error('Erro ao obter localização', error);
        }
      );
    }
  }, [autoDetectLocation]);

  // Criar filtros com localização
  const filtersWithLocation: SearchFilters = {
    ...baseFilters,
    ...(userLocation && {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: defaultRadius,
    }),
  };

  const searchHook = useAdvancedSearch<T>(filtersWithLocation, searchOptions, false);

  return {
    ...searchHook,
    userLocation,
    locationError,
    setUserLocation,
  };
}
