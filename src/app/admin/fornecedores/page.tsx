'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Building2, Mail, Phone, ChevronDown, TrendingUp, CheckCircle, XCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSupplierSearch } from '@/hooks/useSupplierSearch';
import { SupplierSearch } from '@/components/admin/SupplierSearch';
import { EQUIPMENT_CATEGORIES, getAllEquipmentTypes } from '@/lib/equipment-types';

const supplierSchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
  contact_name: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  equipment_types: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de equipamento'),
  pricing: z.object({
    daily: z.string().optional(),
    three_days: z.string().optional(),
    weekly: z.string().optional(),
    discount_notes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

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
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  stats?: {
    totalQuotations: number;
    submittedQuotations: number;
    acceptedQuotations: number;
    rejectedQuotations: number;
    acceptanceRate: number;
    avgTicket: number;
  };
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hook de busca avançada
  const {
    results: searchResults,
    total: searchTotal,
    isLoading: searchLoading,
    search,
  } = useSupplierSearch();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      equipment_types: [],
      status: 'active',
    },
  });

  const watchedEquipmentTypes = watch('equipment_types');

  // Buscar fornecedores (mantido para estatísticas)
  const fetchSuppliers = async () => {
    try {
      setErrorMessage(null);
      const response = await fetch('/api/admin/suppliers');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.hint
          ? `${errorData.error}\n\n${errorData.hint}`
          : errorData.error || 'Erro ao buscar fornecedores';
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setSuppliers(data);
    } catch (error: any) {
      toast.error('Erro ao carregar fornecedores');
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  useEffect(() => {
    fetchSuppliers(); // Buscar para estatísticas
  }, []);

  // Estatísticas
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    inactive: suppliers.filter((s) => s.status === 'inactive').length,
  };

  // Handler de busca
  const handleSearch = (filters: any) => {
    search(filters);
  };

  // Abrir dialog para adicionar
  const handleAdd = () => {
    setEditingSupplier(null);
    reset({
      equipment_types: [],
      status: 'active',
    });
    setSelectedEquipmentTypes([]);
    setIsDialogOpen(true);
  };

  // Abrir dialog para editar
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    reset({
      company_name: supplier.company_name,
      contact_name: supplier.contact_name,
      email: supplier.email,
      phone: supplier.phone,
      equipment_types: supplier.equipment_types,
      pricing: supplier.pricing || {},
      notes: supplier.notes || '',
      status: supplier.status,
    });
    setSelectedEquipmentTypes(supplier.equipment_types);
    setIsDialogOpen(true);
  };

  // Deletar fornecedor
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este fornecedor?')) return;

    try {
      const response = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar fornecedor');
      }

      toast.success('Fornecedor deletado com sucesso');
      fetchSuppliers();
      search(); // Atualizar busca
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  // Salvar fornecedor
  const onSubmit = async (data: SupplierFormData) => {
    try {
      const url = editingSupplier
        ? `/api/admin/suppliers/${editingSupplier.id}`
        : '/api/admin/suppliers';

      const method = editingSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar fornecedor');
      }

      toast.success(
        editingSupplier
          ? 'Fornecedor atualizado com sucesso'
          : 'Fornecedor cadastrado com sucesso'
      );

      setIsDialogOpen(false);
      fetchSuppliers();
      search(); // Atualizar busca
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  // Toggle tipo de equipamento
  const toggleEquipmentType = (type: string) => {
    const current = selectedEquipmentTypes;
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setSelectedEquipmentTypes(newTypes);
    setValue('equipment_types', newTypes);
  };

  // Toggle categoria do accordion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Contar quantos equipamentos selecionados por categoria
  const getSelectedCountByCategory = (categoryName: string): number => {
    const category = EQUIPMENT_CATEGORIES.find(c => c.name === categoryName);
    if (!category) return 0;
    return category.subtypes.filter(s => selectedEquipmentTypes.includes(s.label)).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fornecedores de Equipamentos</h1>
          <p className="text-zinc-400">Gerenciar fornecedores de equipamentos para eventos</p>
        </div>
        <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Mensagem de Erro */}
      {errorMessage && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 text-red-500">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500 mb-1">
                  Erro ao carregar fornecedores
                </p>
                <p className="text-sm text-red-400 whitespace-pre-wrap">
                  {errorMessage}
                </p>
                <div className="mt-4">
                  <Button
                    onClick={fetchSuppliers}
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Ativos</p>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Inativos</p>
            <p className="text-2xl font-bold text-zinc-500">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca Avançada */}
      <SupplierSearch
        onSearch={handleSearch}
        totalResults={searchTotal}
        isLoading={searchLoading}
      />

      {/* Suppliers List */}
      <div className="grid grid-cols-1 gap-4">
        {searchLoading ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-400">
              Buscando fornecedores...
            </CardContent>
          </Card>
        ) : searchResults.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-400">
              Nenhum fornecedor encontrado com os filtros selecionados
            </CardContent>
          </Card>
        ) : (
          searchResults.map((supplier) => {
            // Formatar telefone para WhatsApp (remover caracteres não numéricos)
            const whatsappNumber = supplier.phone.replace(/\D/g, '');
            const hasWhatsApp = whatsappNumber.length >= 10;

            return (
            <Card key={supplier.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-semibold text-white">
                        {supplier.company_name}
                      </h3>
                      <Badge
                        variant={supplier.status === 'active' ? 'default' : 'secondary'}
                        className={
                          supplier.status === 'active'
                            ? 'bg-green-600/20 text-green-400 border-green-600/30'
                            : 'bg-zinc-700 text-zinc-400'
                        }
                      >
                        {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {/* Informações de Contato */}
                    <div className="space-y-2 text-sm text-zinc-400 mb-3">
                      <p className="flex items-center gap-2">
                        <strong className="text-zinc-300">Contato:</strong> {supplier.contact_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a
                          href={`mailto:${supplier.email}`}
                          className="hover:text-blue-400 hover:underline transition-colors"
                        >
                          {supplier.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.phone}</span>
                        {hasWhatsApp && (
                          <a
                            href={`https://wa.me/55${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                            title="Abrir no WhatsApp"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Estatísticas de Orçamentos */}
                    {supplier.stats && supplier.stats.totalQuotations > 0 && (
                      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-semibold text-zinc-300">Histórico de Orçamentos</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-zinc-500">Total</p>
                            <p className="text-lg font-bold text-white">{supplier.stats.totalQuotations}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Aceitos
                            </p>
                            <p className="text-lg font-bold text-green-400">{supplier.stats.acceptedQuotations}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                              <XCircle className="h-3 w-3" /> Rejeitados
                            </p>
                            <p className="text-lg font-bold text-red-400">{supplier.stats.rejectedQuotations}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-zinc-500">Taxa</p>
                            <p className="text-lg font-bold text-blue-400">{supplier.stats.acceptanceRate}%</p>
                          </div>
                        </div>
                        {supplier.stats.avgTicket > 0 && (
                          <div className="mt-2 pt-2 border-t border-zinc-700">
                            <p className="text-xs text-zinc-500">Ticket Médio (aceitos)</p>
                            <p className="text-sm font-semibold text-yellow-400">
                              R$ {supplier.stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preços */}
                    {supplier.pricing && (supplier.pricing.daily || supplier.pricing.three_days || supplier.pricing.weekly) && (
                      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-zinc-800">
                        {supplier.pricing.daily && (
                          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                            Diária: {supplier.pricing.daily}
                          </span>
                        )}
                        {supplier.pricing.three_days && (
                          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                            3 dias: {supplier.pricing.three_days}
                          </span>
                        )}
                        {supplier.pricing.weekly && (
                          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                            Semanal: {supplier.pricing.weekly}
                          </span>
                        )}
                      </div>
                    )}
                    {supplier.pricing?.discount_notes && (
                      <p className="text-xs text-green-400 mb-3">
                        💰 {supplier.pricing.discount_notes}
                      </p>
                    )}

                    {/* Tipos de Equipamento */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {supplier.equipment_types.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="bg-red-600/10 text-red-400 border-red-600/30 text-xs"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>

                    {/* Notas */}
                    {supplier.notes && (
                      <p className="text-xs mt-2 text-zinc-500">{supplier.notes}</p>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(supplier)}
                      className="border-zinc-700 text-white hover:bg-red-600 hover:border-red-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(supplier.id)}
                      className="border-red-600/30 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Dialog para Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              {editingSupplier
                ? 'Atualize as informações do fornecedor'
                : 'Cadastre um novo fornecedor de equipamentos'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-5">
              <div>
                <Label htmlFor="company_name" className="text-sm font-medium text-zinc-200">
                  Nome da Empresa *
                </Label>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  placeholder="Ex: Som & Luz Eventos"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
                {errors.company_name && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.company_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_name" className="text-sm font-medium text-zinc-200">
                    Nome do Contato *
                  </Label>
                  <Input
                    id="contact_name"
                    {...register('contact_name')}
                    placeholder="Nome completo"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                  {errors.contact_name && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.contact_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-zinc-200">
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="(00) 00000-0000"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-zinc-200">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contato@empresa.com"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Preços por Período */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-zinc-200">
                  Valores por Período (Opcional)
                </Label>
                <p className="text-xs text-zinc-500 mt-1">
                  Defina os valores de locação/serviço por período
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="pricing.daily" className="text-xs text-zinc-400">
                      Diária
                    </Label>
                    <Input
                      id="pricing.daily"
                      {...register('pricing.daily')}
                      placeholder="Ex: R$ 500,00"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricing.three_days" className="text-xs text-zinc-400">
                      3 Dias
                    </Label>
                    <Input
                      id="pricing.three_days"
                      {...register('pricing.three_days')}
                      placeholder="Ex: R$ 1.200,00"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricing.weekly" className="text-xs text-zinc-400">
                      Semanal (7 dias)
                    </Label>
                    <Input
                      id="pricing.weekly"
                      {...register('pricing.weekly')}
                      placeholder="Ex: R$ 2.000,00"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pricing.discount_notes" className="text-xs text-zinc-400">
                    Observações sobre Descontos
                  </Label>
                  <Input
                    id="pricing.discount_notes"
                    {...register('pricing.discount_notes')}
                    placeholder="Ex: 10% de desconto para períodos acima de 7 dias"
                    className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Tipos de Equipamento - Accordion por Categoria */}
            <div className="pt-4 border-t border-zinc-800">
              <Label className="text-sm font-medium text-zinc-200">
                Tipos de Equipamento que a Empresa Fornece *
              </Label>
              <p className="text-xs text-zinc-500 mt-1 mb-3">
                Selecione todos os tipos de equipamento que este fornecedor pode fornecer
              </p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {EQUIPMENT_CATEGORIES.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);
                  const selectedCount = getSelectedCountByCategory(category.name);

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
                          <span className="text-xs text-zinc-500">
                            ({category.subtypes.length})
                          </span>
                        </div>

                        {selectedCount > 0 && (
                          <Badge className="bg-red-600 text-white text-xs px-2 py-0.5">
                            {selectedCount}
                          </Badge>
                        )}
                      </button>

                      {/* Conteúdo expandido */}
                      {isExpanded && (
                        <div className="border-t border-zinc-700 px-3 py-2 bg-zinc-900/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {category.subtypes.map((subtype) => (
                              <div key={subtype.name} className="flex items-start space-x-2">
                                <Checkbox
                                  id={`equipment-${category.name}-${subtype.name}`}
                                  checked={selectedEquipmentTypes.includes(subtype.label)}
                                  onCheckedChange={() => toggleEquipmentType(subtype.label)}
                                  className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-0.5"
                                />
                                <label
                                  htmlFor={`equipment-${category.name}-${subtype.name}`}
                                  className="text-sm text-zinc-300 cursor-pointer select-none flex-1"
                                >
                                  {subtype.label}
                                  {subtype.description && (
                                    <span className="block text-xs text-zinc-500 mt-0.5">
                                      {subtype.description}
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {errors.equipment_types && (
                <p className="text-xs text-red-400 mt-2">{errors.equipment_types.message}</p>
              )}
              <p className="text-xs text-zinc-600 mt-2">
                {selectedEquipmentTypes.length > 0
                  ? `${selectedEquipmentTypes.length} tipo${selectedEquipmentTypes.length > 1 ? 's' : ''} selecionado${selectedEquipmentTypes.length > 1 ? 's' : ''}`
                  : 'Nenhum tipo selecionado'}
              </p>
            </div>

            {/* Informações Adicionais */}
            <div className="pt-4 border-t border-zinc-800 space-y-5">
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-zinc-200">
                  Observações (Opcional)
                </Label>
                <Input
                  id="notes"
                  {...register('notes')}
                  placeholder="Informações adicionais, horários de atendimento, etc."
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium text-zinc-200">
                  Status do Fornecedor
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value: 'active' | 'inactive') => setValue('status', value)}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-white text-white hover:bg-red-600 hover:border-red-600"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
              >
                {isSubmitting ? 'Salvando...' : editingSupplier ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
