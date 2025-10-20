import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  Plus,
  Building2,
  MapPin,
  Users,
} from 'lucide-react';

export default async function DashboardContratantePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/entrar');
  }

  // Verificar se é contratante
  const userType = user.publicMetadata?.userType;
  if (userType !== 'contractor') {
    redirect('/');
  }

  const supabase = await createClient();

  // Buscar email do usuário
  const userEmail = user.emailAddresses[0].emailAddress;

  console.log('🔍 [Dashboard] Buscando solicitações para:');
  console.log('   clerk_id:', userId);
  console.log('   email:', userEmail);

  // Buscar solicitações do contratante de duas formas:
  // 1. Por clerk_id (solicitações novas)
  const { data: requestsByClerkId } = await supabase
    .from('contractor_requests')
    .select('*')
    .eq('clerk_id', userId);

  // 2. Por email (solicitações antigas sem clerk_id)
  const { data: requestsByEmail } = await supabase
    .from('contractor_requests')
    .select('*')
    .eq('email', userEmail)
    .is('clerk_id', null);

  // Combinar e remover duplicatas
  const allRequests = [...(requestsByClerkId || []), ...(requestsByEmail || [])];
  const uniqueRequests = Array.from(
    new Map(allRequests.map(req => [req.id, req])).values()
  );

  // Ordenar por data
  const requests = uniqueRequests.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  console.log('✅ [Dashboard] Solicitações encontradas:', requests?.length || 0);
  console.log('   - Por clerk_id:', requestsByClerkId?.length || 0);
  console.log('   - Por email:', requestsByEmail?.length || 0);
  if (requests && requests.length > 0) {
    console.log('📋 [Dashboard] Primeira solicitação:', {
      id: requests[0].id.substring(0, 8),
      company: requests[0].company_name,
      email: requests[0].email,
      clerk_id: requests[0].clerk_id || 'null',
    });
  }

  // Estatísticas
  const totalRequests = requests?.length || 0;
  const pendingRequests = requests?.filter((r) => r.status === 'pending').length || 0;
  const approvedRequests = requests?.filter((r) => r.status === 'approved').length || 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Dashboard Contratante</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/solicitar-equipe">
              <Button className="bg-red-600 hover:bg-red-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </Link>
            <DashboardHeader
              userName={user.firstName || user.emailAddresses[0].emailAddress}
              userRole="Contratante"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Total de Solicitações</p>
                  <p className="text-3xl font-bold text-white">{totalRequests}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Em Análise</p>
                  <p className="text-3xl font-bold text-yellow-500">{pendingRequests}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Aprovadas</p>
                  <p className="text-3xl font-bold text-green-500">{approvedRequests}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Minhas Solicitações */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Minhas Solicitações
              </CardTitle>
              <Link href="/solicitar-equipe">
                <Button className="bg-red-600 hover:bg-red-500 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Solicitação
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {request.event_name}
                        </h3>
                        <p className="text-sm text-zinc-400">{request.event_type}</p>
                      </div>
                      <div>
                        {request.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            Em Análise
                          </span>
                        )}
                        {request.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Aprovado
                          </span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Rejeitado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(request.start_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="h-4 w-4" />
                        <span>{request.venue_city} - {request.venue_state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Building2 className="h-4 w-4" />
                        <span>{request.company_name}</span>
                      </div>
                    </div>

                    {request.professionals_needed && Array.isArray(request.professionals_needed) && (
                      <div className="mt-3 pt-3 border-t border-zinc-700">
                        <p className="text-xs text-zinc-500 mb-2">Profissionais Solicitados:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.professionals_needed.map(
                            (prof: any, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded"
                              >
                                {prof.category}: {prof.quantity} ({prof.shift})
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-zinc-500">
                      Solicitado em: {new Date(request.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">Nenhuma solicitação ainda</p>
                <p className="text-sm text-zinc-500 mb-6">
                  Faça sua primeira solicitação de equipe para eventos
                </p>
                <Link href="/solicitar-equipe">
                  <Button className="bg-red-600 hover:bg-red-500 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Primeira Solicitação
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card className="bg-zinc-900 border-zinc-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white text-base">Precisa de Ajuda?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="mailto:hrxtecnologic@gmail.com"
                className="flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              >
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Email</p>
                  <p className="text-xs text-zinc-400">hrxtecnologic@gmail.com</p>
                </div>
              </a>

              <a
                href="https://wa.me/5521999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              >
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">WhatsApp</p>
                  <p className="text-xs text-zinc-400">Fale conosco</p>
                </div>
              </a>

              <Link
                href="/"
                className="flex items-center gap-3 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              >
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Site</p>
                  <p className="text-xs text-zinc-400">Voltar para home</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
