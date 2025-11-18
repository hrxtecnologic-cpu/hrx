'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { SimpleCatalogItemsManager } from '@/components/admin/SimpleCatalogItemsManager';

const manualSupplierSchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
  contact_name: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cnpj: z.string().optional(),

  // Endereço
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Use sigla do estado'),

  // Observações
  notes: z.string().optional(),
});

type FormData = z.infer<typeof manualSupplierSchema>;

export function ManualSupplierForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogItems, setCatalogItems] = useState<Array<{ id: string; [key: string]: unknown }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(manualSupplierSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/suppliers/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: data.phone.replace(/\D/g, ''),
          cnpj: data.cnpj?.replace(/\D/g, ''),
          equipment_catalog: catalogItems.map(item => ({
            category: item.category,
            subcategory: item.subcategory,
            name: item.name,
            description: item.description,
            specifications: item.specifications.reduce((acc: Record<string, string>, spec: { key: string; value: string }) => {
              if (spec.key && spec.value) acc[spec.key] = spec.value;
              return acc;
            }, {}),
            pricing: {
              daily: item.pricing_daily ? parseFloat(item.pricing_daily) : undefined,
              weekly: item.pricing_weekly ? parseFloat(item.pricing_weekly) : undefined,
              monthly: item.pricing_monthly ? parseFloat(item.pricing_monthly) : undefined,
            },
            availability: {
              status: 'available',
              quantity: parseInt(item.quantity) || 1,
            },
            photos: item.photos || [], // Incluir fotos do equipamento
            is_active: true,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Erro da API:', {
          status: response.status,
          error: result.error,
          details: result.details,
          existing: result.existing,
        });

        // Mensagem mais detalhada para o usuário
        const errorMsg = result.error || 'Erro ao cadastrar fornecedor';
        const detailsMsg = result.details ? `\n${result.details}` : '';
        throw new Error(errorMsg + detailsMsg);
      }

      toast.success('✅ Fornecedor cadastrado com sucesso!');
      reset();
      setCatalogItems([]);
    } catch (error: unknown) {
      console.error('Erro ao cadastrar fornecedor:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar fornecedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados da Empresa */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Dados da Empresa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="company_name" className="text-zinc-300">
              Nome da Empresa *
            </Label>
            <Input
              id="company_name"
              {...register('company_name')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="Equipamentos XYZ"
            />
            {errors.company_name && (
              <p className="text-xs text-red-400 mt-1">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cnpj" className="text-zinc-300">
              CNPJ
            </Label>
            <Input
              id="cnpj"
              {...register('cnpj')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <Label htmlFor="contact_name" className="text-zinc-300">
              Nome do Contato *
            </Label>
            <Input
              id="contact_name"
              {...register('contact_name')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="João da Silva"
            />
            {errors.contact_name && (
              <p className="text-xs text-red-400 mt-1">{errors.contact_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-zinc-300">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="contato@empresa.com"
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className="text-zinc-300">
              Telefone *
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="(00) 00000-0000"
            />
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Localização */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Localização
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="text-zinc-300">
              Cidade *
            </Label>
            <Input
              id="city"
              {...register('city')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="São Paulo"
            />
            {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <Label htmlFor="state" className="text-zinc-300">
              Estado (UF) *
            </Label>
            <Input
              id="state"
              {...register('state')}
              className="bg-zinc-800 border-zinc-700 text-white uppercase mt-1"
              placeholder="SP"
              maxLength={2}
            />
            {errors.state && <p className="text-xs text-red-400 mt-1">{errors.state.message}</p>}
          </div>
        </div>
      </div>

      {/* Catálogo de Equipamentos */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Catálogo de Equipamentos (Opcional)
        </h3>
        <SimpleCatalogItemsManager items={catalogItems} onChange={setCatalogItems} />
      </div>

      {/* Observações */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Observações
        </h3>
        <Textarea
          id="notes"
          {...register('notes')}
          className="bg-zinc-800 border-zinc-700 text-white"
          placeholder="Informações adicionais sobre o fornecedor..."
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cadastrando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Cadastrar Fornecedor
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setCatalogItems([]);
          }}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Limpar Formulário
        </Button>
      </div>
    </form>
  );
}
