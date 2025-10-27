'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2,
  ChevronDown,
  Users,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { EQUIPMENT_CATEGORIES } from '@/lib/equipment-types';
import { CATEGORIES_WITH_SUBCATEGORIES } from '@/lib/categories-subcategories';
import { WizardContainer, WizardStep, useWizard } from '@/components/Wizard';
import { LocationPicker, ParsedAddress } from '@/components/LocationPicker';

// ==========================================
// Schemas de validação
// ==========================================

const professionalSchema = z.object({
  category_group: z.string().min(1, 'Selecione a categoria principal'),
  category: z.string().min(1, 'Selecione a subcategoria'),
  quantity: z.number().min(1, 'Mínimo 1'),
  requirements: z.string().optional(),
});

const equipmentSchema = z.object({
  equipment_group: z.string().min(1, 'Selecione a categoria'),
  equipment_type: z.string().min(1, 'Selecione o tipo de equipamento'),
  quantity: z.number().min(1, 'Mínimo 1'),
  estimated_daily_rate: z.number().min(0, 'Valor deve ser maior ou igual a 0').optional(),
  notes: z.string().optional(),
});

const clientRequestSchema = z.object({
  request_type: z.literal('client'),
  client_name: z.string().min(2, 'Nome é obrigatório'),
  client_email: z.string().email('Email inválido'),
  client_phone: z.string().min(10, 'Telefone é obrigatório'),
  client_company: z.string().optional(),
  client_cnpj: z.string().optional(),
  event_name: z.string().min(3, 'Nome do evento é obrigatório'),
  event_type: z.string().min(1, 'Tipo de evento é obrigatório'),
  event_description: z.string().min(10, 'Descreva seu evento (mínimo 10 caracteres)'),
  event_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  expected_attendance: z.number().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().min(5, 'Endereço é obrigatório'),
  venue_city: z.string().min(2, 'Cidade é obrigatória'),
  venue_state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  venue_zip: z.string().optional(),
  professionals: z.array(professionalSchema).min(1, 'Adicione pelo menos um profissional'),
  equipment: z.array(equipmentSchema).optional(),
  is_urgent: z.boolean().default(false),
  budget_range: z.string().optional(),
  client_budget: z.number().positive('Orçamento deve ser positivo').optional(),
  additional_notes: z.string().optional(),
});

