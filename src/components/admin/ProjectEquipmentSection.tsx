/**
 * Project Equipment Section - REESTRUTURADO
 *
 * UX IGUAL à aba de Equipe:
 * - Demanda do cliente (equipamentos solicitados)
 * - Fornecedores selecionados / Equipamentos
 * - Adicionar equipamentos via TABS (Sugestões vs Todos)
 * - Sistema de seleção: escolhe fornecedor → vê equipamentos dele
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Sparkles,
  Award,
  Filter,
  Briefcase,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  equipment_types?: string[];
  notes?: string;
  status: 'active' | 'inactive';
}

interface SuggestedSupplier extends Supplier {
  distance_km: number;
  total_score: number;
  distance_score: number;
  equipment_score: number;
  performance_score: number;
}

interface ProjectEquipment {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  duration_days: number;
  daily_rate?: number;
  total_cost?: number;
  supplier?: Supplier;
  status?: 'pending' | 'quoting' | 'quoted' | 'confirmed';
}

interface EquipmentNeeded {
  category: string;
  subcategory?: string;
  quantity: number;
  notes?: string;
}

interface ProjectEquipmentSectionProps {
  projectId: string;
  equipment: ProjectEquipment[];
  suppliers: Supplier[];
  equipmentNeeded: EquipmentNeeded[];
}

export function ProjectEquipmentSection({
  projectId,
  equipment,
  suppliers,
  equipmentNeeded,
}: ProjectEquipmentSectionProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sendingQuotes, setSendingQuotes] = useState(false);
  const [addingEquipment, setAddingEquipment] = useState<string | null>(null);

  // Sugestões
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<SuggestedSupplier[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Seleção de fornecedor e equipamentos
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [supplierEquipment, setSupplierEquipment] = useState<any[]>([]);
  const [equipmentPrices, setEquipmentPrices] = useState<{ [key: string]: { quantity: number; daily_rate: number; days: number } }>({});

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Extrair tipos e estados
  const allTypes = Array.from(
    new Set(suppliers.flatMap((s) => s.equipment_types || []))
  ).sort();

  const allStates = Array.from(
    new Set(suppliers.map((s) => s.state).filter(Boolean))
  ).sort();

  // Carregar sugestões (SEM LIMITE DE DISTÂNCIA)
  useEffect(() => {
    loadSuggestions();
  }, [projectId]);

  async function loadSuggestions() {
    try {
      setLoadingSuggestions(true);

      const requiredTypes = equipmentNeeded?.map(need => need.category).filter(Boolean) || [];

      const params = new URLSearchParams();
      if (requiredTypes.length > 0) {
        params.append('equipment_types', requiredTypes.join(','));
      }
      params.append('min_score', '0'); // Score mínimo 0 para mostrar todos
      params.append('limit', '100');

      const response = await fetch(`/api/admin/event-projects/${projectId}/suggested-suppliers?${params}`);

      if (response.ok) {
        const result = await response.json();
        setSuggestedSuppliers(result.data?.suppliers || []);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Filtrar fornecedores disponíveis
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === 'all' || supplier.equipment_types?.includes(selectedType);

    const matchesState =
      selectedState === 'all' || supplier.state === selectedState;

    const alreadyInProject = equipment.some(
      (item) => item.supplier?.id === supplier.id
    );

    return matchesSearch && matchesType && matchesState && !alreadyInProject && supplier.status === 'active';
  });

  // Selecionar fornecedor - usar equipamentos da demanda do cliente
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedEquipmentIds([]);

    // Usar equipamentos da demanda do cliente (equipment_needed)
    // Transformar para o formato esperado
    const clientEquipment = (equipmentNeeded || []).map((need, index) => ({
      id: `need-${index}`,
      name: need.category,
      category: need.category,
      description: need.notes || need.subcategory,
      quantity: need.quantity || 1,
      daily_rate: need.estimated_daily_rate || 0, // Usar valor do cliente se tiver
    }));

    // Se não tiver nenhum equipamento na demanda, criar um padrão para o admin adicionar
    if (clientEquipment.length === 0) {
      setSupplierEquipment([{
        id: 'manual-1',
        name: 'Equipamento (defina o nome)',
        category: supplier.equipment_types?.[0] || 'Geral',
        description: '',
        quantity: 1,
        daily_rate: 0,
      }]);
    } else {
      setSupplierEquipment(clientEquipment);
    }
  };

  // Toggle seleção de equipamento
  const toggleEquipmentSelection = (equipmentId: string) => {
    setSelectedEquipmentIds(prev => {
      const isSelected = prev.includes(equipmentId);

      if (isSelected) {
        // Remover seleção e limpar preços
        const newPrices = { ...equipmentPrices };
        delete newPrices[equipmentId];
        setEquipmentPrices(newPrices);
        return prev.filter(id => id !== equipmentId);
      } else {
        // Adicionar seleção e inicializar preços
        const equipment = supplierEquipment.find(e => e.id === equipmentId);
        setEquipmentPrices({
          ...equipmentPrices,
          [equipmentId]: {
            quantity: equipment?.quantity || 1,
            daily_rate: equipment?.daily_rate || 0,
            days: 1,
          },
        });
        return [...prev, equipmentId];
      }
    });
  };

  // Atualizar preço/quantidade de equipamento
  const updateEquipmentPrice = (equipmentId: string, field: 'quantity' | 'daily_rate' | 'days', value: number) => {
    setEquipmentPrices({
      ...equipmentPrices,
      [equipmentId]: {
        ...equipmentPrices[equipmentId],
        [field]: value,
      },
    });
  };

  // Adicionar equipamentos selecionados ao projeto
  const handleAddSelectedEquipment = async () => {
    if (!selectedSupplier || selectedEquipmentIds.length === 0) {
      toast.error('Selecione pelo menos um equipamento');
      return;
    }

    try {
      setAddingEquipment(selectedSupplier.id);

      // Adicionar cada equipamento selecionado com preços definidos
      for (const equipmentId of selectedEquipmentIds) {
        const equipmentItem = supplierEquipment.find(e => e.id === equipmentId);
        const prices = equipmentPrices[equipmentId];

        if (!equipmentItem || !prices) continue;

        const response = await fetch(
          `/api/admin/event-projects/${projectId}/equipment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplier_id: selectedSupplier.id,
              name: equipmentItem.name,
              category: equipmentItem.category || selectedSupplier.equipment_types?.[0] || 'Geral',
              description: equipmentItem.description,
              quantity: prices.quantity,
              duration_days: prices.days,
              daily_rate: prices.daily_rate,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao adicionar equipamento');
        }
      }

      toast.success(`${selectedEquipmentIds.length} equipamento(s) adicionado(s) ao projeto!`);
      setSelectedSupplier(null);
      setSelectedEquipmentIds([]);
      setSupplierEquipment([]);
      setEquipmentPrices({});

      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar equipamentos');
    } finally {
      setAddingEquipment(null);
    }
  };

  // Remover equipamento
  const handleRemove = async (equipmentId: string) => {
    if (!confirm('Deseja remover este equipamento do projeto?')) return;

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/equipment/${equipmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Erro ao remover equipamento');

      toast.success('Equipamento removido do projeto');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao remover equipamento');
    }
  };

  // Enviar cotação individual
  const handleSendQuote = async (equipmentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/equipment/${equipmentId}/request-quotes`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao enviar cotação:', errorData);
        throw new Error(errorData.error || 'Erro ao enviar cotação');
      }

      const result = await response.json();
      console.log('Cotação enviada:', result);
      toast.success(`Cotação enviada para ${result.supplierEmail}!`);

      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error(error.message || 'Erro ao enviar cotação');
      throw error; // Re-throw para o handleSendAllQuotes capturar
    }
  };

  // Enviar TODAS as cotações de uma vez
  const handleSendAllQuotes = async () => {
    const pendingItems = equipment.filter(
      e => e.supplier && e.status !== 'confirmed' && e.status !== 'quoted'
    );

    if (pendingItems.length === 0) {
      toast.info('Não há cotações pendentes para enviar');
      return;
    }

    if (!confirm(`Enviar cotações para ${pendingItems.length} equipamentos?`)) return;

    try {
      setSendingQuotes(true);

      for (const item of pendingItems) {
        await handleSendQuote(item.id);
      }

      toast.success(`${pendingItems.length} cotações enviadas com sucesso!`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Erro ao enviar algumas cotações');
    } finally {
      setSendingQuotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DEMANDA DO CLIENTE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-red-600" />
            Demanda do Cliente ({equipmentNeeded?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipmentNeeded && equipmentNeeded.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipmentNeeded.map((need, index) => (
                <div
                  key={index}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-semibold text-white">{need.category}</p>
                  </div>
                  {need.subcategory && (
                    <p className="text-xs text-zinc-400 ml-6 mb-1">{need.subcategory}</p>
                  )}
                  <p className="text-xs text-zinc-500 ml-6">
                    Quantidade: {need.quantity}
                  </p>
                  {need.notes && (
                    <p className="text-xs text-zinc-600 ml-6 mt-1">{need.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhuma demanda de equipamento registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. FORNECEDORES SELECIONADOS / EQUIPAMENTOS */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-600" />
              Fornecedores Selecionados / Equipamentos ({equipment.length})
            </div>
            {equipment.length > 0 && (
              <Button
                size="sm"
                onClick={handleSendAllQuotes}
                disabled={sendingQuotes}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sendingQuotes ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Todas as Cotações
                  </>
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.length > 0 ? (
            <div className="space-y-3">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      {/* Status Badge */}
                      {item.status === 'confirmed' && (
                        <span className="text-xs bg-green-600/10 text-green-500 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmado
                        </span>
                      )}
                      {item.status === 'quoted' && (
                        <span className="text-xs bg-blue-600/10 text-blue-500 px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Cotação Recebida
                        </span>
                      )}
                      {item.status === 'quoting' && (
                        <span className="text-xs bg-yellow-600/10 text-yellow-500 px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Aguardando Cotação
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 mb-2">
                      {item.supplier
                        ? item.supplier.company_name
                        : 'Fornecedor não definido'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span>Qtd: {item.quantity} × {item.duration_days} dias</span>
                      {item.daily_rate && (
                        <span>Diária: {formatCurrency(item.daily_rate)}</span>
                      )}
                      {item.total_cost && (
                        <span className="text-green-500 font-medium">
                          Total: {formatCurrency(item.total_cost)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(item.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Total */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">
                    Total de Equipamentos
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    {formatCurrency(
                      equipment.reduce((sum, e) => sum + (e.total_cost || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhum equipamento selecionado ainda
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Adicione fornecedores e equipamentos usando as abas abaixo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. ADICIONAR EQUIPAMENTOS - COM TABS */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-600" />
            Adicionar Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sugestoes" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-950 mb-6">
              <TabsTrigger
                value="sugestoes"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Sugestões ({suggestedSuppliers.length})
              </TabsTrigger>
              <TabsTrigger
                value="todos"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Todos ({filteredSuppliers.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: SUGESTÕES */}
            <TabsContent value="sugestoes" className="space-y-4">
              <p className="text-xs text-zinc-400 mb-4">
                Fornecedores ordenados por compatibilidade (distância + tipos de equipamento + performance)
              </p>

              {loadingSuggestions ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-red-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-zinc-400">Calculando sugestões...</p>
                </div>
              ) : suggestedSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {suggestedSuppliers.slice(0, 10).map((supplier) => (
                    <div
                      key={supplier.id}
                      className={`p-4 bg-zinc-950 border rounded-lg hover:border-red-800/40 transition-all cursor-pointer ${
                        selectedSupplier?.id === supplier.id
                          ? 'border-red-600 ring-2 ring-red-600/20'
                          : 'border-red-900/20'
                      }`}
                      onClick={() => handleSelectSupplier(supplier)}
                    >
                      {/* Score Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          {supplier.company_name}
                        </h3>
                        <div className="flex items-center gap-1 bg-red-600/20 border border-red-600/40 px-2 py-1 rounded-full">
                          <Award className="h-3 w-3 text-red-500" />
                          <span className="text-xs font-bold text-red-500">
                            {Math.round(supplier.total_score)}
                          </span>
                        </div>
                      </div>

                      {/* Localização */}
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{supplier.city}/{supplier.state}</span>
                        <span className="text-red-500">• {supplier.distance_km.toFixed(1)}km</span>
                      </div>

                      {/* Tipos de Equipamento */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {supplier.equipment_types?.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className="text-xs bg-red-600/10 text-red-500 border border-red-600/20 px-2 py-0.5 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      {/* Contato */}
                      <div className="space-y-1 mb-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                        {supplier.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Indicador de Seleção */}
                      {selectedSupplier?.id === supplier.id && (
                        <div className="mt-3 pt-3 border-t border-red-600/20">
                          <p className="text-xs text-red-500 font-medium">✓ Selecionado - veja equipamentos abaixo</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhuma sugestão disponível no momento
                  </p>
                </div>
              )}

              {/* SEÇÃO: Equipamentos do Fornecedor Selecionado (Sugestões) */}
              {selectedSupplier && (
                <Card className="bg-zinc-900 border-red-900/30 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-red-600" />
                        Equipamentos de {selectedSupplier.company_name}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSupplier(null);
                          setSelectedEquipmentIds([]);
                          setSupplierEquipment([]);
                        }}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supplierEquipment.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400">
                          Selecione os equipamentos que deseja adicionar ao projeto:
                        </p>

                        <div className="space-y-2">
                          {supplierEquipment.map((equip: any) => {
                            const isSelected = selectedEquipmentIds.includes(equip.id);
                            const prices = equipmentPrices[equip.id];

                            return (
                              <div
                                key={equip.id}
                                className={`p-4 bg-zinc-950 rounded-lg border transition-colors ${
                                  isSelected ? 'border-red-600' : 'border-zinc-800'
                                }`}
                              >
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleEquipmentSelection(equip.id)}
                                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-600 focus:ring-offset-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-white">{equip.name}</p>
                                      {equip.category && (
                                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-0.5 rounded">
                                          {equip.category}
                                        </span>
                                      )}
                                    </div>
                                    {equip.description && (
                                      <p className="text-xs text-zinc-400 mb-2">{equip.description}</p>
                                    )}
                                    <p className="text-xs text-zinc-500">
                                      Solicitado: {equip.quantity} {equip.quantity > 1 ? 'unidades' : 'unidade'}
                                    </p>
                                  </div>
                                </label>

                                {/* Inputs de Preço/Quantidade - Aparece quando selecionado */}
                                {isSelected && prices && (
                                  <div className="mt-3 pt-3 border-t border-red-600/20 grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="text-xs text-zinc-400 mb-1 block">Qtd</label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={prices.quantity}
                                        onChange={(e) => updateEquipmentPrice(equip.id, 'quantity', parseInt(e.target.value) || 1)}
                                        className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-zinc-400 mb-1 block">Dias</label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={prices.days}
                                        onChange={(e) => updateEquipmentPrice(equip.id, 'days', parseInt(e.target.value) || 1)}
                                        className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-zinc-400 mb-1 block">Diária (R$)</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={prices.daily_rate}
                                        onChange={(e) => updateEquipmentPrice(equip.id, 'daily_rate', parseFloat(e.target.value) || 0)}
                                        className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                                      />
                                    </div>
                                    {prices.daily_rate > 0 && (
                                      <div className="col-span-3">
                                        <p className="text-xs text-green-500 font-medium">
                                          Total: {formatCurrency(prices.quantity * prices.days * prices.daily_rate)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          onClick={handleAddSelectedEquipment}
                          disabled={selectedEquipmentIds.length === 0 || !!addingEquipment}
                          className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        >
                          {addingEquipment ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar {selectedEquipmentIds.length} Equipamento(s) ao Projeto
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">
                          Este fornecedor ainda não tem equipamentos cadastrados
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          Cadastre equipamentos na página de Fornecedores
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB: TODOS */}
            <TabsContent value="todos" className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nome ou email..."
                      className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Tipo de Equipamento</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm"
                  >
                    <option value="all">Todos</option>
                    {allTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Estado</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm"
                  >
                    <option value="all">Todos</option>
                    {allStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista */}
              {filteredSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className={`p-4 bg-zinc-950 border rounded-lg hover:border-zinc-700 transition-colors cursor-pointer ${
                        selectedSupplier?.id === supplier.id
                          ? 'border-red-600 ring-2 ring-red-600/20'
                          : 'border-zinc-800'
                      }`}
                      onClick={() => handleSelectSupplier(supplier)}
                    >
                      <h3 className="text-sm font-semibold text-white mb-2">
                        {supplier.company_name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{supplier.city}/{supplier.state}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {supplier.equipment_types?.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-1 mb-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                        {supplier.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>

                      {selectedSupplier?.id === supplier.id && (
                        <div className="mt-3 pt-3 border-t border-red-600/20">
                          <p className="text-xs text-red-500 font-medium">✓ Selecionado</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Filter className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhum fornecedor encontrado com esses filtros
                  </p>
                </div>
              )}

              {/* SEÇÃO: Equipamentos do Fornecedor Selecionado */}
              {selectedSupplier && (
                <Card className="bg-zinc-900 border-red-900/30 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-red-600" />
                        Equipamentos de {selectedSupplier.company_name}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSupplier(null);
                          setSelectedEquipmentIds([]);
                          setSupplierEquipment([]);
                        }}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supplierEquipment.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400">
                          Selecione os equipamentos que deseja adicionar ao projeto:
                        </p>

                        <div className="space-y-2">
                          {supplierEquipment.map((equip: any) => {
                            const isSelected = selectedEquipmentIds.includes(equip.id);
                            const prices = equipmentPrices[equip.id];

                            return (
                              <div
                                key={equip.id}
                                className={`p-4 bg-zinc-950 rounded-lg border transition-colors ${
                                  isSelected ? 'border-red-600' : 'border-zinc-800'
                                }`}
                              >
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleEquipmentSelection(equip.id)}
                                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-600 focus:ring-offset-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-white">{equip.name}</p>
                                      {equip.category && (
                                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-0.5 rounded">
                                          {equip.category}
                                        </span>
                                      )}
                                    </div>
                                    {equip.description && (
                                      <p className="text-xs text-zinc-400 mb-2">{equip.description}</p>
                                    )}
                                    <p className="text-xs text-zinc-500">
                                      Solicitado: {equip.quantity} {equip.quantity > 1 ? 'unidades' : 'unidade'}
                                    </p>
                                  </div>
                                </label>

                                {/* Inputs de Preço/Quantidade - Aparece quando selecionado */}
                                {isSelected && prices && (
                                  <div className="mt-3 pt-3 border-t border-red-600/20 grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="text-xs text-zinc-400 mb-1 block">Qtd</label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={prices.quantity}
                                        onChange={(e) => updateEquipmentPrice(equip.id, 'quantity', parseInt(e.target.value) || 1)}
                                        className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-zinc-400 mb-1 block">Dias</label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={prices.days}
                                        onChange={(e) => updateEquipmentPrice(equip.id, 'days', parseInt(e.target.value) || 1)}
                                        className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-zinc-400 mb-1 block">Diária (R$)</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={prices.daily_rate}
                                        onChange={(e) => updateEquipmentPrice(equip.id, 'daily_rate', parseFloat(e.target.value) || 0)}
                                        className="h-8 bg-zinc-900 border-zinc-700 text-white text-sm"
                                      />
                                    </div>
                                    {prices.daily_rate > 0 && (
                                      <div className="col-span-3">
                                        <p className="text-xs text-green-500 font-medium">
                                          Total: {formatCurrency(prices.quantity * prices.days * prices.daily_rate)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          onClick={handleAddSelectedEquipment}
                          disabled={selectedEquipmentIds.length === 0 || !!addingEquipment}
                          className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        >
                          {addingEquipment ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar {selectedEquipmentIds.length} Equipamento(s) ao Projeto
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">
                          Este fornecedor ainda não tem equipamentos cadastrados
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          Cadastre equipamentos na página de Fornecedores
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
