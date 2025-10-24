/**
 * Project Detail Page - Nova UX com Tabs
 *
 * Abas: Informações | Equipe | Equipamentos | Cotações
 */

import { Card, CardContent } from '@/components/ui/card';
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
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SendProposalButton } from '@/components/admin/ProjectActions';
import { ProjectQuotationsSection } from '@/components/admin/ProjectQuotationsSection';
import { ProjectTeamSection } from '@/components/admin/ProjectTeamSection';
import { ProjectEquipmentSection } from '@/components/admin/ProjectEquipmentSection';
import { ProjectTabsManager } from '@/components/admin/ProjectTabsManager';

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar projeto
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

  // Buscar equipamentos (com fornecedor)
  const { data: equipment, error: equipmentError } = await supabase
    .from('project_equipment')
    .select(`
      *,
      supplier:equipment_suppliers!selected_supplier_id(
        id,
        company_name,
        contact_name,
        email,
        phone,
        city,
        state,
        equipment_types,
        status
      )
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  // DEBUG: Log equipment query
  console.log('[SERVER] Equipment query result:', {
    count: equipment?.length || 0,
    error: equipmentError,
    sample: equipment?.[0],
    hasSupplier: equipment?.[0]?.supplier ? true : false,
  });

  // Buscar profissionais disponíveis (apenas aprovados)
  const { data: professionals, error: professionalsError } = await supabase
    .from('professionals')
    .select(`
      id,
      full_name,
      email,
      phone,
      categories,
      city,
      state
    `)
    .eq('status', 'approved')
    .order('full_name', { ascending: true });

  // DEBUG: Log query result
  console.log('[SERVER] Professionals query result:', {
    count: professionals?.length || 0,
    error: professionalsError,
    sample: professionals?.[0]
  });

  // Buscar fornecedores ativos
  const { data: suppliers } = await supabase
    .from('equipment_suppliers')
    .select('*')
    .eq('status', 'active')
    .order('company_name', { ascending: true });

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'Novo', color: 'bg-blue-500/10 text-blue-500' },
      analyzing: { label: 'Análise', color: 'bg-purple-500/10 text-purple-500' },
      quoting: { label: 'Cotando', color: 'bg-yellow-500/10 text-yellow-500' },
      quoted: { label: 'Cotado', color: 'bg-orange-500/10 text-orange-500' },
      proposed: { label: 'Proposta Enviada', color: 'bg-cyan-500/10 text-cyan-500' },
      approved: { label: 'Aprovado ✓', color: 'bg-green-500/10 text-green-500' },
      rejected: { label: 'Recusado', color: 'bg-red-500/10 text-red-500' },
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
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {project.event_name}
            </h1>
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

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <SendProposalButton
            projectId={id}
            clientEmail={project.client_email || ''}
            clientName={project.client_name}
            hasTeamMembers={(team?.length || 0) > 0}
            hasEquipment={(equipment?.length || 0) > 0}
            projectStatus={project.status}
          />
          <Link href="/admin/projetos" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ProjectTabsManager
        teamCount={team?.length || 0}
        equipmentCount={equipment?.length || 0}
      >
        {{
          info: (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados do Cliente */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-red-600" />
                    Dados do Cliente
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Nome do Cliente</p>
                      <p className="text-sm text-white">{project.client_name}</p>
                    </div>
                    {project.client_email && (
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
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
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    Detalhes do Evento
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Tipo de Evento</p>
                      <p className="text-sm text-white">{project.event_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Data do Evento</p>
                      <p className="text-sm text-white">
                        {new Date(project.event_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {project.expected_attendance && (
                      <div>
                        <p className="text-xs text-zinc-500">Público Esperado</p>
                        <p className="text-sm text-white">
                          {project.expected_attendance} pessoas
                        </p>
                      </div>
                    )}
                    {project.event_description && (
                      <div>
                        <p className="text-xs text-zinc-500">Descrição</p>
                        <p className="text-sm text-white whitespace-pre-wrap">
                          {project.event_description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Localização */}
              <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Localização do Evento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.venue_name && (
                      <div>
                        <p className="text-xs text-zinc-500">Local</p>
                        <p className="text-sm text-white">{project.venue_name}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-xs text-zinc-500">Endereço</p>
                      <p className="text-sm text-white">{project.venue_address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Cidade</p>
                      <p className="text-sm text-white">{project.venue_city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Estado</p>
                      <p className="text-sm text-white">{project.venue_state}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ),
          team: (
            <ProjectTeamSection
              projectId={id}
              projectDate={project.event_date}
              teamMembers={team || []}
              availableProfessionals={professionals || []}
              professionalsNeeded={project.professionals_needed || []}
            />
          ),
          equipment: (
            <ProjectEquipmentSection
              projectId={id}
              equipment={equipment || []}
              suppliers={suppliers || []}
              equipmentNeeded={project.equipment_needed || []}
            />
          ),
          quotations: (
            <ProjectQuotationsSection
              projectId={id}
              projectName={project.event_name}
              equipmentItems={(equipment || []).map((item: any) => ({
                name: item.name,
                category: item.category || '',
                quantity: item.quantity || 1,
                duration_days: item.duration_days || 1,
                specifications: item.description,
              }))}
            />
          ),
        }}
      </ProjectTabsManager>
    </div>
  );
}
