'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Eye, Calendar, User, MapPin, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { QuoteRequestSummary } from '@/types/quote';

export default function OrcamentosPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgentFilter, setUrgentFilter] = useState<string>('all');

  // Buscar orçamentos
  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (urgentFilter === 'urgent') {
        params.append('is_urgent', 'true');
      }

      const response = await fetch(`/api/admin/quotes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar orçamentos');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar orçamentos');
      console.error('Erro ao buscar orçamentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter, urgentFilter]);

  // Estatísticas
  const stats = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === 'draft').length,
    sent: quotes.filter((q) => q.status === 'sent').length,
    urgent: quotes.filter((q) => q.is_urgent).length,
  };

  // Status badge helper
  const getStatusBadge = (status: string, isUrgent: boolean) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-zinc-700 text-zinc-300 border-zinc-600' },
      sent: { label: 'Enviado', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
      analyzing: { label: 'Analisando', className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' },
      finalized: { label: 'Finalizado', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
      cancelled: { label: 'Cancelado', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
    };

    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={badges[status]?.className || badges.draft.className}>
          {badges[status]?.label || status}
        </Badge>
        {isUrgent && (
          <Badge variant="outline" className="bg-red-600 text-white border-red-600 animate-pulse">
            🚨 URGENTE
          </Badge>
        )}
      </div>
    );
  };

  // Status icon helper
  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      draft: AlertCircle,
      sent: Clock,
      analyzing: Clock,
      finalized: CheckCircle,
      cancelled: XCircle,
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orçamentos</h1>
          <p className="text-zinc-400">Gerenciar solicitações de orçamento para eventos</p>
        </div>
        <Button
          onClick={() => router.push('/admin/orcamentos/novo')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Rascunhos</p>
            <p className="text-2xl font-bold text-zinc-500">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Enviados</p>
            <p className="text-2xl font-bold text-blue-500">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Urgentes</p>
            <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-1.5">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="analyzing">Analisando</SelectItem>
                  <SelectItem value="finalized">Finalizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-1.5">Urgência</label>
              <Select value={urgentFilter} onValueChange={setUrgentFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="urgent">Apenas Urgentes</SelectItem>
                  <SelectItem value="normal">Apenas Normais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-400">
              Carregando orçamentos...
            </CardContent>
          </Card>
        ) : quotes.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center text-zinc-400">
              Nenhum orçamento encontrado com os filtros selecionados
            </CardContent>
          </Card>
        ) : (
          quotes.map((quote) => (
            <Card
              key={quote.id}
              className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer ${
                quote.is_urgent ? 'ring-1 ring-red-600/30' : ''
              }`}
              onClick={() => router.push(`/admin/orcamentos/${quote.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-red-500">
                        {getStatusIcon(quote.status)}
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {quote.client_name}
                      </h3>
                      {getStatusBadge(quote.status, quote.is_urgent)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <User className="h-4 w-4" />
                        <span className="text-zinc-300">{quote.client_email || 'Email não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-zinc-300">
                          {quote.event_date
                            ? new Date(quote.event_date).toLocaleDateString('pt-BR')
                            : 'Data não informada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="h-4 w-4" />
                        <span className="text-zinc-300">
                          {quote.event_location || 'Local não informado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <span className="font-medium">Tipo:</span>
                        <span className="text-zinc-300">{quote.event_type || 'Não especificado'}</span>
                      </div>
                    </div>

                    {quote.description && (
                      <p className="text-sm text-zinc-500 mt-3 line-clamp-2">
                        {quote.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-800">
                      <div>
                        <p className="text-xs text-zinc-500">Itens</p>
                        <p className="text-sm font-medium text-white">{quote.total_items || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Cotações Recebidas</p>
                        <p className="text-sm font-medium text-blue-400">{quote.quotes_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Margem de Lucro</p>
                        <p className={`text-sm font-bold ${quote.is_urgent ? 'text-red-400' : 'text-green-400'}`}>
                          {quote.profit_margin}%
                        </p>
                      </div>
                      {quote.total_client_price && quote.total_client_price > 0 && (
                        <div>
                          <p className="text-xs text-zinc-500">Valor Total (Cliente)</p>
                          <p className="text-sm font-bold text-green-400">
                            R$ {quote.total_client_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/orcamentos/${quote.id}`);
                      }}
                      className="border-white text-white hover:bg-red-600 hover:border-red-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
