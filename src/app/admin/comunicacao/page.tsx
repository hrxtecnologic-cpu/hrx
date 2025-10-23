'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Search,
  Edit,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

// Templates disponíveis no sistema
const EMAIL_TEMPLATES = [
  {
    id: 'professional-welcome',
    name: 'Boas-vindas Profissional',
    description: 'Email de boas-vindas enviado após cadastro de profissional',
    file: 'ProfessionalWelcomeEmail.tsx',
    category: 'Profissionais',
    active: true,
  },
  {
    id: 'simple-welcome',
    name: 'Boas-vindas Simples',
    description: 'Email de boas-vindas básico',
    file: 'SimpleWelcomeEmail.tsx',
    category: 'Geral',
    active: true,
  },
  {
    id: 'contractor-confirmation',
    name: 'Confirmação Contratante',
    description: 'Confirmação de solicitação de evento',
    file: 'ContractorConfirmationEmail.tsx',
    category: 'Contratantes',
    active: true,
  },
  {
    id: 'contact-confirmation',
    name: 'Confirmação de Contato',
    description: 'Confirmação de recebimento de contato',
    file: 'ContactConfirmationEmail.tsx',
    category: 'Geral',
    active: true,
  },
  {
    id: 'pending-documents',
    name: 'Documentos Pendentes',
    description: 'Lembrete de documentos pendentes para profissionais',
    file: 'PendingDocumentsEmail.tsx',
    category: 'Profissionais',
    active: true,
  },
  {
    id: 'quote-request',
    name: 'Solicitação de Orçamento',
    description: 'Email solicitando orçamento a fornecedores',
    file: 'QuoteRequestEmail.tsx',
    category: 'Fornecedores',
    active: true,
  },
  {
    id: 'quote-accepted',
    name: 'Orçamento Aceito',
    description: 'Notificação de orçamento aceito',
    file: 'QuoteAcceptedEmail.tsx',
    category: 'Fornecedores',
    active: true,
  },
  {
    id: 'quote-rejected',
    name: 'Orçamento Rejeitado',
    description: 'Notificação de orçamento rejeitado',
    file: 'QuoteRejectedEmail.tsx',
    category: 'Fornecedores',
    active: true,
  },
  {
    id: 'admin-notification',
    name: 'Notificação Admin',
    description: 'Notificações gerais para administradores',
    file: 'AdminNotificationEmail.tsx',
    category: 'Admin',
    active: true,
  },
  {
    id: 'admin-request-notification',
    name: 'Notificação de Solicitação',
    description: 'Notifica admin sobre nova solicitação',
    file: 'AdminRequestNotificationEmail.tsx',
    category: 'Admin',
    active: true,
  },
  {
    id: 'urgent-quote-admin',
    name: 'Cotação Urgente',
    description: 'Alerta de cotação urgente para admin',
    file: 'UrgentQuoteAdminEmail.tsx',
    category: 'Admin',
    active: true,
  },
  {
    id: 'contact-notification',
    name: 'Notificação de Contato',
    description: 'Notifica admin sobre novo contato',
    file: 'ContactNotificationEmail.tsx',
    category: 'Admin',
    active: true,
  },
  {
    id: 'final-proposal',
    name: 'Proposta Final',
    description: 'Email com proposta final do projeto',
    file: 'FinalProposalEmail.tsx',
    category: 'Contratantes',
    active: true,
  },
];

const CATEGORIES = ['Todos', 'Profissionais', 'Contratantes', 'Fornecedores', 'Admin', 'Geral'];

export default function ComunicacaoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredTemplates = EMAIL_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: EMAIL_TEMPLATES.length,
    active: EMAIL_TEMPLATES.filter(t => t.active).length,
    categories: [...new Set(EMAIL_TEMPLATES.map(t => t.category))].length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Comunicação</h1>
          <p className="text-zinc-400">Gerenciar templates de email e comunicação</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/comunicacao/configuracoes">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link>
          <Link href="/admin/comunicacao/historico">
            <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
              <Clock className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Templates Totais</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-zinc-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Ativos</p>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Categorias</p>
                <p className="text-2xl font-bold text-blue-500">{stats.categories}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg mb-1">{template.name}</CardTitle>
                  <Badge className="bg-zinc-800 text-zinc-300 text-xs">
                    {template.category}
                  </Badge>
                </div>
                {template.active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-zinc-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 mb-4">{template.description}</p>

              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                <FileText className="h-3 w-3" />
                <span className="font-mono">{template.file}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                  onClick={() => {
                    window.open(`/api/admin/emails/preview?template=${template.id}`, '_blank', 'width=800,height=600');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Link href={`/admin/comunicacao/editar/${template.id}`} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-zinc-400">
              Tente ajustar os filtros de busca
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500 mb-1">
                Editor de Templates em Desenvolvimento
              </p>
              <p className="text-sm text-blue-500/70">
                Os templates estão funcionando normalmente. O editor visual para personalização será disponibilizado em breve.
                Atualmente, os templates podem ser editados diretamente nos arquivos em <code className="bg-blue-900/30 px-1 rounded">src/lib/resend/templates/</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
