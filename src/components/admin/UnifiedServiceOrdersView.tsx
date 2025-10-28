/**
 * Unified Service Orders View
 *
 * Componente unificado que mostra TODOS os dados de OS em um só lugar:
 * - Dados básicos (número, evento, data)
 * - Status e progresso
 * - Briefing da IA
 * - Timeline e checklist
 * - Emails enviados
 * - Ações (reenviar emails, marcar como concluído, etc)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  Truck,
  PlayCircle,
  StopCircle,
  Send,
} from 'lucide-react';
import { UnifiedServiceOrder } from '@/app/api/admin/service-orders/unified/route';
import { useAuth } from '@clerk/nextjs';

interface UnifiedServiceOrdersViewProps {
  initialStats: {
    total: number;
    upcoming: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'upcoming';

export function UnifiedServiceOrdersView({ initialStats }: UnifiedServiceOrdersViewProps) {
  const { getToken } = useAuth();

  const [serviceOrders, setServiceOrders] = useState<UnifiedServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Row expansion
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Email sending
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    loadServiceOrders();
  }, []);

  async function loadServiceOrders() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/service-orders/unified');

      if (!response.ok) {
        throw new Error('Erro ao carregar ordens de serviço');
      }

      const data = await response.json();

      if (data.success) {
        setServiceOrders(data.serviceOrders);
        console.log(`✅ ${data.serviceOrders.length} ordens de serviço carregadas em ${data.performance.duration_seconds}s`);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar ordens de serviço:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar service orders
  const filteredServiceOrders = serviceOrders.filter(os => {
    // Filtro por tab
    if (activeTab === 'pending' && os.status !== 'pending') return false;
    if (activeTab === 'in_progress' && os.status !== 'in_progress') return false;
    if (activeTab === 'completed' && os.status !== 'completed') return false;
    if (activeTab === 'cancelled' && os.status !== 'cancelled') return false;

    // Próximos 7 dias
    if (activeTab === 'upcoming') {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const eventDate = new Date(os.event_date);

      if (eventDate < today || eventDate > nextWeek) return false;
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        os.os_number?.toLowerCase().includes(term) ||
        os.title?.toLowerCase().includes(term) ||
        os.client_name?.toLowerCase().includes(term) ||
        os.venue_city?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Toggle row expansion
  function toggleRow(id: string) {
    setExpandedRow(expandedRow === id ? null : id);
  }

  // Reenviar emails
  async function handleResendEmails(os: UnifiedServiceOrder) {
    if (!confirm(`Reenviar emails da OS ${os.os_number}?`)) {
      return;
    }

    setSendingEmail(os.id);

    try {
      const token = await getToken();

      const response = await fetch(`/api/admin/service-orders/${os.id}/resend-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Emails reenviados com sucesso!');
        loadServiceOrders();
      } else {
        const error = await response.json();
        alert(`❌ Erro ao reenviar emails: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro ao reenviar emails:', err);
      alert(`❌ Erro ao reenviar emails: ${err.message}`);
    } finally {
      setSendingEmail(null);
    }
  }

  // Formatar data
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Formatar data completa
  function formatFullDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-zinc-900 border-red-500/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Erro ao carregar ordens de serviço: {error}</p>
          </div>
          <Button
            onClick={loadServiceOrders}
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'all'
              ? 'text-white border-b-2 border-red-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({initialStats.total})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'upcoming'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Próximos 7 Dias ({initialStats.upcoming})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'pending'
              ? 'text-yellow-500 border-b-2 border-yellow-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Aguardando ({initialStats.pending})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'in_progress'
              ? 'text-purple-500 border-b-2 border-purple-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Em Andamento ({initialStats.in_progress})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'completed'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Concluídas ({initialStats.completed})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'cancelled'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Canceladas ({initialStats.cancelled})
        </button>
      </div>

      {/* Busca */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por número, evento, cliente ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
      </div>

      {/* Tabela */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400 w-8"></th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">OS</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Evento</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Data</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Local</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Progresso</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Equipe</th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredServiceOrders.length > 0 ? (
                  filteredServiceOrders.map((os) => (
                    <React.Fragment key={os.id}>
                      {/* Main Row */}
                      <tr
                        className="hover:bg-zinc-800/50 transition cursor-pointer"
                        onClick={() => toggleRow(os.id)}
                      >
                        {/* Expand Icon */}
                        <td className="p-4">
                          {expandedRow === os.id ? (
                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          )}
                        </td>

                        {/* OS Number */}
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-white font-mono">{os.os_number}</p>
                            <p className="text-xs text-zinc-500">{formatDate(os.created_at)}</p>
                          </div>
                        </td>

                        {/* Evento */}
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-white">{os.title.replace('OS - ', '')}</p>
                            <p className="text-sm text-zinc-500">{os.client_name}</p>
                          </div>
                        </td>

                        {/* Data */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm text-white">{formatDate(os.event_date)}</p>
                              {os.event_start_time && (
                                <p className="text-xs text-zinc-500">
                                  {os.event_start_time} - {os.event_end_time}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Local */}
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-zinc-400">
                            <MapPin className="h-3 w-3" />
                            <span>{os.venue_city}, {os.venue_state}</span>
                          </div>
                          {os.distance_from_base_km && (
                            <p className="text-xs text-zinc-500 mt-1">
                              {os.distance_from_base_km.toFixed(1)} km da base
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {os.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              <CheckCircle className="h-3 w-3" />
                              Concluída
                            </span>
                          ) : os.status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded">
                              <PlayCircle className="h-3 w-3" />
                              Em Andamento
                            </span>
                          ) : os.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                              <Clock className="h-3 w-3" />
                              Aguardando
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                              <StopCircle className="h-3 w-3" />
                              Cancelada
                            </span>
                          )}
                        </td>

                        {/* Progresso */}
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="text-white">
                              {os.completed_tasks}/{os.total_tasks} tarefas
                            </p>
                            <div className="w-24 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{
                                  width: `${os.total_tasks > 0 ? (os.completed_tasks / os.total_tasks) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Equipe */}
                        <td className="p-4">
                          <div className="text-sm text-zinc-400">
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>{os.total_professionals}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Truck className="h-3 w-3" />
                              <span>{os.total_suppliers}</span>
                            </div>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-zinc-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(os.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === os.id && (
                        <tr className="bg-zinc-800/30">
                          <td colSpan={9} className="p-6">
                            <div className="space-y-6">
                              {/* Cabeçalho com informações principais */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Coluna 1: Event Info */}
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-3">📍 Informações do Evento</h4>
                                  <dl className="space-y-2 text-sm">
                                    <div>
                                      <dt className="text-zinc-500">Data Completa</dt>
                                      <dd className="text-white">{formatFullDate(os.event_date)}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-zinc-500">Horário</dt>
                                      <dd className="text-white">
                                        {os.event_start_time} às {os.event_end_time}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-zinc-500">Local</dt>
                                      <dd className="text-white">{os.venue_name}</dd>
                                      <dd className="text-zinc-400 text-xs mt-1">
                                        {os.venue_address}, {os.venue_city}/{os.venue_state}
                                      </dd>
                                    </div>
                                    {os.recommended_arrival_time && (
                                      <div>
                                        <dt className="text-zinc-500">Chegada Recomendada</dt>
                                        <dd className="text-orange-500 font-medium">{os.recommended_arrival_time}</dd>
                                      </div>
                                    )}
                                  </dl>
                                </div>

                                {/* Coluna 2: Logística */}
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-3">🚗 Logística</h4>
                                  <dl className="space-y-2 text-sm">
                                    {os.distance_from_base_km && (
                                      <div>
                                        <dt className="text-zinc-500">Distância da Base</dt>
                                        <dd className="text-white">{os.distance_from_base_km.toFixed(1)} km</dd>
                                      </div>
                                    )}
                                    {os.estimated_travel_time_minutes && (
                                      <div>
                                        <dt className="text-zinc-500">Tempo de Viagem</dt>
                                        <dd className="text-white">~{os.estimated_travel_time_minutes} min</dd>
                                      </div>
                                    )}
                                    <div>
                                      <dt className="text-zinc-500">Profissionais</dt>
                                      <dd className="text-white">{os.total_professionals} alocados</dd>
                                    </div>
                                    <div>
                                      <dt className="text-zinc-500">Fornecedores</dt>
                                      <dd className="text-white">{os.total_suppliers} envolvidos</dd>
                                    </div>
                                  </dl>
                                </div>

                                {/* Coluna 3: Comunicação */}
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-3">📧 Comunicação</h4>
                                  <dl className="space-y-2 text-sm">
                                    <div>
                                      <dt className="text-zinc-500">Emails Enviados</dt>
                                      <dd className="text-white">{os.total_emails_sent}</dd>
                                    </div>
                                    {os.last_log_action && (
                                      <div>
                                        <dt className="text-zinc-500">Última Ação</dt>
                                        <dd className="text-white capitalize">{os.last_log_action.replace('_', ' ')}</dd>
                                        {os.last_log_at && (
                                          <dd className="text-xs text-zinc-500 mt-1">
                                            {formatDate(os.last_log_at)} às {new Date(os.last_log_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          </dd>
                                        )}
                                      </div>
                                    )}
                                  </dl>
                                </div>
                              </div>

                              {/* Briefing da IA */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">🤖 Briefing Inteligente</h4>
                                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                    {os.ai_briefing}
                                  </p>
                                </div>
                              </div>

                              {/* Recomendações */}
                              {os.ai_recommendations && (
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-3">💡 Recomendações</h4>
                                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                                    <p className="text-sm text-green-200 whitespace-pre-wrap">
                                      {os.ai_recommendations}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Alertas */}
                              {os.ai_alerts && (
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-3">⚠️ Alertas Importantes</h4>
                                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-sm text-red-200 whitespace-pre-wrap">
                                      {os.ai_alerts}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Ações Rápidas */}
                              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700 text-white hover:bg-blue-500/10 hover:border-blue-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResendEmails(os);
                                  }}
                                  disabled={sendingEmail === os.id}
                                >
                                  {sendingEmail === os.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      Reenviar Emails
                                    </>
                                  )}
                                </Button>

                                {os.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    className="bg-purple-500 hover:bg-purple-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implementar início de OS
                                    }}
                                  >
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Iniciar OS
                                  </Button>
                                )}

                                {os.status === 'in_progress' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implementar conclusão de OS
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Concluída
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700 text-white hover:bg-zinc-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implementar visualização detalhada
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver Detalhes Completos
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-zinc-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhuma ordem de serviço encontrada</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer com total */}
      <div className="text-sm text-zinc-400 text-center">
        Mostrando {filteredServiceOrders.length} de {serviceOrders.length} ordens de serviço
      </div>
    </div>
  );
}
