'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  Package,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { QuoteRequestWithDetails } from '@/types/quote';
import { useParams } from 'next/navigation';

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<QuoteRequestWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Buscar detalhes do orçamento
  const fetchQuote = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/quotes/${quoteId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar orçamento');
      }
      const data = await response.json();
      setQuote(data.quote);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar orçamento');
      console.error('Erro ao buscar orçamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar fornecedores disponíveis
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers?status=active');
      if (!response.ok) {
        throw new Error('Erro ao buscar fornecedores');
      }
      const data = await response.json();
      setSuppliers(data);
    } catch (error: any) {
      toast.error('Erro ao carregar fornecedores');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchQuote();
    fetchSuppliers();
  }, [quoteId]);

  // Enviar solicitações para fornecedores
  const handleSendQuotes = async () => {
    if (selectedSuppliers.length === 0) {
      toast.error('Selecione pelo menos um fornecedor');
      return;
    }

    if (!deadline) {
      toast.error('Defina um prazo para resposta');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(`/api/admin/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_ids: selectedSuppliers,
          deadline: deadline,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar solicitações');
      }

      const result = await response.json();
      toast.success(`${result.totalSent} solicitações enviadas com sucesso!`);

      if (result.totalFailed > 0) {
        toast.warning(`${result.totalFailed} solicitações falharam`);
      }

      setIsSendDialogOpen(false);
      setSelectedSuppliers([]);
      setDeadline('');
      fetchQuote(); // Atualizar dados
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle seleção de fornecedor
  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-zinc-700 text-zinc-300' },
      sent: { label: 'Enviado', className: 'bg-blue-600 text-white' },
      analyzing: { label: 'Analisando', className: 'bg-yellow-600 text-white' },
      finalized: { label: 'Finalizado', className: 'bg-green-600 text-white' },
      cancelled: { label: 'Cancelado', className: 'bg-red-600 text-white' },
    };
    return badges[status] || badges.draft;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-400">Carregando orçamento...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-zinc-400">Orçamento não encontrado</p>
        <Button onClick={() => router.push('/admin/orcamentos')} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(quote.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/orcamentos')}
            className="border-zinc-700 text-white hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{quote.client_name}</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Orçamento #{quote.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          {quote.is_urgent && (
            <Badge className="bg-red-600 text-white animate-pulse">
              🚨 URGENTE
            </Badge>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Margem de Lucro</p>
            <p className={`text-2xl font-bold ${quote.is_urgent ? 'text-red-400' : 'text-green-400'}`}>
              {quote.profit_margin}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Itens</p>
            <p className="text-2xl font-bold text-white">{quote.items?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Cotações Recebidas</p>
            <p className="text-2xl font-bold text-blue-400">{quote.quotes?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Valor Total</p>
            <p className="text-2xl font-bold text-green-400">
              {quote.total_client_price
                ? `R$ ${quote.total_client_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Cliente e Evento */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-200">Informações do Cliente e Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-zinc-300">
              <User className="h-4 w-4 text-zinc-500" />
              <span className="text-sm">{quote.client_name}</span>
            </div>
            {quote.client_email && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span className="text-sm">{quote.client_email}</span>
              </div>
            )}
            {quote.client_phone && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="h-4 w-4 text-zinc-500" />
                <span className="text-sm">{quote.client_phone}</span>
              </div>
            )}
            {quote.event_date && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span className="text-sm">
                  {new Date(quote.event_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            {quote.event_location && (
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span className="text-sm">{quote.event_location}</span>
              </div>
            )}
            {quote.event_type && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Package className="h-4 w-4 text-zinc-500" />
                <span className="text-sm">{quote.event_type}</span>
              </div>
            )}
          </div>
          {quote.description && (
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 mb-1">Descrição:</p>
              <p className="text-sm text-zinc-300">{quote.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens Solicitados */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-200">Itens Solicitados</CardTitle>
            {quote.status === 'draft' && (
              <Button
                onClick={() => setIsSendDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar para Fornecedores
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quote.items && quote.items.length > 0 ? (
              quote.items.map((item, index) => (
                <Card key={item.id} className="bg-zinc-800 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-1">{item.name}</h4>
                        <p className="text-xs text-zinc-400 mb-2">{item.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
                          <span>
                            <strong className="text-zinc-400">Tipo:</strong> {item.item_type}
                          </span>
                          <span>
                            <strong className="text-zinc-400">Categoria:</strong> {item.category}
                          </span>
                          {item.subcategory && (
                            <span>
                              <strong className="text-zinc-400">Subcategoria:</strong> {item.subcategory}
                            </span>
                          )}
                          <span>
                            <strong className="text-zinc-400">Quantidade:</strong> {item.quantity}
                          </span>
                          <span>
                            <strong className="text-zinc-400">Duração:</strong> {item.duration_days} dia(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-zinc-400 text-center py-4">
                Nenhum item adicionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cotações Recebidas */}
      {quote.quotes && quote.quotes.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200">Cotações Recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quote.quotes.map((supplierQuote: any) => (
                <Card key={supplierQuote.id} className="bg-zinc-800 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-1">
                          {supplierQuote.supplier?.company_name || 'Fornecedor'}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-300 mt-2">
                          <span>
                            <strong className="text-zinc-400">Preço Total:</strong>{' '}
                            R$ {supplierQuote.total_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                          </span>
                          {supplierQuote.daily_rate && (
                            <span>
                              <strong className="text-zinc-400">Diária:</strong>{' '}
                              R$ {supplierQuote.daily_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {supplierQuote.delivery_fee && (
                            <span>
                              <strong className="text-zinc-400">Taxa Entrega:</strong>{' '}
                              R$ {supplierQuote.delivery_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {supplierQuote.setup_fee && (
                            <span>
                              <strong className="text-zinc-400">Taxa Instalação:</strong>{' '}
                              R$ {supplierQuote.setup_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          <Badge
                            className={
                              supplierQuote.status === 'accepted'
                                ? 'bg-green-600 text-white'
                                : supplierQuote.status === 'rejected'
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-700 text-zinc-300'
                            }
                          >
                            {supplierQuote.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para Enviar para Fornecedores */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Enviar Solicitação para Fornecedores</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Selecione os fornecedores e defina o prazo para resposta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Prazo */}
            <div>
              <Label htmlFor="deadline" className="text-sm font-medium text-zinc-200">
                Prazo para Resposta *
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            {/* Lista de Fornecedores */}
            <div>
              <Label className="text-sm font-medium text-zinc-200">
                Selecione os Fornecedores
              </Label>
              <p className="text-xs text-zinc-500 mt-1 mb-3">
                Escolha os fornecedores que receberão a solicitação de orçamento
              </p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {suppliers.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">
                    Nenhum fornecedor ativo disponível
                  </p>
                ) : (
                  suppliers.map((supplier) => (
                    <Card key={supplier.id} className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`supplier-${supplier.id}`}
                            checked={selectedSuppliers.includes(supplier.id)}
                            onCheckedChange={() => toggleSupplier(supplier.id)}
                            className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-1"
                          />
                          <label
                            htmlFor={`supplier-${supplier.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <p className="text-sm font-medium text-white">
                              {supplier.company_name}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {supplier.contact_name} • {supplier.email}
                            </p>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <p className="text-xs text-zinc-600 mt-2">
                {selectedSuppliers.length > 0
                  ? `${selectedSuppliers.length} fornecedor(es) selecionado(s)`
                  : 'Nenhum fornecedor selecionado'}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendDialogOpen(false)}
              className="border-white text-white hover:bg-red-600 hover:border-red-600"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendQuotes}
              disabled={isSending || selectedSuppliers.length === 0 || !deadline}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            >
              {isSending ? 'Enviando...' : 'Enviar Solicitações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
