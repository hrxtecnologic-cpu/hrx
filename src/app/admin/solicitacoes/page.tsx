import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import {
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default async function SolicitacoesPage() {
  const supabase = await createClient();

  // Buscar todas as solicitações
  const { data: requests } = await supabase
    .from('contractor_requests')
    .select('*')
    .order('created_at', { ascending: false });

  // Contar por status
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: inProgressCount },
    { count: completedCount },
  ] = await Promise.all([
    supabase.from('contractor_requests').select('*', { count: 'exact', head: true }),
    supabase
      .from('contractor_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('contractor_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    supabase
      .from('contractor_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Solicitações de Equipe</h1>
        <p className="text-zinc-400">Gerenciar solicitações de empresas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{totalCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-500">{pendingCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-500">{inProgressCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Concluídas</p>
            <p className="text-2xl font-bold text-green-500">{completedCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Solicitações */}
      <div className="space-y-4">
        {requests && requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {request.urgency === 'very_urgent' ? (
                      <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      </div>
                    ) : request.status === 'completed' ? (
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-500" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {request.event_name}
                        </h3>
                        <p className="text-sm text-zinc-400">{request.company_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {request.urgency === 'very_urgent' && (
                          <span className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-full whitespace-nowrap">
                            Muito Urgente
                          </span>
                        )}
                        {request.urgency === 'urgent' && (
                          <span className="text-xs bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full whitespace-nowrap">
                            Urgente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Data do Evento</p>
                          <p className="text-white">
                            {new Date(request.start_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Local</p>
                          <p className="text-white">
                            {request.venue_city}, {request.venue_state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500 text-xs">Tipo de Evento</p>
                          <p className="text-white">{request.event_type}</p>
                        </div>
                      </div>
                    </div>

                    {/* Profissionais Necessários */}
                    {request.professionals_needed && (
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 mb-2">Profissionais Necessários:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.professionals_needed.map((prof: any, index: number) => (
                            <span
                              key={index}
                              className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded"
                            >
                              {prof.quantity}x {prof.category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status e Ações */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>
                          Recebida em: {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {request.status === 'pending' ? (
                          <span className="text-yellow-500">● Aguardando resposta</span>
                        ) : request.status === 'in_progress' ? (
                          <span className="text-blue-500">● Em andamento</span>
                        ) : (
                          <span className="text-green-500">● Concluída</span>
                        )}
                      </div>

                      <Link href={`/admin/solicitacoes/${request.id}`}>
                        <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhuma solicitação ainda
              </h3>
              <p className="text-zinc-400">
                As solicitações de equipe aparecerão aqui
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
