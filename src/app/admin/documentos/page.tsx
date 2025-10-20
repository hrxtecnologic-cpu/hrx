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

      {/* Lista de Profissionais Pendentes */}
      <div className="grid gap-4">
        {professionals && professionals.length > 0 ? (
          professionals.map((prof) => (
            <Card key={prof.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-zinc-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {prof.full_name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-2">{prof.email}</p>

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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500">CPF:</span>
                          <p className="text-white">{prof.cpf}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Telefone:</span>
                          <p className="text-white">{prof.phone}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Cidade:</span>
                          <p className="text-white">
                            {prof.city}, {prof.state}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Cadastro:</span>
                          <p className="text-white">
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
                  <Link href={`/admin/profissionais/${prof.id}`}>
                    <Button className="bg-red-600 hover:bg-red-500 ml-4">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Validar Documentos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <FileCheck className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Tudo em dia!
              </h3>
              <p className="text-zinc-400">
                Não há documentos pendentes de validação no momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
