'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Calendar,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_type: string;
  subject: string;
  template_used: string;
  related_id?: string;
  related_type?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  external_id?: string;
  sent_at: string;
}

export default function HistoricoEmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [importing, setImporting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: '100',
          offset: '0',
        });

        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        if (typeFilter !== 'all') {
          params.append('recipientType', typeFilter);
        }

        const response = await fetch(`/api/admin/emails?${params}`);
        const data = await response.json();

        if (data.success) {
          setEmails(data.emails || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar emails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [statusFilter, typeFilter, refreshTrigger]);

  const filteredEmails = emails.filter(email => {
    const matchesSearch =
      email.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.template_used.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return { label: 'Enviado', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'failed':
        return { label: 'Falhou', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
      default:
        return { label: status, color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      professional: 'Profissional',
      contractor: 'Contratante',
      supplier: 'Fornecedor',
      admin: 'Admin',
      hrx: 'HRX',
    };
    return types[type] || type;
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const response = await fetch('/api/admin/emails/import', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.totalImported} emails importados com sucesso!`);
        setRefreshTrigger(prev => prev + 1); // Trigger re-fetch
      } else {
        alert(`❌ Erro ao importar: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao importar emails:', error);
      alert('❌ Erro ao importar emails');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/comunicacao">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Histórico de Emails</h1>
            <p className="text-sm sm:text-base text-zinc-400">Todos os emails enviados pelo sistema</p>
          </div>
          <Button
            onClick={handleImport}
            disabled={importing}
            className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto shrink-0"
          >
            {importing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Importar Histórico</span>
                <span className="xs:hidden">Importar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Import Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500 mb-1">
                Importação de Histórico Disponível
              </p>
              <p className="text-sm text-blue-500/70">
                A API do Resend está configurada com acesso completo (Full Access). Você pode importar todos os emails históricos
                clicando no botão &quot;Importar Histórico&quot; acima. Todos os emails enviados a partir de agora são registrados
                automaticamente no banco de dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Enviados</p>
                <p className="text-2xl font-bold text-white">{total}</p>
              </div>
              <Mail className="h-8 w-8 text-zinc-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Enviados com Sucesso</p>
                <p className="text-2xl font-bold text-green-500">
                  {emails.filter(e => e.status === 'sent').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Falharam</p>
                <p className="text-2xl font-bold text-red-500">
                  {emails.filter(e => e.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {emails.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar por email, assunto ou template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Falharam</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="professional">Profissionais</SelectItem>
                  <SelectItem value="contractor">Contratantes</SelectItem>
                  <SelectItem value="supplier">Fornecedores</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            Emails ({filteredEmails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-8 w-8 text-zinc-600 animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Carregando histórico...</p>
            </div>
          ) : filteredEmails.length > 0 ? (
            <div className="space-y-3">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-3 sm:p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getStatusBadge(email.status).color}>
                          {getStatusBadge(email.status).label}
                        </Badge>
                        <Badge className="bg-zinc-700 text-zinc-300 text-xs">
                          {getTypeLabel(email.recipient_type)}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-white mb-1 truncate text-sm sm:text-base">
                        {email.subject}
                      </h4>

                      <div className="flex flex-col gap-1 text-xs sm:text-sm text-zinc-400">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{email.recipient_email}</span>
                        </span>
                        <span className="font-mono text-xs truncate">{email.template_used}</span>
                      </div>

                      {email.error_message && (
                        <p className="text-xs text-red-400 mt-2 break-words">
                          Erro: {email.error_message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-700/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(email.sent_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span>{new Date(email.sent_at).toLocaleTimeString('pt-BR')}</span>
                      {email.external_id && (
                        <span className="font-mono text-xs text-zinc-600 hidden sm:inline">
                          ID: {email.external_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum email encontrado
              </h3>
              <p className="text-zinc-400">
                Tente ajustar os filtros de busca
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
