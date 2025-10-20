import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/server';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ProfissionaisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Query base
  let query = supabase
    .from('professionals')
    .select('*')
    .order('created_at', { ascending: false });

  // Filtrar por status
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  // Buscar por nome/email
  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  const { data: professionals, error } = await query;

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

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <form className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  name="search"
                  defaultValue={params.search}
                  placeholder="Buscar por nome ou email..."
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <Select name="status" defaultValue={params.status || 'all'}>
              <SelectTrigger className="w-full md:w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="bg-red-600 hover:bg-red-500">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Profissional
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Categorias
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">
                    Cadastro
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {professionals && professionals.length > 0 ? (
                  professionals.map((prof) => (
                    <tr key={prof.id} className="hover:bg-zinc-800/50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white">{prof.full_name}</p>
                          <p className="text-sm text-zinc-500">{prof.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {prof.categories?.slice(0, 2).map((cat: string) => (
                            <span
                              key={cat}
                              className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                            >
                              {cat}
                            </span>
                          ))}
                          {prof.categories?.length > 2 && (
                            <span className="text-xs text-zinc-500">
                              +{prof.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {prof.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                            <CheckCircle className="h-3 w-3" />
                            Aprovado
                          </span>
                        ) : prof.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                            <XCircle className="h-3 w-3" />
                            Rejeitado
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-zinc-400">
                          {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/profissionais/${prof.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-zinc-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                      Nenhum profissional encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
