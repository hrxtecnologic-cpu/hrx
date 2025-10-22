/**
 * Supplier Search Component
 *
 * Componente de busca avançada para fornecedores (baseado no AdvancedSearch de profissionais)
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, ChevronDown } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';

// =====================================================
// Types
// =====================================================

interface SupplierSearchProps {
  onSearch: (filters: {
    query?: string;
    status?: 'active' | 'inactive' | 'all';
    equipment_types?: string[];
  }) => void;
  totalResults?: number;
  isLoading?: boolean;
}

// Status options
const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo', color: 'bg-green-500' },
  { value: 'inactive', label: 'Inativo', color: 'bg-gray-500' },
] as const;

// =====================================================
// Main Component
// =====================================================

export function SupplierSearch({
  onSearch,
  totalResults,
  isLoading = false,
}: SupplierSearchProps) {
  // ========== State ==========
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auto-buscar ao carregar
  useEffect(() => {
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ========== Handlers ==========
  const handleSearch = () => {
    onSearch({
      query: searchQuery || undefined,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      equipment_types: selectedEquipmentTypes.length > 0 ? selectedEquipmentTypes : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedEquipmentTypes([]);
    onSearch({});
  };

  const toggleEquipmentType = (type: string) => {
    setSelectedEquipmentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Toggle categoria do accordion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Contar quantos equipamentos selecionados por categoria
  const getSelectedCountByCategory = (categoryName: string): number => {
    const category = EQUIPMENT_CATEGORIES.find(c => c.name === categoryName);
    if (!category) return 0;
    return category.subtypes.filter(s => selectedEquipmentTypes.includes(s.label)).length;
  };

  // Contar filtros ativos
  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    selectedEquipmentTypes.length;

  // ========== Render ==========
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por empresa, contato, email ou telefone..."
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

        {activeFiltersCount > 0 && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters Panel (Collapsible) */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <Label className="text-sm font-medium text-zinc-200 mb-3 block">Status</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-all"
                  checked={selectedStatus === 'all'}
                  onCheckedChange={() => setSelectedStatus('all')}
                  className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <label
                  htmlFor="status-all"
                  className="text-sm text-zinc-300 cursor-pointer select-none"
                >
                  Todos
                </label>
              </div>
              {STATUS_OPTIONS.map(status => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={selectedStatus === status.value}
                    onCheckedChange={() => setSelectedStatus(status.value)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label
                    htmlFor={`status-${status.value}`}
                    className="text-sm text-zinc-300 cursor-pointer select-none flex items-center gap-2"
                  >
                    <div className={cn('h-2 w-2 rounded-full', status.color)} />
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Types Filter - Accordion */}
          <div>
            <Label className="text-sm font-medium text-zinc-200 mb-3 block">
              Tipos de Equipamento
            </Label>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {EQUIPMENT_CATEGORIES.map((category) => {
                const isExpanded = expandedCategories.has(category.name);
                const selectedCount = getSelectedCountByCategory(category.name);

                return (
                  <div
                    key={category.name}
                    className="border border-zinc-800 bg-zinc-800/50 rounded-md overflow-hidden"
                  >
                    {/* Header da categoria */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.name)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-zinc-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                        <span className="text-sm font-medium text-zinc-200">
                          {category.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({category.subtypes.length})
                        </span>
                      </div>

                      {selectedCount > 0 && (
                        <Badge className="bg-red-600 text-white text-xs px-2 py-0.5">
                          {selectedCount}
                        </Badge>
                      )}
                    </button>

                    {/* Conteúdo expandido */}
                    {isExpanded && (
                      <div className="border-t border-zinc-700 px-3 py-2 bg-zinc-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {category.subtypes.map((subtype) => (
                            <div key={subtype.name} className="flex items-start space-x-2">
                              <Checkbox
                                id={`equipment-search-${category.name}-${subtype.name}`}
                                checked={selectedEquipmentTypes.includes(subtype.label)}
                                onCheckedChange={() => toggleEquipmentType(subtype.label)}
                                className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                              />
                              <label
                                htmlFor={`equipment-search-${category.name}-${subtype.name}`}
                                className="text-sm text-zinc-300 cursor-pointer select-none flex-1"
                              >
                                {subtype.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedEquipmentTypes.length > 0 && (
              <p className="text-xs text-zinc-500 mt-3">
                {selectedEquipmentTypes.length} tipo{selectedEquipmentTypes.length > 1 ? 's' : ''} selecionado{selectedEquipmentTypes.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-zinc-400">Filtros ativos:</span>
          {searchQuery && (
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              Busca: {searchQuery}
            </Badge>
          )}
          {selectedStatus !== 'all' && (
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              Status: {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}
            </Badge>
          )}
          {selectedEquipmentTypes.map(type => (
            <Badge
              key={type}
              variant="outline"
              className="bg-red-600/10 text-red-400 border-red-600/30"
            >
              {type}
              <button
                onClick={() => toggleEquipmentType(type)}
                className="ml-1 hover:text-red-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {totalResults !== undefined && (
        <div className="text-sm text-zinc-400">
          {isLoading ? (
            'Buscando...'
          ) : (
            <>
              {totalResults} {totalResults === 1 ? 'fornecedor encontrado' : 'fornecedores encontrados'}
            </>
          )}
        </div>
      )}
    </div>
  );
}
