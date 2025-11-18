'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CheckCircle, Clock, XCircle, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface Quotation {
  id: string;
  supplier_id: string;
  status: string;
  total_price: number | null;
  daily_rate: number | null;
  delivery_fee: number | null;
  setup_fee: number | null;
  payment_terms: string | null;
  delivery_details: string | null;
  notes: string | null;
  submitted_at: string | null;
  valid_until: string | null;
  supplier: {
    company_name: string;
    contact_name: string;
    email: string;
  };
}

interface QuotationsComparisonProps {
  projectId: string;
}

export function QuotationsComparison({ projectId }: QuotationsComparisonProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function loadQuotations() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/event-projects/${projectId}/quotations`);
        if (!response.ok) throw new Error('Erro ao carregar orçamentos');

        const data = await response.json();
        setQuotations(data.quotations || []);
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
        toast.error('Erro ao carregar orçamentos');
      } finally {
        setLoading(false);
      }
    }

    loadQuotations();
  }, [projectId, refreshTrigger]);

  async function acceptQuotation(quotationId: string) {
    try {
      setAccepting(quotationId);

      const response = await fetch(
        `/api/admin/event-projects/${projectId}/quotations/${quotationId}/accept`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao aceitar orçamento');
      }

      const data = await response.json();

      // Mostrar custos atualizados
      if (data.updatedCosts) {
        const { totalEquipmentCost, totalCost, totalClientPrice } = data.updatedCosts;
        toast.success(
          `Orçamento aceito!\n\n` +
          `💰 Equipamentos: R$ ${totalEquipmentCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `📊 Custo Total: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
          `💵 Preço Cliente: R$ ${totalClientPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          { duration: 6000 }
        );
      } else {
        toast.success('Orçamento aceito! Projeto atualizado.');
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Erro ao aceitar orçamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao aceitar orçamento');
    } finally {
      setAccepting(null);
    }
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando orçamentos...</p>
        </CardContent>
      </Card>
    );
  }

  if (quotations.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-12 text-center">
          <Clock className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum orçamento solicitado ainda
          </h3>
          <p className="text-zinc-400">
            Use o botão &quot;Solicitar Orçamentos&quot; para enviar pedidos aos fornecedores
          </p>
        </CardContent>
      </Card>
    );
  }

  const submitted = quotations.filter(q => q.status === 'submitted');
  const pending = quotations.filter(q => q.status === 'pending');
  const accepted = quotations.find(q => q.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-900/20 border-green-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">Recebidos</p>
                <p className="text-2xl font-bold text-green-500">{submitted.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-900/20 border-yellow-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Aguardando</p>
                <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-900/20 border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Aceito</p>
                <p className="text-2xl font-bold text-blue-500">{accepted ? 1 : 0}</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de comparação */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Comparação de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Fornecedor</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Preço Total</TableHead>
                  <TableHead className="text-zinc-400 text-right">Taxa Diária</TableHead>
                  <TableHead className="text-zinc-400 text-right">Entrega</TableHead>
                  <TableHead className="text-zinc-400 text-right">Montagem</TableHead>
                  <TableHead className="text-zinc-400">Enviado em</TableHead>
                  <TableHead className="text-zinc-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => {
                  const isAccepted = quotation.status === 'accepted';
                  const isSubmitted = quotation.status === 'submitted';
                  const isPending = quotation.status === 'pending';

                  return (
                    <TableRow
                      key={quotation.id}
                      className={`border-zinc-800 ${
                        isAccepted
                          ? 'bg-green-900/10'
                          : isSubmitted
                          ? 'bg-zinc-800/50'
                          : 'opacity-60'
                      }`}
                    >
                      <TableCell className="text-white">
                        <div>
                          <p className="font-medium">{quotation.supplier.company_name}</p>
                          <p className="text-xs text-zinc-500">{quotation.supplier.email}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isAccepted && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            ✓ Aceito
                          </Badge>
                        )}
                        {isSubmitted && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Recebido
                          </Badge>
                        )}
                        {isPending && (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            Aguardando
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {quotation.total_price ? (
                          <span className="font-semibold text-green-500">
                            R$ {quotation.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-zinc-300">
                        {quotation.daily_rate ? (
                          `R$ ${quotation.daily_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-zinc-300">
                        {quotation.delivery_fee ? (
                          `R$ ${quotation.delivery_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-zinc-300">
                        {quotation.setup_fee ? (
                          `R$ ${quotation.setup_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-zinc-400 text-sm">
                        {quotation.submitted_at ? (
                          new Date(quotation.submitted_at).toLocaleString('pt-BR')
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isSubmitted && !accepted && (
                          <Button
                            size="sm"
                            onClick={() => acceptQuotation(quotation.id)}
                            disabled={accepting === quotation.id}
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            {accepting === quotation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Aceitar'
                            )}
                          </Button>
                        )}
                        {isAccepted && (
                          <span className="text-xs text-green-500">✓ Selecionado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Notas dos orçamentos */}
          {submitted.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-white">Observações dos Fornecedores:</h4>
              {submitted.map((quotation) => (
                quotation.notes && (
                  <div key={quotation.id} className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-1">{quotation.supplier.company_name}:</p>
                    <p className="text-sm text-zinc-300">{quotation.notes}</p>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
