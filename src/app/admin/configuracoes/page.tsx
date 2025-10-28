import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Tag,
  Truck,
  Shield,
  Database,
  Bell,
  Palette,
} from 'lucide-react';
import Link from 'next/link';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-zinc-400">Gerenciar configurações do sistema</p>
      </div>

      {/* Configurações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorias */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-red-600" />
              Categorias de Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">
              Gerenciar categorias disponíveis para profissionais
            </p>
            <Link href="/admin/configuracoes/categorias">
              <Button className="w-full bg-red-600 hover:bg-red-500 text-white">
                Gerenciar Categorias
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Categorias de Fornecedores */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              Categorias de Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">
              Gerenciar categorias e subcategorias de equipamentos dos fornecedores
            </p>
            <Link href="/admin/configuracoes/categorias-fornecedores">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                Gerenciar Categorias
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-green-600" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">
              Configurar notificações automáticas
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-500 text-white">
              Configurar Alertas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configurações do Sistema */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-white">Backup Automático</p>
                  <p className="text-xs text-zinc-500">Último backup: Hoje às 03:00</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-zinc-700">
                Configurar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-white">Segurança</p>
                  <p className="text-xs text-zinc-500">Autenticação de dois fatores</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-zinc-700">
                Configurar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-white">Aparência</p>
                  <p className="text-xs text-zinc-500">Tema: Dark (Padrão)</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-zinc-700">
                Personalizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 mb-1">Versão</p>
              <p className="text-white font-medium">v1.0.0</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Ambiente</p>
              <p className="text-white font-medium">Desenvolvimento</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Database</p>
              <p className="text-white font-medium">Supabase</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1">Auth</p>
              <p className="text-white font-medium">Clerk</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500 mb-1">
                Funcionalidade em Desenvolvimento
              </p>
              <p className="text-sm text-blue-500/70">
                As configurações avançadas estão em desenvolvimento e serão disponibilizadas em breve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
