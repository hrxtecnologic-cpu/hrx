import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  FileCheck,
  ClipboardList,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Buscar métricas
  const [
    { count: totalProfessionals },
    { count: pendingDocuments },
    { count: totalProjects },
    { count: newProjects },
  ] = await Promise.all([
    supabase.from('professionals').select('*', { count: 'exact', head: true }),
    supabase
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('event_projects').select('*', { count: 'exact', head: true }),
    supabase
      .from('event_projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),
  ]);

  const stats = [
    {
      title: 'Total de Profissionais',
      value: totalProfessionals || 0,
      icon: Users,
      description: 'Cadastrados na plataforma',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Documentos Pendentes',
      value: pendingDocuments || 0,
      icon: FileCheck,
      description: 'Aguardando validação',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      alert: (pendingDocuments || 0) > 0,
    },
    {
      title: 'Projetos Totais',
      value: totalProjects || 0,
      icon: ClipboardList,
      description: 'Eventos cadastrados',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Projetos Novos',
      value: newProjects || 0,
      icon: Clock,
      description: 'Aguardando análise',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      alert: (newProjects || 0) > 0,
    },
  ];

  // Buscar profissionais recentes
  const { data: recentProfessionals } = await supabase
    .from('professionals')
    .select('full_name, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Buscar projetos recentes
  const { data: recentProjects } = await supabase
    .from('event_projects')
    .select('client_company, event_name, is_urgent, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                {stat.alert && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>Requer atenção</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profissionais Recentes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Profissionais Recentes</CardTitle>
            <CardDescription className="text-zinc-400">
              Últimos cadastros na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProfessionals && recentProfessionals.length > 0 ? (
                recentProfessionals.map((prof, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{prof.full_name}</p>
                      <p className="text-xs text-zinc-500">{prof.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {prof.status === 'approved' ? (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                          Aprovado
                        </span>
                      ) : prof.status === 'pending' ? (
                        <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                          Pendente
                        </span>
                      ) : (
                        <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                          Rejeitado
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Nenhum profissional cadastrado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projetos Recentes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Projetos Recentes</CardTitle>
            <CardDescription className="text-zinc-400">
              Últimos projetos cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects && recentProjects.length > 0 ? (
                recentProjects.map((proj, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{proj.client_company || 'Cliente'}</p>
                      <p className="text-xs text-zinc-500">{proj.event_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {proj.is_urgent && (
                        <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                          Urgente
                        </span>
                      )}
                      {proj.status === 'new' ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : proj.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Nenhum projeto ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/documentos"
              className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition"
            >
              <FileCheck className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-semibold text-white">Validar Documentos</p>
                <p className="text-xs text-zinc-400">{pendingDocuments || 0} pendentes</p>
              </div>
            </a>

            <a
              href="/admin/projetos"
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition"
            >
              <ClipboardList className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-semibold text-white">Ver Projetos</p>
                <p className="text-xs text-zinc-400">{newProjects || 0} novos</p>
              </div>
            </a>

            <a
              href="/admin/profissionais"
              className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition"
            >
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-white">Gerenciar Profissionais</p>
                <p className="text-xs text-zinc-400">{totalProfessionals || 0} cadastrados</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
