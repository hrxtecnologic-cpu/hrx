'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateQuoteRequestData } from '@/types/quote';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';

// Schema de validação
const quoteItemSchema = z.object({
  item_type: z.enum(['equipment', 'professional', 'service', 'other']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  name: z.string().min(1, 'Nome do item é obrigatório'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantidade mínima é 1'),
  duration_days: z.number().min(1, 'Duração mínima é 1 dia'),
  specifications: z.any().optional(),
});

const quoteSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_email: z.string().email('Email inválido').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  event_date: z.string().optional(),
  event_type: z.string().optional(),
  event_location: z.string().optional(),
  description: z.string().optional(),
  is_urgent: z.boolean().default(false),
  items: z.array(quoteItemSchema).min(1, 'Adicione pelo menos um item'),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      is_urgent: false,
      items: [
        {
          item_type: 'equipment',
          category: '',
          subcategory: '',
          name: '',
          description: '',
          quantity: 1,
          duration_days: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const isUrgent = watch('is_urgent');

  // Adicionar novo item
  const handleAddItem = () => {
    append({
      item_type: 'equipment',
      category: '',
      subcategory: '',
      name: '',
      description: '',
      quantity: 1,
      duration_days: 1,
    });
  };

  // Submeter formulário
  const onSubmit = async (data: QuoteFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar orçamento');
      }

      const result = await response.json();
      toast.success('Orçamento criado com sucesso!');

      // Redirecionar para página de detalhes
      router.push(`/admin/orcamentos/${result.quote.id}`);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obter categorias disponíveis baseado no tipo
  const getAvailableCategories = (itemType: string) => {
    if (itemType === 'equipment') {
      return EQUIPMENT_CATEGORIES;
    }
    // Para outros tipos, retornar categorias genéricas
    return [
      { name: 'general', label: 'Geral', subtypes: [] },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold text-white">Novo Orçamento</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Criar uma nova solicitação de orçamento
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações do Cliente */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200">
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_name" className="text-sm font-medium text-zinc-200">
                Nome do Cliente *
              </Label>
              <Input
                id="client_name"
                {...register('client_name')}
                placeholder="Nome completo ou empresa"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
              {errors.client_name && (
                <p className="text-xs text-red-400 mt-1.5">{errors.client_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_email" className="text-sm font-medium text-zinc-200">
                  Email
                </Label>
                <Input
                  id="client_email"
                  type="email"
                  {...register('client_email')}
                  placeholder="email@exemplo.com"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
                {errors.client_email && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.client_email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="client_phone" className="text-sm font-medium text-zinc-200">
                  Telefone
                </Label>
                <Input
                  id="client_phone"
                  {...register('client_phone')}
                  placeholder="(00) 00000-0000"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Evento */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200">
              Informações do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_date" className="text-sm font-medium text-zinc-200">
                  Data do Evento
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  {...register('event_date')}
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
              </div>

              <div>
                <Label htmlFor="event_type" className="text-sm font-medium text-zinc-200">
                  Tipo de Evento
                </Label>
                <Input
                  id="event_type"
                  {...register('event_type')}
                  placeholder="Ex: Casamento, Feira, Show"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="event_location" className="text-sm font-medium text-zinc-200">
                Local do Evento
              </Label>
              <Input
                id="event_location"
                {...register('event_location')}
                placeholder="Endereço completo"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-zinc-200">
                Descrição / Observações
              </Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Informações adicionais sobre o evento"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            {/* Urgência */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="is_urgent"
                checked={isUrgent}
                onCheckedChange={(checked) => setValue('is_urgent', !!checked)}
                className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
              <label htmlFor="is_urgent" className="text-sm text-zinc-200 cursor-pointer">
                🚨 Marcar como URGENTE (margem de lucro de <strong className="text-red-400">80%</strong>)
              </label>
            </div>
            {!isUrgent && (
              <p className="text-xs text-zinc-500">
                Orçamentos normais têm margem de lucro de <strong className="text-green-400">35%</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Itens Solicitados */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-200">
                Itens Solicitados
              </CardTitle>
              <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-red-600 hover:border-red-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">Item #{index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => remove(index)}
                        className="border-red-600/30 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-zinc-400">Tipo de Item *</Label>
                      <Select
                        value={watch(`items.${index}.item_type`)}
                        onValueChange={(value: any) =>
                          setValue(`items.${index}.item_type`, value)
                        }
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="equipment">Equipamento</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="service">Serviço</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-zinc-400">Categoria *</Label>
                      <Select
                        value={watch(`items.${index}.category`)}
                        onValueChange={(value) =>
                          setValue(`items.${index}.category`, value)
                        }
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {getAvailableCategories(watch(`items.${index}.item_type`)).map(
                            (cat) => (
                              <SelectItem key={cat.name} value={cat.label}>
                                {cat.label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-400">Nome do Item *</Label>
                    <Input
                      {...register(`items.${index}.name` as const)}
                      placeholder="Ex: Caixa de Som JBL"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    />
                    {errors.items?.[index]?.name && (
                      <p className="text-xs text-red-400 mt-1">
                        {errors.items[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-400">Descrição</Label>
                    <Input
                      {...register(`items.${index}.description` as const)}
                      placeholder="Detalhes adicionais"
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-zinc-400">Quantidade *</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity` as const, {
                          valueAsNumber: true,
                        })}
                        min="1"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-red-400 mt-1">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-zinc-400">Duração (dias) *</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.duration_days` as const, {
                          valueAsNumber: true,
                        })}
                        min="1"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      />
                      {errors.items?.[index]?.duration_days && (
                        <p className="text-xs text-red-400 mt-1">
                          {errors.items[index]?.duration_days?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {errors.items && typeof errors.items.message === 'string' && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{errors.items.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo e Ações */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Margem de Lucro Estimada</p>
                <p className={`text-2xl font-bold ${isUrgent ? 'text-red-400' : 'text-green-400'}`}>
                  {isUrgent ? '80%' : '35%'}
                </p>
                {isUrgent && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Email de notificação urgente será enviado ao admin
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/orcamentos')}
                  className="border-white text-white hover:bg-zinc-700 hover:border-zinc-700"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[150px]"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Orçamento'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
