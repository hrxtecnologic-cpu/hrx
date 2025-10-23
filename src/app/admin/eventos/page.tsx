import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default async function EventosPage() {
  const supabase = await createClient();

  // Buscar projetos aprovados e em execução (eventos)
  const { data: events } = await supabase
    .from('event_projects')
    .select('*')
    .in('status', ['approved', 'in_execution', 'completed'])
    .order('event_date', { ascending: true });

  const now = new Date();

  // Separar eventos futuros e passados
  const upcomingEvents = events?.filter(e => e.event_date && new Date(e.event_date) >= now) || [];
  const pastEvents = events?.filter(e => e.event_date && new Date(e.event_date) < now) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Eventos</h1>
        <p className="text-zinc-400">Gerenciar eventos e alocação de profissionais das solicitações aprovadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total de Eventos</p>
            <p className="text-2xl font-bold text-white">{events?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Próximos Eventos</p>
            <p className="text-2xl font-bold text-blue-500">{upcomingEvents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Em Execução</p>
            <p className="text-2xl font-bold text-yellow-500">
              {events?.filter(e => e.status === 'in_execution').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Concluídos</p>
            <p className="text-2xl font-bold text-green-500">
              {events?.filter(e => e.status === 'completed').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Eventos */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Próximos Eventos</h2>
          <div className="grid gap-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Data Badge */}
                    <div className="flex-shrink-0 w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-lg flex flex-col items-center justify-center">
                      <p className="text-xs text-red-500 uppercase">
                        {new Date(event.event_date).toLocaleDateString('pt-BR', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-red-500">
                        {new Date(event.event_date).getDate()}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {event.event_name}
                          </h3>
                          <p className="text-sm text-zinc-400">{event.client_company || event.client_name}</p>
                        </div>
                        {event.status === 'in_execution' ? (
                          <span className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full whitespace-nowrap">
                            Em Execução
                          </span>
                        ) : event.status === 'approved' ? (
                          <span className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full whitespace-nowrap">
                            Aprovado
                          </span>
                        ) : (
                          <span className="text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full whitespace-nowrap">
                            Concluído
                          </span>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-zinc-500" />
                          <div>
                            <p className="text-zinc-400">
                              {new Date(event.event_date).toLocaleDateString('pt-BR')}
                              {event.start_time && ` - ${event.start_time}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-zinc-500" />
                          <p className="text-zinc-400">
                            {event.venue_city}, {event.venue_state}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-zinc-500" />
                          <p className="text-zinc-400">
                            {event.expected_attendance || 'N/A'} pessoas esperadas
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          <span className="text-zinc-500">
                            Faltam {Math.ceil((new Date(event.event_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias
                          </span>
                        </div>

                        <Link href={`/admin/projetos/${event.id}`}>
                          <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Eventos Passados */}
      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Eventos Anteriores</h2>
          <div className="grid gap-4">
            {pastEvents.slice(0, 5).map((event) => (
              <Card key={event.id} className="bg-zinc-900 border-zinc-800 opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-white">{event.event_name}</h3>
                        <p className="text-sm text-zinc-400">{event.client_company || event.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">
                        {new Date(event.event_date).toLocaleDateString('pt-BR')}
                      </p>
                      <span className="text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                        Concluído
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!events || events.length === 0) && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum evento agendado
            </h3>
            <p className="text-zinc-400">
              Os eventos aparecerão aqui automaticamente quando você aprovar projetos na seção{' '}
              <Link href="/admin/projetos" className="text-red-500 hover:underline">
                Projetos
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
