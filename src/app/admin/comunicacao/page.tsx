import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Send, Users, FileText } from 'lucide-react';

export default function ComunicacaoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Comunicação</h1>
        <p className="text-zinc-400">Enviar mensagens e notificações para profissionais e empresas</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 hover:border-red-600 transition cursor-pointer">
          <CardContent className="p-6">
            <Mail className="h-8 w-8 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Email em Massa</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Enviar emails para múltiplos destinatários
            </p>
            <Button className="w-full bg-red-600 hover:bg-red-500 text-white">
              <Send className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-600 transition cursor-pointer">
          <CardContent className="p-6">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Notificações</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Enviar notificações via WhatsApp ou SMS
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 hover:border-green-600 transition cursor-pointer">
          <CardContent className="p-6">
            <FileText className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Templates</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Gerenciar templates de mensagens
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-500 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Ver Templates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Templates Disponíveis */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Templates de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: 'Boas-vindas Profissional',
                description: 'Mensagem de boas-vindas após aprovação do cadastro',
                type: 'Email',
              },
              {
                name: 'Notificação de Vaga',
                description: 'Notificar profissionais sobre novas oportunidades',
                type: 'Email + WhatsApp',
              },
              {
                name: 'Confirmação de Evento',
                description: 'Confirmar presença do profissional no evento',
                type: 'WhatsApp',
              },
              {
                name: 'Lembrete de Documentos',
                description: 'Lembrar profissionais sobre documentos vencidos',
                type: 'Email',
              },
            ].map((template, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
              >
                <div>
                  <h4 className="font-medium text-white mb-1">{template.name}</h4>
                  <p className="text-sm text-zinc-400">{template.description}</p>
                  <span className="text-xs text-zinc-500 mt-1 inline-block">{template.type}</span>
                </div>
                <Button size="sm" variant="outline" className="border-zinc-700">
                  Usar Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Últimas Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 text-center py-8">
              Nenhuma campanha enviada ainda
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Métricas de Comunicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Taxa de Abertura</span>
                <span className="text-sm font-medium text-white">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Taxa de Resposta</span>
                <span className="text-sm font-medium text-white">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Mensagens Enviadas</span>
                <span className="text-sm font-medium text-white">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500 mb-1">
                Funcionalidade em Desenvolvimento
              </p>
              <p className="text-sm text-blue-500/70">
                O sistema de comunicação em massa está em desenvolvimento e será disponibilizado em breve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
