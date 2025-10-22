import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { ProfessionalsSearchView } from '@/components/admin/ProfessionalsSearchView';

export default async function ProfissionaisPage() {
  const supabase = await createClient();

  // Buscar todos os profissionais inicialmente (serão filtrados no cliente)
  const { data: professionals, error } = await supabase
    .from('professionals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20); // Limite inicial, a busca avançada fará paginação

  // Contar por status
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profissionais</h1>
        <p className="text-zinc-400">Gerenciar profissionais cadastrados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Advanced Search & Results */}
      <ProfessionalsSearchView initialProfessionals={professionals || []} />
    </div>
  );
}
