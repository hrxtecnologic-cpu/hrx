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
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Briefcase,
  Target,
  Send,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AddTeamMemberButton, AddEquipmentButton, RequestQuotesButton } from '@/components/admin/ProjectActions';

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar projeto com todos os detalhes
  const { data: project, error } = await supabase
    .from('event_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Buscar equipe
  const { data: team } = await supabase
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
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  // Buscar equipamentos
  const { data: equipment } = await supabase
    .from('project_equipment')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  // Buscar cotações
  const { data: quotations } = await supabase
    .from('supplier_quotations')
    .select(`
      *,
      supplier:equipment_suppliers(
        id,
        company_name,
        contact_name,
        email,
        phone
      ),
      equipment:project_equipment(
        id,
        name,
        category
      )
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  // Buscar emails
  const { data: emails } = await supabase
    .from('project_emails')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Extrair profissionais solicitados das notas internas
  const getRequestedProfessionals = () => {
    if (!project.internal_notes) return [];

    try {
      const match = project.internal_notes.match(/Profissionais solicitados:\s*(\[[\s\S]*?\])/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch (error) {
      console.error('Erro ao parsear profissionais:', error);
    }
    return [];
  };

  // Extrair equipamentos solicitados das notas internas
  const getRequestedEquipment = () => {
    if (!project.internal_notes) return [];

    try {
      const match = project.internal_notes.match(/Equipamentos:\s*([^\n]+)/);
      if (match) {
        return match[1]
          .split(',')
          .map(item => item.trim())
          .filter(item => item && item !== 'Nenhuma');
      }
    } catch (error) {
      console.error('Erro ao parsear equipamentos:', error);
    }
    return [];
  };

  // Extrair observações sobre equipamentos
  const getEquipmentNotes = () => {
    if (!project.internal_notes) return null;

    const match = project.internal_notes.match(/Observações sobre equipamentos:\s*([^\n]+)/);
    return match && match[1] !== 'Nenhuma' ? match[1] : null;
  };

  const requestedProfessionals = getRequestedProfessionals();
  const requestedEquipment = getRequestedEquipment();
  const equipmentNotes = getEquipmentNotes();

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'Novo', color: 'bg-blue-500/10 text-blue-500' },
      analyzing: { label: 'Análise', color: 'bg-purple-500/10 text-purple-500' },
      quoting: { label: 'Cotando', color: 'bg-yellow-500/10 text-yellow-500' },
      quoted: { label: 'Cotado', color: 'bg-orange-500/10 text-orange-500' },
      proposed: { label: 'Proposta Enviada', color: 'bg-cyan-500/10 text-cyan-500' },
      approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500' },
      in_execution: { label: 'Em Execução', color: 'bg-indigo-500/10 text-indigo-500' },
      completed: { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-500' },
      cancelled: { label: 'Cancelado', color: 'bg-zinc-500/10 text-zinc-500' },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{project.event_name}</h1>
            {project.is_urgent && (
              <span className="inline-flex items-center gap-1 text-xs md:text-sm bg-red-500/20 text-red-500 px-2 md:px-3 py-1 rounded-full animate-pulse">
                <AlertTriangle className="h-3 md:h-4 w-3 md:w-4" />
                URGENTE
              </span>
            )}
          </div>
          <p className="text-zinc-400 mb-2">{project.client_name}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-500">#{project.project_number}</span>
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                getStatusBadge(project.status).color
              }`}
            >
              {getStatusBadge(project.status).label}
            </span>
            <span className="text-xs text-zinc-500">
              Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/projetos">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards - Financials */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">Custo Total</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(project.total_cost || 0)}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Equipe: {formatCurrency(project.total_team_cost || 0)} + Equip:{' '}
              {formatCurrency(project.total_equipment_cost || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">Preço Cliente</p>
            <p className="text-xl font-bold text-green-500">
              {formatCurrency(project.total_client_price || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
              Lucro
              {project.is_urgent && <TrendingUp className="h-3 w-3 text-red-500" />}
            </p>
            <p className="text-xl font-bold text-red-500">
              {formatCurrency(project.total_profit || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">Margem de Lucro</p>
            <p className="text-xl font-bold text-red-500">{project.profit_margin}%</p>
            {project.is_urgent && (
              <p className="text-xs text-red-500 mt-1">Urgência aplicada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Nome do Cliente</p>
                  <p className="text-sm text-white">{project.client_name}</p>
                </div>
                {project.client_company && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Empresa</p>
                    <p className="text-sm text-white">{project.client_company}</p>
                  </div>
                )}
                {project.client_cnpj && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">CNPJ</p>
                    <p className="text-sm text-white">{project.client_cnpj}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                {project.client_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <a
                      href={`mailto:${project.client_email}`}
                      className="text-sm text-red-500 hover:underline"
                    >
                      {project.client_email}
                    </a>
                  </div>
                )}
                {project.client_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    <a
                      href={`tel:${project.client_phone}`}
                      className="text-sm text-red-500 hover:underline"
                    >
                      {project.client_phone}
                    </a>
                  </div>
                )}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Nome do Evento</p>
                  <p className="text-sm text-white">{project.event_name}</p>
                </div>
                {project.event_type && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Tipo de Evento</p>
                    <p className="text-sm text-white">{project.event_type}</p>
                  </div>
                )}
                {project.event_date && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Data do Evento</p>
                    <p className="text-sm text-white">
                      {new Date(project.event_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {project.start_time && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Horário</p>
                    <p className="text-sm text-white">
                      {project.start_time}
                      {project.end_time && ` - ${project.end_time}`}
                    </p>
                  </div>
                )}
                {project.expected_attendance && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Público Esperado</p>
                    <p className="text-sm text-white">{project.expected_attendance} pessoas</p>
                  </div>
                )}
              </div>

              {project.event_description && (
                <div className="pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Descrição</p>
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {project.event_description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localização */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Localização do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.venue_name && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-zinc-500 mb-1">Nome do Local</p>
                    <p className="text-sm text-white">{project.venue_name}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-xs text-zinc-500 mb-1">Endereço</p>
                  <p className="text-sm text-white">{project.venue_address}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Cidade</p>
                  <p className="text-sm text-white">{project.venue_city}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Estado</p>
                  <p className="text-sm text-white">{project.venue_state}</p>
                </div>
                {project.venue_zip && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">CEP</p>
                    <p className="text-sm text-white">{project.venue_zip}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipe do Projeto */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-600" />
                  Equipe do Projeto ({team?.length || 0})
                </CardTitle>
                <AddTeamMemberButton
                  projectId={id}
                  project={{
                    event_name: project.event_name,
                    event_date: project.event_date,
                    event_type: project.event_type,
                    venue_name: project.venue_name,
                    venue_city: project.venue_city,
                    venue_state: project.venue_state,
                    expected_attendance: project.expected_attendance,
                    internal_notes: project.internal_notes,
                    additional_notes: project.additional_notes,
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {team && team.length > 0 ? (
                <div className="space-y-3">
                  {team.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-start justify-between p-3 bg-zinc-950/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="h-4 w-4 text-zinc-500" />
                          <p className="text-sm font-semibold text-white">{member.role}</p>
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                            {member.category}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 ml-6">
                          {member.professional
                            ? member.professional.full_name
                            : member.external_name || 'Não alocado'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-zinc-500">
                          <span>
                            Qtd: {member.quantity} x {member.duration_days} dias
                          </span>
                          {member.daily_rate && (
                            <span>Diária: {formatCurrency(member.daily_rate)}</span>
                          )}
                          {member.total_cost && (
                            <span className="text-green-500">
                              Total: {formatCurrency(member.total_cost)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhum membro na equipe ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipamentos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-red-600" />
                  Equipamentos ({equipment?.length || 0})
                </CardTitle>
                <AddEquipmentButton
                  projectId={id}
                  project={{
                    event_name: project.event_name,
                    event_date: project.event_date,
                    event_type: project.event_type,
                    venue_name: project.venue_name,
                    venue_city: project.venue_city,
                    venue_state: project.venue_state,
                    expected_attendance: project.expected_attendance,
                    internal_notes: project.internal_notes,
                    additional_notes: project.additional_notes,
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {equipment && equipment.length > 0 ? (
                <div className="space-y-3">
                  {equipment.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3 bg-zinc-950/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-zinc-500" />
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.status === 'quoted' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {item.status === 'quoting' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-zinc-400 ml-6 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 ml-6 text-xs text-zinc-500">
                          <span>
                            Qtd: {item.quantity} x {item.duration_days} dias
                          </span>
                          <span className="capitalize">Status: {item.status}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <RequestQuotesButton
                          projectId={id}
                          equipmentId={item.id}
                          equipmentType={item.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhum equipamento solicitado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cotações */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                Cotações ({quotations?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotations && quotations.length > 0 ? (
                <div className="space-y-3">
                  {quotations.map((quote: any) => (
                    <div
                      key={quote.id}
                      className="p-3 bg-zinc-950/50 rounded-lg border-l-4"
                      style={{
                        borderColor:
                          quote.status === 'accepted'
                            ? '#22c55e'
                            : quote.status === 'rejected'
                            ? '#ef4444'
                            : quote.status === 'received'
                            ? '#3b82f6'
                            : '#71717a',
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {quote.supplier?.company_name || 'Fornecedor desconhecido'}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {quote.equipment?.name || 'Equipamento'}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            quote.status === 'accepted'
                              ? 'bg-green-500/10 text-green-500'
                              : quote.status === 'rejected'
                              ? 'bg-red-500/10 text-red-500'
                              : quote.status === 'received'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {quote.status}
                        </span>
                      </div>

                      {quote.supplier_price && (
                        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                          <div>
                            <p className="text-zinc-500">Preço Fornecedor</p>
                            <p className="text-white font-semibold">
                              {formatCurrency(quote.supplier_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Preço HRX</p>
                            <p className="text-green-500 font-semibold">
                              {formatCurrency(quote.hrx_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Lucro ({quote.profit_margin_applied}%)</p>
                            <p className="text-red-500 font-semibold">
                              {formatCurrency(quote.profit_amount)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                        {quote.responded_at && (
                          <span>
                            Respondido: {new Date(quote.responded_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {quote.deadline && (
                          <span>
                            Prazo: {new Date(quote.deadline).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhuma cotação solicitada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Timeline / Histórico */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Projeto criado</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(project.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {project.quoted_at && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Cotações recebidas</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(project.quoted_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {project.proposed_at && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Send className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Proposta enviada</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(project.proposed_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {project.approved_at && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Projeto aprovado</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(project.approved_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {project.completed_at && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Projeto concluído</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(project.completed_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emails Enviados */}
          {emails && emails.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-red-600" />
                  Emails ({emails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {emails.slice(0, 5).map((email: any) => (
                  <div key={email.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-400">{email.email_type}</span>
                      {email.status === 'sent' ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <p className="text-zinc-500 truncate">{email.recipient_email}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Solicitação do Cliente */}
          {(requestedProfessionals.length > 0 || requestedEquipment.length > 0 || project.additional_notes) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Solicitação do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Observações do Cliente */}
                {project.additional_notes && (
                  <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
                    <p className="text-sm font-medium text-blue-200 mb-2">💬 Observações Gerais</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {project.additional_notes}
                    </p>
                  </div>
                )}

                {/* Profissionais Solicitados */}
                {requestedProfessionals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-semibold text-white">
                        Profissionais Solicitados ({requestedProfessionals.length})
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {requestedProfessionals.map((prof: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-zinc-600 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white text-sm font-bold rounded-full">
                                {prof.quantity}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {prof.category}
                              </p>
                              {prof.category_group && (
                                <p className="text-xs text-zinc-400 mt-1">
                                  {prof.category_group}
                                </p>
                              )}
                              {prof.requirements && (
                                <div className="mt-2 pt-2 border-t border-zinc-700">
                                  <p className="text-xs text-zinc-500 mb-0.5">Requisitos:</p>
                                  <p className="text-xs text-zinc-300 italic">
                                    {prof.requirements}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipamentos Solicitados */}
                {requestedEquipment.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-semibold text-white">
                        Equipamentos Solicitados ({requestedEquipment.length})
                      </p>
                    </div>
                    <div className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {requestedEquipment.map((equipment: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 rounded-md hover:bg-zinc-700/80 transition-colors"
                          >
                            <span className="text-red-500 text-xs">▪</span>
                            <span className="text-xs text-zinc-200">{equipment}</span>
                          </div>
                        ))}
                      </div>
                      {equipmentNotes && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <p className="text-xs text-zinc-400 mb-1">Observações:</p>
                          <p className="text-xs text-zinc-300 italic">{equipmentNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
