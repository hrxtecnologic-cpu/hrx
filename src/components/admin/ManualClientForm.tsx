'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { SimpleProfessionalsManager } from '@/components/admin/SimpleProfessionalsManager';
import { SimpleEquipmentManager } from '@/components/admin/SimpleEquipmentManager';

const manualClientSchema = z.object({
  // Dados do cliente
  client_name: z.string().min(3, 'Nome muito curto'),
  client_email: z.string().email('Email inválido'),
  client_phone: z.string().min(10, 'Telefone inválido'),
  client_company: z.string().optional(),

  // Dados do evento
  event_name: z.string().min(3, 'Nome do evento é obrigatório'),
  event_type: z.string().min(1, 'Tipo de evento é obrigatório'),
  event_description: z.string().min(10, 'Descrição muito curta'),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  expected_attendance: z.number().optional(),

  // Local
  venue_address: z.string().min(5, 'Endereço é obrigatório'),
  venue_city: z.string().min(2, 'Cidade é obrigatória'),
  venue_state: z.string().length(2, 'Use sigla do estado'),

  // Orçamento
  client_budget: z.number().positive('Orçamento deve ser positivo').optional(),
  is_urgent: z.boolean().default(false),

  // Observações
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof manualClientSchema>;

export function ManualClientForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professionalItems, setProfessionalItems] = useState<any[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(manualClientSchema),
    defaultValues: {
      is_urgent: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (professionalItems.length === 0) {
      toast.error('Adicione pelo menos um profissional');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/clients/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: data.client_phone.replace(/\D/g, ''),
          professionals: professionalItems,
          equipment: equipmentItems,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar cliente');
      }

      toast.success(`✅ Cliente e projeto cadastrados com sucesso! Projeto #${result.projectNumber}`);
      reset();
      setProfessionalItems([]);
      setEquipmentItems([]);
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast.error(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados do Cliente */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Dados do Cliente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="client_name" className="text-zinc-300">
              Nome Completo *
            </Label>
            <Input
              id="client_name"
              {...register('client_name')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="Maria Silva"
            />
            {errors.client_name && (
              <p className="text-xs text-red-400 mt-1">{errors.client_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="client_email" className="text-zinc-300">
              Email *
            </Label>
            <Input
              id="client_email"
              type="email"
              {...register('client_email')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="maria@email.com"
            />
            {errors.client_email && (
              <p className="text-xs text-red-400 mt-1">{errors.client_email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="client_phone" className="text-zinc-300">
              Telefone *
            </Label>
            <Input
              id="client_phone"
              {...register('client_phone')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="(00) 00000-0000"
            />
            {errors.client_phone && (
              <p className="text-xs text-red-400 mt-1">{errors.client_phone.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="client_company" className="text-zinc-300">
              Empresa (Opcional)
            </Label>
            <Input
              id="client_company"
              {...register('client_company')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="Empresa LTDA"
            />
          </div>
        </div>
      </div>

      {/* Dados do Evento */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Dados do Evento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="event_name" className="text-zinc-300">
              Nome do Evento *
            </Label>
            <Input
              id="event_name"
              {...register('event_name')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="Conferência Anual 2025"
            />
            {errors.event_name && (
              <p className="text-xs text-red-400 mt-1">{errors.event_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="event_type" className="text-zinc-300">
              Tipo de Evento *
            </Label>
            <Select onValueChange={(value) => setValue('event_type', value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1 [&>span]:text-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="Corporativo">Corporativo</SelectItem>
                <SelectItem value="Social">Social (Casamento, Festa)</SelectItem>
                <SelectItem value="Esportivo">Esportivo</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Educacional">Educacional</SelectItem>
                <SelectItem value="Religioso">Religioso</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.event_type && (
              <p className="text-xs text-red-400 mt-1">{errors.event_type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="event_date" className="text-zinc-300">
              Data do Evento
            </Label>
            <Input
              id="event_date"
              type="date"
              {...register('event_date')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="start_time" className="text-zinc-300">
              Horário de Início
            </Label>
            <Input
              id="start_time"
              type="time"
              {...register('start_time')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="expected_attendance" className="text-zinc-300">
              Público Esperado
            </Label>
            <Input
              id="expected_attendance"
              type="number"
              {...register('expected_attendance', { valueAsNumber: true })}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="100"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="event_description" className="text-zinc-300">
              Descrição do Evento *
            </Label>
            <Textarea
              id="event_description"
              {...register('event_description')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="Descreva o evento..."
              rows={3}
            />
            {errors.event_description && (
              <p className="text-xs text-red-400 mt-1">{errors.event_description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Local do Evento */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Local do Evento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="venue_address" className="text-zinc-300">
              Endereço *
            </Label>
            <Input
              id="venue_address"
              {...register('venue_address')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="Rua das Flores, 123"
            />
            {errors.venue_address && (
              <p className="text-xs text-red-400 mt-1">{errors.venue_address.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="venue_city" className="text-zinc-300">
              Cidade *
            </Label>
            <Input
              id="venue_city"
              {...register('venue_city')}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="São Paulo"
            />
            {errors.venue_city && (
              <p className="text-xs text-red-400 mt-1">{errors.venue_city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="venue_state" className="text-zinc-300">
              Estado (UF) *
            </Label>
            <Input
              id="venue_state"
              {...register('venue_state')}
              className="bg-zinc-800 border-zinc-700 text-white uppercase mt-1"
              placeholder="SP"
              maxLength={2}
            />
            {errors.venue_state && (
              <p className="text-xs text-red-400 mt-1">{errors.venue_state.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profissionais Necessários */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Profissionais Necessários *
        </h3>
        <SimpleProfessionalsManager items={professionalItems} onChange={setProfessionalItems} />
        {professionalItems.length === 0 && (
          <p className="text-xs text-yellow-400">
            ⚠️ Adicione pelo menos um profissional para continuar
          </p>
        )}
      </div>

      {/* Equipamentos Necessários */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Equipamentos Necessários (Opcional)
        </h3>
        <SimpleEquipmentManager items={equipmentItems} onChange={setEquipmentItems} />
      </div>

      {/* Orçamento e Urgência */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Orçamento e Urgência
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_budget" className="text-zinc-300">
              Orçamento do Cliente (R$)
            </Label>
            <Input
              id="client_budget"
              type="number"
              step="0.01"
              {...register('client_budget', { valueAsNumber: true })}
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
              placeholder="15000.00"
            />
          </div>

          <div className="flex items-center gap-2 pt-7">
            <Checkbox
              id="is_urgent"
              checked={watch('is_urgent')}
              onCheckedChange={(checked) => setValue('is_urgent', checked as boolean)}
              className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <Label htmlFor="is_urgent" className="text-zinc-300 cursor-pointer">
              Este evento é URGENTE
            </Label>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
          Observações Adicionais
        </h3>

        <Textarea
          id="additional_notes"
          {...register('additional_notes')}
          className="bg-zinc-800 border-zinc-700 text-white"
          placeholder="Informações adicionais sobre o evento..."
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || professionalItems.length === 0}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">Cadastrando...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cadastrar Cliente e Projeto</span>
              <span className="sm:hidden">Cadastrar</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setProfessionalItems([]);
            setEquipmentItems([]);
          }}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <span className="hidden sm:inline">Limpar Formulário</span>
          <span className="sm:hidden">Limpar</span>
        </Button>
      </div>
    </form>
  );
}
