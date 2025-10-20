import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  XCircle,
  User,
  Briefcase,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default async function DashboardProfissionalPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/entrar');
  }

  // Verificar se é profissional
  const userType = user.publicMetadata?.userType;
  if (userType !== 'professional') {
    redirect('/');
  }

  const supabase = await createClient();

  // Buscar dados do profissional
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    redirect('/cadastro-profissional');
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', userData.id)
    .single();

  if (!professional) {
    redirect('/cadastro-profissional');
  }

  // Status do cadastro
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      textColor: 'text-yellow-500',
      title: 'Em Análise',
      message: 'Seu cadastro está sendo analisado pela nossa equipe. Em breve você receberá um retorno.',
    },
    approved: {
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-500',
      title: 'Aprovado',
      message: 'Parabéns! Seu cadastro foi aprovado. Agora você pode receber oportunidades de trabalho.',
    },
    rejected: {
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      textColor: 'text-red-500',
      title: 'Não Aprovado',
      message: 'Infelizmente seu cadastro não foi aprovado. Entre em contato conosco para mais informações.',
    },
  };

  const status = statusConfig[professional.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Dashboard Profissional</h1>
          </div>
          <div className="flex items-center gap-4">
            <DashboardHeader
              userName={professional.full_name}
              userRole="Profissional"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status do Cadastro */}
        <Card className={`bg-zinc-900 border-zinc-800 mb-8 ${status.borderColor}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${status.bgColor}`}>
                <StatusIcon className={`h-8 w-8 ${status.textColor}`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold mb-2 ${status.textColor}`}>
                  Status: {status.title}
                </h2>
                <p className="text-zinc-400">{status.message}</p>
                {professional.status === 'pending' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                    <Clock className="h-4 w-4" />
                    <span>Tempo médio de análise: 24-48 horas úteis</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Oportunidades */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-red-600" />
                  Oportunidades Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {professional.status === 'approved' ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-4">
                      Nenhuma oportunidade disponível no momento
                    </p>
                    <p className="text-sm text-zinc-500">
                      Você será notificado quando surgirem novas oportunidades
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-2">
                      Aguardando aprovação do cadastro
                    </p>
                    <p className="text-sm text-zinc-500">
                      Você poderá ver oportunidades após a aprovação
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  Histórico de Trabalhos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">Nenhum trabalho realizado ainda</p>
                  <p className="text-sm text-zinc-500">
                    Seus trabalhos aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Dados do Perfil */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500">Nome Completo</p>
                  <p className="text-sm text-white">{professional.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-white">{professional.email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Telefone</p>
                  <p className="text-sm text-white">{professional.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Cidade</p>
                  <p className="text-sm text-white">
                    {professional.city} - {professional.state}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Minhas Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {professional.categories?.map((cat: string) => (
                    <span
                      key={cat}
                      className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.keys(professional.documents || {}).length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span>{Object.keys(professional.documents).length} documentos enviados</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Documentos enviados com sucesso
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Nenhum documento enviado</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="mailto:hrxtecnologic@gmail.com"
                  className="block w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition text-center text-sm"
                >
                  📧 Enviar Email
                </a>
                <a
                  href="https://wa.me/5521999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-center text-sm"
                >
                  💬 WhatsApp
                </a>
                <Link
                  href="/"
                  className="block w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition text-center text-sm"
                >
                  🏠 Voltar para Home
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
