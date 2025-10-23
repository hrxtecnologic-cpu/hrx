'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  User,
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface EventDetails {
  id: string;
  project_id: string;
  project_number: string;
  event_name: string;
  event_type: string;
  event_description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue_name?: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_zip?: string;
  client_name: string;
  role: string;
  category: string;
  duration_days: number;
  daily_rate?: number;
  total_cost?: number;
  status: string;
  invited_at?: string;
  confirmed_at?: string;
  is_urgent: boolean;
  notes?: string;
}

export default function ProfessionalEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buscar detalhes do evento
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/professional/events/${eventId}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.message || 'Erro ao carregar evento');
          return;
        }

        setEvent(result.event);
      } catch (err) {
        console.error('Erro ao carregar evento:', err);
        setError('Erro ao carregar detalhes do evento');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  // Confirmar ou rejeitar
  const handleAction = async (action: 'confirm' | 'reject') => {
    if (!confirm(`Tem certeza que deseja ${action === 'confirm' ? 'confirmar' : 'rejeitar'} este convite?`)) {
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(`/api/professional/events/${eventId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Erro ao processar ação');
        return;
      }

      toast.success(result.message || 'Ação realizada com sucesso!');

      // Redirecionar para dashboard
      setTimeout(() => {
        router.push('/professional/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Erro ao processar ação:', err);
      toast.error('Erro ao processar ação');
    } finally {
      setProcessing(false);
    }
  };

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

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando evento...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Erro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-400">{error || 'Evento não encontrado'}</p>
            <Link href="/professional/dashboard">
              <Button className="w-full bg-red-600 hover:bg-red-500 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = event.status === 'invited';
  const isConfirmed = event.status === 'confirmed' || event.status === 'allocated';
  const isRejected = event.status === 'rejected';
  const isCompleted = event.status === 'completed';

  return (
    <div className="min-h-screen bg-zinc-950 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/professional/dashboard">
            <Button variant="outline" className="border-zinc-700 text-zinc-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{event.event_name}</h1>
            <p className="text-zinc-400 text-sm">Projeto: {event.project_number}</p>
          </div>
          {event.is_urgent && (
            <Badge variant="destructive" className="text-sm">
              URGENTE
            </Badge>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {isPending && (
            <Badge className="bg-blue-600/10 text-blue-500 border-blue-600/20">
              Aguardando Sua Resposta
            </Badge>
          )}
          {isConfirmed && (
            <Badge className="bg-green-600/10 text-green-500 border-green-600/20">
              Confirmado
            </Badge>
          )}
          {isRejected && (
            <Badge className="bg-red-600/10 text-red-500 border-red-600/20">
              Recusado
            </Badge>
          )}
          {isCompleted && (
            <Badge className="bg-zinc-700 text-zinc-300">
              Concluído
            </Badge>
          )}
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detalhes do Evento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Detalhes do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-zinc-500 text-sm">Tipo de Evento</p>
                <p className="text-white">{event.event_type}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Data</p>
                <p className="text-white">{formatDate(event.event_date)}</p>
              </div>
              {(event.start_time || event.end_time) && (
                <div>
                  <p className="text-zinc-500 text-sm">Horário</p>
                  <p className="text-white">
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-zinc-500 text-sm">Cliente</p>
                <p className="text-white">{event.client_name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Local do Evento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Local do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {event.venue_name && (
                <div>
                  <p className="text-zinc-500 text-sm">Nome do Local</p>
                  <p className="text-white">{event.venue_name}</p>
                </div>
              )}
              <div>
                <p className="text-zinc-500 text-sm">Endereço</p>
                <p className="text-white">{event.venue_address}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Cidade/Estado</p>
                <p className="text-white">
                  {event.venue_city}, {event.venue_state}
                </p>
              </div>
              {event.venue_zip && (
                <div>
                  <p className="text-zinc-500 text-sm">CEP</p>
                  <p className="text-white">{event.venue_zip}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sua Função */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                Sua Função
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-zinc-500 text-sm">Função</p>
                <p className="text-white font-semibold">{event.role}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Categoria</p>
                <p className="text-white">{event.category}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Duração</p>
                <p className="text-white">
                  {event.duration_days} {event.duration_days === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Remuneração */}
          {event.daily_rate && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Remuneração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-zinc-500 text-sm">Diária</p>
                  <p className="text-white font-bold text-2xl">
                    {formatCurrency(event.daily_rate)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Total Estimado</p>
                  <p className="text-green-500 font-bold text-xl">
                    {formatCurrency(event.total_cost || event.daily_rate * event.duration_days)}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    ({event.duration_days} {event.duration_days === 1 ? 'dia' : 'dias'})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Descrição */}
        {event.event_description && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Descrição do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 whitespace-pre-wrap">{event.event_description}</p>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {event.notes && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 whitespace-pre-wrap">{event.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Ações (apenas se pendente) */}
        {isPending && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Confirme sua Presença</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400">
                Por favor, confirme ou recuse este convite o quanto antes. Nossa equipe aguarda sua
                resposta para finalizar o planejamento do evento.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction('confirm')}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Presença
                </Button>
                <Button
                  onClick={() => handleAction('reject')}
                  disabled={processing}
                  variant="outline"
                  className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Recusar Convite
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