const supplierRequestSchema = z.object({
  request_type: z.literal('supplier'),
  company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
  contact_name: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  equipment_types: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de equipamento'),
  pricing: z.object({
    daily: z.string().optional(),
    three_days: z.string().optional(),
    weekly: z.string().optional(),
    discount_notes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

const requestSchema = z.discriminatedUnion('request_type', [
  clientRequestSchema,
  supplierRequestSchema,
]);

type RequestFormData = z.infer<typeof requestSchema>;

// ==========================================
// Steps do Wizard
// ==========================================

const CLIENT_WIZARD_STEPS = [
  { id: 'contact', title: 'Seus Dados', description: 'Informações de contato' },
  { id: 'event', title: 'Sobre o Evento', description: 'Detalhes do evento' },
  { id: 'venue', title: 'Local', description: 'Endereço do evento' },
  { id: 'requirements', title: 'Requisitos', description: 'Profissionais e equipamentos' },
  { id: 'review', title: 'Revisão', description: 'Confirme os dados' },
];

const SUPPLIER_WIZARD_STEPS = [
  { id: 'company', title: 'Empresa', description: 'Dados da empresa' },
  { id: 'equipment', title: 'Equipamentos', description: 'O que você fornece' },
  { id: 'pricing', title: 'Preços', description: 'Valores (opcional)' },
  { id: 'review', title: 'Revisão', description: 'Confirme os dados' },
];

function SolicitarEventoWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'client' | 'supplier' | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [mapLatitude, setMapLatitude] = useState<number | undefined>();
  const [mapLongitude, setMapLongitude] = useState<number | undefined>();

  const wizard = useWizard(requestType === 'client' ? CLIENT_WIZARD_STEPS.length : SUPPLIER_WIZARD_STEPS.length);

  // Detectar tipo da URL - OBRIGATÓRIO vir como parâmetro
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl === 'client' || typeFromUrl === 'supplier') {
      setRequestType(typeFromUrl);
      setValue('request_type', typeFromUrl);
    } else {
      // Se não vier type na URL, redireciona para onboarding
      router.push('/onboarding');
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(requestType === 'client' ? clientRequestSchema : requestType === 'supplier' ? supplierRequestSchema : z.any()),
    defaultValues: {
      request_type: requestType,
      professionals: [{ category_group: '', category: '', quantity: 1, requirements: '' }],
      equipment: [],
      equipment_types: [],
      is_urgent: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'professionals',
  });

  const { fields: equipmentFields, append: appendEquipment, remove: removeEquipment } = useFieldArray({
    control,
    name: 'equipment',
  });

  const isUrgent = watch('is_urgent');

  // Toggle categoria
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

  // Adicionar equipamento
  const addEquipment = (category: string) => {
    appendEquipment({
      category,
      quantity: 1,
      estimated_daily_rate: 0,
      notes: '',
    });
  };

  // Contar equipamentos selecionados (CLIENT)
  const getSelectedCountByCategory = (categoryName: string): number => {
    const category = EQUIPMENT_CATEGORIES.find((c) => c.name === categoryName);
    if (!category) return 0;
    return category.subtypes.filter((subtype) =>
      equipmentFields.some((field) => field.category === subtype.label)
    ).length;
  };

  // Contar equipamentos selecionados (SUPPLIER)
  const getSelectedTypesCountByCategory = (categoryName: string): number => {
    const category = EQUIPMENT_CATEGORIES.find((c) => c.name === categoryName);
    if (!category) return 0;
    return category.subtypes.filter((s) => selectedEquipmentTypes.includes(s.label)).length;
  };

  // Toggle tipo de equipamento (SUPPLIER)
  const toggleEquipmentType = (type: string) => {
    const current = selectedEquipmentTypes;
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setSelectedEquipmentTypes(newTypes);
    setValue('equipment_types', newTypes);
  };

  // Toggle equipamento (CLIENT)
  const toggleEquipment = (label: string) => {
    const current = selectedEquipment;
    if (current.includes(label)) {
      setSelectedEquipment(current.filter((item) => item !== label));
    } else {
      setSelectedEquipment([...current, label]);
    }
  };

  // Validação por step
  const validateStep = async (step: number): Promise<boolean> => {
    if (requestType === 'client') {
      const fieldsToValidate: Record<number, (keyof any)[]> = {
        0: ['client_name', 'client_email', 'client_phone'],
        1: ['event_name', 'event_type', 'event_description'],
        2: ['venue_address', 'venue_city', 'venue_state'],
        3: ['professionals'],
        4: [], // Review
      };
      const result = await trigger(fieldsToValidate[step]);
      return result;
    } else if (requestType === 'supplier') {
      const fieldsToValidate: Record<number, (keyof any)[]> = {
        0: ['company_name', 'contact_name', 'email', 'phone'],
        1: ['equipment_types'],
        2: [], // Pricing is optional
        3: [], // Review
      };
      const result = await trigger(fieldsToValidate[step]);
      return result;
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(wizard.currentStep);
    if (isValid) {
      wizard.nextStep();
    }
  };

  // Handler para seleção de localização no mapa
  const handleLocationSelect = async (
    lat: number,
    lng: number,
    address?: string,
    parsedAddress?: ParsedAddress
  ) => {
    setMapLatitude(lat);
    setMapLongitude(lng);

    // Preencher campos automaticamente se o endereço foi parseado
    if (parsedAddress) {
      console.log('📍 Endereço parseado do mapa:', parsedAddress);

      // Preencher endereço
      if (parsedAddress.street) {
        const fullStreet = parsedAddress.number
          ? `${parsedAddress.street}, ${parsedAddress.number}`
          : parsedAddress.street;
        setValue('venue_address', fullStreet);
      }

      // Preencher cidade
      if (parsedAddress.city) {
        setValue('venue_city', parsedAddress.city);
      }

      // Preencher estado
      if (parsedAddress.state) {
        setValue('venue_state', parsedAddress.state.toUpperCase());
      }

      // Preencher CEP
      if (parsedAddress.postalCode) {
        setValue('venue_zip', parsedAddress.postalCode);
      }
    }
  };

  const onSubmit = async (data: any) => {
    console.log('🚀 [Wizard] onSubmit chamado!', { requestType, data });
    setIsSubmitting(true);

    try {
      // Preparar payload completo e mapear campos
      const payload = {
        request_type: requestType,
        ...data,
        // Mapear equipment_type → type para compatibilidade com schema backend
        equipment: data.equipment?.map((equip: any) => ({
          type: equip.equipment_type || equip.type,
          quantity: equip.quantity,
        })) || [],
      };

      console.log('📤 [Wizard] Enviando requisição para /api/public/event-requests...');
      console.log('📦 [Wizard] Payload completo:', JSON.stringify(payload, null, 2));

      const response = await fetch('/api/public/event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 [Wizard] Resposta recebida:', { status: response.status, ok: response.ok });

      const result = await response.json();
      console.log('📄 [Wizard] Dados da resposta:', result);

      if (!response.ok) {
        console.error('❌ [Wizard] Erro na resposta:', result);
        console.error('📋 [Wizard] Detalhes dos erros de validação:', result.details);

        // Mostrar erros detalhados
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: any) => {
            console.error('  ⚠️', detail.path?.join('.') || 'campo', ':', detail.message);
          });
        }

        throw new Error(result.error || 'Erro ao enviar solicitação');
      }

      console.log('✅ [Wizard] Solicitação enviada com sucesso!');
      toast.success(requestType === 'supplier' ? 'Cadastro enviado com sucesso!' : 'Solicitação enviada com sucesso!');

      if (requestType === 'supplier') {
        console.log('🔀 [Wizard] Redirecionando para /solicitar-evento/sucesso-fornecedor');
        router.push('/solicitar-evento/sucesso-fornecedor');
      } else {
        console.log('🔀 [Wizard] Redirecionando para /solicitar-evento/sucesso');
        router.push('/solicitar-evento/sucesso');
      }
    } catch (error: any) {
      console.error('❌ [Wizard] Erro ao enviar:', error);
      toast.error(error.message || 'Erro ao enviar solicitação');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 [Wizard] onSubmit finalizado');
    }
  };

  // Se não tem tipo definido, mostra loading (o useEffect vai redirecionar)
  if (!requestType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Wizard para CLIENTE
  if (requestType === 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Solicite seu Evento Completo
            </h1>
            <p className="text-lg text-zinc-300">
              Preencha os dados em etapas e receba uma proposta personalizada
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full" />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <WizardContainer
              steps={CLIENT_WIZARD_STEPS}
              currentStep={wizard.currentStep}
              onNext={handleNext}
              onPrevious={wizard.previousStep}
              onSubmit={handleSubmit(onSubmit)}
              onBackToSelection={() => router.push('/onboarding')}
              isSubmitting={isSubmitting}
              canGoNext={true}
              canGoPrevious={true}
              submitLabel="Enviar Solicitação"
            >
              {/* Step 0: Seus Dados */}
              {wizard.currentStep === 0 && (
                <WizardStep
                  title="Seus Dados de Contato"
                  description="Informe seus dados para que possamos entrar em contato"
                  icon={<Building2 className="h-6 w-6" />}
                >
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
                </WizardStep>
              )}

              {/* Step 1: Dados do Evento */}
              {wizard.currentStep === 1 && (
                <WizardStep
                  title="Informações do Evento"
                  description="Conte mais sobre o seu evento"
                  icon={<Calendar className="h-6 w-6" />}
                >
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
                </WizardStep>
              )}

              {/* Step 2: Local */}
              {wizard.currentStep === 2 && (
                <WizardStep
                  title="Local do Evento"
                  description="Onde será realizado o evento?"
                  icon={<MapPin className="h-6 w-6" />}
                >
                  <div className="space-y-6">
                    {/* Mapa para seleção de localização */}
                    <LocationPicker
                      latitude={mapLatitude}
                      longitude={mapLongitude}
                      onLocationSelect={handleLocationSelect}
                      disabled={isSubmitting}
                    />

                    {/* Campos de endereço */}
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
                  </div>
                </WizardStep>
              )}

              {/* Step 3: Requisitos (Profissionais e Equipamentos) */}
              {wizard.currentStep === 3 && (
                <WizardStep
                  title="Requisitos do Evento"
                  description="Profissionais, equipamentos e orçamento"
                  icon={<Users className="h-6 w-6" />}
                >
                  <div className="space-y-6">
                    {/* Profissionais */}
                    <Card className="bg-zinc-800/50 border-zinc-700">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-red-600" />
                            <Label className="text-base font-semibold text-zinc-200">
                              Profissionais Necessários *
                            </Label>
                          </div>
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

                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-zinc-200">Categoria *</Label>
                                  <Select
                                    value={watch(`professionals.${index}.category_group`) || ''}
                                    onValueChange={(value) => {
                                      setValue(`professionals.${index}.category_group`, value);
                                      setValue(`professionals.${index}.category`, '');
                                    }}
                                  >
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                                      <SelectValue placeholder="Ex: Produção" />
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
                                      <SelectValue placeholder="Selecione" />
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
                                    placeholder="Ex: 5 anos exp."
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

                    {/* Equipamentos */}
                    <Card className="bg-zinc-800/50 border-zinc-700">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-red-600" />
                            <Label className="text-base font-semibold text-zinc-200">
                              Equipamentos Necessários (Opcional)
                            </Label>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => appendEquipment({ equipment_group: '', equipment_type: '', quantity: 1, estimated_daily_rate: 0, notes: '' })}
                            className="bg-red-600 hover:bg-red-500 text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>

                        {equipmentFields.length === 0 && (
                          <p className="text-sm text-zinc-400 text-center py-4">
                            Nenhum equipamento adicionado. Clique em "Adicionar" para incluir equipamentos.
                          </p>
                        )}

                        {equipmentFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-zinc-200">Categoria *</Label>
                                  <Select
                                    value={watch(`equipment.${index}.equipment_group`) || ''}
                                    onValueChange={(value) => {
                                      setValue(`equipment.${index}.equipment_group`, value);
                                      setValue(`equipment.${index}.equipment_type`, '');
                                    }}
                                  >
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white">
                                      <SelectValue placeholder="Ex: Som" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                      {EQUIPMENT_CATEGORIES.map((category) => (
                                        <SelectItem key={category.name} value={category.name}>
                                          {category.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-zinc-200">Tipo *</Label>
                                  <Select
                                    value={watch(`equipment.${index}.equipment_type`) || ''}
                                    onValueChange={(value) =>
                                      setValue(`equipment.${index}.equipment_type`, value)
                                    }
                                    disabled={!watch(`equipment.${index}.equipment_group`)}
                                  >
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white [&>span]:text-white disabled:opacity-50">
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                      {watch(`equipment.${index}.equipment_group`) &&
                                        EQUIPMENT_CATEGORIES.find(
                                          (cat) => cat.name === watch(`equipment.${index}.equipment_group`)
                                        )?.subtypes.map((subtype) => (
                                          <SelectItem key={subtype.label} value={subtype.label}>
                                            {subtype.label}
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
                                    {...register(`equipment.${index}.quantity`, {
                                      valueAsNumber: true,
                                    })}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    placeholder="1"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-zinc-200">Observações</Label>
                                  <Input
                                    {...register(`equipment.${index}.notes`)}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    placeholder="Ex: Cabo 10m"
                                  />
                                </div>
                              </div>

                              {equipmentFields.length > 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeEquipment(index)}
                                  className="border-red-600/30 text-red-400 hover:bg-red-600/10 mt-7"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Urgência e Orçamento */}
                    <Card className="bg-zinc-800/50 border-zinc-700">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="h-5 w-5 text-red-600" />
                          <Label className="text-base font-semibold text-zinc-200">
                            Orçamento e Urgência
                          </Label>
                        </div>

                        <div>
                          <Label htmlFor="budget_range" className="text-sm font-medium text-zinc-200">
                            Faixa de Orçamento (Aproximada)
                          </Label>
                          <Select onValueChange={(value) => setValue('budget_range', value)}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2 [&>span]:text-white">
                              <SelectValue placeholder="Selecione uma faixa" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="Até R$ 10.000">Até R$ 10.000</SelectItem>
                              <SelectItem value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</SelectItem>
                              <SelectItem value="R$ 25.000 - R$ 50.000">R$ 25.000 - R$ 50.000</SelectItem>
                              <SelectItem value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</SelectItem>
                              <SelectItem value="Acima de R$ 100.000">Acima de R$ 100.000</SelectItem>
                              <SelectItem value="Não sei informar">Não sei informar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="client_budget" className="text-sm font-medium text-zinc-200">
                            Orçamento Exato (Opcional)
                          </Label>
                          <Input
                            id="client_budget"
                            type="number"
                            step="0.01"
                            {...register('client_budget', { valueAsNumber: true })}
                            className="bg-zinc-800 border-zinc-700 text-white mt-2"
                            placeholder="Ex: 15000.00"
                          />
                          <p className="text-xs text-zinc-500 mt-1">
                            💡 Se souber o valor exato que pode investir, informe aqui
                          </p>
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

                    {/* Observações */}
                    <div>
                      <Label htmlFor="additional_notes" className="text-sm font-medium text-zinc-200">
                        Observações Adicionais
                      </Label>
                      <Textarea
                        id="additional_notes"
                        {...register('additional_notes')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                        placeholder="Alguma informação adicional que queira compartilhar?"
                        rows={4}
                      />
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 4: Revisão */}
              {wizard.currentStep === 4 && (
                <WizardStep
                  title="Revise sua Solicitação"
                  description="Confira todos os dados antes de enviar"
                  icon={<CheckCircle className="h-6 w-6" />}
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-500 mb-2">Seus Dados</h3>
                      <p className="text-sm text-zinc-300">
                        <strong>Nome:</strong> {watch('client_name') || '-'}<br />
                        <strong>Email:</strong> {watch('client_email') || '-'}<br />
                        <strong>Telefone:</strong> {watch('client_phone') || '-'}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-500 mb-2">Evento</h3>
                      <p className="text-sm text-zinc-300">
                        <strong>Nome:</strong> {watch('event_name') || '-'}<br />
                        <strong>Tipo:</strong> {watch('event_type') || '-'}<br />
                        <strong>Data:</strong> {watch('event_date') || 'Não informada'}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-500 mb-2">Local</h3>
                      <p className="text-sm text-zinc-300">
                        {watch('venue_address')}, {watch('venue_city')} - {watch('venue_state')}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-500 mb-3">Profissionais Solicitados</h3>
                      {fields.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nenhum profissional adicionado</p>
                      ) : (
                        <div className="space-y-2">
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-md border border-zinc-700/50">
                              <div className="flex-shrink-0 w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center border border-red-600/30">
                                <span className="text-xs font-bold text-red-500">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">
                                  {watch(`professionals.${index}.category`) || 'Categoria não informada'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  Quantidade: {watch(`professionals.${index}.quantity`) || 0}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {watch('equipment') && watch('equipment').length > 0 && (
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                        <h3 className="text-sm font-semibold text-red-500 mb-3">Equipamentos Solicitados</h3>
                        <div className="space-y-2">
                          {watch('equipment').map((equip: any, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-md border border-zinc-700/50">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-600/30">
                                <span className="text-xs font-bold text-blue-500">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">
                                  {equip.type || 'Tipo não informado'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  Quantidade: {equip.quantity || 0}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {watch('client_budget') && (
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                        <h3 className="text-sm font-semibold text-red-500 mb-2">Orçamento</h3>
                        <p className="text-sm text-zinc-300">
                          <strong>Orçamento do Cliente:</strong> R$ {Number(watch('client_budget')).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-400">
                        ✓ Tudo pronto! Clique em "Enviar Solicitação" para finalizar.
                      </p>
                    </div>
                  </div>
                </WizardStep>
              )}
            </WizardContainer>
          </form>
        </div>
      </div>
    );
  }

  // Wizard para FORNECEDOR
  if (requestType === 'supplier') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cadastro de Fornecedor
            </h1>
            <p className="text-lg text-zinc-300">
              Preencha os dados em etapas para começar a receber solicitações
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full" />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <WizardContainer
              steps={SUPPLIER_WIZARD_STEPS}
              currentStep={wizard.currentStep}
              onNext={handleNext}
              onPrevious={wizard.previousStep}
              onSubmit={handleSubmit(onSubmit)}
              onBackToSelection={() => router.push('/onboarding')}
              isSubmitting={isSubmitting}
              canGoNext={true}
              canGoPrevious={true}
              submitLabel="Cadastrar Empresa"
            >
              {/* Step 0: Dados da Empresa */}
              {wizard.currentStep === 0 && (
                <WizardStep
                  title="Dados da Empresa"
                  description="Informações básicas da sua empresa"
                  icon={<Building2 className="h-6 w-6" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="company_name" className="text-sm font-medium text-zinc-200">
                        Nome da Empresa *
                      </Label>
                      <Input
                        id="company_name"
                        {...register('company_name')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                        placeholder="Ex: Equipamentos XYZ Ltda"
                      />
                      {errors.company_name && (
                        <p className="text-xs text-red-400 mt-1.5">{errors.company_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="contact_name" className="text-sm font-medium text-zinc-200">
                        Nome do Contato *
                      </Label>
                      <Input
                        id="contact_name"
                        {...register('contact_name')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                        placeholder="Seu nome"
                      />
                      {errors.contact_name && (
                        <p className="text-xs text-red-400 mt-1.5">{errors.contact_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-zinc-200">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Telefone/WhatsApp *
                      </Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                        placeholder="(00) 00000-0000"
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-400 mt-1.5">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="text-sm font-medium text-zinc-200">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                        placeholder="contato@empresa.com"
                      />
                      {errors.email && (
                        <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                </WizardStep>
              )}

              {/* Step 1: Tipos de Equipamentos */}
              {wizard.currentStep === 1 && (
                <WizardStep
                  title="Equipamentos que Fornece"
                  description="Selecione os tipos de equipamento"
                  icon={<Package className="h-6 w-6" />}
                >
                  <p className="text-sm text-zinc-300 mb-4">
                    Selecione todos os tipos de equipamento que sua empresa pode fornecer
                  </p>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {EQUIPMENT_CATEGORIES.map((category) => {
                      const isExpanded = expandedCategories.has(category.name);
                      const selectedCount = getSelectedTypesCountByCategory(category.name);

                      return (
                        <div
                          key={category.name}
                          className="border border-zinc-800 bg-zinc-800/50 rounded-md overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.name)}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
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

                          {isExpanded && (
                            <div className="px-3 py-2 space-y-2 bg-zinc-900/50 border-t border-zinc-800">
                              {category.subtypes.map((subtype) => (
                                <div key={subtype.label} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`supplier-equipment-${subtype.label}`}
                                    checked={selectedEquipmentTypes.includes(subtype.label)}
                                    onCheckedChange={() => toggleEquipmentType(subtype.label)}
                                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                  />
                                  <Label
                                    htmlFor={`supplier-equipment-${subtype.label}`}
                                    className="text-sm font-medium text-zinc-200 cursor-pointer flex-1"
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

                  {errors.equipment_types && (
                    <p className="text-xs text-red-400 mt-4">{errors.equipment_types.message}</p>
                  )}

                  {selectedEquipmentTypes.length > 0 && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-400">
                        ✓ {selectedEquipmentTypes.length} tipo(s) de equipamento selecionado(s)
                      </p>
                    </div>
                  )}
                </WizardStep>
              )}

              {/* Step 2: Preços (Opcional) */}
              {wizard.currentStep === 2 && (
                <WizardStep
                  title="Valores por Período"
                  description="Defina seus preços (opcional)"
                  icon={<DollarSign className="h-6 w-6" />}
                >
                  <p className="text-sm text-zinc-300 mb-4">
                    Defina os valores médios de locação/serviço por período (opcional)
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="pricing.daily" className="text-sm font-medium text-zinc-200">
                        Diária
                      </Label>
                      <Input
                        id="pricing.daily"
                        {...register('pricing.daily')}
                        placeholder="Ex: R$ 500,00"
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pricing.three_days" className="text-sm font-medium text-zinc-200">
                        3 Dias
                      </Label>
                      <Input
                        id="pricing.three_days"
                        {...register('pricing.three_days')}
                        placeholder="Ex: R$ 1.200,00"
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pricing.weekly" className="text-sm font-medium text-zinc-200">
                        Semanal (7 dias)
                      </Label>
                      <Input
                        id="pricing.weekly"
                        {...register('pricing.weekly')}
                        placeholder="Ex: R$ 2.000,00"
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="pricing.discount_notes" className="text-sm font-medium text-zinc-200">
                      Observações sobre Descontos
                    </Label>
                    <Input
                      id="pricing.discount_notes"
                      {...register('pricing.discount_notes')}
                      placeholder="Ex: 10% de desconto para períodos acima de 7 dias"
                      className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    />
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="notes" className="text-sm font-medium text-zinc-200">
                      Informações Adicionais
                    </Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-2"
                      placeholder="Conte mais sobre sua empresa: horários de atendimento, área de atuação, diferenciais, etc."
                      rows={4}
                    />
                  </div>
                </WizardStep>
              )}

              {/* Step 3: Revisão */}
              {wizard.currentStep === 3 && (
                <WizardStep
                  title="Revise seu Cadastro"
                  description="Confira todos os dados antes de enviar"
                  icon={<CheckCircle className="h-6 w-6" />}
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-500 mb-2">Dados da Empresa</h3>
                      <p className="text-sm text-zinc-300">
                        <strong>Empresa:</strong> {watch('company_name') || '-'}<br />
                        <strong>Contato:</strong> {watch('contact_name') || '-'}<br />
                        <strong>Email:</strong> {watch('email') || '-'}<br />
                        <strong>Telefone:</strong> {watch('phone') || '-'}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-500 mb-2">Equipamentos</h3>
                      <p className="text-sm text-zinc-300">
                        {selectedEquipmentTypes.length} tipo(s) de equipamento selecionado(s)
                      </p>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-400">
                        ✓ Tudo pronto! Clique em "Cadastrar Empresa" para finalizar.
                      </p>
                    </div>
                  </div>
                </WizardStep>
              )}
            </WizardContainer>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

// Wrapper com Suspense
export default function SolicitarEventoWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando...</p>
          </div>
        </div>
      }
    >
      <SolicitarEventoWizardContent />
    </Suspense>
  );
}
