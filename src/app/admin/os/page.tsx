import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { UnifiedServiceOrdersView } from '@/components/admin/UnifiedServiceOrdersView';

export default async function OrdemDeServicoPage() {
  const supabase = await createClient();

  // Contar por status
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: inProgressCount },
    { count: completedCount },
    { count: cancelledCount },
  ] = await Promise.all([
    supabase.from('service_orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled'),
  ]);

  // Contar OS dos próximos 7 dias
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { count: upcomingCount } = await supabase
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', today.toISOString().split('T')[0])
    .lte('event_date', nextWeek.toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">📋 Ordens de Serviço</h1>
        <p className="text-zinc-400">
          Gerenciar Ordens de Serviço geradas automaticamente por IA
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{totalCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Próximos 7 Dias</p>
            <p className="text-2xl font-bold text-blue-500">{upcomingCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Aguardando</p>
            <p className="text-2xl font-bold text-yellow-500">{pendingCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Em Andamento</p>
            <p className="text-2xl font-bold text-purple-500">{inProgressCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Concluídas</p>
            <p className="text-2xl font-bold text-green-500">{completedCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Canceladas</p>
            <p className="text-2xl font-bold text-red-500">{cancelledCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified View (Client Component) */}
      <UnifiedServiceOrdersView
        initialStats={{
          total: totalCount || 0,
          upcoming: upcomingCount || 0,
          pending: pendingCount || 0,
          in_progress: inProgressCount || 0,
          completed: completedCount || 0,
          cancelled: cancelledCount || 0,
        }}
      />
    </div>
  );
}
