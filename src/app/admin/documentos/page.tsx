import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { FileCheck, AlertCircle, User } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Validação de Documentos</h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {professionals?.length || 0} profissionais aguardando validação
        </p>
      </div>

      {/* Alert se houver pendências */}
      {professionals && professionals.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-yellow-500">
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

      {/* Lista de Profissionais Pendentes */}
      <div className="grid gap-4">
        {professionals && professionals.length > 0 ? (
          professionals.map((prof) => (
            <Card key={prof.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                        {prof.full_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 mb-2 truncate">{prof.email}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {prof.categories?.map((cat: string) => (
                          <span
                            key={cat}
                            className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-zinc-500">CPF:</span>
                          <p className="text-white truncate">{prof.cpf}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-zinc-500">Telefone:</span>
                          <p className="text-white truncate">{prof.phone}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-zinc-500">Cidade:</span>
                          <p className="text-white truncate">
                            {prof.city}, {prof.state}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-zinc-500">Cadastro:</span>
                          <p className="text-white truncate">
                            {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Documentos Status */}
                      <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-2">Documentos enviados:</p>
                        <div className="flex flex-wrap gap-2">
                          {prof.documents?.rg_front && (
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              ✓ RG Frente
                            </span>
                          )}
                          {prof.documents?.rg_back && (
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              ✓ RG Verso
                            </span>
                          )}
                          {prof.documents?.cpf && (
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              ✓ CPF
                            </span>
                          )}
                          {prof.documents?.proof_of_address && (
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              ✓ Comprovante
                            </span>
                          )}
                          {(!prof.documents?.rg_front ||
                            !prof.documents?.rg_back ||
                            !prof.documents?.cpf ||
                            !prof.documents?.proof_of_address) && (
                            <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                              ⚠ Documentos incompletos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/admin/profissionais/${prof.id}`} className="w-full lg:w-auto">
                    <Button className="bg-red-600 hover:bg-red-500 text-white w-full lg:w-auto text-sm sm:text-base">
                      <FileCheck className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Validar Documentos</span>
                      <span className="sm:hidden">Validar</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 sm:p-12 text-center">
              <FileCheck className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Tudo em dia!
              </h3>
              <p className="text-sm sm:text-base text-zinc-400">
                Não há documentos pendentes de validação no momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
