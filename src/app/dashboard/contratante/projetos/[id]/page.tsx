'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  Users,
  DollarSign,
  Package,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ProjectDetails {
  id: string;
  project_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  event_name: string;
  event_type: string;
  event_description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  expected_attendance: number | null;
  venue_name: string | null;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip: string | null;
  is_urgent: boolean;
  status: string;
  total_team_cost: number | null;
  total_equipment_cost: number | null;
  total_cost: number | null;
  total_client_price: number | null;
  total_profit: number | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  project_team: any[];
  project_equipment: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  new: {
    label: 'Novo',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Sua solicitação foi recebida e está aguardando análise inicial.',
  },
  analyzing: {
    label: 'Em Análise',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    description: 'Nossa equipe está analisando os requisitos do seu evento.',
  },
  quoting: {
    label: 'Orçando',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    description: 'Estamos preparando o orçamento detalhado para o seu evento.',
  },
  quoted: {
    label: 'Orçado',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    description: 'Orçamento pronto! Em breve você receberá a proposta completa.',
  },
  proposed: {
    label: 'Proposta Enviada',
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    description: 'Proposta enviada para sua análise. Aguardando sua aprovação.',
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    description: 'Projeto aprovado! Estamos organizando a equipe e equipamentos.',
  },
  in_execution: {
    label: 'Em Execução',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Seu evento está em andamento. Nossa equipe está trabalhando!',
  },
  completed: {
    label: 'Concluído',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    description: 'Evento concluído com sucesso! Obrigado pela confiança.',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    description: 'Este projeto foi cancelado.',
  },
};

export default function ProjetoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      setLoading(true);
      const response = await fetch(`/api/contratante/meus-projetos/${id}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/entrar');
          return;
        }
        if (response.status === 404) {
          toast.error('Projeto não encontrado');
          router.push('/dashboard/contratante');
          return;
        }
        throw new Error('Erro ao carregar projeto');
      }

      const data = await response.json();
      setProject(data.project);
    } catch (error: any) {
      console.error('❌ Erro ao carregar projeto:', error);
      toast.error('Erro ao carregar detalhes do projeto');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.new;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/contratante">
              <Button variant="outline" size="sm" className="border-zinc-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{project.event_name}</h1>
                {project.is_urgent && (
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                    URGENTE
                  </Badge>
                )}
              </div>
              <p className="text-zinc-400">Projeto #{project.project_number}</p>
            </div>
            <Badge className={`${statusInfo.color} border text-sm px-4 py-2`}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status atual */}
        <Card className={`mb-6 border ${statusInfo.color.split(' ')[2]}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {['completed', 'approved'].includes(project.status) ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : ['cancelled'].includes(project.status) ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Status: {statusInfo.label}
                </h3>
                <p className="text-zinc-400">{statusInfo.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Evento */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">Tipo de Evento</p>
                    <p className="text-white font-medium">{project.event_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Data do Evento</p>
                    <p className="text-white font-medium">
                      {project.event_date
                        ? new Date(project.event_date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Não definida'}
                    </p>
                  </div>
                  {project.start_time && (
                    <div>
                      <p className="text-sm text-zinc-400">Horário</p>
                      <p className="text-white font-medium">
                        {project.start_time}
                        {project.end_time && ` - ${project.end_time}`}
                      </p>
                    </div>
                  )}
                  {project.expected_attendance && (
                    <div>
                      <p className="text-sm text-zinc-400">Público Esperado</p>
                      <p className="text-white font-medium">
                        {project.expected_attendance} pessoas
                      </p>
                    </div>
                  )}
                </div>

                {project.event_description && (
                  <div>
                    <p className="text-sm text-zinc-400 mb-2">Descrição</p>
                    <p className="text-white">{project.event_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Local do Evento */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Local do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.venue_name && (
                  <p className="text-white font-medium">{project.venue_name}</p>
                )}
                <p className="text-zinc-400">{project.venue_address}</p>
                <p className="text-zinc-400">
                  {project.venue_city}, {project.venue_state}
                  {project.venue_zip && ` - CEP: ${project.venue_zip}`}
                </p>
              </CardContent>
            </Card>

            {/* Equipe */}
            {project.project_team && project.project_team.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Equipe ({project.project_team.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.project_team.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {member.role || member.category}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {member.quantity}x {member.subcategory}
                          </p>
                        </div>
                        <Badge
                          className={
                            member.status === 'confirmed'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }
                        >
                          {member.status === 'confirmed' ? 'Confirmado' : 'Planejado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equipamentos */}
            {project.project_equipment && project.project_equipment.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Equipamentos ({project.project_equipment.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.project_equipment.map((equipment: any) => (
                      <div
                        key={equipment.id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">{equipment.name}</p>
                          <p className="text-sm text-zinc-400">
                            {equipment.quantity}x - {equipment.category}
                          </p>
                        </div>
                        <Badge
                          className={
                            equipment.status === 'confirmed'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }
                        >
                          {equipment.status === 'confirmed' ? 'Confirmado' : 'Solicitado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {project.additional_notes && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 whitespace-pre-wrap">
                    {project.additional_notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">
            {/* Orçamento */}
            {project.total_client_price && project.total_client_price > 0 && (
              <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-zinc-400">Valor Total</p>
                      <p className="text-3xl font-bold text-green-500">
                        R${' '}
                        {project.total_client_price.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    {project.total_team_cost && project.total_team_cost > 0 && (
                      <div className="pt-3 border-t border-zinc-700">
                        <p className="text-sm text-zinc-400">Equipe</p>
                        <p className="text-lg text-white">
                          R${' '}
                          {project.total_team_cost.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    )}
                    {project.total_equipment_cost && project.total_equipment_cost > 0 && (
                      <div>
                        <p className="text-sm text-zinc-400">Equipamentos</p>
                        <p className="text-lg text-white">
                          R${' '}
                          {project.total_equipment_cost.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Linha do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-400">Criado em</p>
                    <p className="text-white">
                      {new Date(project.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {project.quoted_at && (
                    <div className="pt-3 border-t border-zinc-800">
                      <p className="text-sm text-zinc-400">Orçamento enviado</p>
                      <p className="text-white">
                        {new Date(project.quoted_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {project.approved_at && (
                    <div className="pt-3 border-t border-zinc-800">
                      <p className="text-sm text-zinc-400">Aprovado em</p>
                      <p className="text-white">
                        {new Date(project.approved_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {project.completed_at && (
                    <div className="pt-3 border-t border-zinc-800">
                      <p className="text-sm text-zinc-400">Concluído em</p>
                      <p className="text-white">
                        {new Date(project.completed_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
