'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { professionalSchema, type ProfessionalFormData } from '@/lib/validations/professional';
import { formatCPF, formatPhone, formatCEP, fetchAddressByCEP } from '@/lib/format';
import { uploadDocument, uploadPortfolioPhotos } from '@/lib/supabase/storage';
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
import { PortfolioUpload } from '@/components/PortfolioUpload';
import { CategorySubcategorySelector } from '@/components/CategorySubcategorySelector';
import { BasicDocumentsUpload } from '@/components/BasicDocumentsUpload';
import { LocationPicker, ParsedAddress } from '@/components/LocationPicker';
import { ServiceRadiusSelector } from '@/components/ServiceRadiusSelector';
import { WizardContainer, WizardStep, useWizard } from '@/components/Wizard';
import { MapboxAutocomplete, AddressSuggestion } from '@/components/MapboxAutocomplete';
import {
  User,
  MapPin,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Subcategories, Certifications } from '@/types/certification';

// Definir os steps do wizard
const WIZARD_STEPS = [
  {
    id: 'personal',
    title: 'Dados Pessoais',
    description: 'Informações básicas',
  },
  {
    id: 'address',
    title: 'Endereço',
    description: 'Localização',
  },
  {
    id: 'categories',
    title: 'Categorias',
    description: 'Áreas de atuação',
  },
  {
    id: 'documents',
    title: 'Documentos',
    description: 'Documentação',
  },
  {
    id: 'experience',
    title: 'Experiência',
    description: 'Disponibilidade',
  },
  {
    id: 'review',
    title: 'Revisão',
    description: 'Confirmar dados',
  },
];

