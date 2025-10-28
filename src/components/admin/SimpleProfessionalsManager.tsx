'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X, Users } from 'lucide-react';
import { CATEGORIES_WITH_SUBCATEGORIES } from '@/lib/categories-subcategories';

interface ProfessionalItem {
  id: string;
  category_group: string;
  category: string;
  quantity: number;
  requirements?: string;
}

interface SimpleProfessionalsManagerProps {
  items: ProfessionalItem[];
  onChange: (items: ProfessionalItem[]) => void;
}

export function SimpleProfessionalsManager({ items, onChange }: SimpleProfessionalsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<ProfessionalItem>({
    id: '',
    category_group: '',
    category: '',
    quantity: 1,
    requirements: '',
  });

  const handleAddItem = () => {
    if (!currentItem.category_group || !currentItem.category || currentItem.quantity < 1) {
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
      category_group: '',
      category: '',
      quantity: 1,
      requirements: '',
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const availableSubcategories = currentItem.category_group
    ? CATEGORIES_WITH_SUBCATEGORIES.find(c => c.name === currentItem.category_group)?.subcategories || []
    : [];

  return (
    <div className="space-y-4">
      {/* Lista de Profissionais Adicionados */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            Profissionais Solicitados ({items.length})
          </h3>
          <div className="grid gap-3">
            {items.map((item, index) => (
              <Card key={item.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <h4 className="font-semibold text-white">{item.category}</h4>
                        <span className="text-xs bg-blue-950/50 text-blue-300 px-2 py-0.5 rounded">
                          {item.category_group}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span className="font-medium">Quantidade:</span>
                          <span className="text-white">{item.quantity}</span>
                        </div>
                        {item.requirements && (
                          <div className="flex items-start gap-2 text-zinc-400">
                            <span className="font-medium">Requisitos:</span>
                            <span className="text-zinc-300 flex-1">{item.requirements}</span>
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
          Adicionar Profissional
        </Button>
      )}

      {/* Formulário de Adição/Edição */}
      {isAdding && (
        <Card className="bg-zinc-900/50 border-blue-900/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingIndex !== null ? 'Editar Profissional' : 'Novo Profissional'}
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
              {/* Categoria Principal */}
              <div className="space-y-2">
                <Label htmlFor="category_group" className="text-zinc-300">
                  Categoria Principal *
                </Label>
                <Select
                  value={currentItem.category_group}
                  onValueChange={(value) => {
                    setCurrentItem({
                      ...currentItem,
                      category_group: value,
                      category: '', // Resetar subcategoria
                    });
                  }}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {CATEGORIES_WITH_SUBCATEGORIES.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategoria */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-zinc-300">
                  Subcategoria / Especialização *
                </Label>
                <Select
                  value={currentItem.category}
                  onValueChange={(value) =>
                    setCurrentItem({ ...currentItem, category: value })
                  }
                  disabled={!currentItem.category_group}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white disabled:opacity-50">
                    <SelectValue placeholder="Selecione a especialização" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {availableSubcategories.map((subcat) => (
                      <SelectItem key={subcat.name} value={subcat.label}>
                        {subcat.label}
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

              {/* Requisitos */}
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-zinc-300">
                  Requisitos ou Observações
                </Label>
                <Textarea
                  id="requirements"
                  value={currentItem.requirements}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, requirements: e.target.value })
                  }
                  placeholder="Ex: Experiência mínima de 2 anos, conhecimento em..."
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={editingIndex !== null ? handleUpdateItem : handleAddItem}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!currentItem.category_group || !currentItem.category || currentItem.quantity < 1}
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
