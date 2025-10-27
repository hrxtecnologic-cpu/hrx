'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import {
  Calendar,
  MapPin,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  TrendingUp,
  DollarSign,
  Loader2,
  User,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Project {
  id: string;
  project_number: string;
  event_name: string;
  event_type: string;
  event_date: string | null;
  event_description: string | null;
  venue_city: string;
  venue_state: string;
  status: string;
  is_urgent: boolean;
  expected_attendance: number | null;
  client_budget: number | null;
  total_cost: number | null;
  total_client_price: number | null;
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Novo', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  analyzing: { label: 'Em Análise', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  quoting: { label: 'Orçando', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: DollarSign },
  quoted: { label: 'Orçado', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: DollarSign },
  proposed: { label: 'Proposta Enviada', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: TrendingUp },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  in_execution: { label: 'Em Execução', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Package },
  completed: { label: 'Concluído', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
};

export default function DashboardContratantePage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Proteção: redireciona se não estiver logado
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('❌ [Dashboard Contratante] Usuário não autenticado - redirecionando');
      router.push('/entrar');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      loadProjects();
    }
  }, [isSignedIn]);

  async function loadProjects() {
    try {
      setLoading(true);
      const response = await fetch('/api/contratante/meus-projetos');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/entrar');
          return;
        }
        throw new Error('Erro ao carregar projetos');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar seus projetos');
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: projects.length,
    pending: projects.filter(p => ['new', 'analyzing', 'quoting'].includes(p.status)).length,
    approved: projects.filter(p => ['approved', 'in_execution'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  // Mostra loading enquanto verifica autenticação
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Mostra loading enquanto carrega projetos
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando seus projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header com UserButton */}
      <DashboardHeader
        title="Meus Projetos"
        subtitle="Acompanhe o status dos seus eventos"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Botão de Ação */}
        <div className="flex justify-end items-center mb-6">
          <Link href="/solicitar-evento-wizard?type=client">
            <Button className="bg-red-600 hover:bg-red-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </Link>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total de Projetos</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Em Análise</p>
                  <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Aprovados</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Concluídos</p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Projetos */}
        {projects.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum projeto ainda
              </h3>
              <p className="text-zinc-400 mb-6">
                Comece criando seu primeiro projeto de evento
              </p>
              <Link href="/solicitar-evento">
                <Button className="bg-red-600 hover:bg-red-500 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Todos os Projetos</h2>
            {projects.map((project) => {
              const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.new;
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={project.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Conteúdo principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-4">
                          {/* Ícone de status */}
                          <div className={`p-3 rounded-lg ${statusInfo.color} border`}>
                            <StatusIcon className="h-6 w-6" />
                          </div>

                          {/* Info do projeto */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {project.event_name}
                                </h3>
                                <p className="text-sm text-zinc-400">
                                  #{project.project_number}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {project.is_urgent && (
                                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                    URGENTE
                                  </Badge>
                                )}
                                <Badge className={`${statusInfo.color} border`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                            </div>

                            {/* Detalhes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                              <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {project.event_date
                                    ? new Date(project.event_date).toLocaleDateString('pt-BR')
                                    : 'Data não definida'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {project.venue_city}, {project.venue_state}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>

                            {/* Orçamento (se disponível) */}
                            {project.client_budget && project.client_budget > 0 ? (
                              <div className="bg-blue-800/20 rounded-lg p-3 mb-4 border border-blue-700/30">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-zinc-400">💰 Seu Orçamento:</span>
                                  <span className="text-sm font-bold text-blue-400">
                                    R$ {project.client_budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {project.total_cost && project.total_cost > 0 && (
                                  <>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-zinc-500">Custo HRX:</span>
                                      <span className="text-sm text-white">
                                        R$ {project.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                                      <span className="text-xs text-zinc-500">Margem:</span>
                                      <span className={`text-sm font-bold ${
                                        (project.client_budget - project.total_cost) >= 0
                                          ? 'text-green-400'
                                          : 'text-red-400'
                                      }`}>
                                        R$ {(project.client_budget - project.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : project.total_client_price && project.total_client_price > 0 && (
                              <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-zinc-400">Valor Estimado:</span>
                                  <span className="text-lg font-bold text-green-500">
                                    R$ {project.total_client_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                          <div className="text-xs text-zinc-500">
                            Tipo: <span className="text-zinc-400">{project.event_type}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {project.status === 'new' && (
                              <Link href={`/solicitar-evento-wizard?type=client&projectId=${project.id}`}>
                                <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-white">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                              </Link>
                            )}
                            <Link href={`/dashboard/contratante/projetos/${project.id}`}>
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
