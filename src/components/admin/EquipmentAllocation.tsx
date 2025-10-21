'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Plus, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  equipment_types: string[];
  status: string;
}

interface EquipmentItem {
  item: string;
  quantity: number;
}

interface EquipmentAllocationItem {
  equipmentName: string;
  quantity: number;
  supplierId: string;
  estimatedBudget?: number;
  notes?: string;
}

interface Props {
  requestId: string;
  equipmentList: EquipmentItem[];
  currentStatus: string;
}

export function EquipmentAllocation({ requestId, equipmentList, currentStatus }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allocations, setAllocations] = useState<EquipmentAllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Buscar fornecedores ativos
      const suppliersResponse = await fetch('/api/admin/suppliers?status=active');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
      }

      // Buscar alocações existentes
      const allocationsResponse = await fetch(`/api/admin/requests/${requestId}/equipment-allocations`);
      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        if (allocationsData && allocationsData.allocations) {
          console.log('✅ Carregando alocações de equipamentos existentes:', allocationsData.allocations);
          setAllocations(allocationsData.allocations);
          setNotes(allocationsData.notes || '');
        } else {
          // Inicializar com equipamentos da solicitação
          const initialAllocations = equipmentList.map(item => ({
            equipmentName: item.item,
            quantity: item.quantity,
            supplierId: '',
            estimatedBudget: 0,
            notes: '',
          }));
          setAllocations(initialAllocations);
        }
      } else {
        // Inicializar com equipamentos da solicitação
        const initialAllocations = equipmentList.map(item => ({
          equipmentName: item.item,
          quantity: item.quantity,
          supplierId: '',
          estimatedBudget: 0,
          notes: '',
        }));
        setAllocations(initialAllocations);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar dados:', error);
      toast.error('Erro ao carregar dados');

      // Em caso de erro, inicializar com equipamentos da solicitação
      const initialAllocations = equipmentList.map(item => ({
        equipmentName: item.item,
        quantity: item.quantity,
        supplierId: '',
        estimatedBudget: 0,
        notes: '',
      }));
      setAllocations(initialAllocations);
    } finally {
      setLoading(false);
    }
  };

  const addEquipmentItem = () => {
    setAllocations([...allocations, {
      equipmentName: '',
      quantity: 1,
      supplierId: '',
      estimatedBudget: 0,
      notes: '',
    }]);
  };

  const removeEquipmentItem = (index: number) => {
    const updated = allocations.filter((_, i) => i !== index);
    setAllocations(updated);
  };

  const updateAllocation = (index: number, field: keyof EquipmentAllocationItem, value: any) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const handleSave = async () => {
    // Validar se todos os campos obrigatórios foram preenchidos
    const invalidAllocations = allocations.filter(
      a => !a.equipmentName || !a.supplierId || a.quantity <= 0
    );

    if (invalidAllocations.length > 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios (equipamento, quantidade e fornecedor)');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/equipment-allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations, notes }),
      });

      if (response.ok) {
        toast.success('Equipamentos alocados com sucesso! Os fornecedores receberão emails com a solicitação de orçamento.');

        // Recarregar dados
        await initializeData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao salvar alocações');
      }
    } catch (error) {
      console.error('Erro ao salvar alocações:', error);
      toast.error('Erro ao salvar alocações. Verifique o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  if (currentStatus === 'pending') {
    return (
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500 mb-1">
                Alocação Indisponível
              </p>
              <p className="text-sm text-blue-500/70">
                Aprove esta solicitação para poder alocar equipamentos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-12 text-center">
          <p className="text-zinc-500">Carregando fornecedores disponíveis...</p>
        </CardContent>
      </Card>
    );
  }

  const totalEstimatedBudget = allocations.reduce((sum, item) => sum + (item.estimatedBudget || 0), 0);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-red-600" />
            Alocar Equipamentos e Fornecedores
          </CardTitle>
          <Button
            onClick={handleSave}
            disabled={saving || allocations.length === 0}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-2 sm:px-3 w-full sm:w-auto"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar e Solicitar Orçamentos'}</span>
            <span className="sm:hidden">{saving ? 'Salvando...' : 'Salvar e Solicitar'}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de Alocações */}
        <div className="space-y-4">
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum equipamento alocado</p>
              <p className="text-sm mt-1">Clique no botão abaixo para adicionar equipamentos</p>
            </div>
          ) : (
            allocations.map((allocation, index) => (
              <Card key={index} className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nome do Equipamento */}
                    <div>
                      <Label htmlFor={`equipment-${index}`} className="text-zinc-300">
                        Equipamento *
                      </Label>
                      <Input
                        id={`equipment-${index}`}
                        value={allocation.equipmentName}
                        onChange={(e) => updateAllocation(index, 'equipmentName', e.target.value)}
                        placeholder="Ex: Caixa de som"
                        className="bg-zinc-900 border-zinc-700 text-white mt-1"
                      />
                    </div>

                    {/* Quantidade */}
                    <div>
                      <Label htmlFor={`quantity-${index}`} className="text-zinc-300">
                        Quantidade *
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={allocation.quantity}
                        onChange={(e) => updateAllocation(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="bg-zinc-900 border-zinc-700 text-white mt-1"
                      />
                    </div>

                    {/* Fornecedor */}
                    <div>
                      <Label htmlFor={`supplier-${index}`} className="text-zinc-300">
                        Fornecedor *
                      </Label>
                      <Select
                        value={allocation.supplierId}
                        onValueChange={(value) => updateAllocation(index, 'supplierId', value)}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1">
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">
                              Nenhum fornecedor ativo encontrado
                            </div>
                          ) : (
                            suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.company_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Orçamento Estimado */}
                    <div>
                      <Label htmlFor={`budget-${index}`} className="text-zinc-300">
                        Orçamento Estimado (R$)
                      </Label>
                      <Input
                        id={`budget-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocation.estimatedBudget || ''}
                        onChange={(e) => updateAllocation(index, 'estimatedBudget', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="bg-zinc-900 border-zinc-700 text-white mt-1"
                      />
                    </div>

                    {/* Observações */}
                    <div className="md:col-span-2 lg:col-span-1">
                      <Label htmlFor={`notes-${index}`} className="text-zinc-300">
                        Observações
                      </Label>
                      <Input
                        id={`notes-${index}`}
                        value={allocation.notes || ''}
                        onChange={(e) => updateAllocation(index, 'notes', e.target.value)}
                        placeholder="Informações adicionais..."
                        className="bg-zinc-900 border-zinc-700 text-white mt-1"
                      />
                    </div>

                    {/* Botão Remover */}
                    <div className="flex items-end">
                      <Button
                        onClick={() => removeEquipmentItem(index)}
                        variant="outline"
                        size="sm"
                        className="border-red-600/30 text-red-400 hover:bg-red-600/10 w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Botão Adicionar Equipamento */}
        <Button
          onClick={addEquipmentItem}
          variant="outline"
          className="w-full border-zinc-700 hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Equipamento
        </Button>

        {/* Observações Gerais */}
        <div>
          <Label htmlFor="general-notes" className="text-zinc-300">
            Observações Gerais para Fornecedores
          </Label>
          <Input
            id="general-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações adicionais que serão enviadas para todos os fornecedores..."
            className="bg-zinc-800 border-zinc-700 text-white mt-1"
          />
        </div>

        {/* Resumo do Orçamento */}
        {totalEstimatedBudget > 0 && (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 font-medium">Orçamento Total Estimado:</span>
                <span className="text-2xl font-bold text-green-400">
                  R$ {totalEstimatedBudget.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            <strong>📧 Automação de Emails:</strong> Ao salvar as alocações, cada fornecedor selecionado
            receberá automaticamente um email com os detalhes do evento e a lista de equipamentos solicitados,
            incluindo os orçamentos estimados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
