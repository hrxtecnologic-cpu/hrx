import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { FileCheck, AlertCircle, User, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function DocumentosPage() {
  const supabase = await createClient();

  // Buscar profissionais pendentes com documentos
  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Validação de Documentos</h1>
        <p className="text-zinc-400">
          {professionals?.length || 0} profissionais aguardando validação
        </p>
      </div>

      {/* Alert se houver pendências */}
      {professionals && professionals.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-500">
                  Atenção! Existem {professionals.length} profissionais aguardando validação
                </p>
                <p className="text-xs text-yellow-500/70 mt-1">
                  Valide os documentos para liberar o acesso desses profissionais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '800px' }}>
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Profissional</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Categorias</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Localização</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Documentos</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Cadastro</th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {professionals && professionals.length > 0 ? (
                  professionals.map((prof) => {
                    const hasAllDocs = prof.documents?.rg_front &&
                                      prof.documents?.rg_back &&
                                      prof.documents?.cpf &&
                                      prof.documents?.proof_of_address;

                    return (
                      <tr key={prof.id} className="hover:bg-zinc-800/50 transition">
                        {/* Profissional */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-zinc-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{prof.full_name}</p>
                              <p className="text-sm text-zinc-500">{prof.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Categorias */}
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
                            {prof.categories && prof.categories.length > 2 && (
                              <span className="text-xs text-zinc-500">
                                +{prof.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Localização */}
                        <td className="p-4">
                          <p className="text-sm text-white">{prof.city}</p>
                          <p className="text-xs text-zinc-500">{prof.state}</p>
                        </td>

                        {/* Documentos */}
                        <td className="p-4">
                          {hasAllDocs ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              <FileCheck className="h-3 w-3" />
                              Completos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                              <AlertCircle className="h-3 w-3" />
                              Incompletos
                            </span>
                          )}
                        </td>

                        {/* Cadastro */}
                        <td className="p-4">
                          <p className="text-sm text-zinc-400">
                            {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right">
                          <Link href={`/admin/profissionais/${prof.id}`}>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Validar
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <FileCheck className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Tudo em dia!
                      </h3>
                      <p className="text-zinc-400">
                        Não há documentos pendentes de validação no momento
                      </p>
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
