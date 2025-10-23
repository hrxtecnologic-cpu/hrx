'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  equipment_types: string[];
}

interface EquipmentItem {
  name: string;
  category: string;
  quantity: number;
  duration_days: number;
  specifications?: string;
}

interface RequestQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  equipmentItems?: EquipmentItem[];
}

export function RequestQuotesModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  equipmentItems = [],
}: RequestQuotesModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [validDays, setValidDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  async function loadSuppliers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/suppliers');
      if (!response.ok) throw new Error('Erro ao carregar fornecedores');

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar lista de fornecedores');
    } finally {
      setLoading(false);
    }
  }

  function toggleSupplier(supplierId: string) {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  }

  async function handleSubmit() {
    if (selectedSuppliers.length === 0) {
      toast.error('Selecione pelo menos um fornecedor');
      return;
    }

    if (equipmentItems.length === 0) {
      toast.error('Nenhum equipamento foi adicionado ao projeto');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/admin/projects/${projectId}/request-quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_ids: selectedSuppliers,
          equipment_items: equipmentItems,
          valid_days: validDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar orçamentos');
      }

      toast.success(`Solicitações enviadas para ${selectedSuppliers.length} fornecedores!`);
      onClose();

      // Reload da página para mostrar orçamentos solicitados
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Erro ao solicitar orçamentos:', error);
      toast.error(error.message || 'Erro ao solicitar orçamentos');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Solicitar Orçamentos de Equipamentos
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Projeto: <span className="font-semibold">{projectName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Equipamentos que serão orçados */}
          <div>
            <Label className="text-zinc-300 mb-2 block">
              Equipamentos a serem orçados ({equipmentItems.length})
            </Label>
            <div className="bg-zinc-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              {equipmentItems.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  Nenhum equipamento adicionado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {equipmentItems.map((item, idx) => (
                    <div key={idx} className="text-sm text-zinc-300 flex justify-between">
                      <span>{item.name}</span>
                      <span className="text-zinc-500">
                        {item.quantity}x - {item.duration_days} dias
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prazo de resposta */}
          <div>
            <Label htmlFor="valid_days" className="text-zinc-300">
              Prazo para resposta (dias)
            </Label>
            <Input
              id="valid_days"
              type="number"
              min="1"
              max="30"
              value={validDays}
              onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
              className="bg-zinc-800 border-zinc-700 text-white mt-2"
            />
          </div>

          {/* Lista de fornecedores */}
          <div>
            <Label className="text-zinc-300 mb-3 block">
              Selecione os fornecedores ({selectedSuppliers.length} selecionados)
            </Label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
                <p className="text-zinc-400">
                  Nenhum fornecedor cadastrado ainda.
                </p>
                <Button
                  variant="link"
                  className="text-red-500 mt-2"
                  onClick={() => window.open('/admin/fornecedores', '_blank')}
                >
                  Cadastrar Fornecedor
                </Button>
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition"
                  >
                    <Checkbox
                      id={supplier.id}
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={() => toggleSupplier(supplier.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={supplier.id}
                        className="text-white font-medium cursor-pointer block"
                      >
                        {supplier.company_name}
                      </label>
                      <p className="text-sm text-zinc-400">{supplier.contact_name}</p>
                      <p className="text-xs text-zinc-500">{supplier.email}</p>
                      {supplier.equipment_types && supplier.equipment_types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {supplier.equipment_types.slice(0, 3).map((type, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded"
                            >
                              {type}
                            </span>
                          ))}
                          {supplier.equipment_types.length > 3 && (
                            <span className="text-xs text-zinc-500">
                              +{supplier.equipment_types.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="border-zinc-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedSuppliers.length === 0 || equipmentItems.length === 0}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar para {selectedSuppliers.length || 0} fornecedores
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
