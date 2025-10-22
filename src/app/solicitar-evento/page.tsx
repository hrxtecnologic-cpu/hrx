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
import {
  Calendar,
  MapPin,
  Building2,
  Mail,
  Phone,
  Send,
  Loader2,
  ChevronDown,
  Users,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';
import { CATEGORIES_WITH_SUBCATEGORIES } from '@/lib/categories-subcategories';

// Schema para profissional
const professionalSchema = z.object({
  category_group: z.string().min(1, 'Selecione a categoria principal'),
  category: z.string().min(1, 'Selecione a subcategoria'),
  quantity: z.number().min(1, 'Mínimo 1'),
  requirements: z.string().optional(),
});

// Schema completo do formulário
const eventRequestSchema = z.object({
  // Cliente
  client_name: z.string().min(2, 'Nome é obrigatório'),
  client_email: z.string().email('Email inválido'),
  client_phone: z.string().min(10, 'Telefone é obrigatório'),
  client_company: z.string().optional(),
  client_cnpj: z.string().optional(),

  // Evento
  event_name: z.string().min(3, 'Nome do evento é obrigatório'),
  event_type: z.string().min(1, 'Tipo de evento é obrigatório'),
  event_description: z.string().min(10, 'Descreva seu evento (mínimo 10 caracteres)'),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  expected_attendance: z.number().optional(),

  // Localização
  venue_name: z.string().optional(),
  venue_address: z.string().min(5, 'Endereço é obrigatório'),
  venue_city: z.string().min(2, 'Cidade é obrigatória'),
  venue_state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  venue_zip: z.string().optional(),

  // Profissionais
  professionals: z.array(professionalSchema).min(1, 'Adicione pelo menos um profissional'),

  // Equipamentos
  equipment_types: z.array(z.string()).optional(),
  equipment_notes: z.string().optional(),

  // Urgência e Orçamento
  is_urgent: z.boolean().default(false),
  budget_range: z.string().optional(),

  // Observações
  additional_notes: z.string().optional(),
});

type EventRequestFormData = z.infer<typeof eventRequestSchema>;

export default function SolicitarEventoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EventRequestFormData>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      professionals: [{ category_group: '', category: '', quantity: 1, requirements: '' }],
      equipment_types: [],
      is_urgent: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'professionals',
  });

  const isUrgent = watch('is_urgent');

  // Toggle categoria do acordeão
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Toggle equipamento
  const toggleEquipment = (equipment: string) => {
    const updated = selectedEquipment.includes(equipment)
      ? selectedEquipment.filter((e) => e !== equipment)
      : [...selectedEquipment, equipment];
    setSelectedEquipment(updated);
    setValue('equipment_types', updated);
  };

  // Contar equipamentos selecionados por categoria
  const getSelectedCountByCategory = (categoryName: string): number => {
    const category = EQUIPMENT_CATEGORIES.find((c) => c.name === categoryName);
    if (!category) return 0;
    return category.subtypes.filter((s) => selectedEquipment.includes(s.value)).length;
  };

  const onSubmit = async (data: EventRequestFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar solicitação');
      }

      toast.success('Solicitação enviada com sucesso!');
      router.push('/solicitar-evento/sucesso');
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error(error.message || 'Erro ao enviar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Solicite seu Evento Completo
          </h1>
          <p className="text-lg text-zinc-300">
            Preencha o formulário detalhado e receba uma proposta personalizada com equipe e
            equipamentos
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Seus Dados */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="client_name" className="text-sm font-medium text-zinc-200">
                    Nome Completo *
                  </Label>
                  <Input
                    id="client_name"
                    {...register('client_name')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Seu nome completo"
                  />
                  {errors.client_name && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.client_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_email" className="text-sm font-medium text-zinc-200">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </Label>
                  <Input
                    id="client_email"
                    type="email"
                    {...register('client_email')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="seu@email.com"
                  />
                  {errors.client_email && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.client_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_phone" className="text-sm font-medium text-zinc-200">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone/WhatsApp *
                  </Label>
                  <Input
                    id="client_phone"
                    {...register('client_phone')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.client_phone && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.client_phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_company" className="text-sm font-medium text-zinc-200">
                    Empresa
                  </Label>
                  <Input
                    id="client_company"
                    {...register('client_company')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Nome da empresa (opcional)"
                  />
                </div>

                <div>
                  <Label htmlFor="client_cnpj" className="text-sm font-medium text-zinc-200">
                    CNPJ
                  </Label>
                  <Input
                    id="client_cnpj"
                    {...register('client_cnpj')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="00.000.000/0000-00 (opcional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Evento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Sobre o Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="event_name" className="text-sm font-medium text-zinc-200">
                    Nome do Evento *
                  </Label>
                  <Input
                    id="event_name"
                    {...register('event_name')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Ex: Conferência Anual de Tecnologia 2025"
                  />
                  {errors.event_name && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.event_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="event_type" className="text-sm font-medium text-zinc-200">
                    Tipo de Evento *
                  </Label>
                  <Select onValueChange={(value) => setValue('event_type', value)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2 [&>span]:text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="Corporativo">Corporativo</SelectItem>
                      <SelectItem value="Social">Social (Casamento, Festa, etc)</SelectItem>
                      <SelectItem value="Esportivo">Esportivo</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Educacional">Educacional</SelectItem>
                      <SelectItem value="Religioso">Religioso</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.event_type && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.event_type.message}</p>
                  )}
                </div>

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
                  <Label htmlFor="start_time" className="text-sm font-medium text-zinc-200">
                    Horário de Início
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...register('start_time')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="end_time" className="text-sm font-medium text-zinc-200">
                    Horário de Término
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    {...register('end_time')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="expected_attendance" className="text-sm font-medium text-zinc-200">
                    Público Esperado
                  </Label>
                  <Input
                    id="expected_attendance"
                    type="number"
                    {...register('expected_attendance', { valueAsNumber: true })}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Número de pessoas"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="event_description" className="text-sm font-medium text-zinc-200">
                    Descrição do Evento *
                  </Label>
                  <Textarea
                    id="event_description"
                    {...register('event_description')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Descreva seu evento: objetivo, atividades planejadas, necessidades específicas..."
                    rows={4}
                  />
                  {errors.event_description && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.event_description.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Local do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="venue_name" className="text-sm font-medium text-zinc-200">
                    Nome do Local
                  </Label>
                  <Input
                    id="venue_name"
                    {...register('venue_name')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Ex: Centro de Convenções, Hotel (opcional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="venue_address" className="text-sm font-medium text-zinc-200">
                    Endereço *
                  </Label>
                  <Input
                    id="venue_address"
                    {...register('venue_address')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Rua, número, complemento"
                  />
                  {errors.venue_address && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.venue_address.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="venue_city" className="text-sm font-medium text-zinc-200">
                    Cidade *
                  </Label>
                  <Input
                    id="venue_city"
                    {...register('venue_city')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="Cidade"
                  />
                  {errors.venue_city && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.venue_city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="venue_state" className="text-sm font-medium text-zinc-200">
                    Estado (UF) *
                  </Label>
                  <Input
                    id="venue_state"
                    {...register('venue_state')}
                    className="bg-zinc-800 border-zinc-700 text-white uppercase mt-2"
                    placeholder="Ex: SP"
                    maxLength={2}
                  />
                  {errors.venue_state && (
                    <p className="text-xs text-red-400 mt-1.5">{errors.venue_state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="venue_zip" className="text-sm font-medium text-zinc-200">
                    CEP
                  </Label>
                  <Input
                    id="venue_zip"
                    {...register('venue_zip')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    placeholder="00000-000 (opcional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profissionais Necessários */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-600" />
                  Profissionais Necessários *
                </CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => append({ category_group: '', category: '', quantity: 1, requirements: '' })}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-zinc-200">Categoria *</Label>
                        <Select
                          value={watch(`professionals.${index}.category_group`) || ''}
                          onValueChange={(value) => {
                            setValue(`professionals.${index}.category_group`, value);
                            setValue(`professionals.${index}.category`, ''); // Limpa subcategoria
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                            <SelectValue placeholder="Ex: Produção e Coordenação" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            {CATEGORIES_WITH_SUBCATEGORIES.map((category) => (
                              <SelectItem key={category.name} value={category.name}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-zinc-200">Função *</Label>
                        <Select
                          value={watch(`professionals.${index}.category`) || ''}
                          onValueChange={(value) =>
                            setValue(`professionals.${index}.category`, value)
                          }
                          disabled={!watch(`professionals.${index}.category_group`)}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white disabled:opacity-50">
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            {watch(`professionals.${index}.category_group`) &&
                              CATEGORIES_WITH_SUBCATEGORIES.find(
                                (cat) => cat.name === watch(`professionals.${index}.category_group`)
                              )?.subcategories.map((subcat) => (
                                <SelectItem key={subcat.name} value={subcat.label}>
                                  {subcat.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-zinc-200">Quantidade *</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`professionals.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-zinc-200">Requisitos</Label>
                        <Input
                          {...register(`professionals.${index}.requirements`)}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="Ex: Experiência 5 anos"
                        />
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => remove(index)}
                        className="border-red-600/30 text-red-400 hover:bg-red-600/10 mt-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {errors.professionals && (
                <p className="text-xs text-red-400">{errors.professionals.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Equipamentos Necessários */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-red-600" />
                Equipamentos Necessários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300 mb-4">
                Selecione os equipamentos que você precisa para o evento
              </p>

              <div className="space-y-2">
                {EQUIPMENT_CATEGORIES.map((category) => {
                  const isExpanded = expandedCategories.has(category.name);
                  const selectedCount = getSelectedCountByCategory(category.name);

                  return (
                    <div
                      key={category.name}
                      className="border border-zinc-800 bg-zinc-800/50 rounded-md overflow-hidden"
                    >
                      {/* Header da categoria */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-zinc-400 transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                          />
                          <span className="text-sm font-medium text-zinc-200">
                            {category.label}
                          </span>
                        </div>
                        {selectedCount > 0 && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                            {selectedCount} selecionado(s)
                          </span>
                        )}
                      </button>

                      {/* Conteúdo expandido */}
                      {isExpanded && (
                        <div className="px-4 py-3 space-y-2 bg-zinc-900/50 border-t border-zinc-800">
                          {category.subtypes.map((subtype) => (
                            <div key={subtype.label} className="flex items-center gap-2">
                              <Checkbox
                                id={`equipment-${subtype.label}`}
                                checked={selectedEquipment.includes(subtype.label)}
                                onCheckedChange={() => toggleEquipment(subtype.label)}
                                className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                              />
                              <Label
                                htmlFor={`equipment-${subtype.label}`}
                                className="text-sm font-medium text-zinc-200 cursor-pointer"
                              >
                                {subtype.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedEquipment.length > 0 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">
                    ✓ {selectedEquipment.length} equipamento(s) selecionado(s)
                  </p>
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="equipment_notes" className="text-sm font-medium text-zinc-200">
                  Observações sobre Equipamentos
                </Label>
                <Textarea
                  id="equipment_notes"
                  {...register('equipment_notes')}
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  placeholder="Especificações técnicas, quantidades estimadas, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Urgência e Orçamento */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                Orçamento e Urgência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budget_range" className="text-sm font-medium text-zinc-200">
                  Faixa de Orçamento
                </Label>
                <Select onValueChange={(value) => setValue('budget_range', value)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2 [&>span]:text-white">
                    <SelectValue placeholder="Selecione uma faixa" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="Até R$ 10.000">Até R$ 10.000</SelectItem>
                    <SelectItem value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</SelectItem>
                    <SelectItem value="R$ 25.000 - R$ 50.000">R$ 25.000 - R$ 50.000</SelectItem>
                    <SelectItem value="R$ 50.000 - R$ 100.000">
                      R$ 50.000 - R$ 100.000
                    </SelectItem>
                    <SelectItem value="Acima de R$ 100.000">Acima de R$ 100.000</SelectItem>
                    <SelectItem value="Não sei informar">Não sei informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_urgent"
                  checked={isUrgent}
                  onCheckedChange={(checked) => setValue('is_urgent', checked as boolean)}
                  className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <Label htmlFor="is_urgent" className="text-sm font-medium text-zinc-200 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Este evento é URGENTE (menos de 7 dias)</span>
                  </div>
                </Label>
              </div>

              {isUrgent && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
                  <p className="text-sm text-red-400">
                    ⚠️ Eventos urgentes podem ter valores diferenciados devido ao prazo reduzido.
                    Nossa equipe priorizará sua solicitação.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações Adicionais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="additional_notes"
                {...register('additional_notes')}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Alguma informação adicional que queira compartilhar? Necessidades especiais, preferências, etc."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Botão de Enviar */}
          <div className="flex flex-col items-center gap-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-12 py-6 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Solicitação Completa
                </>
              )}
            </Button>

            <p className="text-sm text-zinc-400 text-center max-w-md">
              Ao enviar, nossa equipe analisará todos os detalhes e preparará uma proposta completa
              com equipe, equipamentos e orçamento detalhado.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
