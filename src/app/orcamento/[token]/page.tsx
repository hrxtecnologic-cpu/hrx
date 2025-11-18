'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  MapPin,
  Package,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const quotationSchema = z.object({
  total_price: z.number().min(0.01, 'Preço total é obrigatório'),
  daily_rate: z.number().min(0, 'Taxa diária é obrigatória').optional(),
  delivery_fee: z.number().min(0, 'Taxa de entrega inválida').optional(),
  setup_fee: z.number().min(0, 'Taxa de montagem inválida').optional(),
  payment_terms: z.string().optional(),
  delivery_details: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

export default function OrcamentoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [quotation, setQuotation] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
  });

  useEffect(() => {
    loadQuotation();
  }, [token]);

  async function loadQuotation() {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/quotations/${token}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 410) {
          setError('Esta solicitação de orçamento expirou');
        } else if (data.quotation?.status === 'submitted') {
          setSubmitted(true);
          setQuotation(data.quotation);
        } else {
          setError(data.error || 'Erro ao carregar solicitação');
        }
        return;
      }

      setQuotation(data.quotation);
    } catch (err: unknown) {
      console.error('❌ Erro ao carregar:', err);
      setError('Erro ao carregar solicitação de orçamento');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: QuotationFormData) {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/public/quotations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar orçamento');
      }

      toast.success('Orçamento enviado com sucesso!');
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('❌ Erro ao enviar:', err);
      toast.error(err.message || 'Erro ao enviar orçamento');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Erro</h2>
            <p className="text-zinc-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Orçamento Enviado!
            </h2>
            <p className="text-zinc-400 mb-4">
              Seu orçamento foi enviado com sucesso. Aguarde o contato da equipe HRX.
            </p>
            {quotation?.submitted_at && (
              <p className="text-sm text-zinc-500">
                Enviado em:{' '}
                {new Date(quotation.submitted_at).toLocaleString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = quotation?.project;
  const supplier = quotation?.supplier;
  const items = quotation?.requested_items || [];

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Solicitação de Orçamento
          </h1>
          <p className="text-zinc-400">HRX Eventos & Produção</p>
        </div>

        {/* Informações do Projeto */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Detalhes do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-zinc-400">Nome do Evento</p>
              <p className="text-lg font-semibold text-white">
                {project?.event_name}
              </p>
              <p className="text-sm text-zinc-500">
                Projeto #{project?.project_number}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project?.event_date && (
                <div className="flex items-center gap-2 text-zinc-300">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span>
                    {new Date(project.event_date).toLocaleDateString('pt-BR')}
                    {project.start_time && ` - ${project.start_time}`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span>
                  {project?.venue_city}, {project?.venue_state}
                </span>
              </div>
            </div>

            {project?.venue_address && (
              <div>
                <p className="text-sm text-zinc-400">Local</p>
                <p className="text-zinc-300">{project.venue_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipamentos Solicitados */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              Equipamentos Solicitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {item.name || item.type}
                      </p>
                      {item.category && (
                        <p className="text-sm text-zinc-400">{item.category}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">
                        {item.quantity}x
                      </p>
                      {item.duration_days && (
                        <p className="text-sm text-zinc-400">
                          {item.duration_days} dias
                        </p>
                      )}
                    </div>
                  </div>
                  {item.specifications && (
                    <p className="text-sm text-zinc-500 mt-2">
                      {item.specifications}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Orçamento */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Seu Orçamento</CardTitle>
            <p className="text-sm text-zinc-400">
              Olá, <span className="font-semibold">{supplier?.company_name}</span>!
              Preencha os valores abaixo.
            </p>
            {quotation?.valid_until && (
              <div className="flex items-center gap-2 text-yellow-500 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Válido até:{' '}
                  {new Date(quotation.valid_until).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Preços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_price" className="text-zinc-300">
                    Preço Total * (R$)
                  </Label>
                  <Input
                    id="total_price"
                    type="number"
                    step="0.01"
                    {...register('total_price', { valueAsNumber: true })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.total_price && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.total_price.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="daily_rate" className="text-zinc-300">
                    Taxa Diária (R$)
                  </Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    step="0.01"
                    {...register('daily_rate', { valueAsNumber: true })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_fee" className="text-zinc-300">
                    Taxa de Entrega (R$)
                  </Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    {...register('delivery_fee', { valueAsNumber: true })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="setup_fee" className="text-zinc-300">
                    Taxa de Montagem (R$)
                  </Label>
                  <Input
                    id="setup_fee"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    {...register('setup_fee', { valueAsNumber: true })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              {/* Detalhes */}
              <div>
                <Label htmlFor="payment_terms" className="text-zinc-300">
                  Condições de Pagamento
                </Label>
                <Textarea
                  id="payment_terms"
                  {...register('payment_terms')}
                  placeholder="Ex: 50% antecipado, 50% após entrega"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="delivery_details" className="text-zinc-300">
                  Detalhes de Entrega/Retirada
                </Label>
                <Textarea
                  id="delivery_details"
                  {...register('delivery_details')}
                  placeholder="Horário de entrega, necessidade de caminhão, etc"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-zinc-300">
                  Observações Adicionais
                </Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Informações importantes sobre o orçamento"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={4}
                />
              </div>

              {/* Botão de Envio */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-500 text-white"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Orçamento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
