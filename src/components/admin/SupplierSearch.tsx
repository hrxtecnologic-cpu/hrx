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

// Equipment types (mesma lista do formulário)
const EQUIPMENT_TYPES = [
  // Som
  'Sistema de Som',
  'Microfones',
  'Mesa de Som',
  'Caixas de Som',
  'Subwoofers',
  'Monitores de Retorno',
  // Iluminação
  'Iluminação Geral',
  'Iluminação Cênica',
  'Moving Lights',
  'Refletores LED',
  'Strobo',
  'Máquina de Fumaça',
  'Laser',
  // Audiovisual
  'Projetores',
  'Telões',
  'TVs/Monitores',
  'Câmeras',
  'Transmissão ao Vivo',
  // Estrutura
  'Palco/Tablado',
  'Tendas',
  'Barracas',
  'Camarotes',
  'Grades',
  'Fechamento',
  // Mobiliário
  'Mesas',
  'Cadeiras',
  'Sofás',
  'Puffs',
  'Bistrôs',
  'Longarinas',
  // Decoração
  'Decoração Temática',
  'Flores/Arranjos',
  'Tapetes',
  'Painéis',
  'Backdrop',
  'Balões',
  // Energia e Infraestrutura
  'Geradores',
  'Distribuição Elétrica',
  'Ar Condicionado',
  'Ventiladores',
  // Outros
  'Banheiros Químicos',
  'Seguranças/Equipe',
  'Outros Equipamentos',
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

          {/* Equipment Types Filter */}
          <div>
            <Label className="text-sm font-medium text-zinc-200 mb-3 block">
              Tipos de Equipamento
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {EQUIPMENT_TYPES.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`equipment-${type}`}
                    checked={selectedEquipmentTypes.includes(type)}
                    onCheckedChange={() => toggleEquipmentType(type)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label
                    htmlFor={`equipment-${type}`}
                    className="text-sm text-zinc-300 cursor-pointer select-none"
                  >
                    {type}
                  </label>
                </div>
              ))}
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
