/**
 * Advanced Search Component
 *
 * Componente reutilizável de busca avançada para profissionais
 *
 * Features:
 * - Busca por texto (nome, CPF, email, telefone, endereço)
 * - Filtros múltiplos (status, categorias, cidade, estado, experiência)
 * - Busca por proximidade geográfica com mapa
 * - Paginação
 * - Ordenação
 * - Responsivo
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Filter, X, Loader2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAdvancedSearch, SearchFilters } from '@/hooks/useAdvancedSearch';
import { RADIUS_PRESETS, formatDistance } from '@/lib/geo-utils';
import { getAllCategoryNames } from '@/lib/categories-subcategories';
import { cn } from '@/lib/utils';

// =====================================================
// Types
// =====================================================

interface AdvancedSearchProps<T = any> {
  onResultsChange?: (results: T[]) => void;
  initialFilters?: SearchFilters;
  showProximitySearch?: boolean;
  showStatusFilter?: boolean;
  showCategoryFilter?: boolean;
  showExperienceFilter?: boolean;
  className?: string;
}

// Status options
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejeitado', color: 'bg-red-500' },
  { value: 'incomplete', label: 'Incompleto', color: 'bg-gray-500' },
] as const;

// Category options - importadas do sistema completo
const CATEGORY_OPTIONS = getAllCategoryNames();

// Brazilian states
const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

// =====================================================
// Main Component
// =====================================================

export function AdvancedSearch<T = any>({
  onResultsChange,
  initialFilters = {},
  showProximitySearch = true,
  showStatusFilter = true,
  showCategoryFilter = true,
  showExperienceFilter = true,
  className,
}: AdvancedSearchProps<T>) {
  // ========== State ==========
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [hasExperience, setHasExperience] = useState<boolean | undefined>(undefined);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [radius, setRadius] = useState<number>(50);
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });

  // ========== Search Hook ==========
  const {
    results,
    total,
    page,
    totalPages,
    isLoading,
    error,
    search,
    setFilters,
    nextPage,
    previousPage,
  } = useAdvancedSearch<T>(initialFilters, { limit: 20 }, false);

  // Notificar parent sobre mudanças nos resultados
  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  // ========== Handlers ==========
  const handleSearch = () => {
    const filters: SearchFilters = {
      query: searchQuery || undefined,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      city: selectedCity || undefined,
      state: selectedState || undefined,
      hasExperience,
    };

    // Adicionar busca por proximidade se habilitada
    if (proximityEnabled && manualLocation.lat && manualLocation.lng) {
      filters.latitude = parseFloat(manualLocation.lat);
      filters.longitude = parseFloat(manualLocation.lng);
      filters.radius = radius;
    }

    search(filters, { page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus([]);
    setSelectedCategories([]);
    setSelectedState('');
    setSelectedCity('');
    setHasExperience(undefined);
    setProximityEnabled(false);
    setManualLocation({ lat: '', lng: '' });
    search({}, { page: 1 });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const detectUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setManualLocation({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          });
          setProximityEnabled(true);
        },
        error => {
          alert('Não foi possível obter sua localização. Por favor, insira manualmente.');
        }
      );
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.');
    }
  };

  // Contar filtros ativos
  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedStatus.length +
    selectedCategories.length +
    (selectedCity ? 1 : 0) +
    (selectedState ? 1 : 0) +
    (hasExperience !== undefined ? 1 : 0) +
    (proximityEnabled ? 1 : 0);

  // ========== Render ==========
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por nome, CPF, email, telefone, endereço..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={cn(
            'border-zinc-800 text-white hover:bg-zinc-800',
            showFilters && 'bg-zinc-800'
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-red-600 text-white">{activeFiltersCount}</Badge>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 ml-2 transition-transform',
              showFilters && 'rotate-180'
            )}
          />
        </Button>

        <Button onClick={handleSearch} className="bg-red-600 hover:bg-red-500 text-white">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6 space-y-6">
          {/* Status Filter */}
          {showStatusFilter && (
            <div>
              <Label className="text-white text-sm font-semibold mb-3 block">Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      'border-2',
                      selectedStatus.includes(status.value)
                        ? `${status.color} text-white border-transparent`
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          {showCategoryFilter && (
            <div>
              <Label className="text-white text-sm font-semibold mb-3 block">Categorias</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                      className="border-zinc-700"
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm text-zinc-300 cursor-pointer"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Estado</Label>
              <Select value={selectedState || "all"} onValueChange={(val) => setSelectedState(val === "all" ? "" : val)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white text-sm font-semibold mb-2 block">Cidade</Label>
              <Input
                type="text"
                placeholder="Digite a cidade..."
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          {/* Experience Filter */}
          {showExperienceFilter && (
            <div>
              <Label className="text-white text-sm font-semibold mb-3 block">Experiência</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setHasExperience(undefined)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all border-2',
                    hasExperience === undefined
                      ? 'bg-red-600 text-white border-transparent'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => setHasExperience(true)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all border-2',
                    hasExperience === true
                      ? 'bg-red-600 text-white border-transparent'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                  )}
                >
                  Com experiência
                </button>
                <button
                  onClick={() => setHasExperience(false)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all border-2',
                    hasExperience === false
                      ? 'bg-red-600 text-white border-transparent'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                  )}
                >
                  Sem experiência
                </button>
              </div>
            </div>
          )}

          {/* Proximity Search */}
          {showProximitySearch && (
            <div className="border-t border-zinc-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-white text-sm font-semibold">Busca por Proximidade</Label>
                <Checkbox
                  id="proximity-enabled"
                  checked={proximityEnabled}
                  onCheckedChange={(checked) => setProximityEnabled(checked as boolean)}
                  className="border-zinc-700"
                />
              </div>

              {proximityEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      type="text"
                      placeholder="Latitude"
                      value={manualLocation.lat}
                      onChange={e => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <Input
                      type="text"
                      placeholder="Longitude"
                      value={manualLocation.lng}
                      onChange={e => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <Button
                      onClick={detectUserLocation}
                      variant="outline"
                      className="border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Detectar
                    </Button>
                  </div>

                  <div>
                    <Label className="text-white text-sm mb-2 block">Raio de busca</Label>
                    <div className="flex flex-wrap gap-2">
                      {RADIUS_PRESETS.filter(p => p.value > 0).map(preset => (
                        <button
                          key={preset.value}
                          onClick={() => setRadius(preset.value)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-sm font-medium transition-all border-2',
                            radius === preset.value
                              ? 'bg-red-600 text-white border-transparent'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-zinc-800">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <Button
              onClick={handleSearch}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Mostrando {results.length} de {total} profissionais
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} ativo${activeFiltersCount > 1 ? 's' : ''})`}
          </span>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={previousPage}
                disabled={page === 1}
                size="sm"
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Anterior
              </Button>
              <span className="text-white">
                Página {page} de {totalPages}
              </span>
              <Button
                onClick={nextPage}
                disabled={page >= totalPages}
                size="sm"
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && total === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg mb-2">Nenhum profissional encontrado</p>
          <p className="text-zinc-500 text-sm">
            Tente ajustar os filtros ou fazer uma nova busca
          </p>
        </div>
      )}
    </div>
  );
}
