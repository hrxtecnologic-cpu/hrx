'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';

interface CatalogItem {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  pricing_daily?: string;
  pricing_weekly?: string;
  pricing_monthly?: string;
  quantity: string;
  specifications: { key: string; value: string }[];
}

interface SimpleCatalogItemsManagerProps {
  items: CatalogItem[];
  onChange: (items: CatalogItem[]) => void;
}

export function SimpleCatalogItemsManager({ items, onChange }: SimpleCatalogItemsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<CatalogItem>({
    id: '',
    category: '',
    subcategory: '',
    name: '',
    description: '',
    pricing_daily: '',
    pricing_weekly: '',
    pricing_monthly: '',
    quantity: '1',
    specifications: [{ key: '', value: '' }],
  });

  const handleAddItem = () => {
    const newItem = {
      ...currentItem,
      id: Date.now().toString(),
    };
    onChange([...items, newItem]);
    setCurrentItem({
      id: '',
      category: '',
      subcategory: '',
      name: '',
      description: '',
      pricing_daily: '',
      pricing_weekly: '',
      pricing_monthly: '',
      quantity: '1',
      specifications: [{ key: '', value: '' }],
    });
    setIsAdding(false);
  };

  const handleUpdateItem = () => {
    if (editingIndex === null) return;
    const updated = [...items];
    updated[editingIndex] = currentItem;
    onChange(updated);
    setEditingIndex(null);
    setCurrentItem({
      id: '',
      category: '',
      subcategory: '',
      name: '',
      description: '',
      pricing_daily: '',
      pricing_weekly: '',
      pricing_monthly: '',
      quantity: '1',
      specifications: [{ key: '', value: '' }],
    });
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    setCurrentItem(items[index]);
    setEditingIndex(index);
    setIsAdding(true);
  };

  const availableSubcategories = currentItem.category
    ? EQUIPMENT_CATEGORIES.find(c => c.name === currentItem.category)?.subtypes || []
    : [];

  const addSpecification = () => {
    setCurrentItem({
      ...currentItem,
      specifications: [...currentItem.specifications, { key: '', value: '' }],
    });
  };

  const removeSpecification = (index: number) => {
    setCurrentItem({
      ...currentItem,
      specifications: currentItem.specifications.filter((_, i) => i !== index),
    });
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...currentItem.specifications];
    updated[index][field] = value;
    setCurrentItem({ ...currentItem, specifications: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium text-white">
            Catálogo de Equipamentos *
          </Label>
          <p className="text-xs text-zinc-500 mt-1">
            Adicione itens detalhados com especificações técnicas e preços
          </p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        )}
      </div>

      {/* Lista de itens */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={item.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{item.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                        {item.subcategory}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditItem(index)}
                      className="text-white hover:text-white hover:bg-zinc-700"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-xs text-zinc-400 mb-3">{item.description}</p>

                {/* Especificações Técnicas */}
                {item.specifications && item.specifications.length > 0 && item.specifications.some(s => s.key && s.value) && (
                  <div className="mb-3 pb-3 border-b border-zinc-700">
                    <p className="text-xs font-medium text-white mb-2">Especificações Técnicas:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {item.specifications.filter(s => s.key && s.value).map((spec, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="text-zinc-500">{spec.key}:</span>{' '}
                          <span className="text-white">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preços e Quantidade */}
                <div className="flex flex-wrap gap-2">
                  {item.pricing_daily && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20">
                      💰 R$ {item.pricing_daily}/dia
                    </span>
                  )}
                  {item.pricing_weekly && (
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded border border-blue-500/20">
                      📅 R$ {item.pricing_weekly}/semana
                    </span>
                  )}
                  {item.pricing_monthly && (
                    <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded border border-purple-500/20">
                      📆 R$ {item.pricing_monthly}/mês
                    </span>
                  )}
                  <span className="text-xs bg-zinc-700 text-zinc-200 px-2 py-1 rounded">
                    📦 {item.quantity} unid. disponível
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário de adicionar/editar item */}
      {isAdding && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-white">
                {editingIndex !== null ? 'Editar Item' : 'Novo Item do Catálogo'}
              </h4>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setEditingIndex(null);
                }}
                className="text-white hover:text-white hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Categoria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white">Categoria *</Label>
                <Select
                  value={currentItem.category}
                  onValueChange={(value) => setCurrentItem({ ...currentItem, category: value, subcategory: '' })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1">
                    <SelectValue placeholder="Selecione..." className="text-zinc-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {[...EQUIPMENT_CATEGORIES].sort((a, b) => a.label.localeCompare(b.label)).map((cat) => (
                      <SelectItem key={cat.name} value={cat.name} className="text-white focus:bg-zinc-800 focus:text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-white">Subcategoria *</Label>
                <Select
                  value={currentItem.subcategory}
                  onValueChange={(value) => setCurrentItem({ ...currentItem, subcategory: value })}
                  disabled={!currentItem.category}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1">
                    <SelectValue placeholder="Selecione..." className="text-zinc-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {[...availableSubcategories].sort((a, b) => a.label.localeCompare(b.label)).map((sub) => (
                      <SelectItem key={sub.name} value={sub.label} className="text-white focus:bg-zinc-800 focus:text-white">
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nome */}
            <div>
              <Label className="text-xs text-white">Nome do Item *</Label>
              <Input
                value={currentItem.name}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                placeholder="Ex: Sistema de Som 500 pessoas - Line Array"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label className="text-xs text-white">Descrição *</Label>
              <Textarea
                value={currentItem.description}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                placeholder="Descreva o equipamento em detalhes..."
                rows={3}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
              />
            </div>

            {/* Especificações Técnicas */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-white">Especificações Técnicas</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSpecification}
                  className="h-6 text-xs border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {currentItem.specifications.map((spec, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={spec.key}
                    onChange={(e) => updateSpecification(idx, 'key', e.target.value)}
                    placeholder="Ex: Potência"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-xs"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) => updateSpecification(idx, 'value', e.target.value)}
                    placeholder="Ex: 10.000W"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSpecification(idx)}
                    disabled={currentItem.specifications.length === 1}
                    className="text-white hover:text-white hover:bg-zinc-700 disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Preços */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-white">Diária (R$)</Label>
                <Input
                  type="number"
                  value={currentItem.pricing_daily}
                  onChange={(e) => setCurrentItem({ ...currentItem, pricing_daily: e.target.value })}
                  placeholder="2500"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-white">Semanal (R$)</Label>
                <Input
                  type="number"
                  value={currentItem.pricing_weekly}
                  onChange={(e) => setCurrentItem({ ...currentItem, pricing_weekly: e.target.value })}
                  placeholder="12000"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-white">Mensal (R$)</Label>
                <Input
                  type="number"
                  value={currentItem.pricing_monthly}
                  onChange={(e) => setCurrentItem({ ...currentItem, pricing_monthly: e.target.value })}
                  placeholder="35000"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
                />
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <Label className="text-xs text-white">Quantidade Disponível *</Label>
              <Input
                type="number"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                min="1"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 mt-1"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingIndex(null);
                }}
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={editingIndex !== null ? handleUpdateItem : handleAddItem}
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!currentItem.name || !currentItem.category || !currentItem.subcategory}
              >
                <Check className="h-4 w-4 mr-2" />
                {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !isAdding && (
        <div className="text-center py-8 border border-dashed border-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-500">
            Nenhum item no catálogo. Clique em "Novo Item" para adicionar.
          </p>
        </div>
      )}
    </div>
  );
}
