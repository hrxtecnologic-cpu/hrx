'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  requestSchema,
  type RequestFormData,
  EVENT_TYPES,
  PROFESSIONAL_CATEGORIES,
  EQUIPMENT_OPTIONS,
  BUDGET_RANGES,
  URGENCY_LEVELS,
} from '@/lib/validations/contractor';
import { formatCNPJ, formatPhone } from '@/lib/format';
import { Building2, Calendar, MapPin, Users, Package, DollarSign, Plus, Trash2 } from 'lucide-react';

export default function SolicitarEquipePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      professionalsNeeded: [{ category: 'Segurança' as any, quantity: 1, shift: '', requirements: '' }],
      needsEquipment: false,
      equipmentList: [],
      urgency: 'normal',
      acceptsTerms: false,
      acceptsWhatsApp: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'professionalsNeeded',
  });

  const selectedEquipment = watch('equipmentList') || [];

  const onSubmit = async (data: RequestFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar solicitação');
      }

      const result = await response.json();

      // Redireciona para página de sucesso
      router.push(`/solicitar-equipe/sucesso?request=${result.requestNumber}`);
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
            <span className="text-red-500 font-semibold text-sm">Solicitação de Equipe</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Monte sua equipe perfeita
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Preencha o formulário abaixo e nossa equipe entrará em contato em até 2 horas
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 1. DADOS DA EMPRESA */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Dados da Empresa</CardTitle>
              <CardDescription className="text-zinc-400">
                Informações sobre sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Razão Social */}
              <div>
                <Label htmlFor="companyName" className="text-zinc-300 mb-2 block">
                  Razão Social / Nome da Empresa *
                </Label>
                <Input
                  id="companyName"
                  {...register('companyName')}
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  placeholder="Ex: HRX Eventos Ltda"
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-2">{errors.companyName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CNPJ */}
                <div>
                  <Label htmlFor="cnpj" className="text-zinc-300 mb-2 block">
                    CNPJ *
                  </Label>
                  <Input
                    id="cnpj"
                    {...register('cnpj')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => {
                      const formatted = formatCNPJ(e.target.value);
                      setValue('cnpj', formatted);
                    }}
                    maxLength={18}
                  />
                  {errors.cnpj && (
                    <p className="text-red-500 text-sm mt-2">{errors.cnpj.message}</p>
                  )}
                </div>

                {/* Nome do Responsável */}
                <div>
                  <Label htmlFor="responsibleName" className="text-zinc-300 mb-2 block">
                    Nome do Responsável *
                  </Label>
                  <Input
                    id="responsibleName"
                    {...register('responsibleName')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Ex: João Silva"
                  />
                  {errors.responsibleName && (
                    <p className="text-red-500 text-sm mt-2">{errors.responsibleName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cargo */}
                <div>
                  <Label htmlFor="responsibleRole" className="text-zinc-300 mb-2 block">
                    Cargo do Responsável
                  </Label>
                  <Input
                    id="responsibleRole"
                    {...register('responsibleRole')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Ex: Gerente de Eventos"
                  />
                  {errors.responsibleRole && (
                    <p className="text-red-500 text-sm mt-2">{errors.responsibleRole.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-zinc-300 mb-2 block">
                    Email Corporativo *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="contato@empresa.com.br"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Telefone */}
                <div>
                  <Label htmlFor="phone" className="text-zinc-300 mb-2 block">
                    Telefone / WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('phone', formatted);
                    }}
                    maxLength={15}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-2">{errors.phone.message}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-zinc-300 mb-2 block">
                    Website
                  </Label>
                  <Input
                    id="website"
                    {...register('website')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="https://www.empresa.com.br"
                  />
                  {errors.website && (
                    <p className="text-red-500 text-sm mt-2">{errors.website.message}</p>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div>
                <Label htmlFor="companyAddress" className="text-zinc-300 mb-2 block">
                  Endereço da Empresa
                </Label>
                <Textarea
                  id="companyAddress"
                  {...register('companyAddress')}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                  placeholder="Rua, número, bairro, cidade - UF"
                  rows={2}
                />
                {errors.companyAddress && (
                  <p className="text-red-500 text-sm mt-2">{errors.companyAddress.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. DADOS DO EVENTO */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Dados do Evento</CardTitle>
              <CardDescription className="text-zinc-400">
                Informações sobre o evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome do Evento */}
              <div>
                <Label htmlFor="eventName" className="text-zinc-300 mb-2 block">
                  Nome do Evento *
                </Label>
                <Input
                  id="eventName"
                  {...register('eventName')}
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  placeholder="Ex: Festival de Música 2025"
                />
                {errors.eventName && (
                  <p className="text-red-500 text-sm mt-2">{errors.eventName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Evento */}
                <div>
                  <Label htmlFor="eventType" className="text-zinc-300 mb-2 block">
                    Tipo de Evento *
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('eventType', value as any)}
                    defaultValue={watch('eventType')}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.eventType && (
                    <p className="text-red-500 text-sm mt-2">{errors.eventType.message}</p>
                  )}
                </div>

                {/* Público Esperado */}
                <div>
                  <Label htmlFor="expectedAttendance" className="text-zinc-300 mb-2 block">
                    Público Esperado
                  </Label>
                  <Input
                    id="expectedAttendance"
                    type="number"
                    {...register('expectedAttendance')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Ex: 5000"
                  />
                  {errors.expectedAttendance && (
                    <p className="text-red-500 text-sm mt-2">{errors.expectedAttendance.message}</p>
                  )}
                </div>
              </div>

              {/* Tipo Outro (se selecionou "Outro") */}
              {watch('eventType') === 'Outro' && (
                <div>
                  <Label htmlFor="eventTypeOther" className="text-zinc-300 mb-2 block">
                    Especifique o tipo
                  </Label>
                  <Input
                    id="eventTypeOther"
                    {...register('eventTypeOther')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Descreva o tipo de evento"
                  />
                </div>
              )}

              {/* Descrição do Evento */}
              <div>
                <Label htmlFor="eventDescription" className="text-zinc-300 mb-2 block">
                  Descrição do Evento
                </Label>
                <Textarea
                  id="eventDescription"
                  {...register('eventDescription')}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                  placeholder="Descreva brevemente o evento, suas características principais..."
                  rows={3}
                />
                {errors.eventDescription && (
                  <p className="text-red-500 text-sm mt-2">{errors.eventDescription.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. LOCAL DO EVENTO */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Local do Evento</CardTitle>
              <CardDescription className="text-zinc-400">
                Onde o evento acontecerá
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome do Local */}
              <div>
                <Label htmlFor="venueName" className="text-zinc-300 mb-2 block">
                  Nome do Local
                </Label>
                <Input
                  id="venueName"
                  {...register('venueName')}
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  placeholder="Ex: Centro de Convenções"
                />
                {errors.venueName && (
                  <p className="text-red-500 text-sm mt-2">{errors.venueName.message}</p>
                )}
              </div>

              {/* Endereço Completo */}
              <div>
                <Label htmlFor="venueAddress" className="text-zinc-300 mb-2 block">
                  Endereço Completo do Local *
                </Label>
                <Textarea
                  id="venueAddress"
                  {...register('venueAddress')}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                  placeholder="Rua, número, bairro, cidade - UF"
                  rows={2}
                />
                {errors.venueAddress && (
                  <p className="text-red-500 text-sm mt-2">{errors.venueAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cidade */}
                <div>
                  <Label htmlFor="venueCity" className="text-zinc-300 mb-2 block">
                    Cidade *
                  </Label>
                  <Input
                    id="venueCity"
                    {...register('venueCity')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Ex: Rio de Janeiro"
                  />
                  {errors.venueCity && (
                    <p className="text-red-500 text-sm mt-2">{errors.venueCity.message}</p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <Label htmlFor="venueState" className="text-zinc-300 mb-2 block">
                    Estado (UF) *
                  </Label>
                  <Input
                    id="venueState"
                    {...register('venueState')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Ex: RJ"
                    maxLength={2}
                    onChange={(e) => setValue('venueState', e.target.value.toUpperCase())}
                  />
                  {errors.venueState && (
                    <p className="text-red-500 text-sm mt-2">{errors.venueState.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. DATAS E HORÁRIOS */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Datas e Horários</CardTitle>
              <CardDescription className="text-zinc-400">
                Quando o evento acontecerá
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data de Início */}
                <div>
                  <Label htmlFor="startDate" className="text-zinc-300 mb-2 block">
                    Data de Início *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-2">{errors.startDate.message}</p>
                  )}
                </div>

                {/* Data de Término */}
                <div>
                  <Label htmlFor="endDate" className="text-zinc-300 mb-2 block">
                    Data de Término *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-2">{errors.endDate.message}</p>
                  )}
                </div>

                {/* Horário de Início */}
                <div>
                  <Label htmlFor="startTime" className="text-zinc-300 mb-2 block">
                    Horário de Início
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                  />
                  {errors.startTime && (
                    <p className="text-red-500 text-sm mt-2">{errors.startTime.message}</p>
                  )}
                </div>

                {/* Horário de Término */}
                <div>
                  <Label htmlFor="endTime" className="text-zinc-300 mb-2 block">
                    Horário de Término
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register('endTime')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-sm mt-2">{errors.endTime.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. PROFISSIONAIS NECESSÁRIOS */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Profissionais Necessários</CardTitle>
              <CardDescription className="text-zinc-400">
                Informe as categorias e quantidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 bg-zinc-800/50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">Categoria {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Categoria */}
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Categoria *</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue(`professionalsNeeded.${index}.category`, value as any)
                        }
                        defaultValue={field.category}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {PROFESSIONAL_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`professionalsNeeded.${index}.quantity` as const)}
                        className="bg-zinc-800 border-zinc-700 text-white h-11"
                        placeholder="Ex: 10"
                      />
                    </div>

                    {/* Turno/Horário */}
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Turno/Horário *</Label>
                      <Input
                        {...register(`professionalsNeeded.${index}.shift` as const)}
                        className="bg-zinc-800 border-zinc-700 text-white h-11"
                        placeholder="Ex: 12h-20h"
                      />
                    </div>
                  </div>

                  {/* Requisitos */}
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Requisitos Específicos</Label>
                    <Textarea
                      {...register(`professionalsNeeded.${index}.requirements` as const)}
                      className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                      placeholder="Descreva requisitos específicos para esta categoria..."
                      rows={2}
                    />
                  </div>

                  {errors.professionalsNeeded?.[index] && (
                    <p className="text-red-500 text-sm">
                      {errors.professionalsNeeded[index]?.category?.message ||
                       errors.professionalsNeeded[index]?.quantity?.message ||
                       errors.professionalsNeeded[index]?.shift?.message}
                    </p>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ category: 'Segurança' as any, quantity: 1, shift: '', requirements: '' })}
                className="w-full bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Categoria
              </Button>

              {errors.professionalsNeeded && typeof errors.professionalsNeeded.message === 'string' && (
                <p className="text-red-500 text-sm">{errors.professionalsNeeded.message}</p>
              )}
            </CardContent>
          </Card>

          {/* 6. EQUIPAMENTOS */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Equipamentos</CardTitle>
              <CardDescription className="text-zinc-400">
                Precisa de equipamentos adicionais?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Checkbox para precisar de equipamentos */}
              <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition cursor-pointer">
                <Checkbox
                  id="needsEquipment"
                  checked={showEquipment}
                  onCheckedChange={(checked) => {
                    setShowEquipment(!!checked);
                    setValue('needsEquipment', !!checked);
                    if (!checked) {
                      setValue('equipmentList', []);
                      setValue('equipmentOther', '');
                      setValue('equipmentNotes', '');
                    }
                  }}
                  className="border-zinc-600"
                />
                <Label htmlFor="needsEquipment" className="text-zinc-300 cursor-pointer flex-1">
                  Preciso de equipamentos
                </Label>
              </div>

              {showEquipment && (
                <div className="space-y-6 pl-6 border-l-2 border-red-600">
                  {/* Lista de equipamentos */}
                  <div>
                    <Label className="text-zinc-300 mb-3 block">Selecione os equipamentos necessários:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EQUIPMENT_OPTIONS.map((equipment) => (
                        <div
                          key={equipment}
                          className="flex items-center space-x-2 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                        >
                          <Checkbox
                            id={`equipment-${equipment}`}
                            checked={selectedEquipment.includes(equipment)}
                            onCheckedChange={(checked) => {
                              const current = selectedEquipment;
                              if (checked) {
                                setValue('equipmentList', [...current, equipment]);
                              } else {
                                setValue('equipmentList', current.filter((e) => e !== equipment));
                              }
                            }}
                            className="border-zinc-600"
                          />
                          <label htmlFor={`equipment-${equipment}`} className="text-sm text-zinc-300 cursor-pointer flex-1">
                            {equipment}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outros equipamentos */}
                  <div>
                    <Label htmlFor="equipmentOther" className="text-zinc-300 mb-2 block">
                      Outros Equipamentos
                    </Label>
                    <Input
                      id="equipmentOther"
                      {...register('equipmentOther')}
                      className="bg-zinc-800 border-zinc-700 text-white h-11"
                      placeholder="Liste outros equipamentos necessários"
                    />
                  </div>

                  {/* Observações sobre equipamentos */}
                  <div>
                    <Label htmlFor="equipmentNotes" className="text-zinc-300 mb-2 block">
                      Observações sobre Equipamentos
                    </Label>
                    <Textarea
                      id="equipmentNotes"
                      {...register('equipmentNotes')}
                      className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                      placeholder="Informações adicionais sobre os equipamentos..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 7. ORÇAMENTO E URGÊNCIA */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Orçamento e Informações Adicionais</CardTitle>
              <CardDescription className="text-zinc-400">
                Detalhes sobre investimento e prioridade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faixa de Orçamento */}
                <div>
                  <Label htmlFor="budgetRange" className="text-zinc-300 mb-2 block">
                    Orçamento Estimado
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('budgetRange', value as any)}
                    defaultValue={watch('budgetRange')}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                      <SelectValue placeholder="Selecione uma faixa" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {BUDGET_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Urgência */}
                <div>
                  <Label htmlFor="urgency" className="text-zinc-300 mb-2 block">
                    Urgência *
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('urgency', value as any)}
                    defaultValue="normal"
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="very_urgent">Muito Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observações Adicionais */}
              <div>
                <Label htmlFor="additionalNotes" className="text-zinc-300 mb-2 block">
                  Observações Gerais
                </Label>
                <Textarea
                  id="additionalNotes"
                  {...register('additionalNotes')}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                  placeholder="Conte-nos mais detalhes importantes sobre suas necessidades..."
                  rows={4}
                />
                {errors.additionalNotes && (
                  <p className="text-red-500 text-sm mt-2">{errors.additionalNotes.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 8. TERMOS E ENVIO */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-6">
              {/* Aceitar Termos */}
              <div className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  id="acceptsTerms"
                  {...register('acceptsTerms')}
                  onCheckedChange={(checked) => setValue('acceptsTerms', !!checked)}
                  className="border-zinc-600 mt-1"
                />
                <label htmlFor="acceptsTerms" className="text-zinc-300 text-sm leading-relaxed cursor-pointer">
                  Li e aceito os{' '}
                  <a href="/termos" target="_blank" className="text-red-500 hover:underline">
                    termos de serviço
                  </a>{' '}
                  *
                </label>
              </div>
              {errors.acceptsTerms && (
                <p className="text-red-500 text-sm ml-6">{errors.acceptsTerms.message}</p>
              )}

              {/* Aceitar WhatsApp */}
              <div className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  id="acceptsWhatsApp"
                  defaultChecked
                  {...register('acceptsWhatsApp')}
                  onCheckedChange={(checked) => setValue('acceptsWhatsApp', !!checked)}
                  className="border-zinc-600 mt-1"
                />
                <label htmlFor="acceptsWhatsApp" className="text-zinc-300 text-sm leading-relaxed cursor-pointer">
                  Autorizo contato via WhatsApp
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Botão Submit */}
          <div className="flex justify-center pb-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white px-12 py-6 text-lg"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>

          <p className="text-sm text-zinc-500 text-center pb-4">
            Nossa equipe entrará em contato em até 2 horas durante horário comercial
          </p>
        </form>
      </div>
    </div>
  );
}
