import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { UnifiedProfessionalsView } from '@/components/admin/UnifiedProfessionalsView';

export default async function ProfissionaisPage() {
  const supabase = await createClient();

  // Contar por status (mantém as queries leves para stats)
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from('professionals').select('*', { count: 'exact', head: true }),
    supabase
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
  ]);

  // Contar documentos órfãos (profissionais que têm has_orphan_documents = true)
  // TODO: implementar após adicionar campo has_orphan_documents na tabela
  const orphanCount = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">👥 Profissionais</h1>
        <p className="text-zinc-400">
          Gerenciar profissionais cadastrados - Dados Unificados (Clerk + Supabase + Documentos + Emails)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <p className="text-sm text-zinc-400">Aprovados</p>
            <p className="text-2xl font-bold text-green-500">{approvedCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Rejeitados</p>
            <p className="text-2xl font-bold text-red-500">{rejectedCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Docs Órfãos</p>
            <p className="text-2xl font-bold text-orange-500">{orphanCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified View (Client Component) */}
      <UnifiedProfessionalsView
        initialStats={{
          total: totalCount || 0,
          pending: pendingCount || 0,
          approved: approvedCount || 0,
          rejected: rejectedCount || 0,
          orphan: orphanCount,
        }}
      />
    </div>
  );
}
