'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

const quotationResponseSchema = z.object({
  supplier_price: z.string().min(1, 'Preço é obrigatório'),
  supplier_notes: z.string().optional(),
  availability_confirmed: z.boolean().default(true),
  delivery_date: z.string().optional(),
  pickup_date: z.string().optional(),
});

type QuotationResponseData = z.infer<typeof quotationResponseSchema>;

interface QuotationDetails {
  id: string;
  status: string;
  supplier_price?: number;
  supplier_notes?: string;
  hrx_price?: number;
  availability_confirmed?: boolean;
  delivery_date?: string;
  pickup_date?: string;
  created_at: string;
  event_projects: {
    project_number: string;
    event_name: string;
    event_description?: string;
    event_date: string;
    event_type: string;
    client_name: string;
    venue_name?: string;
    venue_city?: string;
  };
  project_equipment: {
    equipment_type: string;
    quantity: number;
    duration_days: number;
    specific_requirements?: string;
  };
}

export default function SupplierQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<QuotationResponseData>({
    resolver: zodResolver(quotationResponseSchema),
  });

  const watchPrice = watch('supplier_price');

  useEffect(() => {
    if (quotationId) {
      loadQuotation();
    }
  }, [quotationId]);

  async function loadQuotation() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/supplier/quotations/${quotationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar cotação');
      }

      const data = await response.json();
      setQuotation(data.quotation);

      // Se já foi respondida, preencher formulário
      if (data.quotation.supplier_price) {
        setValue('supplier_price', data.quotation.supplier_price.toString());
        setValue('supplier_notes', data.quotation.supplier_notes || '');
        setValue('availability_confirmed', data.quotation.availability_confirmed ?? true);
        setValue('delivery_date', data.quotation.delivery_date || '');
        setValue('pickup_date', data.quotation.pickup_date || '');
      }
    } catch (err: any) {
      console.error('Erro ao carregar cotação:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: QuotationResponseData) {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/suppliers/quotations/${quotationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_price: parseFloat(data.supplier_price),
          supplier_notes: data.supplier_notes,
          availability_confirmed: data.availability_confirmed,
          delivery_date: data.delivery_date || null,
          pickup_date: data.pickup_date || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar resposta');
      }

      alert('Cotação enviada com sucesso!');
      router.push('/supplier/dashboard');
    } catch (err: any) {
      console.error('Erro ao enviar cotação:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: { label: 'Aguardando', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
      sent: { label: 'Enviado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: FileText },
      received: { label: 'Recebido', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
      accepted: { label: 'Aceito', color: 'bg-green-600/10 text-green-600 border-green-600/20', icon: CheckCircle },
      rejected: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando cotação...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-zinc-900 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-red-500 mb-2">Erro ao Carregar Cotação</h2>
                  <p className="text-zinc-300">{error || 'Cotação não encontrada'}</p>
                  <Link href="/supplier/dashboard">
                    <Button className="mt-4 bg-red-600 hover:bg-red-700">
                      Voltar ao Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canRespond = quotation.status === 'pending' || quotation.status === 'sent';

  return (
    <div className="min-h-screen bg-zinc-950 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/supplier/dashboard">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 mb-3">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Detalhes da Cotação</h1>
            <p className="text-zinc-400">
              Projeto #{quotation.event_projects.project_number}
            </p>
          </div>
          {getStatusBadge(quotation.status)}
        </div>

        {/* Informações do Evento */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-500" />
              Informações do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Nome do Evento</p>
                <p className="text-base text-white font-medium">{quotation.event_projects.event_name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Tipo</p>
                <p className="text-base text-white">{quotation.event_projects.event_type}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Cliente</p>
                <p className="text-base text-white">{quotation.event_projects.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Data do Evento</p>
                <p className="text-base text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {formatDate(quotation.event_projects.event_date)}
                </p>
              </div>
              {quotation.event_projects.venue_name && (
                <div className="md:col-span-2">
                  <p className="text-sm text-zinc-500">Local</p>
                  <p className="text-base text-white">
                    {quotation.event_projects.venue_name}
                    {quotation.event_projects.venue_city && ` - ${quotation.event_projects.venue_city}`}
                  </p>
                </div>
              )}
            </div>

            {quotation.event_projects.event_description && (
              <div>
                <p className="text-sm text-zinc-500">Descrição do Evento</p>
                <p className="text-base text-zinc-300">{quotation.event_projects.event_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalhes do Equipamento */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Equipamento Solicitado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Tipo de Equipamento</p>
                <p className="text-lg text-white font-medium">{quotation.project_equipment.equipment_type}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Quantidade</p>
                <p className="text-lg text-white font-medium">{quotation.project_equipment.quantity}x</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Duração</p>
                <p className="text-lg text-white font-medium">{quotation.project_equipment.duration_days} dia(s)</p>
              </div>
            </div>

            {quotation.project_equipment.specific_requirements && (
              <div className="mt-4">
                <p className="text-sm text-zinc-500">Requisitos Específicos</p>
                <p className="text-base text-zinc-300">{quotation.project_equipment.specific_requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Resposta */}
        {canRespond ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Sua Cotação
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Preencha os dados abaixo para responder esta solicitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="supplier_price" className="text-sm font-medium text-zinc-200">
                    Preço Total (R$) *
                  </Label>
                  <Input
                    id="supplier_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('supplier_price')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                  {errors.supplier_price && (
                    <p className="text-red-500 text-sm mt-1">{errors.supplier_price.message}</p>
                  )}
                  {watchPrice && (
                    <p className="text-sm text-zinc-400 mt-1">
                      Valor: {formatCurrency(parseFloat(watchPrice) || 0)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery_date" className="text-sm font-medium text-zinc-200">
                      Data de Entrega
                    </Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      {...register('delivery_date')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pickup_date" className="text-sm font-medium text-zinc-200">
                      Data de Retirada
                    </Label>
                    <Input
                      id="pickup_date"
                      type="date"
                      {...register('pickup_date')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier_notes" className="text-sm font-medium text-zinc-200">
                    Observações
                  </Label>
                  <Textarea
                    id="supplier_notes"
                    rows={4}
                    placeholder="Informações adicionais sobre sua cotação, condições de pagamento, etc."
                    {...register('supplier_notes')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Link href="/supplier/dashboard" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-zinc-700 text-zinc-300"
                    >
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Cotação'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Cotação Respondida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Preço Cotado</p>
                  <p className="text-xl text-white font-bold">
                    {formatCurrency(quotation.supplier_price || 0)}
                  </p>
                </div>
                {quotation.hrx_price && (
                  <div>
                    <p className="text-sm text-zinc-500">Preço Final (HRX)</p>
                    <p className="text-xl text-white font-bold">
                      {formatCurrency(quotation.hrx_price)}
                    </p>
                  </div>
                )}
              </div>

              {quotation.supplier_notes && (
                <div>
                  <p className="text-sm text-zinc-500">Observações</p>
                  <p className="text-base text-zinc-300">{quotation.supplier_notes}</p>
                </div>
              )}

              <Link href="/supplier/dashboard">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
