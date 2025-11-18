'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Eye,
  Plus,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Schema de validação - Modal BÁSICO (sem equipe/equipamentos)
const projectSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_email: z.string().email('Email inválido').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  client_company: z.string().optional(),
  client_cnpj: z.string().optional(),
  event_name: z.string().min(2, 'Nome do evento é obrigatório'),
  event_type: z.string().optional(),
  event_description: z.string().optional(),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  expected_attendance: z.number().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().min(3, 'Endereço é obrigatório'),
  venue_city: z.string().min(2, 'Cidade é obrigatória'),
  venue_state: z.string().min(2, 'Estado é obrigatório'),
  venue_zip: z.string().optional(),
  is_urgent: z.boolean().default(false),
  budget_range: z.string().optional(),
  additional_notes: z.string().optional(),
  internal_notes: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectSummary {
  id: string;
  project_number: string;
  client_name: string;
  event_name: string;
  event_date?: string;
  venue_city: string;
  venue_state: string;
  status: string;
  is_urgent: boolean;
  profit_margin: number;
  client_budget: number;
  total_cost: number;
  total_client_price: number;
  total_profit: number;
  team_count: number;
  equipment_count: number;
  quotations_count: number;
  created_at: string;
}

export default function ProjetosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    quoting: 0,
    proposed: 0,
    approved: 0,
    urgent: 0,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      is_urgent: false,
    },
  });

  const isUrgent = watch('is_urgent');

  // Buscar projetos (used by handleDelete and onSubmit)
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/event-projects');
      if (!response.ok) {
        // Se as tabelas ainda não existem, apenas não mostra nada
        console.warn('Tabelas de projetos ainda não criadas. Execute as migrations.');
        setProjects([]);
        return;
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.warn('Sistema de projetos ainda não inicializado:', error);
      setProjects([]);
    }
  };

  // Buscar stats
  const fetchStats = async () => {
    // Implementar busca de estatísticas
    // Por enquanto usar valores mockados dos projetos
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/admin/event-projects');
        if (!response.ok) {
          // Se as tabelas ainda não existem, apenas não mostra nada
          console.warn('Tabelas de projetos ainda não criadas. Execute as migrations.');
          setProjects([]);
          return;
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.warn('Sistema de projetos ainda não inicializado:', error);
        setProjects([]);
      }
    };

    loadProjects();
  }, []);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      new: { label: 'Novo', color: 'bg-blue-500/10 text-blue-500' },
      analyzing: { label: 'Análise', color: 'bg-purple-500/10 text-purple-500' },
      quoting: { label: 'Cotando', color: 'bg-yellow-500/10 text-yellow-500' },
      quoted: { label: 'Cotado', color: 'bg-orange-500/10 text-orange-500' },
      proposed: { label: 'Proposta Enviada', color: 'bg-cyan-500/10 text-cyan-500' },
      approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500' },
      in_execution: { label: 'Em Execução', color: 'bg-indigo-500/10 text-indigo-500' },
      completed: { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-500' },
      cancelled: { label: 'Cancelado', color: 'bg-zinc-500/10 text-zinc-500' },
    };
    return statusConfig[status] || statusConfig.new;
  };

  // Abrir dialog para adicionar
  const handleAdd = () => {
    reset({
      is_urgent: false,
    });
    setIsDialogOpen(true);
  };

  // Deletar projeto
  const handleDelete = async (projectId: string, projectNumber: string) => {
    if (!confirm(`Tem certeza que deseja deletar o projeto ${projectNumber}?`)) {
      return;
    }

    try {
      setDeletingId(projectId);
      const response = await fetch(`/api/admin/event-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar projeto');
      }

      toast.success('Projeto deletado com sucesso');
      fetchProjects();
    } catch (error: any) {
      console.error('Erro ao deletar projeto:', error);
      toast.error(error.message || 'Erro ao deletar projeto');
    } finally {
      setDeletingId(null);
    }
  };

  // Submeter formulário
  const onSubmit = async (data: ProjectFormData) => {
    try {
      const response = await fetch('/api/admin/event-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Se tabelas não existem ainda
        if (response.status === 500 && result.error?.includes('relation')) {
          toast.error('Sistema de projetos ainda não foi inicializado. Execute as migrations do banco de dados.');
          return;
        }
        throw new Error(result.error || 'Erro ao criar projeto');
      }

      toast.success('Projeto criado com sucesso!');
      setIsDialogOpen(false);
      fetchProjects();
      router.push(`/admin/projetos/${result.project.id}`);
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      toast.error(error.message || 'Erro ao criar projeto');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projetos de Eventos</h1>
          <p className="text-zinc-400">Gerenciar projetos unificados de eventos</p>
        </div>
        <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-500 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Novos</p>
            <p className="text-2xl font-bold text-blue-500">
              {projects.filter((p) => p.status === 'new').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Cotando</p>
            <p className="text-2xl font-bold text-yellow-500">
              {projects.filter((p) => p.status === 'quoting' || p.status === 'quoted').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Propostos</p>
            <p className="text-2xl font-bold text-cyan-500">
              {projects.filter((p) => p.status === 'proposed').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Aprovados</p>
            <p className="text-2xl font-bold text-green-500">
              {projects.filter((p) => p.status === 'approved' || p.status === 'in_execution').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Urgentes</p>
            <p className="text-2xl font-bold text-red-500">
              {projects.filter((p) => p.is_urgent && p.status !== 'completed' && p.status !== 'cancelled').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-4">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Card
              key={project.id}
              className={`border-zinc-800 hover:border-zinc-700 transition ${
                project.is_urgent ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-900'
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 self-start sm:self-auto">
                    {project.is_urgent ? (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                      </div>
                    ) : project.status === 'completed' ? (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                            {project.event_name}
                          </h3>
                          {project.is_urgent && (
                            <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">
                              URGENTE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 truncate">{project.client_name}</p>
                        <p className="text-xs text-zinc-500 mt-1">#{project.project_number}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span
                          className={`text-xs px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                            getStatusBadge(project.status).color
                          }`}
                        >
                          {getStatusBadge(project.status).label}
                        </span>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Data do Evento</p>
                          <p className="text-white">
                            {project.event_date
                              ? new Date(project.event_date).toLocaleDateString('pt-BR')
                              : 'A definir'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Local</p>
                          <p className="text-white truncate">
                            {project.venue_city}, {project.venue_state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Equipe</p>
                          <p className="text-white">{project.team_count || 0} membros</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Equipamentos</p>
                          <p className="text-white">{project.equipment_count || 0} itens</p>
                        </div>
                      </div>
                    </div>

                    {/* Financeiro */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-zinc-950/50 rounded-lg">
                      <div>
                        <p className="text-xs text-zinc-500">💰 Orçamento Cliente</p>
                        <p className="text-sm font-semibold text-blue-400">
                          {formatCurrency(project.client_budget || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Custo HRX</p>
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(project.total_cost || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          Margem Disponível
                          {project.is_urgent && (
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          )}
                        </p>
                        <p className={`text-sm font-semibold ${
                          (project.client_budget || 0) - (project.total_cost || 0) >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}>
                          {formatCurrency((project.client_budget || 0) - (project.total_cost || 0))}
                        </p>
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(project.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {project.quotations_count > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {project.quotations_count} cotações
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(project.id, project.project_number);
                          }}
                          disabled={deletingId === project.id}
                          className="bg-zinc-700 hover:bg-zinc-600 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link href={`/admin/projetos/${project.id}`}>
                          <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum projeto ainda
              </h3>
              <p className="text-zinc-400 mb-4">
                Crie seu primeiro projeto de evento
              </p>
              <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para Adicionar Projeto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Novo Projeto de Evento</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Preencha as informações básicas. Equipe e equipamentos podem ser adicionados depois.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
                Dados do Cliente
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="client_name" className="text-sm font-medium text-zinc-200">
                    Nome do Cliente *
                  </Label>
                  <Input
                    id="client_name"
                    {...register('client_name')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Nome completo do cliente"
                  />
                  {errors.client_name && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.client_name.message}</p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="client_email" className="text-sm font-medium text-zinc-200">
                    Email
                  </Label>
                  <Input
                    id="client_email"
                    type="email"
                    {...register('client_email')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="email@exemplo.com"
                  />
                  {errors.client_email && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.client_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_phone" className="text-sm font-medium text-zinc-200">
                    Telefone
                  </Label>
                  <Input
                    id="client_phone"
                    {...register('client_phone')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="client_company" className="text-sm font-medium text-zinc-200">
                    Empresa
                  </Label>
                  <Input
                    id="client_company"
                    {...register('client_company')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Evento */}
            <div className="space-y-5 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
                Dados do Evento
              </h3>

              <div className="col-span-2">
                <Label htmlFor="event_name" className="text-sm font-medium text-zinc-200">
                  Nome do Evento *
                </Label>
                <Input
                  id="event_name"
                  {...register('event_name')}
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  placeholder="Nome do evento"
                />
                {errors.event_name && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.event_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_type" className="text-sm font-medium text-zinc-200">
                    Tipo de Evento
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('event_type', value)}
                    defaultValue=""
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="Corporativo">Corporativo</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Esportivo">Esportivo</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Educacional">Educacional</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event_date" className="text-sm font-medium text-zinc-200">
                    Data do Evento
                  </Label>
                  <Input
                    id="event_date"
                    type="date"
                    {...register('event_date')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="event_description" className="text-sm font-medium text-zinc-200">
                  Descrição do Evento
                </Label>
                <Textarea
                  id="event_description"
                  {...register('event_description')}
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  placeholder="Descreva o evento..."
                  rows={3}
                />
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-5 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
                Localização do Evento
              </h3>

              <div className="col-span-2">
                <Label htmlFor="venue_address" className="text-sm font-medium text-zinc-200">
                  Endereço *
                </Label>
                <Input
                  id="venue_address"
                  {...register('venue_address')}
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  placeholder="Rua, número, complemento"
                />
                {errors.venue_address && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.venue_address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venue_city" className="text-sm font-medium text-zinc-200">
                    Cidade *
                  </Label>
                  <Input
                    id="venue_city"
                    {...register('venue_city')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Cidade"
                  />
                  {errors.venue_city && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.venue_city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="venue_state" className="text-sm font-medium text-zinc-200">
                    Estado *
                  </Label>
                  <Input
                    id="venue_state"
                    {...register('venue_state')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="UF"
                    maxLength={2}
                  />
                  {errors.venue_state && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.venue_state.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-5 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
                Configurações do Projeto
              </h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_urgent"
                  checked={isUrgent}
                  onCheckedChange={(checked) => setValue('is_urgent', checked as boolean)}
                  className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <Label htmlFor="is_urgent" className="text-sm text-zinc-300 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Projeto URGENTE (margem de lucro 80%)</span>
                  </div>
                </Label>
              </div>

              {isUrgent && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
                  <p className="text-sm text-red-400">
                    ⚠️ Este projeto será marcado como URGENTE e terá margem de lucro de 80% ao
                    invés dos 35% padrão. Um email será enviado automaticamente ao administrador.
                  </p>
                </div>
              )}
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
                {isSubmitting ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