export default function CadastroProfissionalWizardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // Se está atualizando cadastro existente

  // Sistema de subcategorias e certificações
  const [subcategories, setSubcategories] = useState<Subcategories>({});
  const [certifications, setCertifications] = useState<Certifications>({});

  // Localização no mapa
  const [mapLatitude, setMapLatitude] = useState<number | undefined>();
  const [mapLongitude, setMapLongitude] = useState<number | undefined>();

  // Wizard hook
  const wizard = useWizard(WIZARD_STEPS.length);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    mode: 'onChange',
    defaultValues: {
      hasExperience: false,
      acceptsTerms: false,
      acceptsNotifications: true,
      availability: {
        weekdays: false,
        weekends: false,
        holidays: false,
        night: false,
        travel: false,
      },
      categories: [],
    },
  });

  const hasExperience = watch('hasExperience');
  const selectedCategories = watch('categories') || [];
  const availability = watch('availability');
  const acceptsTerms = watch('acceptsTerms');
  const acceptsNotifications = watch('acceptsNotifications');

  // Carregar dados do profissional existente (se houver)
  useEffect(() => {
    const loadProfessionalData = async () => {
      if (!user) {
        setLoadingProfessional(false);
        return;
      }

      try {
        const response = await fetch('/api/professional/profile');

        if (response.ok) {
          const result = await response.json();
          const professional = result.data;

          if (professional) {
            console.log('📋 Carregando dados do profissional:', professional);

            // Marcar que está atualizando um cadastro existente
            setIsUpdating(true);

            // Dados pessoais
            if (professional.full_name) setValue('fullName', professional.full_name);
            if (professional.cpf) setValue('cpf', professional.cpf);
            if (professional.birth_date) setValue('birthDate', professional.birth_date);
            if (professional.email) setValue('email', professional.email);
            if (professional.phone) setValue('phone', professional.phone);

            // Endereço
            if (professional.cep) setValue('cep', professional.cep);
            if (professional.street) setValue('street', professional.street);
            if (professional.number) setValue('number', professional.number);
            if (professional.complement) setValue('complement', professional.complement);
            if (professional.neighborhood) setValue('neighborhood', professional.neighborhood);
            if (professional.city) setValue('city', professional.city);
            if (professional.state) setValue('state', professional.state);

            // Coordenadas do mapa
            if (professional.latitude && professional.longitude) {
              setMapLatitude(professional.latitude);
              setMapLongitude(professional.longitude);
            }

            // Categorias e subcategorias
            if (professional.categories && professional.categories.length > 0) {
              setValue('categories', professional.categories);
            }

            if (professional.subcategories) {
              setSubcategories(professional.subcategories);
            }

            // Documentos já enviados
            if (professional.documents) {
              setUploadedDocuments(professional.documents);
            }

            // Portfólio
            if (professional.portfolio_urls) {
              setPortfolioUrls(professional.portfolio_urls);
            }

            // Experiência e disponibilidade
            if (professional.experience_years !== undefined) {
              setValue('hasExperience', professional.experience_years > 0);
              setValue('experienceYears', professional.experience_years);
            }

            if (professional.experience_description) {
              setValue('experienceDescription', professional.experience_description);
            }

            if (professional.availability) {
              setValue('availability', {
                weekdays: professional.availability.weekdays || false,
                weekends: professional.availability.weekends || false,
                holidays: professional.availability.holidays || false,
                night: professional.availability.night || false,
                travel: professional.availability.travel || false,
              });
            }

            // Termos e notificações
            setValue('acceptsTerms', true); // Já aceitou ao cadastrar
            setValue('acceptsNotifications', professional.accepts_notifications !== false);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do profissional:', error);
      } finally {
        setLoadingProfessional(false);
      }
    };

    loadProfessionalData();
  }, [user, setValue]);

  // Validação por step
  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: Record<number, (keyof ProfessionalFormData)[]> = {
      0: ['fullName', 'cpf', 'birthDate', 'email', 'phone'],
      1: ['cep', 'street', 'number', 'neighborhood', 'city', 'state'],
      2: ['categories'],
      3: [], // Documentos são opcionais durante o wizard
      4: [], // Experiência é opcional
      5: ['acceptsTerms'], // Termos obrigatórios
    };

    const fields = fieldsToValidate[step];
    if (!fields || fields.length === 0) return true;

    const result = await trigger(fields as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(wizard.currentStep);
    if (isValid) {
      wizard.nextStep();
    }
  };

  // Buscar endereço ao digitar CEP
  async function handleCEPBlur(cep: string) {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setSearchingCEP(true);
    const address = await fetchAddressByCEP(cep);

    if (address) {
      setValue('street', address.street);
      setValue('neighborhood', address.neighborhood);
      setValue('city', address.city);
      setValue('state', address.state);

      // Buscar coordenadas
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          const fullAddress = `${address.street}, ${address.neighborhood}, ${address.city}, ${address.state}, Brasil`;
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&limit=1`;

          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            setMapLatitude(lat);
            setMapLongitude(lng);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas:', error);
      }
    }

    setSearchingCEP(false);
  }

  // Handler para seleção do Mapbox Autocomplete
  function handleAddressSelect(suggestion: AddressSuggestion) {
    // Preencher campos com os dados do autocomplete
    setValue('street', suggestion.address || '');
    setValue('city', suggestion.city || '');
    setValue('state', suggestion.state || '');

    // Atualizar coordenadas no mapa
    setMapLatitude(suggestion.coordinates.latitude);
    setMapLongitude(suggestion.coordinates.longitude);
  }

  // Handler para mudança de subcategorias
  const handleSubcategoriesChange = (newSubcategories: Subcategories) => {
    setSubcategories(newSubcategories);
    const categories = Object.keys(newSubcategories).filter(
      (key) => newSubcategories[key].length > 0
    );
    setValue('categories', categories);
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

      // Preencher CEP
      if (parsedAddress.postalCode) {
        setValue('cep', parsedAddress.postalCode);
      }

      // Preencher rua
      if (parsedAddress.street) {
        setValue('street', parsedAddress.street);
      }

      // Preencher número (se disponível)
      if (parsedAddress.number) {
        setValue('number', parsedAddress.number);
      }

      // Preencher bairro
      if (parsedAddress.neighborhood) {
        setValue('neighborhood', parsedAddress.neighborhood);
      }

      // Preencher cidade
      if (parsedAddress.city) {
        setValue('city', parsedAddress.city);
      }

      // Preencher estado
      if (parsedAddress.state) {
        setValue('state', parsedAddress.state.toUpperCase());
      }
    }
  };

  // Upload de documentos
  const handleDocumentUploaded = (type: string, url: string) => {
    setUploadedDocuments((prev) => ({
      ...prev,
      [type]: url,
    }));
  };

  async function onSubmit(data: ProfessionalFormData) {
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        documents: uploadedDocuments,
        portfolio: portfolioUrls,
        subcategories,
        certifications,
        latitude: mapLatitude,
        longitude: mapLongitude,
      };

      // Se está atualizando, usar PATCH em /api/professional/profile
      // Se é novo cadastro, usar POST em /api/professionals
      const endpoint = isUpdating ? '/api/professional/profile' : '/api/professionals';
      const method = isUpdating ? 'PATCH' : 'POST';

      console.log(`${method} ${endpoint} - ${isUpdating ? 'Atualizando' : 'Criando'} cadastro`);

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar cadastro');
      }

      // Se foi atualização bem-sucedida, redirecionar para o dashboard
      if (isUpdating) {
        alert('✅ Cadastro atualizado com sucesso!');
        router.push('/professional/dashboard');
      } else {
        router.push('/cadastro-profissional/sucesso');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar cadastro');
      setIsSubmitting(false);
    }
  }

  // Loading state enquanto carrega dados do profissional
  if (loadingProfessional) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
            <span className="text-red-500 font-semibold text-sm">Cadastro Profissional</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Complete seu Perfil
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Preencha as informações para começar a receber oportunidades de trabalho
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <WizardContainer
            steps={WIZARD_STEPS}
            currentStep={wizard.currentStep}
            onNext={handleNext}
            onPrevious={wizard.previousStep}
            onSubmit={handleSubmit(onSubmit)}
            onBackToSelection={() => router.push('/onboarding')}
            isSubmitting={isSubmitting}
            canGoNext={true}
          >
            {/* STEP 1: Dados Pessoais */}
            {wizard.currentStep === 0 && (
              <WizardStep
                title="Dados Pessoais"
                description="Preencha suas informações básicas"
                icon={<User className="w-6 h-6" />}
              >
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-zinc-200">
                    Nome Completo *
                  </Label>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    placeholder="João da Silva"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-2">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="cpf" className="text-sm font-medium text-zinc-200">
                      CPF *
                    </Label>
                    <Input
                      id="cpf"
                      {...register('cpf')}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        setValue('cpf', formatted);
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {errors.cpf && (
                      <p className="text-red-500 text-sm mt-2">{errors.cpf.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="birthDate" className="text-sm font-medium text-zinc-200">
                      Data de Nascimento *
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      {...register('birthDate')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    />
                    {errors.birthDate && (
                      <p className="text-red-500 text-sm mt-2">{errors.birthDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-zinc-200">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="joao@exemplo.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-zinc-200">
                      Telefone/WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setValue('phone', formatted);
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-2">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </WizardStep>
            )}

            {/* STEP 2: Endereço */}
            {wizard.currentStep === 1 && (
              <WizardStep
                title="Endereço e Localização"
                description="Onde você está localizado"
                icon={<MapPin className="w-6 h-6" />}
              >
                {/* Autocomplete Mapbox */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-zinc-200 mb-2 block">
                    Buscar Endereço (Opcional - facilita o preenchimento)
                  </Label>
                  <MapboxAutocomplete
                    value={watch('street') || ''}
                    onChange={(value) => setValue('street', value)}
                    onSelect={handleAddressSelect}
                    placeholder="Digite seu endereço completo..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <p className="text-xs text-zinc-400 mt-2">
                    💡 Dica: Comece digitando para ver sugestões automáticas. Ou preencha manualmente abaixo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="cep" className="text-sm font-medium text-zinc-200">
                      CEP *
                    </Label>
                    <Input
                      id="cep"
                      {...register('cep')}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value);
                        setValue('cep', formatted);
                      }}
                      onBlur={(e) => handleCEPBlur(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {searchingCEP && <p className="text-xs text-zinc-400 mt-2">Buscando...</p>}
                    {errors.cep && (
                      <p className="text-red-500 text-sm mt-2">{errors.cep.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-sm font-medium text-zinc-200">
                      Rua *
                    </Label>
                    <Input
                      id="street"
                      {...register('street')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Rua das Flores"
                    />
                    {errors.street && (
                      <p className="text-red-500 text-sm mt-2">{errors.street.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="number" className="text-sm font-medium text-zinc-200">
                      Número *
                    </Label>
                    <Input
                      id="number"
                      {...register('number')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="123"
                    />
                    {errors.number && (
                      <p className="text-red-500 text-sm mt-2">{errors.number.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="complement" className="text-sm font-medium text-zinc-200">
                      Complemento
                    </Label>
                    <Input
                      id="complement"
                      {...register('complement')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Apto 101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="neighborhood" className="text-sm font-medium text-zinc-200">
                      Bairro *
                    </Label>
                    <Input
                      id="neighborhood"
                      {...register('neighborhood')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Centro"
                    />
                    {errors.neighborhood && (
                      <p className="text-red-500 text-sm mt-2">{errors.neighborhood.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-zinc-200">
                      Cidade *
                    </Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="São Paulo"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-2">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-zinc-200">
                      Estado *
                    </Label>
                    <Input
                      id="state"
                      {...register('state')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="SP"
                      maxLength={2}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-2">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <LocationPicker
                    latitude={mapLatitude}
                    longitude={mapLongitude}
                    onLocationSelect={handleLocationSelect}
                    disabled={isSubmitting}
                  />
                </div>
              </WizardStep>
            )}

            {/* STEP 3: Categorias */}
            {wizard.currentStep === 2 && (
              <WizardStep
                title="Categorias e Especialidades"
                description="Selecione suas áreas de atuação"
                icon={<Briefcase className="w-6 h-6" />}
              >
                <CategorySubcategorySelector
                  selectedSubcategories={subcategories}
                  certifications={certifications}
                  onSubcategoriesChange={handleSubcategoriesChange}
                  onCertificationChange={(code, cert) => {
                    setCertifications(prev => ({
                      ...prev,
                      [code]: { ...prev[code], ...cert, status: cert.status || 'pending' }
                    }));
                  }}
                  onCertificationUpload={async (code, file) => {
                    if (!user?.id) return { error: 'Usuário não autenticado' };
                    const { url, error } = await uploadDocument(file, user.id, code as any);
                    return error ? { error } : { url };
                  }}
                  disabled={isSubmitting}
                />
                {errors.categories && (
                  <p className="text-red-500 text-sm mt-4 text-center">{errors.categories.message}</p>
                )}
              </WizardStep>
            )}

            {/* STEP 4: Documentos */}
            {wizard.currentStep === 3 && user?.id && (
              <WizardStep
                title="Documentos Básicos"
                description="Envie seus documentos de identificação"
                icon={<FileText className="w-6 h-6" />}
              >
                <BasicDocumentsUpload
                  userId={user.id}
                  uploadedDocuments={uploadedDocuments}
                  onDocumentUploaded={handleDocumentUploaded}
                  disabled={isSubmitting}
                />
              </WizardStep>
            )}

            {/* STEP 5: Experiência e Disponibilidade */}
            {wizard.currentStep === 4 && (
              <WizardStep
                title="Experiência e Disponibilidade"
                description="Conte sobre sua experiência e quando pode trabalhar"
                icon={<Clock className="w-6 h-6" />}
              >
                <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg">
                  <Checkbox
                    checked={hasExperience}
                    onCheckedChange={(checked) => setValue('hasExperience', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label className="text-sm text-zinc-200 cursor-pointer">
                    Tenho experiência anterior em eventos
                  </label>
                </div>

                {hasExperience && (
                  <>
                    <div>
                      <Label htmlFor="yearsOfExperience" className="text-sm font-medium text-zinc-200">
                        Anos de experiência
                      </Label>
                      <Select onValueChange={(value) => setValue('yearsOfExperience', value as any)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="<1">Menos de 1 ano</SelectItem>
                          <SelectItem value="1-3">1 a 3 anos</SelectItem>
                          <SelectItem value="3-5">3 a 5 anos</SelectItem>
                          <SelectItem value="5-10">5 a 10 anos</SelectItem>
                          <SelectItem value="10+">Mais de 10 anos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="experienceDescription" className="text-sm font-medium text-zinc-200">
                        Descreva sua experiência *
                      </Label>
                      <Textarea
                        id="experienceDescription"
                        {...register('experienceDescription')}
                        className="bg-zinc-800 border-zinc-700 text-white min-h-[120px] mt-1.5"
                        placeholder="Conte sobre sua experiência em eventos..."
                        rows={4}
                      />
                      {errors.experienceDescription && (
                        <p className="text-red-500 text-sm mt-2">
                          {errors.experienceDescription.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-6">
                  <Label className="text-sm font-medium text-zinc-200 mb-4 block">
                    Disponibilidade *
                  </Label>
                  <div className="space-y-3">
                    {[
                      { key: 'weekdays', label: 'Segunda a Sexta' },
                      { key: 'weekends', label: 'Finais de Semana' },
                      { key: 'holidays', label: 'Feriados' },
                      { key: 'night', label: 'Período Noturno' },
                      { key: 'travel', label: 'Disponível para viagens' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition">
                        <Checkbox
                          checked={availability?.[key as keyof typeof availability] || false}
                          onCheckedChange={(checked) => setValue(`availability.${key}` as any, checked as boolean)}
                          className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <label className="text-sm text-zinc-200 flex-1 cursor-pointer">{label}</label>
                      </div>
                    ))}
                  </div>
                  {errors.availability && (
                    <p className="text-red-500 text-sm mt-4">{errors.availability.message}</p>
                  )}
                </div>

                {/* Raio de Atuação */}
                <div className="mt-8 pt-6 border-t border-zinc-700">
                  <ServiceRadiusSelector
                    value={watch('serviceRadiusKm') || 50}
                    onChange={(value) => setValue('serviceRadiusKm', value)}
                  />
                </div>
              </WizardStep>
            )}

            {/* STEP 6: Revisão */}
            {wizard.currentStep === 5 && (
              <WizardStep
                title="Revisão e Confirmação"
                description="Revise suas informações antes de enviar"
                icon={<CheckCircle2 className="w-6 h-6" />}
              >
                <div className="space-y-6">
                  {/* Resumo dos dados */}
                  <div className="p-4 bg-zinc-800/30 rounded-lg space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2">Dados Pessoais</h3>
                      <p className="text-white">{watch('fullName')}</p>
                      <p className="text-sm text-zinc-400">{watch('email')} • {watch('phone')}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2">Endereço</h3>
                      <p className="text-white">
                        {watch('street')}, {watch('number')} - {watch('neighborhood')}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {watch('city')} - {watch('state')} • {watch('cep')}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2">Categorias</h3>
                      <p className="text-white">{selectedCategories.join(', ') || 'Nenhuma selecionada'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2">Raio de Atuação</h3>
                      <p className="text-white">Até {watch('serviceRadiusKm') || 50} km de distância</p>
                    </div>
                  </div>

                  {/* Termos */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                      <Checkbox
                        checked={acceptsTerms || false}
                        onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                        className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-1"
                      />
                      <label className="text-sm text-zinc-200 leading-relaxed cursor-pointer">
                        Li e aceito os{' '}
                        <a href="/termos" className="text-red-500 hover:underline" target="_blank">
                          termos de uso
                        </a>{' '}
                        e a{' '}
                        <a href="/privacidade" className="text-red-500 hover:underline" target="_blank">
                          política de privacidade
                        </a>{' '}
                        *
                      </label>
                    </div>
                    {errors.acceptsTerms && (
                      <p className="text-red-500 text-sm">{errors.acceptsTerms.message}</p>
                    )}

                    <div className="flex items-start space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                      <Checkbox
                        checked={acceptsNotifications ?? true}
                        onCheckedChange={(checked) => setValue('acceptsNotifications', checked as boolean)}
                        className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-1"
                      />
                      <label className="text-sm text-zinc-200 leading-relaxed cursor-pointer">
                        Aceito receber notificações de oportunidades por WhatsApp e Email
                      </label>
                    </div>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-red-500 font-semibold mb-2">
                          Corrija os seguintes erros:
                        </h3>
                        <ul className="text-sm text-red-400 space-y-1">
                          {Object.entries(errors).map(([key, error]) => (
                            <li key={key}>• {error.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </WizardStep>
            )}
          </WizardContainer>
        </form>
      </div>
    </div>
  );
}
