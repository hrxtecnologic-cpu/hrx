/**
 * Project Equipment Section - GRANULAR
 *
 * Sistema granular: Cada equipamento pode ter fornecedores específicos
 * Permite sublocação de múltiplos fornecedores por projeto
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package,
  Plus,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle,
  Clock,
  Building2,
  X,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  company_name: string;
  contact_name?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address_city?: string;
  address_state?: string;
  equipment_types?: string[];
  notes?: string;
  status: 'active' | 'inactive';
}

interface ProjectEquipment {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  duration_days: number;
  status: 'pending' | 'quoting' | 'quoted';
}

interface ProjectEquipmentSectionProps {
  projectId: string;
  equipment: ProjectEquipment[];
  suppliers: Supplier[];
}

export function ProjectEquipmentSection({
  projectId,
  equipment,
  suppliers,
}: ProjectEquipmentSectionProps) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [addingEquipment, setAddingEquipment] = useState(false);

  // Modal de seleção de fornecedores para equipamento específico
  const [selectedEquipmentForQuote, setSelectedEquipmentForQuote] = useState<ProjectEquipment | null>(null);
  const [selectedSuppliersForEquipment, setSelectedSuppliersForEquipment] = useState<string[]>([]);
  const [sendingQuote, setSendingQuote] = useState(false);

  // Form de novo equipamento
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [days, setDays] = useState(1);

  // Extrair tipos únicos
  const allTypes = Array.from(
    new Set(suppliers.flatMap((s) => s.equipment_types || []))
  ).sort();

  // Filtrar fornecedores
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === 'all' ||
      supplier.equipment_types?.includes(selectedType);

    return matchesSearch && matchesType && supplier.status === 'active';
  });

  // Filtrar fornecedores que atendem a categoria do equipamento selecionado
  const relevantSuppliers = selectedEquipmentForQuote
    ? suppliers.filter(s =>
        s.status === 'active' &&
        (s.equipment_types?.includes(selectedEquipmentForQuote.category) ||
         s.equipment_types?.some(type =>
           selectedEquipmentForQuote.category.toLowerCase().includes(type.toLowerCase()) ||
           type.toLowerCase().includes(selectedEquipmentForQuote.category.toLowerCase())
         ))
      )
    : [];

  // Adicionar equipamento
  const handleAddEquipment = async () => {
    if (!equipmentName.trim() || !equipmentCategory.trim()) {
      toast.error('Preencha nome e categoria do equipamento');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/equipment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: equipmentName.trim(),
            category: equipmentCategory.trim(),
            description: equipmentDescription.trim(),
            quantity,
            duration_days: days,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar equipamento');
      }

      toast.success('Equipamento adicionado!');

      // Resetar form
      setAddingEquipment(false);
      setEquipmentName('');
      setEquipmentCategory('');
      setEquipmentDescription('');
      setQuantity(1);
      setDays(1);

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar equipamento');
      console.error('Erro:', error);
    }
  };

  // Remover equipamento
  const handleRemoveEquipment = async (equipmentId: string) => {
    if (!confirm('Deseja remover este equipamento?')) return;

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/equipment/${equipmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Erro ao remover equipamento');

      toast.success('Equipamento removido');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao remover equipamento');
      console.error('Erro:', error);
    }
  };

  // Abrir modal de cotação para equipamento específico
  const openQuoteModal = (equip: ProjectEquipment) => {
    setSelectedEquipmentForQuote(equip);
    setSelectedSuppliersForEquipment([]);
  };

  // Toggle supplier selection
  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliersForEquipment((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  // Enviar cotação para equipamento específico
  const handleRequestQuoteForEquipment = async () => {
    if (!selectedEquipmentForQuote || selectedSuppliersForEquipment.length === 0) {
      toast.error('Selecione pelo menos um fornecedor');
      return;
    }

    try {
      setSendingQuote(true);

      const requested_items = [{
        equipment_id: selectedEquipmentForQuote.id,
        name: selectedEquipmentForQuote.name,
        category: selectedEquipmentForQuote.category,
        description: selectedEquipmentForQuote.description,
        quantity: selectedEquipmentForQuote.quantity,
        duration_days: selectedEquipmentForQuote.duration_days,
      }];

      const response = await fetch(
        `/api/admin/event-projects/${projectId}/request-quotes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_ids: selectedSuppliersForEquipment,
            requested_items
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Erro ao solicitar cotações');
      }

      const data = await response.json();
      toast.success(
        `Cotação enviada para ${selectedSuppliersForEquipment.length} fornecedor(es)!`
      );

      // Fechar modal e resetar
      setSelectedEquipmentForQuote(null);
      setSelectedSuppliersForEquipment([]);

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar cotações');
      console.error('Erro:', error);
    } finally {
      setSendingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Equipamentos no Projeto */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              Equipamentos no Projeto ({equipment.length})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setAddingEquipment(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Equipamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulário de novo equipamento */}
          {addingEquipment && (
            <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">
                  Novo Equipamento
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAddingEquipment(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Nome do equipamento"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                <Input
                  placeholder="Categoria"
                  value={equipmentCategory}
                  onChange={(e) => setEquipmentCategory(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <Input
                placeholder="Descrição/especificações (opcional)"
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Dias</label>
                  <Input
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddEquipment}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          )}

          {/* Lista de Equipamentos */}
          {equipment.length > 0 ? (
            <div className="space-y-3">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-red-600" />
                        <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        {item.status === 'quoted' && (
                          <span className="text-xs bg-green-600/10 text-green-500 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Cotado
                          </span>
                        )}
                        {item.status === 'quoting' && (
                          <span className="text-xs bg-blue-600/10 text-blue-500 px-2 py-1 rounded flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Aguardando
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-zinc-400 mb-2 ml-6">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 ml-6 text-xs text-zinc-500">
                        <span>Qtd: {item.quantity}</span>
                        <span>Dias: {item.duration_days}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => openQuoteModal(item)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Solicitar Cotação
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveEquipment(item.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhum equipamento adicionado ainda
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Clique em "Adicionar Equipamento" acima
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 2: Catálogo de Fornecedores (Referência) */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-600" />
            Catálogo de Fornecedores ({suppliers.filter(s => s.status === 'active').length})
          </CardTitle>
          <p className="text-xs text-zinc-400 mt-1">
            Referência dos fornecedores disponíveis. Para solicitar cotação, use o botão em cada equipamento acima.
          </p>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-950 border-zinc-800 text-white"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm"
            >
              <option value="all">Todos os tipos</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Lista */}
          {filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {supplier.company_name}
                  </h3>
                  {supplier.contact_name && (
                    <p className="text-xs text-zinc-400 mb-2">
                      Contato: {supplier.contact_name}
                    </p>
                  )}
                  {supplier.equipment_types && supplier.equipment_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {supplier.equipment_types.map((type) => (
                        <span
                          key={type}
                          className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1 text-xs text-zinc-500">
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
                    {supplier.address_city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{supplier.address_city}/{supplier.address_state}</span>
                      </div>
                    )}
                  </div>
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
        </CardContent>
      </Card>

      {/* MODAL: Selecionar Fornecedores para Equipamento */}
      {selectedEquipmentForQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Solicitar Cotação
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {selectedEquipmentForQuote.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded">
                      {selectedEquipmentForQuote.category}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {selectedEquipmentForQuote.quantity}x por {selectedEquipmentForQuote.duration_days} dias
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedEquipmentForQuote(null);
                    setSelectedSuppliersForEquipment([]);
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Body - Lista de fornecedores */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Selecione os fornecedores que você quer cotar:
              </p>

              {relevantSuppliers.length > 0 ? (
                <div className="space-y-2">
                  {relevantSuppliers.map((supplier) => (
                    <label
                      key={supplier.id}
                      className="flex items-start gap-3 p-4 bg-zinc-950 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors border border-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSuppliersForEquipment.includes(supplier.id)}
                        onChange={() => toggleSupplier(supplier.id)}
                        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-600 focus:ring-offset-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{supplier.company_name}</p>
                        {supplier.contact_name && (
                          <p className="text-xs text-zinc-400 mt-1">Contato: {supplier.contact_name}</p>
                        )}
                        {supplier.equipment_types && supplier.equipment_types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {supplier.equipment_types.slice(0, 3).map((type) => (
                              <span
                                key={type}
                                className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhum fornecedor disponível para esta categoria
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Cadastre fornecedores que atendam "{selectedEquipmentForQuote.category}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800">
              <Button
                onClick={handleRequestQuoteForEquipment}
                disabled={selectedSuppliersForEquipment.length === 0 || sendingQuote}
                className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {sendingQuote ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Cotação para {selectedSuppliersForEquipment.length} Fornecedor(es)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
