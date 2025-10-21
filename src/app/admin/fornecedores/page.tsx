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
import { Search, Plus, Edit, Trash2, Building2, Mail, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Tipos de equipamentos disponíveis - Lista completa e profissional
const EQUIPMENT_TYPES = [
  // Som
  'Sistema de Som',
  'Microfones',
  'Mesa de Som',
  'Caixas de Som',
  'Subwoofers',
  'Monitores de Retorno',

  // Iluminação
  'Iluminação Geral',
  'Iluminação Cênica',
  'Moving Lights',
  'Refletores LED',
  'Strobo',
  'Máquina de Fumaça',
  'Laser',

  // Audiovisual
  'Projetores',
  'Telões',
  'TVs/Monitores',
  'Câmeras',
  'Transmissão ao Vivo',

  // Estrutura
  'Palco/Tablado',
  'Tendas',
  'Barracas',
  'Camarotes',
  'Grades',
  'Fechamento',

  // Mobiliário
  'Mesas',
  'Cadeiras',
  'Sofás',
  'Puffs',
  'Bistrôs',
  'Longarinas',

  // Decoração
  'Decoração Temática',
  'Flores/Arranjos',
  'Tapetes',
  'Painéis',
  'Backdrop',
  'Balões',

  // Energia e Infraestrutura
  'Geradores',
  'Distribuição Elétrica',
  'Ar Condicionado',
  'Ventiladores',

  // Outros
  'Banheiros Químicos',
  'Seguranças/Equipe',
  'Outros Equipamentos',
];

const supplierSchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
  contact_name: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  equipment_types: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de equipamento'),
  proposed_budget: z.string().optional(),
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
  proposed_budget?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Buscar fornecedores
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch('/api/admin/suppliers');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na API:', response.status, errorData);

        const errorMsg = errorData.hint
          ? `${errorData.error}\n\n${errorData.hint}`
          : errorData.error || 'Erro ao buscar fornecedores';

        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error: any) {
      toast.error('Erro ao carregar fornecedores');
      console.error('Erro ao buscar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filtrar fornecedores
  useEffect(() => {
    let filtered = [...suppliers];

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(term) ||
          s.contact_name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term)
      );
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, statusFilter, searchTerm]);

  // Estatísticas
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    inactive: suppliers.filter((s) => s.status === 'inactive').length,
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
      proposed_budget: supplier.proposed_budget || '',
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

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por empresa, contato ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-400">
              Carregando...
            </CardContent>
          </Card>
        ) : filteredSuppliers.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-400">
              Nenhum fornecedor encontrado
            </CardContent>
          </Card>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                    <div className="space-y-1 text-sm text-zinc-400">
                      <p className="flex items-center gap-2">
                        <strong className="text-zinc-300">Contato:</strong> {supplier.contact_name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {supplier.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {supplier.phone}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {supplier.equipment_types.map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="bg-red-600/10 text-red-400 border-red-600/30"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                      {supplier.notes && (
                        <p className="text-xs mt-2 text-zinc-500">{supplier.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(supplier)}
                      className="border-white text-white hover:bg-red-600 hover:border-red-600"
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
          ))
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

              <div>
                <Label htmlFor="proposed_budget" className="text-sm font-medium text-zinc-200">
                  Valor de Proposta de Orçamento (Opcional)
                </Label>
                <Input
                  id="proposed_budget"
                  {...register('proposed_budget')}
                  placeholder="Ex: R$ 5.000,00 a R$ 15.000,00"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Faixa de valores que este fornecedor costuma trabalhar
                </p>
                {errors.proposed_budget && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.proposed_budget.message}</p>
                )}
              </div>
            </div>

            {/* Tipos de Equipamento */}
            <div className="pt-4 border-t border-zinc-800">
              <Label className="text-sm font-medium text-zinc-200">
                Tipos de Equipamento que a Empresa Fornece *
              </Label>
              <p className="text-xs text-zinc-500 mt-1 mb-3">
                Selecione todos os tipos de equipamento que este fornecedor pode fornecer
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EQUIPMENT_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equipment-${type}`}
                      checked={selectedEquipmentTypes.includes(type)}
                      onCheckedChange={() => toggleEquipmentType(type)}
                      className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <label
                      htmlFor={`equipment-${type}`}
                      className="text-sm text-zinc-300 cursor-pointer select-none"
                    >
                      {type}
                    </label>
                  </div>
                ))}
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
                  <SelectContent>
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
