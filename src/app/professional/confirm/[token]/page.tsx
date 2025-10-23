'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Home,
} from 'lucide-react';
import Link from 'next/link';

interface ProjectData {
  projectNumber: string;
  eventName: string;
  eventType: string;
  eventDescription?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  clientName: string;
  isUrgent: boolean;
  projectStatus: string;
}

interface AssignmentData {
  role: string;
  category: string;
  durationDays: number;
  dailyRate?: number;
}

interface ProfessionalData {
  name: string;
  email?: string;
  phone?: string;
}

interface InvitationData {
  success: boolean;
  status: string;
  tokenExpired: boolean;
  tokenExpiresAt?: string;
  project: ProjectData;
  assignment: AssignmentData;
  professional?: ProfessionalData;
  invitedAt?: string;
  confirmedAt?: string;
}

export default function ProfessionalConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  const action = searchParams?.get('action'); // 'confirm' ou 'reject' (vindo do email)

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [data, setData] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    action: string;
    message: string;
  } | null>(null);

  // Buscar dados do convite ao carregar
  useEffect(() => {
    const fetchInvitationData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/professional/confirm/${token}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.message || 'Erro ao carregar dados do convite');
          return;
        }

        setData(result);
      } catch (err) {
        setError('Erro ao carregar dados do convite');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitationData();
    }
  }, [token]);

  // Processar ação automática vinda do email (se houver)
  useEffect(() => {
    if (action && data && !actionResult && !processing) {
      handleAction(action as 'confirm' | 'reject');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, data]);

  // Confirmar ou rejeitar convite
  const handleAction = async (selectedAction: 'confirm' | 'reject') => {
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/professional/confirm/${token}?action=${selectedAction}`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Erro ao processar ação');
        return;
      }

      setActionResult({
        success: result.success,
        action: selectedAction,
        message: result.message,
      });

      // Atualizar status local
      if (data) {
        setData({
          ...data,
          status: selectedAction === 'confirm' ? 'confirmed' : 'rejected',
        });
      }
    } catch (err) {
      setError('Erro ao processar ação');
      console.error('Erro:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'A definir';
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
  const formatCurrency = (value?: number) => {
    if (!value) return 'A definir';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // ========================================
  // ESTADOS DE CARREGAMENTO E ERRO
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando dados do convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <CardTitle className="text-white">Erro ao Carregar Convite</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-400">{error}</p>
            <Link href="/">
              <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                <Home className="h-4 w-4 mr-2" />
                Voltar para Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // ========================================
  // RESULTADO DA AÇÃO (CONFIRMADO/REJEITADO)
  // ========================================

  if (actionResult) {
    const isConfirmed = actionResult.action === 'confirm';

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              {isConfirmed ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              <CardTitle className="text-white text-2xl">
                {isConfirmed ? 'Presença Confirmada!' : 'Convite Recusado'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mensagem */}
            <div
              className={`p-4 rounded-lg border ${
                isConfirmed
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <p className={isConfirmed ? 'text-green-400' : 'text-red-400'}>
                {actionResult.message}
              </p>
            </div>

            {/* Detalhes do Evento */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-lg">Detalhes do Evento</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-zinc-500">Projeto</p>
                  <p className="text-zinc-300">{data.project.projectNumber}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Evento</p>
                  <p className="text-zinc-300">{data.project.eventName}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Função</p>
                  <p className="text-zinc-300">{data.assignment.role}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Duração</p>
                  <p className="text-zinc-300">
                    {data.assignment.durationDays} {data.assignment.durationDays === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            </div>

            {/* Próximos Passos */}
            {isConfirmed && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Próximos Passos</h4>
                <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside">
                  <li>Nossa equipe entrará em contato em breve</li>
                  <li>Você receberá mais informações sobre logística e horários</li>
                  <li>Fique atento ao seu email e telefone</li>
                  <li>Em caso de dúvidas, entre em contato conosco</li>
                </ul>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar para Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================
  // TELA DE CONFIRMAÇÃO (STATUS: invited)
  // ========================================

  // Verificar status
  const canConfirm = data.status === 'invited' && !data.tokenExpired;
  const isAlreadyConfirmed = data.status === 'confirmed';
  const isRejected = data.status === 'rejected';
  const isCancelled = data.status === 'cancelled';

  return (
    <div className="min-h-screen bg-zinc-950 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Convite para Trabalhar</h1>
          <p className="text-zinc-400">
            {data.professional?.name && `Olá, ${data.professional.name}!`} Você foi convidado para trabalhar em um evento
          </p>
        </div>

        {/* Alertas */}
        {data.project.isUrgent && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-yellow-400 font-semibold">Evento Urgente</p>
              <p className="text-yellow-500/80 text-sm">Este projeto precisa de confirmação rápida!</p>
            </div>
          </div>
        )}

        {data.tokenExpired && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">Token expirado. Entre em contato com a HRX para renovar o convite.</p>
          </div>
        )}

        {isAlreadyConfirmed && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-green-400">Você já confirmou presença neste evento</p>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">Você recusou este convite anteriormente</p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
            <p className="text-zinc-400">Este convite foi cancelado pela HRX</p>
          </div>
        )}

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detalhes do Evento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Detalhes do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-zinc-500 text-sm">Nome do Evento</p>
                <p className="text-white font-semibold">{data.project.eventName}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Tipo</p>
                <p className="text-zinc-300">{data.project.eventType}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Cliente</p>
                <p className="text-zinc-300">{data.project.clientName}</p>
              </div>
              {data.project.eventDate && (
                <div>
                  <p className="text-zinc-500 text-sm">Data</p>
                  <p className="text-zinc-300">{formatDate(data.project.eventDate)}</p>
                </div>
              )}
              {(data.project.startTime || data.project.endTime) && (
                <div>
                  <p className="text-zinc-500 text-sm">Horário</p>
                  <p className="text-zinc-300">
                    {formatTime(data.project.startTime)} - {formatTime(data.project.endTime)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Local */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Local do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.project.venueName && (
                <div>
                  <p className="text-zinc-500 text-sm">Nome do Local</p>
                  <p className="text-zinc-300">{data.project.venueName}</p>
                </div>
              )}
              <div>
                <p className="text-zinc-500 text-sm">Endereço</p>
                <p className="text-zinc-300">{data.project.venueAddress}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Cidade/Estado</p>
                <p className="text-zinc-300">
                  {data.project.venueCity}, {data.project.venueState}
                </p>
              </div>
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
            <CardContent className="space-y-4">
              <div>
                <p className="text-zinc-500 text-sm">Função</p>
                <p className="text-white font-semibold">{data.assignment.role}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Categoria</p>
                <p className="text-zinc-300">{data.assignment.category}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Duração</p>
                <p className="text-zinc-300">
                  {data.assignment.durationDays} {data.assignment.durationDays === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Remuneração */}
          {data.assignment.dailyRate && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  Remuneração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-zinc-500 text-sm">Diária</p>
                  <p className="text-white font-bold text-2xl">
                    {formatCurrency(data.assignment.dailyRate)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-sm">Estimativa Total</p>
                  <p className="text-zinc-300">
                    {formatCurrency(data.assignment.dailyRate * data.assignment.durationDays)}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    ({data.assignment.durationDays} {data.assignment.durationDays === 1 ? 'dia' : 'dias'})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Descrição do Evento */}
        {data.project.eventDescription && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Descrição do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 whitespace-pre-wrap">{data.project.eventDescription}</p>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        {canConfirm && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Confirme sua Presença</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400">
                Ao confirmar, você se compromete a estar disponível nas datas informadas. Caso não possa participar,
                por favor recuse o convite para que possamos alocar outro profissional.
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

        {/* Footer */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
              <Home className="h-4 w-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
