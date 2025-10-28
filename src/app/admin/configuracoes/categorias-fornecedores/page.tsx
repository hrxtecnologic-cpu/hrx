'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Truck, Plus, Pencil, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import type { Subcategory } from '@/hooks/useCategories';

export default function CategoriasFornecedoresPage() {
  const router = useRouter();
  const { categories, loading, error, refetch } = useCategories('equipment');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });
  const [subFormData, setSubFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Criar nova categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryFormData,
          category_type: 'equipment'
        }),
      });

      if (response.ok) {
        await refetch();
        setIsDialogOpen(false);
        setCategoryFormData({ name: '', description: '' });
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao criar categoria');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  // Criar/Editar subcategoria
  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;

    setSubmitting(true);

    try {
      const url = editingSubcategory
        ? `/api/admin/subcategories/${editingSubcategory.id}`
        : `/api/admin/categories/${selectedCategoryId}/subcategories`;

      const method = editingSubcategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subFormData),
      });

      if (response.ok) {
        await refetch();
        setIsSubDialogOpen(false);
        setSubFormData({ name: '', slug: '', description: '' });
        setEditingSubcategory(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao salvar subcategoria');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar subcategoria');
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar subcategoria
  const handleDeleteSubcategory = async (subId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return;

    try {
      const response = await fetch(`/api/admin/subcategories/${subId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refetch();
      } else {
        alert('Erro ao excluir subcategoria');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir subcategoria');
    }
  };

  // Abrir dialog para nova subcategoria
  const handleAddSubcategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory(null);
    setSubFormData({ name: '', slug: '', description: '' });
    setIsSubDialogOpen(true);
  };

  // Abrir dialog para editar subcategoria
  const handleEditSubcategory = (categoryId: string, sub: Subcategory) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory(sub);
    setSubFormData({
      name: sub.name,
      slug: sub.slug,
      description: sub.description || '',
    });
    setIsSubDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-400">Carregando categorias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/configuracoes')}
            className="mb-4 text-zinc-400 hover:text-white -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Configurações
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Categorias de Fornecedores</h1>
          <p className="text-zinc-400">
            Gerenciar categorias e subcategorias de equipamentos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Nome da Categoria *</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Ex: Som e Áudio"
                  required
                />
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Descrição (opcional)</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Breve descrição da categoria"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                  disabled={submitting}
                >
                  {submitting ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Categorias com Accordion */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            Categorias Cadastradas ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhuma categoria cadastrada
              </h3>
              <p className="text-zinc-400 mb-6">
                Comece criando sua primeira categoria de equipamentos
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {categories.map((category) => (
                <AccordionItem
                  key={category.category_id}
                  value={category.category_id}
                  className="bg-zinc-800/50 rounded-lg border border-zinc-700 px-4"
                >
                  <AccordionTrigger className="text-white hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#666' }}
                        />
                        <div className="text-left">
                          <h4 className="font-medium">{category.category_name}</h4>
                          <p className="text-sm text-zinc-400">{category.category_description}</p>
                        </div>
                      </div>
                      <span className="text-sm text-zinc-500">
                        {category.subcategories.length} subcategorias
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-4">
                    <div className="space-y-2 pt-2">
                      {/* Botão adicionar subcategoria */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddSubcategory(category.category_id)}
                        className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-zinc-500"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Adicionar Subcategoria
                      </Button>

                      {/* Lista de subcategorias */}
                      {category.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-zinc-700/50"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{sub.name}</p>
                            <p className="text-xs text-zinc-400">slug: {sub.slug}</p>
                            {sub.description && (
                              <p className="text-xs text-zinc-500 mt-1">{sub.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSubcategory(category.category_id, sub)}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSubcategory(sub.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Dialog Subcategoria */}
      <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubcategorySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Nome da Subcategoria *</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  value={subFormData.name}
                  onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                  placeholder="Ex: Telão LED"
                  required
                />
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Slug (identificador) *</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  value={subFormData.slug}
                  onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="telao_led"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Descrição</Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white h-11"
                value={subFormData.description}
                onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                placeholder="Breve descrição da subcategoria"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubDialogOpen(false)}
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : editingSubcategory ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
