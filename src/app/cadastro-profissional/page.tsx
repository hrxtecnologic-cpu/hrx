'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { professionalSchema, type ProfessionalFormData, CATEGORIES } from '@/lib/validations/professional';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioUpload } from '@/components/PortfolioUpload';
import { CategorySubcategorySelector } from '@/components/CategorySubcategorySelector';
import { BasicDocumentsUpload } from '@/components/BasicDocumentsUpload';
import { LocationPicker, ParsedAddress } from '@/components/LocationPicker';
import { AlertCircle, XCircle } from 'lucide-react';
import { Professional, DocumentValidations, DocumentValidation } from '@/types';
import type { Subcategories, Certifications, Certification } from '@/types/certification';

export default function CadastroProfissionalPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [professionalData, setProfessionalData] = useState<Professional | null>(null);
  const [documentValidations, setDocumentValidations] = useState<DocumentValidations>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Sistema de subcategorias e certificações
  const [subcategories, setSubcategories] = useState<Subcategories>({});
  const [certifications, setCertifications] = useState<Certifications>({});

  // Localização no mapa
  const [mapLatitude, setMapLatitude] = useState<number | undefined>();
  const [mapLongitude, setMapLongitude] = useState<number | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
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

  // Carregar dados existentes se profissional já cadastrado
  useEffect(() => {
    async function loadExistingData() {
      if (!user?.id) return;

      try {
        // Buscar dados do profissional
        const response = await fetch('/api/professionals/me');

        if (response.ok) {
          const data = await response.json();
          setProfessionalData(data);
          setIsEditMode(true);

          // Preencher formulário com dados existentes
          setValue('fullName', data.full_name || '');
          setValue('cpf', data.cpf || '');
          setValue('birthDate', data.birth_date || '');
          setValue('email', data.email || '');
          setValue('phone', data.phone || '');
          setValue('cep', data.cep || '');
          setValue('street', data.street || '');
          setValue('number', data.number || '');
          setValue('complement', data.complement || '');
          setValue('neighborhood', data.neighborhood || '');
          setValue('city', data.city || '');
          setValue('state', data.state || '');
          setValue('categories', data.categories || []);
          setValue('hasExperience', data.has_experience || false);
          setValue('experienceDescription', data.experience_description || '');
          setValue('yearsOfExperience', data.years_of_experience || undefined);
          setValue('availability', data.availability || {
            weekdays: false,
            weekends: false,
            holidays: false,
            night: false,
            travel: false,
          });
          setValue('bankName', data.bank_name || '');
          setValue('accountType', data.account_type || '');
          setValue('agency', data.agency || '');
          setValue('accountNumber', data.account_number || '');
          setValue('pixKey', data.pix_key || '');
          setValue('acceptsNotifications', data.accepts_notifications ?? true);
          setValue('acceptsTerms', true); // Já aceitou antes

          // Carregar documentos existentes
          if (data.documents) {
            setUploadedDocuments(data.documents);
          }

          // Carregar portfolio
          if (data.portfolio) {
            setPortfolioUrls(data.portfolio);
          }

          // Carregar subcategorias e certificações
          if (data.subcategories) {
            setSubcategories(data.subcategories);
          }
          if (data.certifications) {
            setCertifications(data.certifications);
          }

          // Carregar geolocalização
          if (data.latitude && data.longitude) {
            setMapLatitude(data.latitude);
            setMapLongitude(data.longitude);
          }

          // Buscar validações de documentos
          if (data.id) {
            const validationsResponse = await fetch(`/api/professionals/me/documents`);
            if (validationsResponse.ok) {
              const validationsData = await validationsResponse.json();
              setDocumentValidations(validationsData.validations || {});
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadExistingData();
  }, [user?.id, setValue]);

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

      // Buscar coordenadas do endereço via Mapbox Geocoding
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
            console.log(`📍 [CEP→MAPA] Coordenadas encontradas: Lat ${lat}, Lng ${lng}`);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas do CEP:', error);
      }
    }

    setSearchingCEP(false);
  }

  // Toggle categoria (DEPRECATED - mantido para compatibilidade)
  function toggleCategory(category: string) {
    const current = selectedCategories;
    if (current.includes(category as any)) {
      setValue(
        'categories',
        current.filter((c) => c !== category) as any
      );
    } else {
      setValue('categories', [...current, category] as any);
    }
  }

  // Handler para mudança de subcategorias
  const handleSubcategoriesChange = (newSubcategories: Subcategories) => {
    setSubcategories(newSubcategories);

    // Atualizar também as categorias principais (para compatibilidade)
    const categories = Object.keys(newSubcategories).filter(
      (key) => newSubcategories[key].length > 0
    );
    setValue('categories', categories);
  };

  // Handler para mudança de certificação individual
  const handleCertificationChange = (certCode: string, cert: Partial<Certification>) => {
    setCertifications((prev) => ({
      ...prev,
      [certCode]: {
        ...prev[certCode],
        ...cert,
        status: cert.status || prev[certCode]?.status || 'pending',
      },
    }));
  };

  // Handler para upload de certificação
  const handleCertificationUpload = async (
    certCode: string,
    file: File
  ): Promise<{ url?: string; error?: string }> => {
    if (!user?.id) {
      return { error: 'Usuário não autenticado' };
    }

    try {
      console.log(`🔼 [UPLOAD CERT] Fazendo upload de: ${certCode}`);

      // Usar a mesma função de upload de documentos
      const { url, error } = await uploadDocument(file, user.id, certCode as any);

      if (error) {
        console.error(`❌ [UPLOAD CERT] Erro:`, error);
        return { error };
      }

      console.log(`✅ [UPLOAD CERT] ${certCode} carregado:`, url);
      return { url };
    } catch (error) {
      console.error(`❌ [UPLOAD CERT] Exceção:`, error);
      return { error: 'Erro ao fazer upload do documento' };
    }
  };

  // Handler para upload de documentos básicos
  const handleDocumentUploaded = (type: string, url: string) => {
    setUploadedDocuments((prev) => ({
      ...prev,
      [type]: url,
    }));
    console.log(`✅ [DOCUMENTO BÁSICO] ${type} carregado:`, url);
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
    console.log(`📍 [LOCALIZAÇÃO] Lat: ${lat}, Lng: ${lng}`);

    // Preencher campos automaticamente se o endereço foi parseado
    if (parsedAddress) {
      console.log('📍 [ENDEREÇO PARSEADO]', parsedAddress);

      if (parsedAddress.postalCode) setValue('cep', parsedAddress.postalCode);
      if (parsedAddress.street) setValue('street', parsedAddress.street);
      if (parsedAddress.number) setValue('number', parsedAddress.number);
      if (parsedAddress.neighborhood) setValue('neighborhood', parsedAddress.neighborhood);
      if (parsedAddress.city) setValue('city', parsedAddress.city);
      if (parsedAddress.state) setValue('state', parsedAddress.state.toUpperCase());

      console.log(`✅ [MAPA→FORMULÁRIO] Campos preenchidos automaticamente`);
    }
  };

  // Upload de fotos de portfólio
  async function handlePortfolioUpload(files: File[]) {
    if (!user?.id) return;

    const { urls, error } = await uploadPortfolioPhotos(files, user.id);

    if (error) {
      alert(error);
      return;
    }

    setPortfolioUrls((prev) => [...prev, ...urls]);
  }

  async function onSubmit(data: ProfessionalFormData) {
    setIsSubmitting(true);

    try {
      // Mapear certificações para documentos (para validação do backend)
      const mappedDocuments = { ...uploadedDocuments };
      const validityFields: Record<string, string> = {};

      // CNH: certification 'cnh' -> document 'cnh_photo'
      if (certifications.cnh?.document_url) {
        mappedDocuments.cnh_photo = certifications.cnh.document_url;
        if (certifications.cnh.number) {
          validityFields.cnh_number = certifications.cnh.number;
        }
        if (certifications.cnh.validity) {
          validityFields.cnh_validity = certifications.cnh.validity;
        }
      }

      // CNV: certification 'cnv' -> document 'cnv_photo'
      if (certifications.cnv?.document_url) {
        mappedDocuments.cnv_photo = certifications.cnv.document_url;
        if (certifications.cnv.validity) {
          validityFields.cnv_validity = certifications.cnv.validity;
        }
      }

      // NR10: certification 'nr10' -> document 'nr10_certificate'
      if (certifications.nr10?.document_url) {
        mappedDocuments.nr10_certificate = certifications.nr10.document_url;
        if (certifications.nr10.validity) {
          validityFields.nr10_validity = certifications.nr10.validity;
        }
      }

      // NR35: certification 'nr35' -> document 'nr35_certificate'
      if (certifications.nr35?.document_url) {
        mappedDocuments.nr35_certificate = certifications.nr35.document_url;
        if (certifications.nr35.validity) {
          validityFields.nr35_validity = certifications.nr35.validity;
        }
      }

      // DRT: certification 'drt' -> document 'drt_photo'
      if (certifications.drt?.document_url) {
        mappedDocuments.drt_photo = certifications.drt.document_url;
        if (certifications.drt.validity) {
          validityFields.drt_validity = certifications.drt.validity;
        }
      }

      // Incluir URLs dos documentos no payload
      const payload = {
        ...data,
        documents: mappedDocuments,
        portfolio: portfolioUrls,
        // Sistema de subcategorias e certificações
        subcategories,
        certifications,
        // Campos de validade
        ...validityFields,
        // Geolocalização
        latitude: mapLatitude,
        longitude: mapLongitude,
      };

      console.log('📦 [FORMULÁRIO] Documentos básicos:', uploadedDocuments);
      console.log('📦 [FORMULÁRIO] Certificações:', certifications);
      console.log('📦 [FORMULÁRIO] Documentos mapeados:', mappedDocuments);
      console.log('📦 [FORMULÁRIO] Campos de validade:', validityFields);

      const response = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar cadastro');
      }

      // Redirecionar para página de sucesso
      router.push('/cadastro-profissional/sucesso');
    } catch (error) {
      console.error('Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar cadastro. Tente novamente.');
      setIsSubmitting(false);
    }
  }

  // Verificar se há documentos rejeitados
  const hasRejectedDocs = Object.values(documentValidations).some(
    (validation: DocumentValidation) => validation.status === 'rejected'
  );

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-sm text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {!isEditMode && (
            <div className="inline-block mb-4 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
              <span className="text-red-500 font-semibold text-sm">Passo 2 de 2</span>
            </div>
          )}
          {isEditMode && professionalData?.status === 'rejected' && (
            <div className="inline-block mb-4 px-4 py-2 bg-yellow-600/10 border border-yellow-600/20 rounded-full">
              <span className="text-yellow-500 font-semibold text-sm">Cadastro Rejeitado - Correção Necessária</span>
            </div>
          )}
          {isEditMode && professionalData?.status === 'pending' && (
            <div className="inline-block mb-4 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full">
              <span className="text-blue-500 font-semibold text-sm">Em Análise</span>
            </div>
          )}
          {isEditMode && professionalData?.status === 'approved' && (
            <div className="inline-block mb-4 px-4 py-2 bg-green-600/10 border border-green-600/20 rounded-full">
              <span className="text-green-500 font-semibold text-sm">Aprovado</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isEditMode ? 'Atualizar Cadastro' : 'Cadastro Profissional'}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {isEditMode
              ? 'Revise e atualize suas informações'
              : 'Preencha todos os campos abaixo para começar a receber oportunidades de trabalho'}
          </p>
        </div>

        {/* Alerta de Documentos Rejeitados */}
        {hasRejectedDocs && (
          <Card className="bg-red-500/10 border-red-500/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-500 font-semibold mb-2">
                    Documentos Rejeitados - Ação Necessária
                  </h3>
                  <p className="text-red-400 text-sm mb-3">
                    Alguns documentos foram rejeitados e precisam ser corrigidos. Revise os motivos abaixo e faça o upload novamente.
                  </p>
                  <ul className="space-y-2">
                    {Object.entries(documentValidations).map(([key, validation]: [string, any]) => {
                      if (validation.status === 'rejected') {
                        return (
                          <li key={key} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-red-400 font-medium text-sm">
                                {key.replace(/_/g, ' ').toUpperCase()}:
                              </span>
                              <span className="text-red-300 text-sm ml-2">
                                {validation.rejection_reason}
                              </span>
                            </div>
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Dados Pessoais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Dados Pessoais</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Informações básicas sobre você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Endereço</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Onde você mora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>

          {/* Localização no Mapa */}
          <LocationPicker
            latitude={mapLatitude}
            longitude={mapLongitude}
            onLocationSelect={handleLocationSelect}
            disabled={isSubmitting}
          />

          {/* Categorias e Subcategorias - Novo Organograma */}
          <CategorySubcategorySelector
            selectedSubcategories={subcategories}
            certifications={certifications}
            onSubcategoriesChange={handleSubcategoriesChange}
            onCertificationChange={handleCertificationChange}
            onCertificationUpload={handleCertificationUpload}
            disabled={isSubmitting}
          />
          {errors.categories && (
            <p className="text-red-500 text-sm mt-2 text-center">{errors.categories.message}</p>
          )}

          {/* Documentos Básicos Obrigatórios */}
          {user?.id && (
            <BasicDocumentsUpload
              userId={user.id}
              uploadedDocuments={uploadedDocuments}
              onDocumentUploaded={handleDocumentUploaded}
              disabled={isSubmitting}
            />
          )}

          {/* Experiência */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Experiência</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Conte sobre sua experiência profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      placeholder="Conte um pouco sobre sua experiência em eventos..."
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
            </CardContent>
          </Card>

          {/* Disponibilidade */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Disponibilidade</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Quando você pode trabalhar? Selecione todas as opções que se aplicam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition">
                  <Checkbox
                    checked={availability?.weekdays || false}
                    onCheckedChange={(checked) => setValue('availability.weekdays', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label className="text-sm text-zinc-200 flex-1 cursor-pointer">Segunda a Sexta</label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition">
                  <Checkbox
                    checked={availability?.weekends || false}
                    onCheckedChange={(checked) => setValue('availability.weekends', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label className="text-sm text-zinc-200 flex-1 cursor-pointer">Finais de Semana</label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition">
                  <Checkbox
                    checked={availability?.holidays || false}
                    onCheckedChange={(checked) => setValue('availability.holidays', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label className="text-sm text-zinc-200 flex-1 cursor-pointer">Feriados</label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition">
                  <Checkbox
                    checked={availability?.night || false}
                    onCheckedChange={(checked) => setValue('availability.night', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label className="text-sm text-zinc-200 flex-1 cursor-pointer">Período Noturno</label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition">
                  <Checkbox
                    checked={availability?.travel || false}
                    onCheckedChange={(checked) => setValue('availability.travel', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <label className="text-sm text-zinc-200 flex-1 cursor-pointer">Disponível para viagens</label>
                </div>
              </div>
              {errors.availability && (
                <p className="text-red-500 text-sm mt-4">{errors.availability.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Portfólio */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Portfólio</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Adicione fotos dos seus trabalhos anteriores para aumentar suas chances de contratação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioUpload
                onUpload={handlePortfolioUpload}
                currentUrls={portfolioUrls}
                maxFiles={10}
              />
            </CardContent>
          </Card>

          {/* Termos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-4">
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
                <p className="text-red-500 text-sm mt-2">{errors.acceptsTerms.message}</p>
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
            </CardContent>
          </Card>

          {/* Botão Submit */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg"
            >
              {isSubmitting
                ? 'Salvando...'
                : isEditMode
                  ? 'Atualizar Cadastro'
                  : 'Finalizar Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
