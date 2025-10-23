'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ChevronDown, Package, Users, Search, Send, Building2, Mail, Phone, MapPin, Loader2, Briefcase, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CATEGORIES_WITH_SUBCATEGORIES } from '@/lib/categories-subcategories';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';
import { TeamBatchSelection } from './TeamBatchSelection';

// NOTA: Categorias de profissionais devem vir do arquivo central
// Vamos importar CATEGORIES_WITH_SUBCATEGORIES no topo do arquivo

interface ProjectInfo {
  event_name: string;
  event_date: string | null;
  event_type: string;
  venue_name: string | null;
  venue_city: string;
  venue_state: string;
  expected_attendance: number | null;
  internal_notes?: string | null;
  additional_notes?: string | null;
}

interface AddTeamMemberButtonProps {
  projectId: string;
  project?: ProjectInfo;
  onSuccess?: () => void;
}

export function AddTeamMemberButton({ projectId, project, onSuccess }: AddTeamMemberButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [searchingProfessionals, setSearchingProfessionals] = useState(false);
  const [nearbyProfessionals, setNearbyProfessionals] = useState<any[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [formData, setFormData] = useState({
    professional_id: '',
    role: '',
    category: '',
    quantity: 1,
    duration_days: 1,
    daily_rate: '',
    external_name: '',
    notes: '',
  });

  // Extrair profissionais solicitados das notas internas
  const getRequestedProfessionals = () => {
    if (!project?.internal_notes) return [];

    try {
      const match = project.internal_notes.match(/Profissionais solicitados:\s*(\[[\s\S]*?\])/);
      if (match) {
        const professionalsArray = JSON.parse(match[1]);
        return professionalsArray;
      }
    } catch (error) {
      console.error('Erro ao parsear profissionais:', error);
    }
    return [];
  };

  const requestedProfessionals = getRequestedProfessionals();

  // Buscar profissionais próximos quando categoria muda
  const searchNearbyProfessionals = async (category: string) => {
    if (!category || !geolocationEnabled) return;

    setSearchingProfessionals(true);
    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/nearby-professionals?category=${category}`
      );
      const data = await response.json();

      setNearbyProfessionals(data.professionals || []);

      if (data.professionals?.length === 0) {
        toast.info(`Nenhum profissional de ${category} encontrado na região. Digite o nome manualmente.`);
      } else {
        toast.success(`${data.professionals.length} profissional(is) encontrado(s) próximo(s)!`);
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setNearbyProfessionals([]);
    } finally {
      setSearchingProfessionals(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/event-projects/${projectId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar membro');
      }

      toast.success('Membro adicionado à equipe com sucesso!');
      setIsOpen(false);
      setFormData({
        professional_id: '',
        role: '',
        category: '',
        quantity: 1,
        duration_days: 1,
        daily_rate: '',
        external_name: '',
        notes: '',
      });
      setNearbyProfessionals([]);
      setSelectedProfessional(null);

      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="bg-red-600 hover:bg-red-500 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Membro
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Adicionar Membro à Equipe</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Adicione um profissional à equipe deste projeto
            </DialogDescription>
          </DialogHeader>

          {/* Toggle de Geolocalização */}
          <div className="pb-4 border-b border-zinc-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={geolocationEnabled}
                onChange={(e) => {
                  setGeolocationEnabled(e.target.checked);
                  setNearbyProfessionals([]);
                }}
                className="w-4 h-4 text-red-600 bg-zinc-800 border-zinc-700 rounded focus:ring-red-600 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-200">
                  Buscar profissionais próximos ao local do evento
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {geolocationEnabled
                    ? 'Sistema buscará automaticamente profissionais próximos ao selecionar categoria'
                    : 'Modo manual - adicione profissionais sem busca por localização'}
                </p>
              </div>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profissionais Solicitados (apenas quando geolocation desabilitado) */}
            {!geolocationEnabled && requestedProfessionals.length > 0 && (
              <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-blue-400" />
                  <Label className="text-sm font-medium text-blue-200">
                    Profissionais Solicitados pelo Cliente
                  </Label>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {requestedProfessionals.map((prof: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                              {prof.quantity}
                            </span>
                            <span className="text-zinc-200 font-medium text-sm">
                              {prof.category}
                            </span>
                          </div>
                          {prof.category_group && (
                            <p className="text-xs text-zinc-400 mt-1 ml-8">
                              Grupo: {prof.category_group}
                            </p>
                          )}
                          {prof.requirements && (
                            <p className="text-xs text-zinc-300 mt-2 ml-8 italic">
                              Requisitos: {prof.requirements}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {project?.event_date && (
                  <div className="mt-3 pt-3 border-t border-blue-900/30">
                    <p className="text-xs text-zinc-400">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {new Date(project.event_date).toLocaleDateString('pt-BR')} • {project.venue_city}, {project.venue_state}
                    </p>
                  </div>
                )}
                <p className="text-xs text-blue-300 mt-3 pt-2 border-t border-blue-900/30">
                  💡 Use esta lista como referência para montar a equipe do evento
                </p>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-zinc-200">
                    Categoria *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value, role: '' });
                      searchNearbyProfessionals(value);
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2 [&>span]:text-white">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                      {CATEGORIES_WITH_SUBCATEGORIES.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name} className="text-white">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {searchingProfessionals && (
                    <p className="text-xs text-blue-400 mt-1.5 flex items-center gap-1">
                      <Search className="h-3 w-3 animate-spin" />
                      Buscando profissionais próximos...
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-zinc-200">
                    Função Específica *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={!formData.category}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2 [&>span]:text-white disabled:opacity-50">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                      {formData.category &&
                        CATEGORIES_WITH_SUBCATEGORIES.find((cat) => cat.name === formData.category)?.subcategories.map((subcat) => (
                          <SelectItem key={subcat.name} value={subcat.label} className="text-white">
                            {subcat.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Profissionais Cadastrados Próximos */}
              {nearbyProfessionals.length > 0 && (
                <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-blue-400" />
                    <Label className="text-sm font-medium text-blue-200">
                      Profissionais Cadastrados Próximos ({nearbyProfessionals.length})
                    </Label>
                  </div>
                  <Select
                    value={selectedProfessional?.id || ''}
                    onValueChange={(value) => {
                      const prof = nearbyProfessionals.find(p => p.id === value);
                      setSelectedProfessional(prof);
                      setFormData({
                        ...formData,
                        professional_id: value,
                        external_name: prof ? prof.full_name : '',
                      });
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                      <SelectValue placeholder="Selecione um profissional ou digite manualmente abaixo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[200px]">
                      {nearbyProfessionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id} className="text-white">
                          <div className="flex flex-col">
                            <span className="font-medium">{prof.full_name}</span>
                            <span className="text-xs text-zinc-400">
                              {prof.city}, {prof.state} • {prof.phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProfessional && (
                    <div className="mt-2 p-2 bg-zinc-800/50 rounded text-xs text-zinc-300">
                      <p><strong>Email:</strong> {selectedProfessional.email}</p>
                      <p><strong>Tel:</strong> {selectedProfessional.phone}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="external_name" className="text-sm font-medium text-zinc-200">
                  {nearbyProfessionals.length > 0 ? 'Ou digite o nome manualmente' : 'Nome do Profissional (Opcional)'}
                </Label>
                <Input
                  id="external_name"
                  value={formData.external_name}
                  onChange={(e) => {
                    setFormData({ ...formData, external_name: e.target.value, professional_id: '' });
                    setSelectedProfessional(null);
                  }}
                  placeholder="Se já souber quem será, informe aqui"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  disabled={!!selectedProfessional}
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  {selectedProfessional
                    ? 'Desmarque o profissional acima para digitar manualmente'
                    : 'Deixe em branco para alocar depois'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-zinc-200">
                    Quantidade *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration_days" className="text-sm font-medium text-zinc-200">
                    Dias *
                  </Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="daily_rate" className="text-sm font-medium text-zinc-200">
                    Diária (R$) *
                  </Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                    placeholder="0,00"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-800/50 rounded-lg text-sm">
                <p className="text-zinc-400 mb-1">Custo Estimado:</p>
                <p className="text-white font-semibold text-lg">
                  R${' '}
                  {(
                    (parseFloat(formData.daily_rate) || 0) *
                    formData.quantity *
                    formData.duration_days
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {formData.quantity} pessoa(s) × {formData.duration_days} dia(s) = R${' '}
                  {parseFloat(formData.daily_rate || '0').toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-zinc-200">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais sobre este membro da equipe..."
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-white text-white hover:bg-red-600 hover:border-red-600"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
              >
                {loading ? 'Adicionando...' : 'Adicionar à Equipe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AddEquipmentButtonProps {
  projectId: string;
  project?: ProjectInfo;
  onSuccess?: () => void;
}

// =============================================
// Wrapper component that provides both team addition options
// =============================================
interface TeamActionsButtonsProps {
  projectId: string;
  project?: ProjectInfo;
}

export function TeamActionsButtons({ projectId, project }: TeamActionsButtonsProps) {
  const [batchSelectionOpen, setBatchSelectionOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => setBatchSelectionOpen(true)}
        size="sm"
        className="bg-red-600 hover:bg-red-500 text-white"
      >
        <Users className="h-4 w-4 mr-2" />
        Seleção em Massa
      </Button>
      <AddTeamMemberButton projectId={projectId} project={project} />
      <TeamBatchSelection
        projectId={projectId}
        isOpen={batchSelectionOpen}
        onClose={() => setBatchSelectionOpen(false)}
      />
    </div>
  );
}

export function AddEquipmentButton({ projectId, project, onSuccess }: AddEquipmentButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchingSuppliers, setSearchingSuppliers] = useState(false);
  const [nearbySuppliers, setNearbySuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    name: '',
    category: '',
    description: '',
    quantity: 1,
    duration_days: 1,
    notes: '',
  });

  // Extrair equipamentos solicitados das notas internas
  const getRequestedEquipment = () => {
    if (!project?.internal_notes) return [];

    try {
      const match = project.internal_notes.match(/Equipamentos:\s*([^\n]+)/);
      if (match) {
        const equipmentList = match[1]
          .split(',')
          .map(item => item.trim())
          .filter(item => item && item !== 'Nenhuma');
        return equipmentList;
      }
    } catch (error) {
      console.error('Erro ao parsear equipamentos:', error);
    }
    return [];
  };

  const requestedEquipment = getRequestedEquipment();

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Buscar fornecedores próximos quando categoria de equipamento muda
  const searchNearbySuppliers = async (equipmentType: string) => {
    if (!equipmentType || !geolocationEnabled) return;

    setSearchingSuppliers(true);
    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/nearby-suppliers?equipmentType=${equipmentType}`
      );
      const data = await response.json();

      setNearbySuppliers(data.suppliers || []);

      if (data.suppliers?.length === 0) {
        toast.info(`Nenhum fornecedor de ${equipmentType} encontrado na região. Você pode adicionar manualmente.`);
      } else {
        toast.success(`${data.suppliers.length} fornecedor(es) encontrado(s) próximo(s)!`);
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setNearbySuppliers([]);
    } finally {
      setSearchingSuppliers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/event-projects/${projectId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar equipamento');
      }

      toast.success('Equipamento adicionado com sucesso!');
      setIsOpen(false);
      setFormData({
        supplier_id: '',
        name: '',
        category: '',
        description: '',
        quantity: 1,
        duration_days: 1,
        notes: '',
      });
      setNearbySuppliers([]);
      setSelectedSupplier(null);
      setExpandedCategories(new Set());

      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="bg-red-600 hover:bg-red-500 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Equipamento
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Adicionar Equipamento</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Adicione equipamento necessário para este projeto
            </DialogDescription>
          </DialogHeader>

          {/* Toggle de Geolocalização */}
          <div className="pb-4 border-b border-zinc-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={geolocationEnabled}
                onChange={(e) => {
                  setGeolocationEnabled(e.target.checked);
                  setNearbySuppliers([]);
                }}
                className="w-4 h-4 text-red-600 bg-zinc-800 border-zinc-700 rounded focus:ring-red-600 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-200">
                  Buscar fornecedores próximos ao local do evento
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {geolocationEnabled
                    ? 'Sistema buscará automaticamente fornecedores próximos ao selecionar categoria'
                    : 'Modo manual - adicione equipamentos sem busca por localização'}
                </p>
              </div>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Equipamentos Solicitados (apenas quando geolocation desabilitado) */}
            {!geolocationEnabled && requestedEquipment.length > 0 && (
              <div className="p-4 bg-orange-950/20 border border-orange-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-orange-400" />
                  <Label className="text-sm font-medium text-orange-200">
                    Equipamentos Solicitados pelo Cliente ({requestedEquipment.length})
                  </Label>
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-2">
                    {requestedEquipment.map((equipment: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm"
                      >
                        <span className="text-orange-400">▪</span>
                        <span className="text-zinc-200 text-xs">{equipment}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {project?.event_date && (
                  <div className="mt-3 pt-3 border-t border-orange-900/30">
                    <p className="text-xs text-zinc-400">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {new Date(project.event_date).toLocaleDateString('pt-BR')} • {project.venue_city}, {project.venue_state}
                    </p>
                  </div>
                )}
                <p className="text-xs text-orange-300 mt-3 pt-2 border-t border-orange-900/30">
                  💡 Use esta lista como referência para cotar e adicionar equipamentos ao projeto
                </p>
              </div>
            )}

            {/* Seleção por Categoria - Accordion */}
            <div className="pt-4 border-t border-zinc-800">
              <Label className="text-sm font-medium text-zinc-200">
                Selecione o Tipo de Equipamento *
              </Label>
              <p className="text-xs text-zinc-500 mt-1 mb-3">
                Escolha uma categoria e depois o tipo específico
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {EQUIPMENT_CATEGORIES.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);

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
                        </div>
                        {formData.category && category.subtypes.find(s => s.label === formData.name) && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            Selecionado
                          </span>
                        )}
                      </button>

                      {/* Conteúdo expandido */}
                      {isExpanded && (
                        <div className="px-3 py-2 space-y-1 bg-zinc-900/50">
                          {category.subtypes.map((subtype) => (
                            <button
                              key={subtype.name}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  name: subtype.label,
                                  category: category.name,
                                });
                                searchNearbySuppliers(category.name);
                              }}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                                formData.name === subtype.label
                                  ? 'bg-red-600 text-white'
                                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                              )}
                            >
                              {subtype.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {formData.name && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">
                     Selecionado: <strong>{formData.name}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Fornecedores Próximos */}
            {nearbySuppliers.length > 0 && (
              <div className="p-4 bg-orange-950/20 border border-orange-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-orange-400" />
                  <Label className="text-sm font-medium text-orange-200">
                    Fornecedores Cadastrados Próximos ({nearbySuppliers.length})
                  </Label>
                </div>

                {searchingSuppliers && (
                  <div className="flex items-center gap-2 text-orange-300 text-sm mb-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Buscando fornecedores...</span>
                  </div>
                )}

                <Select
                  value={selectedSupplier?.id || ''}
                  onValueChange={(value) => {
                    const supplier = nearbySuppliers.find(s => s.id === value);
                    setSelectedSupplier(supplier);
                    setFormData({
                      ...formData,
                      supplier_id: value,
                    });
                  }}
                >
                  <SelectTrigger className="bg-zinc-800 border-orange-900/50 text-white">
                    <SelectValue placeholder="Selecione um fornecedor ou deixe em branco para buscar manualmente" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {nearbySuppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id}
                        className="text-white hover:bg-zinc-700 cursor-pointer"
                      >
                        <div className="flex flex-col py-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-orange-400" />
                            <span className="font-medium">{supplier.company_name}</span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {supplier.city} - {supplier.state}
                            </span>
                            {supplier.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {supplier.phone}
                              </span>
                            )}
                          </div>
                          {supplier.note && (
                            <div className="mt-1">
                              {supplier.note.includes('Mesmo município') ? (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                  ✓ {supplier.note}
                                </span>
                              ) : (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                                  ⚠ {supplier.note}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedSupplier && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      ✓ Fornecedor: <strong>{selectedSupplier.company_name}</strong>
                    </p>
                    {selectedSupplier.contact_name && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Contato: {selectedSupplier.contact_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Detalhes do Equipamento */}
            <div className="space-y-5">
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-zinc-200">
                  Descrição / Especificações
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Caixa de 2000W, entrada XLR..."
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-zinc-200">
                    Quantidade *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration_days" className="text-sm font-medium text-zinc-200">
                    Dias de Locação *
                  </Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-zinc-200">
                  Observações Adicionais
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais sobre este equipamento..."
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-white text-white hover:bg-red-600 hover:border-red-600"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
              >
                {loading ? 'Adicionando...' : 'Adicionar Equipamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  equipment_types: string[];
  pricing?: {
    daily?: string;
    three_days?: string;
    weekly?: string;
    discount_notes?: string;
  };
}

interface RequestQuotesButtonProps {
  projectId: string;
  equipmentId: string;
  equipmentType: string;
  onSuccess?: () => void;
}

export function RequestQuotesButton({
  projectId,
  equipmentId,
  equipmentType,
  onSuccess
}: RequestQuotesButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar fornecedores ao abrir o modal
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await fetch(
        `/api/admin/suppliers?equipmentType=${encodeURIComponent(equipmentType)}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar fornecedores');
      }

      const data = await response.json();
      setSuppliers(data || []);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchSuppliers();
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSuppliers.length === 0) {
      toast.error('Selecione pelo menos um fornecedor');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/equipment/${equipmentId}/request-quotes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplier_ids: selectedSuppliers }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao solicitar cotações');
      }

      const result = await response.json();
      toast.success(`${result.count || selectedSuppliers.length} cotação(ões) solicitada(s) com sucesso!`);
      setIsOpen(false);
      setSelectedSuppliers([]);

      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar fornecedores por busca
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Button
        onClick={handleOpen}
        size="sm"
        className="bg-yellow-600 hover:bg-yellow-500 text-white"
      >
        <Send className="h-4 w-4 mr-2" />
        Solicitar Cotações
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Solicitar Cotações</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Selecione os fornecedores que deseja solicitar cotação para: <strong>{equipmentType}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Busca */}
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-zinc-200">
                Buscar Fornecedor
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome da empresa ou contato..."
                  className="bg-zinc-800 border-zinc-700 text-white pl-10"
                />
              </div>
            </div>

            {/* Lista de Fornecedores */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-zinc-200">
                  Fornecedores Disponíveis ({filteredSuppliers.length})
                </Label>
                <p className="text-xs text-zinc-500">
                  {selectedSuppliers.length} selecionado(s)
                </p>
              </div>

              {loadingSuppliers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                  <p className="text-sm text-zinc-400">Buscando fornecedores...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-8 bg-zinc-800/50 rounded-lg">
                  <Building2 className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {searchTerm
                      ? 'Nenhum fornecedor encontrado com esse termo'
                      : `Nenhum fornecedor cadastrado para "${equipmentType}"`}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Cadastre fornecedores na seção de Fornecedores
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredSuppliers.map((supplier) => {
                    const isSelected = selectedSuppliers.includes(supplier.id);

                    return (
                      <div
                        key={supplier.id}
                        onClick={() => toggleSupplier(supplier.id)}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'bg-red-600/20 border-red-600'
                            : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox visual */}
                          <div
                            className={cn(
                              'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              isSelected
                                ? 'bg-red-600 border-red-600'
                                : 'border-zinc-600'
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>

                          {/* Info do fornecedor */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                              <p className="text-sm font-semibold text-white truncate">
                                {supplier.company_name}
                              </p>
                            </div>
                            <p className="text-xs text-zinc-400 mb-2">
                              Contato: {supplier.contact_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                              {supplier.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {supplier.email}
                                </span>
                              )}
                              {supplier.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {supplier.phone}
                                </span>
                              )}
                            </div>
                            {supplier.pricing && (
                              <div className="mt-2 pt-2 border-t border-zinc-700/50 flex gap-3 text-xs">
                                {supplier.pricing.daily && (
                                  <span className="text-zinc-500">
                                    Diária: <span className="text-white">{supplier.pricing.daily}</span>
                                  </span>
                                )}
                                {supplier.pricing.weekly && (
                                  <span className="text-zinc-500">
                                    Semanal: <span className="text-white">{supplier.pricing.weekly}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo */}
            {selectedSuppliers.length > 0 && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">
                  ✓ {selectedSuppliers.length} fornecedor(es) será(ão) contatado(s) por email
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Eles receberão um link para responder a cotação com preços
                </p>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-white text-white hover:bg-red-600 hover:border-red-600"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedSuppliers.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
              >
                {loading ? 'Enviando...' : `Solicitar ${selectedSuppliers.length || ''} Cotação(ões)`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================
// SendProposalButton - Enviar proposta final ao cliente
// ============================================

interface SendProposalButtonProps {
  projectId: string;
  clientEmail: string;
  clientName: string;
  hasTeamMembers: boolean;
  hasEquipment: boolean;
  projectStatus: string;
  onSuccess?: () => void;
}

export function SendProposalButton({
  projectId,
  clientEmail,
  clientName,
  hasTeamMembers,
  hasEquipment,
  projectStatus,
  onSuccess,
}: SendProposalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSendProposal = (hasTeamMembers || hasEquipment) && clientEmail;
  const alreadySent = projectStatus === 'proposed' || projectStatus === 'approved' || projectStatus === 'completed';

  const handleSendProposal = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/event-projects/${projectId}/send-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar proposta');
      }

      toast.success(`Proposta enviada para ${clientEmail}!`, {
        description: `Valor total: R$ ${data.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });

      setIsOpen(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast.error('Erro ao enviar proposta', {
        description: error.message || 'Tente novamente mais tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!canSendProposal}
        className="bg-green-600 hover:bg-green-700 text-white"
        title={
          !canSendProposal
            ? !clientEmail
              ? 'Projeto sem email do cliente'
              : 'Adicione profissionais ou equipamentos primeiro'
            : alreadySent
            ? 'Proposta já foi enviada'
            : 'Enviar proposta final ao cliente'
        }
      >
        <Send className="h-4 w-4 mr-2" />
        {alreadySent ? 'Reenviar Proposta' : 'Enviar Proposta Final'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Send className="h-6 w-6 text-green-500" />
              Enviar Proposta Final
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Confirme o envio da proposta comercial completa para o cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Destinatário */}
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Destinatário</span>
              </div>
              <p className="text-white font-medium">{clientName}</p>
              <p className="text-sm text-zinc-400">{clientEmail}</p>
            </div>

            {/* Conteúdo da Proposta */}
            <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">
                  Conteúdo da Proposta
                </span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Dados completos do evento
                </li>
                {hasTeamMembers && (
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Equipe de profissionais selecionados com valores
                  </li>
                )}
                {hasEquipment && (
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Equipamentos selecionados com valores
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Valor total da proposta
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Forma de pagamento (50% início + 50% final)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Observação sobre impostos (16% IOF)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Botões para aceitar/rejeitar proposta
                </li>
              </ul>
            </div>

            {/* Aviso */}
            <div className="p-3 bg-yellow-950/20 border border-yellow-900/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-xs text-yellow-200">
                  <p className="font-medium mb-1">Importante:</p>
                  <p>
                    • O status do projeto será alterado para "Proposta Enviada"
                    <br />
                    • O cliente receberá um email com todos os detalhes e valores
                    <br />
                    • A proposta tem validade de 7 dias
                    <br />
                    {alreadySent && '• Uma nova proposta será enviada substituindo a anterior'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSendProposal}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Proposta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
