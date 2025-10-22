'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// Schema de validação
const teamMemberSchema = z.object({
  professional_id: z.string().optional(),
  external_name: z.string().optional(),
  role: z.string().min(1, 'Função é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  quantity: z.number().min(1).default(1),
  duration_days: z.number().min(1).default(1),
  daily_rate: z.number().optional(),
  notes: z.string().optional(),
});

const equipmentSchema = z.object({
  equipment_type: z.string().min(1, 'Tipo é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  quantity: z.number().min(1).default(1),
  duration_days: z.number().min(1).default(1),
  specifications: z.any().optional(),
  notes: z.string().optional(),
});

const projectSchema = z.object({
  // Cliente
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_email: z.string().email('Email inválido').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  client_company: z.string().optional(),
  client_cnpj: z.string().optional(),

  // Evento
  event_name: z.string().min(2, 'Nome do evento é obrigatório'),
  event_type: z.string().optional(),
  event_description: z.string().optional(),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  expected_attendance: z.number().optional(),

  // Localização
  venue_name: z.string().optional(),
  venue_address: z.string().min(3, 'Endereço é obrigatório'),
  venue_city: z.string().min(2, 'Cidade é obrigatória'),
  venue_state: z.string().min(2, 'Estado é obrigatório'),
  venue_zip: z.string().optional(),

  // Business
  is_urgent: z.boolean().default(false),
  budget_range: z.string().optional(),

  // Observações
  additional_notes: z.string().optional(),
  internal_notes: z.string().optional(),

  // Equipe e Equipamentos (opcionais)
  team: z.array(teamMemberSchema).optional(),
  equipment: z.array(equipmentSchema).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NovoProjetoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      is_urgent: false,
      team: [],
      equipment: [],
    },
  });

  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({
    control,
    name: 'team',
  });

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control,
    name: 'equipment',
  });

  const isUrgent = watch('is_urgent');

  // Submeter formulário
  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/event-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar projeto');
      }

      toast.success('Projeto criado com sucesso!');
      router.push(`/admin/projetos/${result.project.id}`);
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      toast.error(error.message || 'Erro ao criar projeto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Novo Projeto de Evento</h1>
          <p className="text-zinc-400">Criar projeto unificado com equipe e equipamentos</p>
        </div>
        <Link href="/admin/projetos">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados do Cliente */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name" className="text-zinc-300">
                  Nome do Cliente *
                </Label>
                <Input
                  id="client_name"
                  {...register('client_name')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Nome completo do cliente"
                />
                {errors.client_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.client_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="client_email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="client_email"
                  type="email"
                  {...register('client_email')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="email@exemplo.com"
                />
                {errors.client_email && (
                  <p className="text-xs text-red-500 mt-1">{errors.client_email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="client_phone" className="text-zinc-300">
                  Telefone
                </Label>
                <Input
                  id="client_phone"
                  {...register('client_phone')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label htmlFor="client_company" className="text-zinc-300">
                  Empresa
                </Label>
                <Input
                  id="client_company"
                  {...register('client_company')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <Label htmlFor="client_cnpj" className="text-zinc-300">
                  CNPJ
                </Label>
                <Input
                  id="client_cnpj"
                  {...register('client_cnpj')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Evento */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Dados do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="event_name" className="text-zinc-300">
                  Nome do Evento *
                </Label>
                <Input
                  id="event_name"
                  {...register('event_name')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Nome do evento"
                />
                {errors.event_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.event_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="event_type" className="text-zinc-300">
                  Tipo de Evento
                </Label>
                <Select
                  onValueChange={(value) => setValue('event_type', value)}
                  defaultValue=""
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="Corporativo">Corporativo</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Esportivo">Esportivo</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Educacional">Educacional</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event_date" className="text-zinc-300">
                  Data do Evento
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  {...register('event_date')}
                  className="bg-zinc-950 border-zinc-800 text-white"
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
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              <div>
                <Label htmlFor="end_time" className="text-zinc-300">
                  Horário de Término
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register('end_time')}
                  className="bg-zinc-950 border-zinc-800 text-white"
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
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Número de pessoas"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="event_description" className="text-zinc-300">
                  Descrição do Evento
                </Label>
                <Textarea
                  id="event_description"
                  {...register('event_description')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Descreva o evento..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Localização do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="venue_name" className="text-zinc-300">
                  Nome do Local
                </Label>
                <Input
                  id="venue_name"
                  {...register('venue_name')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Nome do local do evento"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="venue_address" className="text-zinc-300">
                  Endereço *
                </Label>
                <Input
                  id="venue_address"
                  {...register('venue_address')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Rua, número, complemento"
                />
                {errors.venue_address && (
                  <p className="text-xs text-red-500 mt-1">{errors.venue_address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="venue_city" className="text-zinc-300">
                  Cidade *
                </Label>
                <Input
                  id="venue_city"
                  {...register('venue_city')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Cidade"
                />
                {errors.venue_city && (
                  <p className="text-xs text-red-500 mt-1">{errors.venue_city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="venue_state" className="text-zinc-300">
                  Estado *
                </Label>
                <Input
                  id="venue_state"
                  {...register('venue_state')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="UF"
                  maxLength={2}
                />
                {errors.venue_state && (
                  <p className="text-xs text-red-500 mt-1">{errors.venue_state.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="venue_zip" className="text-zinc-300">
                  CEP
                </Label>
                <Input
                  id="venue_zip"
                  {...register('venue_zip')}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Projeto */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Configurações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_urgent"
                checked={isUrgent}
                onCheckedChange={(checked) => setValue('is_urgent', checked as boolean)}
                className="border-zinc-700"
              />
              <Label htmlFor="is_urgent" className="text-zinc-300 cursor-pointer">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Projeto URGENTE (margem de lucro 80%)</span>
                </div>
              </Label>
            </div>

            {isUrgent && (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
                <p className="text-sm text-red-400">
                  ⚠️ Este projeto será marcado como URGENTE e terá margem de lucro de 80% ao
                  invés dos 35% padrão. Um email será enviado automaticamente ao administrador.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="budget_range" className="text-zinc-300">
                Faixa de Orçamento
              </Label>
              <Input
                id="budget_range"
                {...register('budget_range')}
                className="bg-zinc-950 border-zinc-800 text-white"
                placeholder="Ex: R$ 50.000 - R$ 100.000"
              />
            </div>

            <div>
              <Label htmlFor="additional_notes" className="text-zinc-300">
                Observações do Cliente
              </Label>
              <Textarea
                id="additional_notes"
                {...register('additional_notes')}
                className="bg-zinc-950 border-zinc-800 text-white"
                placeholder="Observações e requisitos do cliente..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="internal_notes" className="text-zinc-300">
                Notas Internas
              </Label>
              <Textarea
                id="internal_notes"
                {...register('internal_notes')}
                className="bg-zinc-950 border-zinc-800 text-white"
                placeholder="Notas internas (não visíveis ao cliente)..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Equipe (Opcional) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Equipe (Opcional)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendTeam({
                    role: '',
                    category: '',
                    quantity: 1,
                    duration_days: 1,
                  })
                }
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teamFields.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">
                Nenhum membro adicionado. Você pode adicionar depois.
              </p>
            ) : (
              <div className="space-y-4">
                {teamFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">
                        Membro #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeam(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-zinc-400 text-xs">Função *</Label>
                        <Input
                          {...register(`team.${index}.role`)}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          placeholder="Ex: Fotógrafo, Cinegrafista"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Categoria *</Label>
                        <Input
                          {...register(`team.${index}.category`)}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          placeholder="Ex: Audiovisual"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          {...register(`team.${index}.quantity`, { valueAsNumber: true })}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          min={1}
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Duração (dias)</Label>
                        <Input
                          type="number"
                          {...register(`team.${index}.duration_days`, { valueAsNumber: true })}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          min={1}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipamentos (Opcional) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Equipamentos (Opcional)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendEquipment({
                    equipment_type: 'rental',
                    category: '',
                    name: '',
                    quantity: 1,
                    duration_days: 1,
                  })
                }
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Equipamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {equipmentFields.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">
                Nenhum equipamento adicionado. Você pode adicionar depois.
              </p>
            ) : (
              <div className="space-y-4">
                {equipmentFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">
                        Equipamento #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEquipment(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-zinc-400 text-xs">Nome *</Label>
                        <Input
                          {...register(`equipment.${index}.name`)}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          placeholder="Ex: Projetor 10.000 lumens"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Categoria *</Label>
                        <Input
                          {...register(`equipment.${index}.category`)}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          placeholder="Ex: Audiovisual"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Tipo *</Label>
                        <Select
                          onValueChange={(value) =>
                            setValue(`equipment.${index}.equipment_type`, value)
                          }
                          defaultValue="rental"
                        >
                          <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white text-sm">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="rental">Aluguel</SelectItem>
                            <SelectItem value="purchase">Compra</SelectItem>
                            <SelectItem value="service">Serviço</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          {...register(`equipment.${index}.quantity`, { valueAsNumber: true })}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          min={1}
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-400 text-xs">Duração (dias)</Label>
                        <Input
                          type="number"
                          {...register(`equipment.${index}.duration_days`, {
                            valueAsNumber: true,
                          })}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          min={1}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-zinc-400 text-xs">Descrição</Label>
                        <Textarea
                          {...register(`equipment.${index}.description`)}
                          className="bg-zinc-950 border-zinc-800 text-white text-sm"
                          placeholder="Especificações e detalhes..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4 sticky bottom-0 bg-zinc-950/95 backdrop-blur p-4 rounded-lg border border-zinc-800">
          <Link href="/admin/projetos">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Projeto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
