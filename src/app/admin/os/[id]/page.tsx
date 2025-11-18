import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  Navigation,
  CheckCircle2,
  Circle,
  Timer,
  Building2,
  User,
  Truck,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ServiceOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: serviceOrder, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      project:event_projects(
        id,
        name,
        event_type,
        description
      ),
      contract:contracts(
        id,
        contract_number,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (error || !serviceOrder) {
    notFound();
  }

  const { data: tasks } = await supabase
    .from('service_order_tasks')
    .select('*')
    .eq('service_order_id', id)
    .order('sequence_order', { ascending: true });

  const { data: timeline } = await supabase
    .from('service_order_timeline')
    .select('*')
    .eq('service_order_id', id)
    .order('sequence_order', { ascending: true });

  const { data: professionals } = await supabase
    .from('project_team')
    .select(`
      *,
      professional:professionals(
        id,
        full_name,
        email,
        phone,
        categories
      )
    `)
    .eq('project_id', serviceOrder.project_id);

  const { data: equipment } = await supabase
    .from('project_equipment')
    .select(`
      *,
      supplier:equipment_suppliers(
        id,
        company_name,
        contact_name,
        phone,
        email
      )
    `)
    .eq('project_id', serviceOrder.project_id);

  const statusConfig = {
    pending: { label: 'Aguardando', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_progress: { label: 'Em Andamento', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    completed: { label: 'Concluída', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    cancelled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };

  const currentStatus = statusConfig[serviceOrder.status as keyof typeof statusConfig] || statusConfig.pending;

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const totalProfessionals = professionals?.length || 0;
  const totalEquipment = equipment?.length || 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header com padrão do projeto */}
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 p-6">
        {/* Detalhes vermelhos no canto */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/os">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                ← Voltar
              </Button>
            </Link>
            <Badge variant="default" className={currentStatus.color}>
              {currentStatus.label}
            </Badge>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
              <ClipboardList className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                OS #{serviceOrder.os_number}
              </h1>
              <p className="text-zinc-400 text-sm">
                {serviceOrder.title}
              </p>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <CheckCircle2 className="h-3 w-3 text-red-500" />
                Tarefas
              </div>
              <p className="text-2xl font-bold text-white">{completedTasks}/{totalTasks}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Users className="h-3 w-3 text-red-500" />
                Profissionais
              </div>
              <p className="text-2xl font-bold text-white">{totalProfessionals}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Package className="h-3 w-3 text-red-500" />
                Equipamentos
              </div>
              <p className="text-2xl font-bold text-white">{totalEquipment}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-red-600/30 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Navigation className="h-3 w-3 text-red-500" />
                Distância
              </div>
              <p className="text-2xl font-bold text-white">
                {serviceOrder.distance_from_base_km ? `${serviceOrder.distance_from_base_km.toFixed(1)} km` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Accent vermelhos */}
        <div className="absolute top-0 right-0 h-1 w-32 bg-gradient-to-r from-transparent to-red-600" />
        <div className="absolute bottom-0 left-0 h-1 w-24 bg-gradient-to-r from-red-600 to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Informações */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informações do Evento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Informações do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <Calendar className="h-4 w-4 text-purple-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Data do Evento</p>
                    <p className="text-sm text-white">
                      {new Date(serviceOrder.event_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                  </div>
                </div>

                {serviceOrder.event_start_time && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Clock className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Horário</p>
                      <p className="text-sm text-white">
                        {serviceOrder.event_start_time}
                        {serviceOrder.event_end_time && ` - ${serviceOrder.event_end_time}`}
                      </p>
                    </div>
                  </div>
                )}

                {serviceOrder.recommended_arrival_time && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Target className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Chegada Recomendada</p>
                      <p className="text-sm text-white">{serviceOrder.recommended_arrival_time}</p>
                    </div>
                  </div>
                )}

                {serviceOrder.estimated_setup_duration_minutes && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Timer className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Tempo de Montagem</p>
                      <p className="text-sm text-white">{serviceOrder.estimated_setup_duration_minutes} minutos</p>
                    </div>
                  </div>
                )}

                {serviceOrder.estimated_teardown_duration_minutes && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Timer className="h-4 w-4 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Tempo de Desmontagem</p>
                      <p className="text-sm text-white">{serviceOrder.estimated_teardown_duration_minutes} minutos</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Local */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                Local do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {serviceOrder.venue_name && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Building2 className="h-4 w-4 text-red-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Nome do Local</p>
                      <p className="text-sm text-white">{serviceOrder.venue_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <MapPin className="h-4 w-4 text-red-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Endereço</p>
                    <p className="text-sm text-white">{serviceOrder.venue_address}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {serviceOrder.venue_city}, {serviceOrder.venue_state}
                    </p>
                  </div>
                </div>

                {serviceOrder.venue_contact_name && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <User className="h-4 w-4 text-red-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Contato do Local</p>
                      <p className="text-sm text-white">{serviceOrder.venue_contact_name}</p>
                      {serviceOrder.venue_contact_phone && (
                        <p className="text-xs text-zinc-400 mt-1">{serviceOrder.venue_contact_phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {serviceOrder.estimated_travel_time_minutes && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Truck className="h-4 w-4 text-red-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Tempo de Viagem</p>
                      <p className="text-sm text-white">
                        {Math.floor(serviceOrder.estimated_travel_time_minutes / 60)}h {serviceOrder.estimated_travel_time_minutes % 60}min
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-yellow-500" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <User className="h-4 w-4 text-yellow-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Nome</p>
                    <p className="text-sm text-white">{serviceOrder.client_name}</p>
                  </div>
                </div>

                {serviceOrder.client_email && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Mail className="h-4 w-4 text-yellow-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm text-white truncate">{serviceOrder.client_email}</p>
                    </div>
                  </div>
                )}

                {serviceOrder.client_phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <Phone className="h-4 w-4 text-yellow-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Telefone</p>
                      <p className="text-sm text-white">{serviceOrder.client_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Briefing e Detalhes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Briefing Executivo da IA */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-500" />
                Briefing Executivo (GPT-4)
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Análise inteligente gerada automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {serviceOrder.ai_briefing}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações da IA */}
          {serviceOrder.ai_recommendations && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {serviceOrder.ai_recommendations}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {serviceOrder.ai_alerts && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {serviceOrder.ai_alerts}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Equipe Profissional */}
          {professionals && professionals.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Equipe Profissional
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {professionals.length} profissiona{professionals.length !== 1 ? 'is' : 'l'} escalado{professionals.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {professionals.map((member: any) => (
                    <div
                      key={member.id}
                      className="border border-zinc-800 rounded-lg p-4 hover:border-purple-500/50 transition-colors bg-zinc-800/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{member.professional.full_name}</h4>
                          <p className="text-xs text-zinc-400 mt-1">{member.role}</p>
                          <div className="flex gap-2 mt-2">
                            {member.professional.categories?.slice(0, 2).map((cat: string) => (
                              <Badge key={cat} variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          {member.professional.email && (
                            <a href={`mailto:${member.professional.email}`} className="text-xs text-zinc-400 hover:text-white">
                              {member.professional.email}
                            </a>
                          )}
                          {member.professional.phone && (
                            <a href={`tel:${member.professional.phone}`} className="text-xs text-zinc-400 hover:text-white">
                              {member.professional.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Equipamentos e Fornecedores */}
          {equipment && equipment.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-red-500" />
                  Equipamentos e Fornecedores
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {equipment.length} item{equipment.length !== 1 ? 's' : ''} solicitado{equipment.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipment.map((item: any) => (
                    <div
                      key={item.id}
                      className="border border-zinc-800 rounded-lg p-4 hover:border-red-500/50 transition-colors bg-zinc-800/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.equipment_name}</h4>
                          <p className="text-xs text-zinc-400 mt-1">Qtd: {item.quantity}</p>
                          {item.supplier && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">
                                {item.supplier.company_name}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {item.supplier && (
                          <div className="flex flex-col gap-1 text-right">
                            {item.supplier.email && (
                              <a href={`mailto:${item.supplier.email}`} className="text-xs text-zinc-400 hover:text-white">
                                {item.supplier.email}
                              </a>
                            )}
                            {item.supplier.phone && (
                              <a href={`tel:${item.supplier.phone}`} className="text-xs text-zinc-400 hover:text-white">
                                {item.supplier.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tarefas */}
          {tasks && tasks.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Tarefas da OS
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {completedTasks} de {totalTasks} tarefas concluídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.map((task: any, index: number) => (
                    <div
                      key={task.id}
                      className="border border-zinc-800 rounded-lg p-3 hover:border-green-500/50 transition-colors bg-zinc-800/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : task.status === 'in_progress' ? (
                            <Circle className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-white">{task.title}</h5>
                          {task.description && (
                            <p className="text-xs text-zinc-400 mt-1">{task.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                              {task.category}
                            </Badge>
                            {task.scheduled_time && (
                              <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                                {task.scheduled_time}
                              </Badge>
                            )}
                            {task.estimated_duration_minutes && (
                              <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                                {task.estimated_duration_minutes} min
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {timeline && timeline.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Timeline do Evento
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Cronograma completo do evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeline.map((event: any, index: number) => (
                    <div
                      key={event.id}
                      className="border border-zinc-800 rounded-lg p-3 hover:border-purple-500/50 transition-colors bg-zinc-800/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-purple-400 w-16">{event.scheduled_time}</div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-white">{event.title}</h5>
                          {event.description && (
                            <p className="text-xs text-zinc-400 mt-1">{event.description}</p>
                          )}
                          {event.estimated_duration_minutes && (
                            <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600 mt-2">
                              Duração: {event.estimated_duration_minutes} min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
