/**
 * Supplier Search Hook
 *
 * Hook para busca avançada de fornecedores
 */

'use client';

import { useState, useCallback } from 'react';

// =====================================================
// Types
// =====================================================

export interface SupplierSearchFilters {
  query?: string;
  status?: 'active' | 'inactive' | 'all';
  equipment_types?: string[];
}

export interface SupplierSearchOptions {
  page?: number;
  limit?: number;
}

export interface SupplierSearchResult<T = any> {
  suppliers: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UseSupplierSearchReturn<T = any> {
  // Estado
  results: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;

  // Filtros atuais
  filters: SupplierSearchFilters;
  options: SupplierSearchOptions;

  // Ações
  search: (newFilters?: Partial<SupplierSearchFilters>, newOptions?: Partial<SupplierSearchOptions>) => Promise<void>;
  setFilters: (filters: Partial<SupplierSearchFilters>) => void;
  setOptions: (options: Partial<SupplierSearchOptions>) => void;
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
}

// =====================================================
// Hook Configuration
// =====================================================

const DEFAULT_OPTIONS: SupplierSearchOptions = {
  page: 1,
  limit: 20,
};

// =====================================================
// useSupplierSearch Hook
// =====================================================

export function useSupplierSearch<T = any>(
  initialFilters: SupplierSearchFilters = {},
  initialOptions: SupplierSearchOptions = DEFAULT_OPTIONS
): UseSupplierSearchReturn<T> {
  // ========== Estado ==========
  const [results, setResults] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFiltersState] = useState<SupplierSearchFilters>(initialFilters);
  const [options, setOptionsState] = useState<SupplierSearchOptions>(initialOptions);

  // ========== Busca ==========
  const search = useCallback(async (
    newFilters?: Partial<SupplierSearchFilters>,
    newOptions?: Partial<SupplierSearchOptions>
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentFilters = { ...filters, ...newFilters };
      const currentOptions = { ...options, ...newOptions };

      // Atualizar estado
      setFiltersState(currentFilters);
      setOptionsState(currentOptions);

      const response = await fetch('/api/admin/suppliers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentFilters,
          ...currentOptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar fornecedores');
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Erro na busca de fornecedores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setResults([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, options]);

  // ========== Helpers ==========
  const setFilters = useCallback((newFilters: Partial<SupplierSearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setOptions = useCallback((newOptions: Partial<SupplierSearchOptions>) => {
    setOptionsState(prev => ({ ...prev, ...newOptions }));
  }, []);

  const nextPage = useCallback(() => {
    const currentPage = options.page || 1;
    if (currentPage < totalPages) {
      search(undefined, { page: currentPage + 1 });
    }
  }, [options.page, totalPages, search]);

  const previousPage = useCallback(() => {
    const currentPage = options.page || 1;
    if (currentPage > 1) {
      search(undefined, { page: currentPage - 1 });
    }
  }, [options.page, search]);

  const reset = useCallback(() => {
    setFiltersState(initialFilters);
    setOptionsState(initialOptions);
    setResults([]);
    setTotal(0);
    setTotalPages(0);
    setError(null);
  }, [initialFilters, initialOptions]);

  // ========== Estado computado ==========
  const hasMore = (options.page || 1) < totalPages;

  return {
    // Estado
    results,
    total,
    page: options.page || 1,
    totalPages,
    hasMore,
    isLoading,
    error,

    // Filtros
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
