'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Check, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Professional {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  categories: string[];
  status: string;
}

interface TeamBatchSelectionProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TEAM_CATEGORIES = [
  'Direção',
  'Produção',
  'Técnica',
  'Audiovisual',
  'Segurança',
  'Apoio',
  'Outro',
];

export function TeamBatchSelection({ projectId, isOpen, onClose }: TeamBatchSelectionProps) {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Shared configuration for all selected professionals
  const [sharedConfig, setSharedConfig] = useState({
    role: '',
    category: '',
    subcategory: '',
    quantity: 1,
    duration_days: 1,
    daily_rate: 0,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfessionals();
    }
  }, [isOpen]);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/professionals?status=approved');
      if (response.ok) {
        const data = await response.json();
        setProfessionals(data || []);
      } else {
        toast.error('Erro ao carregar profissionais');
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  const toggleProfessional = (professionalId: string) => {
    setSelectedProfessionals(prev => {
      if (prev.includes(professionalId)) {
        return prev.filter(id => id !== professionalId);
      } else {
        return [...prev, professionalId];
      }
    });
  };

  const handleAddTeamMembers = async () => {
    if (selectedProfessionals.length === 0) {
      toast.error('Selecione pelo menos um profissional');
      return;
    }

    if (!sharedConfig.role || !sharedConfig.category) {
      toast.error('Preencha função e categoria');
      return;
    }

    setSaving(true);

    try {
      const promises = selectedProfessionals.map(professionalId => {
        const payload = {
          professional_id: professionalId,
          role: sharedConfig.role,
          category: sharedConfig.category,
          subcategory: sharedConfig.subcategory || '',
          quantity: sharedConfig.quantity || 1,
          duration_days: sharedConfig.duration_days || 1,
          daily_rate: sharedConfig.daily_rate || 0,
          notes: sharedConfig.notes || '',
        };

        console.log('📤 Sending team member:', payload);

        return fetch(`/api/admin/event-projects/${projectId}/team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            console.error('❌ Failed to add team member:', data);
          }
          return res;
        });
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} profissional(is) adicionado(s) à equipe`);
        router.refresh();

        // Reset state
        setSelectedProfessionals([]);
        setSharedConfig({
          role: '',
          category: '',
          subcategory: '',
          quantity: 1,
          duration_days: 1,
          daily_rate: 0,
          notes: '',
        });

        onClose();
      }

      if (failCount > 0) {
        toast.error(`${failCount} profissional(is) não pôde(ram) ser adicionado(s)`);
      }
    } catch (error) {
      console.error('Erro ao adicionar membros:', error);
      toast.error('Erro ao adicionar membros à equipe');
    } finally {
      setSaving(false);
    }
  };

  // Filter professionals
  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prof.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from all professionals
  const availableCategories = Array.from(
    new Set(professionals.flatMap(p => p.categories))
  ).sort();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-red-600" />
            Seleção em Massa - Equipe do Projeto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shared Configuration Section */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-800/30">
            <h3 className="text-sm font-semibold text-white mb-3">Configuração Compartilhada</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Essas informações serão aplicadas a todos os profissionais selecionados
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-zinc-300">Função *</Label>
                <Input
                  id="role"
                  placeholder="Ex: Coordenador, Assistente..."
                  value={sharedConfig.role}
                  onChange={(e) => setSharedConfig(prev => ({ ...prev, role: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-zinc-300">Categoria *</Label>
                <Select
                  value={sharedConfig.category}
                  onValueChange={(value) => setSharedConfig(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {TEAM_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-white focus:bg-zinc-800 focus:text-white">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-zinc-300">Subcategoria</Label>
                <Input
                  id="subcategory"
                  placeholder="Opcional"
                  value={sharedConfig.subcategory}
                  onChange={(e) => setSharedConfig(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-zinc-300">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={sharedConfig.quantity}
                  onChange={(e) => setSharedConfig(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_days" className="text-zinc-300">Dias de Trabalho</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={sharedConfig.duration_days}
                  onChange={(e) => setSharedConfig(prev => ({ ...prev, duration_days: Number(e.target.value) }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily_rate" className="text-zinc-300">Valor por Dia (R$)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={sharedConfig.daily_rate}
                  onChange={(e) => setSharedConfig(prev => ({ ...prev, daily_rate: Number(e.target.value) }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="notes" className="text-zinc-300">Observações</Label>
              <Input
                id="notes"
                placeholder="Observações gerais (opcional)"
                value={sharedConfig.notes}
                onChange={(e) => setSharedConfig(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all" className="text-white focus:bg-zinc-800 focus:text-white">Todas categorias</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-white focus:bg-zinc-800 focus:text-white">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection Counter */}
          <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
            <span className="text-sm text-zinc-300">
              {selectedProfessionals.length} profissional(is) selecionado(s)
            </span>
            {selectedProfessionals.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProfessionals([])}
                className="text-red-400 hover:text-red-300"
              >
                Limpar seleção
              </Button>
            )}
          </div>

          {/* Professionals Grid */}
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Carregando profissionais...</p>
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="py-12 text-center bg-zinc-800/50 rounded-lg border border-zinc-700">
              <p className="text-sm text-zinc-500">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Nenhum profissional encontrado com os filtros aplicados'
                  : 'Nenhum profissional aprovado disponível'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredProfessionals.map(professional => {
                const isSelected = selectedProfessionals.includes(professional.id);

                return (
                  <div
                    key={professional.id}
                    className={`p-3 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-600/10 border-red-600'
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                    }`}
                    onClick={() => toggleProfessional(professional.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">
                          {professional.full_name}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">{professional.email}</p>
                        <p className="text-xs text-zinc-400">{professional.phone}</p>
                        {professional.categories.length > 0 && (
                          <p className="text-xs text-zinc-500 mt-1">
                            {professional.categories.slice(0, 2).join(', ')}
                            {professional.categories.length > 2 && '...'}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                        isSelected
                          ? 'bg-red-600 border-red-600'
                          : 'border-zinc-600'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddTeamMembers}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white"
              disabled={saving || selectedProfessionals.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Adicionar {selectedProfessionals.length} Profissional(is)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
