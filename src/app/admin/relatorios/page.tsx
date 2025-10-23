import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function RelatoriosPage() {
  const supabase = await createClient();

  // Buscar dados para relatórios
  const [
    { data: professionals },
    { data: projects },
  ] = await Promise.all([
    supabase.from('professionals').select('created_at, status, categories'),
    supabase.from('event_projects').select('created_at, event_type, status, expected_attendance'),
  ]);

  // Calcular métricas
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const newProfessionalsLast30Days = professionals?.filter(
    p => new Date(p.created_at) >= last30Days
  ).length || 0;

  const newProjectsLast30Days = projects?.filter(
    p => new Date(p.created_at) >= last30Days
  ).length || 0;

  // Agrupar por categoria
  const categoriesCount: Record<string, number> = {};
  professionals?.forEach(p => {
    p.categories?.forEach((cat: string) => {
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    });
  });

  const topCategories = Object.entries(categoriesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Agrupar por tipo de evento
  const eventTypesCount: Record<string, number> = {};
  projects?.forEach(p => {
    if (p.event_type) {
      eventTypesCount[p.event_type] = (eventTypesCount[p.event_type] || 0) + 1;
    }
  });

  const topEventTypes = Object.entries(eventTypesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Taxa de conversão
  const approvedProfessionals = professionals?.filter(p => p.status === 'approved').length || 0;
  const conversionRate = professionals?.length
    ? Math.round((approvedProfessionals / professionals.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Relatórios</h1>
          <p className="text-zinc-400">Análise de desempenho e métricas</p>
        </div>

        <Button variant="outline" className="border-zinc-700">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-400">Novos Profissionais</p>
                <p className="text-2xl font-bold text-white mt-1">{newProfessionalsLast30Days}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">Últimos 30 dias</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>+{Math.round((newProfessionalsLast30Days / (professionals?.length || 1)) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-400">Novos Projetos</p>
                <p className="text-2xl font-bold text-white mt-1">{newProjectsLast30Days}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">Últimos 30 dias</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>+{Math.round((newProjectsLast30Days / (projects?.length || 1)) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-400">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-white mt-1">{conversionRate}%</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">De todos os cadastros</p>
            <div className="mt-2">
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-yellow-500 h-1.5 rounded-full"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-400">Total de Eventos</p>
                <p className="text-2xl font-bold text-white mt-1">{projects?.length || 0}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">Todos os projetos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categorias */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Top 5 Categorias Mais Procuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(([category, count]) => {
                const percentage = Math.round((count / (professionals?.length || 1)) * 100);
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">{category}</span>
                      <span className="text-sm font-medium text-white">{count}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Tipos de Evento */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Top 5 Tipos de Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEventTypes.map(([eventType, count]) => {
                const percentage = Math.round((count / (projects?.length || 1)) * 100);
                return (
                  <div key={eventType}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">{eventType}</span>
                      <span className="text-sm font-medium text-white">{count}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status de Profissionais */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Status dos Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-sm text-zinc-300">Aprovados</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-500">{approvedProfessionals}</span>
                  <div className="w-24 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${conversionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-sm text-zinc-300">Pendentes</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-yellow-500">
                    {professionals?.filter(p => p.status === 'pending').length || 0}
                  </span>
                  <div className="w-24 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(((professionals?.filter(p => p.status === 'pending').length || 0) / (professionals?.length || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-sm text-zinc-300">Rejeitados</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-500">
                    {professionals?.filter(p => p.status === 'rejected').length || 0}
                  </span>
                  <div className="w-24 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(((professionals?.filter(p => p.status === 'rejected').length || 0) / (professionals?.length || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Projetos */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-sm text-zinc-300">Concluídos</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-500">
                    {projects?.filter(r => r.status === 'completed').length || 0}
                  </span>
                  <div className="w-24 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(((projects?.filter(r => r.status === 'completed').length || 0) / (projects?.length || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-sm text-zinc-300">Em Execução</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-500">
                    {projects?.filter(r => r.status === 'in_execution').length || 0}
                  </span>
                  <div className="w-24 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(((projects?.filter(r => r.status === 'in_execution').length || 0) / (projects?.length || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-sm text-zinc-300">Novos</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-yellow-500">
                    {projects?.filter(r => r.status === 'new').length || 0}
                  </span>
                  <div className="w-24 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(((projects?.filter(r => r.status === 'new').length || 0) / (projects?.length || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
