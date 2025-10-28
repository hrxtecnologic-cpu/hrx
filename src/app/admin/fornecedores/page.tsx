import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { UnifiedSuppliersView } from '@/components/admin/UnifiedSuppliersView';

export default async function FornecedoresPage() {
  const supabase = await createClient();

  // Contar por status
  const [
    { count: totalCount },
    { count: activeCount },
    { count: inactiveCount },
  ] = await Promise.all([
    supabase.from('equipment_suppliers').select('*', { count: 'exact', head: true }),
    supabase
      .from('equipment_suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('equipment_suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive'),
  ]);

  // Contar fornecedores com orçamentos pendentes
  const { data: suppliersWithPendingQuotes } = await supabase
    .from('supplier_quotations')
    .select('supplier_id')
    .eq('status', 'pending');

  const pendingCount = suppliersWithPendingQuotes
    ? new Set(suppliersWithPendingQuotes.map(q => q.supplier_id)).size
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">🏢 Fornecedores</h1>
        <p className="text-zinc-400">
          Gerenciar fornecedores parceiros - Equipamentos, Catálogos e Orçamentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{totalCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Com Orçamentos Pendentes</p>
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Ativos</p>
            <p className="text-2xl font-bold text-green-500">{activeCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Inativos</p>
            <p className="text-2xl font-bold text-red-500">{inactiveCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified View (Client Component) */}
      <UnifiedSuppliersView
        initialStats={{
          total: totalCount || 0,
          pending: pendingCount,
          active: activeCount || 0,
          inactive: inactiveCount || 0,
        }}
      />
    </div>
  );
}
