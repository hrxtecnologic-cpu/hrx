'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  TrendingUp,
  Bell,
  User,
  Mail,
  Phone,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Event {
  id: string;
  project_id: string;
  project_number: string;
  event_name: string;
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue_city: string;
  venue_state: string;
  venue_address: string;
  role: string;
  category: string;
  duration_days: number;
  daily_rate?: number;
  total_cost?: number;
  status: 'planned' | 'invited' | 'confirmed' | 'rejected' | 'allocated' | 'working' | 'completed' | 'cancelled';
  invited_at?: string;
  confirmed_at?: string;
  is_urgent: boolean;
}

interface DashboardStats {
  pending_invitations: number;
  upcoming_events: number;
  completed_events: number;
  total_earned: number;
  pending_earnings: number;
}

interface ProfessionalData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  categories: string[];
  subcategories?: Record<string, string[]>;
  documents?: Record<string, unknown>;
  city?: string;
  state?: string;
  rejection_reason?: string;
}

export default function ProfessionalDashboardPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [professional, setProfessional] = useState<ProfessionalData | null>(null);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);

  // Buscar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/professional/dashboard');
        const result = await response.json();

        if (!response.ok) {
          toast.error(result.message || 'Erro ao carregar dashboard');
          return;
        }

        setStats(result.stats);
        setProfessional(result.professional);
        setPendingEvents(result.pending_events || []);
        setUpcomingEvents(result.upcoming_events || []);
        setCompletedEvents(result.completed_events || []);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user]);

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formatar hora
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Card de evento
  const EventCard = ({ event }: { event: Event }) => {
    const isPending = event.status === 'invited';
    const isUpcoming = event.status === 'confirmed' || event.status === 'allocated';
    const isCompleted = event.status === 'completed';

    return (
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-white text-base">{event.event_name}</CardTitle>
                {event.is_urgent && (
                  <Badge variant="destructive" className="text-xs">
                    URGENTE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">Projeto: {event.project_number}</p>
            </div>
            {isPending && (
              <Badge className="bg-blue-600/10 text-blue-500 border-blue-600/20">
                Aguardando
              </Badge>
            )}
            {isUpcoming && (
              <Badge className="bg-green-600/10 text-green-500 border-green-600/20">
                Confirmado
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-zinc-700 text-zinc-300">
                Concluído
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            {(event.start_time || event.end_time) && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin className="h-4 w-4" />
              <span>
                {event.venue_city}, {event.venue_state}
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Briefcase className="h-4 w-4" />
              <span>{event.role}</span>
            </div>
          </div>

          {/* Remuneração */}
          {event.daily_rate && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Cachê Total</span>
                <span className="text-lg font-bold text-green-500">
                  {formatCurrency(event.total_cost || event.daily_rate * event.duration_days)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-500">
                  {formatCurrency(event.daily_rate)} × {event.duration_days}{' '}
                  {event.duration_days === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            </div>
          )}

          {/* Ações */}
          {isPending && (
            <div className="flex gap-2 pt-2">
              <Link href={`/professional/events/${event.id}`} className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">
                  Ver Convite
                </Button>
              </Link>
            </div>
          )}
          {(isUpcoming || isCompleted) && (
            <Link href={`/professional/events/${event.id}`}>
              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                size="sm"
              >
                Ver Detalhes
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              Você precisa estar autenticado para acessar o dashboard.
            </p>
            <Link href="/sign-in">
              <Button className="w-full bg-red-600 hover:bg-red-500 text-white">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status config
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        textColor: 'text-yellow-500',
        title: 'Em Análise',
        message: 'Seu cadastro está sendo analisado pela nossa equipe. Em breve você receberá um retorno.',
      },
      approved: {
        icon: CheckCircle2,
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        textColor: 'text-green-500',
        title: 'Aprovado',
        message: 'Parabéns! Seu cadastro foi aprovado. Agora você pode receber oportunidades de trabalho.',
      },
      rejected: {
        icon: AlertCircle,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-500',
        title: 'Ajustes Necessários',
        message: 'Seu cadastro precisa de alguns ajustes. Corrija as informações e reenvie para análise.',
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = professional ? getStatusConfig(professional.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header com UserButton */}
      <DashboardHeader
        userName={professional?.name}
        userRole="Profissional"
      />

      <div className="p-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Botões de ação */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Meu Dashboard</h1>
              <p className="text-zinc-400">
                Acompanhe seus eventos e convites
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/cadastro-profissional-wizard">
                <Button className="bg-red-600 hover:bg-red-700 text-white border-0">
                  <User className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>

        {/* Status do Cadastro */}
        {professional && statusConfig && StatusIcon && (
          <Card className={`bg-zinc-900 border-zinc-800 ${statusConfig.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${statusConfig.bgColor}`}>
                  <StatusIcon className={`h-8 w-8 ${statusConfig.textColor}`} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold mb-2 ${statusConfig.textColor}`}>
                    Status: {statusConfig.title}
                  </h2>
                  <p className="text-zinc-400">{statusConfig.message}</p>

                  {professional.status === 'rejected' && professional.rejection_reason && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm font-medium text-red-400 mb-2">Motivo:</p>
                      <p className="text-sm text-red-300 whitespace-pre-line">
                        {professional.rejection_reason}
                      </p>
                    </div>
                  )}

                  {professional.status === 'pending' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                      <Clock className="h-4 w-4" />
                      <span>Tempo médio de análise: 24-48 horas úteis</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Convites Pendentes */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Convites Pendentes</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats.pending_invitations}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximos Eventos */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Próximos Eventos</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.upcoming_events}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eventos Concluídos */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Eventos Concluídos</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats.completed_events}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-zinc-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Ganho */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">A Receber</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">
                      {formatCurrency(stats.pending_earnings)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-600/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Convites Pendentes */}
        {pendingEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Convites Aguardando Resposta ({pendingEvents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Próximos Eventos */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Próximos Eventos ({upcomingEvents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        {completedEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-zinc-500" />
              Histórico de Eventos ({completedEvents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedEvents.slice(0, 6).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {completedEvents.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-400">
                  Ver Todos ({completedEvents.length})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {pendingEvents.length === 0 && upcomingEvents.length === 0 && completedEvents.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum Evento Ainda
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                Você ainda não tem eventos. Quando você for convidado para trabalhar em um
                evento, ele aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        {professional && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Perfil */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-red-600" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Nome Completo</p>
                  <p className="text-sm text-white">{professional.name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-white">{professional.email}</p>
                </div>
                {professional.phone && (
                  <div>
                    <p className="text-xs text-zinc-500">Telefone</p>
                    <p className="text-sm text-white">{professional.phone}</p>
                  </div>
                )}
                {professional.city && professional.state && (
                  <div>
                    <p className="text-xs text-zinc-500">Cidade</p>
                    <p className="text-sm text-white">
                      {professional.city} - {professional.state}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subcategorias / Especialidades */}
            {professional.subcategories && Object.keys(professional.subcategories).length > 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-red-600" />
                    Minhas Especialidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(professional.subcategories).map(([category, subs]) => (
                    <div key={category}>
                      <p className="text-sm font-semibold text-zinc-400 mb-2">{category}</p>
                      <div className="flex flex-wrap gap-2">
                        {subs.map((sub: string) => (
                          <span
                            key={sub}
                            className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full border border-red-500/20"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : professional.categories && professional.categories.length > 0 && (
              // Fallback para sistema antigo (categorias)
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-red-600" />
                    Minhas Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {professional.categories.map((cat: string) => (
                      <span
                        key={cat}
                        className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full border border-red-500/20"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documentos */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {professional.documents && Object.keys(professional.documents).length > 0 ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">
                      {Object.keys(professional.documents).length} documentos enviados
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Nenhum documento enviado</span>
                  </div>
                )}
                <Link href="/cadastro-profissional-wizard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-red-600 hover:text-white hover:border-red-600 mt-2"
                  >
                    Gerenciar Documentos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ações Rápidas */}
        {professional && (
          <Card className="bg-zinc-900 border-zinc-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <a
                href="mailto:atendimento@hrxeventos.com.br"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition text-sm"
              >
                📧 Enviar Email
              </a>
              <a
                href="https://wa.me/5521999952457"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm"
              >
                💬 WhatsApp
              </a>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
