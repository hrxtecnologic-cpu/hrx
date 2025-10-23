/**
 * Project Equipment Section - Nova UX
 *
 * Exibe equipamentos no projeto + catálogo de fornecedores
 * Com busca e filtros integrados
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
  DollarSign
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [showQuoteRequest, setShowQuoteRequest] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  // Dados do formulário de equipamento
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

      // Reload
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

  // Solicitar cotações para TODOS os equipamentos
  const handleRequestQuotes = async () => {
    if (selectedSuppliers.length === 0) {
      toast.error('Selecione pelo menos um fornecedor');
      return;
    }

    if (equipment.length === 0) {
      toast.error('Adicione equipamentos antes de solicitar cotações');
      return;
    }

    try {
      // Preparar lista de equipamentos solicitados
      const requested_items = equipment.map(item => ({
        equipment_id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        duration_days: item.duration_days,
      }));

      const response = await fetch(
        `/api/admin/event-projects/${projectId}/request-quotes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_ids: selectedSuppliers,
            requested_items
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Erro ao solicitar cotações');
      }

      const data = await response.json();
      toast.success(data.message || `${selectedSuppliers.length} cotações solicitadas!`);

      // Resetar
      setShowQuoteRequest(false);
      setSelectedSuppliers([]);

      // Reload
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar cotações');
      console.error('Erro:', error);
    }
  };

  // Toggle supplier selection
  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
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
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
                />
                <Input
                  placeholder="Categoria"
                  value={equipmentCategory}
                  onChange={(e) => setEquipmentCategory(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <Input
                placeholder="Descrição/especificações (opcional)"
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
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
                Adicionar Equipamento
              </Button>
            </div>
          )}

          {/* Lista de equipamentos */}
          {equipment.length > 0 ? (
            <div className="space-y-3">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        {item.status === 'quoted' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {item.status === 'quoting' && (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-zinc-400 ml-6 mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 ml-6 text-xs text-zinc-500">
                        <span>Qtd: {item.quantity} × {item.duration_days} dias</span>
                        <span className="capitalize">Status: {item.status}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveEquipment(item.id)}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botão único para solicitar cotações */}
              <div className="mt-6 pt-6 border-t border-zinc-800">
                {!showQuoteRequest ? (
                  <Button
                    onClick={() => setShowQuoteRequest(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Solicitar Cotações para Todos Equipamentos
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">
                        Selecione os fornecedores:
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowQuoteRequest(false);
                          setSelectedSuppliers([]);
                        }}
                        className="text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      A cotação será enviada com TODOS os {equipment.length} equipamento(s) acima
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => (
                          <label
                            key={supplier.id}
                            className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSuppliers.includes(supplier.id)}
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
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500 text-center py-4">
                          Nenhum fornecedor disponível
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleRequestQuotes}
                      disabled={selectedSuppliers.length === 0}
                      className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Cotação para {selectedSuppliers.length} Fornecedor(es)
                    </Button>
                  </div>
                )}
              </div>
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

      {/* Seção 2: Busca de Fornecedores */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-red-600" />
            Buscar Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por empresa, contato ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-red-600 focus:ring-red-600/20"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none"
            >
              <option value="all">Todos os tipos de equipamento</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Catálogo de Fornecedores */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-600" />
              Fornecedores Disponíveis ({filteredSuppliers.length})
            </div>
            {(searchTerm || selectedType !== 'all') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Limpar filtros
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-red-600/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {supplier.company_name}
                      </h3>
                      {supplier.contact_name && (
                        <p className="text-xs text-zinc-400">
                          Contato: {supplier.contact_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tipos de equipamento */}
                  {supplier.equipment_types && supplier.equipment_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {supplier.equipment_types.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                        >
                          {type}
                        </span>
                      ))}
                      {supplier.equipment_types.length > 3 && (
                        <span className="text-xs text-zinc-600">
                          +{supplier.equipment_types.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contato */}
                  <div className="space-y-1 mb-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Mail className="h-3 w-3" />
                      <a
                        href={`mailto:${supplier.email}`}
                        className="hover:text-red-500 transition-colors"
                      >
                        {supplier.email}
                      </a>
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Phone className="h-3 w-3" />
                        <a
                          href={`tel:${supplier.phone}`}
                          className="hover:text-red-500 transition-colors"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}
                    {supplier.address_city && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <MapPin className="h-3 w-3" />
                        <span>{supplier.address_city}/{supplier.address_state}</span>
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  {supplier.notes && (
                    <p className="text-xs text-zinc-600 italic mb-3 line-clamp-2">
                      {supplier.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {searchTerm || selectedType !== 'all'
                  ? 'Nenhum fornecedor encontrado com esses filtros'
                  : 'Nenhum fornecedor cadastrado'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
