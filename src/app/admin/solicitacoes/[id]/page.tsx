import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import {
  Building2,
  Calendar,
  MapPin,
  Users,
  Package,
  DollarSign,
  Mail,
  Phone,
  Globe,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { RequestActions } from '@/components/admin/RequestActions';
import { ProfessionalAllocation } from '@/components/admin/ProfessionalAllocation';

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar solicitação
  const { data: request, error } = await supabase
    .from('contractor_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !request) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header com ações */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{request.event_name}</h1>
          <p className="text-zinc-400">{request.company_name}</p>
          <div className="flex items-center gap-3 mt-2">
            {request.urgency === 'very_urgent' && (
              <span className="inline-flex items-center gap-1 text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                <AlertTriangle className="h-4 w-4" />
                Muito Urgente
              </span>
            )}
            {request.urgency === 'urgent' && (
              <span className="inline-flex items-center gap-1 text-sm bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full">
                <AlertTriangle className="h-4 w-4" />
                Urgente
              </span>
            )}
            <span className="text-sm text-zinc-500">
              Recebida em {new Date(request.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Ações */}
        <RequestActions requestId={id} currentStatus={request.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados da Empresa */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Razão Social</p>
                  <p className="text-sm text-white">{request.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">CNPJ</p>
                  <p className="text-sm text-white">{request.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Responsável</p>
                  <p className="text-sm text-white">{request.responsible_name}</p>
                </div>
                {request.responsible_role && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Cargo</p>
                    <p className="text-sm text-white">{request.responsible_role}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <a href={`mailto:${request.email}`} className="text-sm text-red-500 hover:underline">
                    {request.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <a href={`tel:${request.phone}`} className="text-sm text-red-500 hover:underline">
                    {request.phone}
                  </a>
                  {request.accepts_whatsapp && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                      WhatsApp
                    </span>
                  )}
                </div>
                {request.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-zinc-500" />
                    <a href={request.website} target="_blank" className="text-sm text-red-500 hover:underline">
                      {request.website}
                    </a>
                  </div>
                )}
              </div>

              {request.company_address && (
                <div className="pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Endereço</p>
                  <p className="text-sm text-white">{request.company_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                <p className="text-xs text-zinc-500 mb-1">Tipo de Evento</p>
                <p className="text-sm text-white">{request.event_type}</p>
              </div>

              {request.expected_attendance && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Público Esperado</p>
                  <p className="text-sm text-white">{request.expected_attendance} pessoas</p>
                </div>
              )}

              {request.event_description && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Descrição</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{request.event_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Local do Evento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Local do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.venue_name && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Nome do Local</p>
                  <p className="text-sm text-white">{request.venue_name}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-zinc-500 mb-1">Endereço</p>
                <p className="text-sm text-white">{request.venue_address}</p>
                <p className="text-sm text-white">
                  {request.venue_city}, {request.venue_state}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profissionais Necessários */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                Profissionais Necessários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.professionals_needed?.map((prof: any, index: number) => (
                  <div key={index} className="p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">{prof.category}</p>
                        <p className="text-sm text-zinc-400">
                          Quantidade: {prof.quantity} | Turno: {prof.shift}
                        </p>
                      </div>
                    </div>
                    {prof.requirements && (
                      <div className="mt-2 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-1">Requisitos:</p>
                        <p className="text-sm text-zinc-300">{prof.requirements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alocação de Profissionais */}
          {request.professionals_needed && (
            <ProfessionalAllocation
              requestId={id}
              professionalsNeeded={request.professionals_needed}
              currentStatus={request.status}
            />
          )}

          {/* Equipamentos */}
          {request.needs_equipment && request.equipment_list?.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-red-600" />
                  Equipamentos Necessários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.equipment_list.map((eq: string) => (
                    <span key={eq} className="text-sm bg-zinc-800 text-zinc-300 px-3 py-1 rounded">
                      {eq}
                    </span>
                  ))}
                </div>
                {request.equipment_other && (
                  <div className="pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Outros Equipamentos:</p>
                    <p className="text-sm text-zinc-300">{request.equipment_other}</p>
                  </div>
                )}
                {request.equipment_notes && (
                  <div className="pt-3 border-t border-zinc-800 mt-3">
                    <p className="text-xs text-zinc-500 mb-1">Observações:</p>
                    <p className="text-sm text-zinc-300">{request.equipment_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observações Gerais */}
          {request.additional_notes && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Observações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {request.additional_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Datas e Horários */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Cronograma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Data de Início</p>
                <p className="text-sm text-white">
                  {new Date(request.start_date).toLocaleDateString('pt-BR')}
                  {request.start_time && ` às ${request.start_time}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Data de Término</p>
                <p className="text-sm text-white">
                  {new Date(request.end_date).toLocaleDateString('pt-BR')}
                  {request.end_time && ` às ${request.end_time}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Orçamento */}
          {request.budget_range && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white">{request.budget_range}</p>
              </CardContent>
            </Card>
          )}

          {/* Status e Urgência */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Status Atual</p>
                {request.status === 'pending' ? (
                  <span className="text-sm bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full">
                    Aguardando Resposta
                  </span>
                ) : request.status === 'in_progress' ? (
                  <span className="text-sm bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full">
                    Em Andamento
                  </span>
                ) : request.status === 'completed' ? (
                  <span className="text-sm bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                    Concluída
                  </span>
                ) : (
                  <span className="text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                    Cancelada
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">Urgência</p>
                <p className="text-sm text-white capitalize">{request.urgency.replace('_', ' ')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1 w-px bg-zinc-800 my-1" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-xs text-zinc-500">Solicitação recebida</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(request.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {request.updated_at && request.updated_at !== request.created_at && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1 w-px bg-zinc-800 my-1" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Última atualização</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(request.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
