'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X, Package, DollarSign } from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';

interface EquipmentItem {
  id: string;
  equipment_group: string;
  equipment_type: string;
  quantity: number;
  estimated_daily_rate?: number;
  notes?: string;
}

interface SimpleEquipmentManagerProps {
  items: EquipmentItem[];
  onChange: (items: EquipmentItem[]) => void;
}

export function SimpleEquipmentManager({ items, onChange }: SimpleEquipmentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<EquipmentItem>({
    id: '',
    equipment_group: '',
    equipment_type: '',
    quantity: 1,
    estimated_daily_rate: undefined,
    notes: '',
  });

  const handleAddItem = () => {
    if (!currentItem.equipment_group || !currentItem.equipment_type || currentItem.quantity < 1) {
      return;
    }

    const newItem = {
      ...currentItem,
      id: Date.now().toString(),
    };
    onChange([...items, newItem]);
    resetForm();
  };

  const handleUpdateItem = () => {
    if (editingIndex === null) return;
    const updated = [...items];
    updated[editingIndex] = currentItem;
    onChange(updated);
    resetForm();
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    setCurrentItem(items[index]);
    setEditingIndex(index);
    setIsAdding(true);
  };

  const resetForm = () => {
    setCurrentItem({
      id: '',
      equipment_group: '',
      equipment_type: '',
      quantity: 1,
      estimated_daily_rate: undefined,
      notes: '',
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const availableSubtypes = currentItem.equipment_group
    ? EQUIPMENT_CATEGORIES.find(c => c.name === currentItem.equipment_group)?.subtypes || []
    : [];

  return (
    <div className="space-y-4">
      {/* Lista de Equipamentos Adicionados */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            Equipamentos Solicitados ({items.length})
          </h3>
          <div className="grid gap-3">
            {items.map((item, index) => (
              <Card key={item.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-green-500" />
                        <h4 className="font-semibold text-white">{item.equipment_type}</h4>
                        <span className="text-xs bg-green-950/50 text-green-300 px-2 py-0.5 rounded">
                          {item.equipment_group}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span className="font-medium">Quantidade:</span>
                          <span className="text-white">{item.quantity}</span>
                        </div>
                        {item.estimated_daily_rate && item.estimated_daily_rate > 0 && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">Taxa estimada/dia:</span>
                            <span className="text-green-400 font-semibold">
                              R$ {item.estimated_daily_rate.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="flex items-start gap-2 text-zinc-400">
                            <span className="font-medium">Observações:</span>
                            <span className="text-zinc-300 flex-1">{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditItem(index)}
                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Botão Adicionar */}
      {!isAdding && (
        <Button
          type="button"
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="w-full border-dashed border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Equipamento
        </Button>
      )}

      {/* Formulário de Adição/Edição */}
      {isAdding && (
        <Card className="bg-zinc-900/50 border-green-900/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingIndex !== null ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h3>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetForm}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              {/* Categoria de Equipamento */}
              <div className="space-y-2">
                <Label htmlFor="equipment_group" className="text-zinc-300">
                  Categoria de Equipamento *
                </Label>
                <Select
                  value={currentItem.equipment_group}
                  onValueChange={(value) => {
                    setCurrentItem({
                      ...currentItem,
                      equipment_group: value,
                      equipment_type: '', // Resetar tipo
                    });
                  }}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Equipamento */}
              <div className="space-y-2">
                <Label htmlFor="equipment_type" className="text-zinc-300">
                  Tipo de Equipamento *
                </Label>
                <Select
                  value={currentItem.equipment_type}
                  onValueChange={(value) =>
                    setCurrentItem({ ...currentItem, equipment_type: value })
                  }
                  disabled={!currentItem.equipment_group}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white disabled:opacity-50">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {availableSubtypes.map((subtype) => (
                      <SelectItem key={subtype.name} value={subtype.label}>
                        {subtype.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-zinc-300">
                  Quantidade *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {/* Taxa Diária Estimada */}
              <div className="space-y-2">
                <Label htmlFor="estimated_daily_rate" className="text-zinc-300">
                  Taxa Diária Estimada (R$)
                </Label>
                <Input
                  id="estimated_daily_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.estimated_daily_rate || ''}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      estimated_daily_rate: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="0.00"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">
                  Opcional - ajuda fornecedores a entenderem seu orçamento
                </p>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-zinc-300">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={currentItem.notes}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, notes: e.target.value })
                  }
                  placeholder="Ex: Preciso de cabos extras, equipamento deve ser novo..."
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={editingIndex !== null ? handleUpdateItem : handleAddItem}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!currentItem.equipment_group || !currentItem.equipment_type || currentItem.quantity < 1}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
