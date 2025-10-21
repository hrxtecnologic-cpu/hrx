'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { professionalSchema, type ProfessionalFormData, CATEGORIES } from '@/lib/validations/professional';
import { formatCPF, formatPhone, formatCEP, fetchAddressByCEP } from '@/lib/format';
import { uploadDocument, uploadPortfolioPhotos, type DocumentType } from '@/lib/supabase/storage';
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
import { DocumentUpload } from '@/components/DocumentUpload';
import { PortfolioUpload } from '@/components/PortfolioUpload';
import { AlertCircle, XCircle } from 'lucide-react';

export default function CadastroProfissionalPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [professionalData, setProfessionalData] = useState<any>(null);
  const [documentValidations, setDocumentValidations] = useState<any>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Campos específicos de documentos
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhValidity, setCnhValidity] = useState('');
  const [cnvValidity, setCnvValidity] = useState('');
  const [nr10Validity, setNr10Validity] = useState('');
  const [nr35Validity, setNr35Validity] = useState('');
  const [drtValidity, setDrtValidity] = useState('');

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
  const isMotorista = selectedCategories.includes('Motorista' as any);
  const isSeguranca = selectedCategories.includes('Segurança' as any);

  // Carregar dados existentes se profissional já cadastrado
  useEffect(() => {
    async function loadExistingData() {
      if (!user?.id) return;

      try {
        // Buscar dados do profissional
        const response = await fetch('/api/professional/profile');

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

          // Carregar campos de validades
          setCnhNumber(data.cnh_number || '');
          setCnhValidity(data.cnh_validity || '');
          setCnvValidity(data.cnv_validity || '');
          setNr10Validity(data.nr10_validity || '');
          setNr35Validity(data.nr35_validity || '');
          setDrtValidity(data.drt_validity || '');

          // Buscar validações de documentos
          if (data.id) {
            const validationsResponse = await fetch(`/api/professional/document-validations`);
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
    setSearchingCEP(false);

    if (address) {
      setValue('street', address.street);
      setValue('neighborhood', address.neighborhood);
      setValue('city', address.city);
      setValue('state', address.state);
    }
  }

  // Toggle categoria
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

  // Upload de documento individual
  async function handleDocumentUpload(file: File, documentType: DocumentType) {
    if (!user?.id) return;

    console.log(`🔼 [UPLOAD] Fazendo upload de: ${documentType}`);
    const { url, error } = await uploadDocument(file, user.id, documentType);

    if (error) {
      alert(error);
      return;
    }

    console.log(`✅ [UPLOAD] ${documentType} carregado:`, url);
    setUploadedDocuments((prev) => ({
      ...prev,
      [documentType]: url,
    }));
  }

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
      // Incluir URLs dos documentos no payload
      const payload = {
        ...data,
        documents: uploadedDocuments,
        portfolio: portfolioUrls,
        cnh_number: isMotorista ? cnhNumber : undefined,
        cnh_validity: cnhValidity || undefined,
        cnv_validity: cnvValidity || undefined,
        nr10_validity: nr10Validity || undefined,
        nr35_validity: nr35Validity || undefined,
        drt_validity: drtValidity || undefined,
      };

      console.log('📦 [FORMULÁRIO] Enviando documentos:', uploadedDocuments);
      console.log('📦 [FORMULÁRIO] Payload completo:', JSON.stringify(payload.documents, null, 2));

      const response = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar cadastro');
      }

      // Redirecionar para página de sucesso
      router.push('/cadastro-profissional/sucesso');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar cadastro. Tente novamente.');
      setIsSubmitting(false);
    }
  }

  // Verificar se há documentos rejeitados
  const hasRejectedDocs = Object.values(documentValidations).some(
    (validation: any) => validation.status === 'rejected'
  );

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
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
              <CardTitle className="text-white">Dados Pessoais</CardTitle>
              <CardDescription className="text-zinc-400">
                Informações básicas sobre você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-zinc-300 mb-2 block">
                  Nome Completo *
                </Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  placeholder="João da Silva"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-2">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="cpf" className="text-zinc-300 mb-2 block">
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    {...register('cpf')}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setValue('cpf', formatted);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {errors.cpf && (
                    <p className="text-red-500 text-sm mt-2">{errors.cpf.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="birthDate" className="text-zinc-300 mb-2 block">
                    Data de Nascimento *
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register('birthDate')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                  />
                  {errors.birthDate && (
                    <p className="text-red-500 text-sm mt-2">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email" className="text-zinc-300 mb-2 block">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="joao@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-zinc-300 mb-2 block">
                    Telefone/WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('phone', formatted);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
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
              <CardTitle className="text-white">Endereço</CardTitle>
              <CardDescription className="text-zinc-400">
                Onde você mora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="cep" className="text-zinc-300 mb-2 block">
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
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {searchingCEP && <p className="text-zinc-500 text-sm mt-2">Buscando...</p>}
                  {errors.cep && (
                    <p className="text-red-500 text-sm mt-2">{errors.cep.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="street" className="text-zinc-300 mb-2 block">
                    Rua *
                  </Label>
                  <Input
                    id="street"
                    {...register('street')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Rua das Flores"
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-2">{errors.street.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="number" className="text-zinc-300 mb-2 block">
                    Número *
                  </Label>
                  <Input
                    id="number"
                    {...register('number')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="123"
                  />
                  {errors.number && (
                    <p className="text-red-500 text-sm mt-2">{errors.number.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="complement" className="text-zinc-300 mb-2 block">
                    Complemento
                  </Label>
                  <Input
                    id="complement"
                    {...register('complement')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Apto 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="neighborhood" className="text-zinc-300 mb-2 block">
                    Bairro *
                  </Label>
                  <Input
                    id="neighborhood"
                    {...register('neighborhood')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="Centro"
                  />
                  {errors.neighborhood && (
                    <p className="text-red-500 text-sm mt-2">{errors.neighborhood.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city" className="text-zinc-300 mb-2 block">
                    Cidade *
                  </Label>
                  <Input
                    id="city"
                    {...register('city')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
                    placeholder="São Paulo"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-2">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-zinc-300 mb-2 block">
                    Estado *
                  </Label>
                  <Input
                    id="state"
                    {...register('state')}
                    className="bg-zinc-800 border-zinc-700 text-white h-11"
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

          {/* Categorias */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Categorias de Interesse</CardTitle>
              <CardDescription className="text-zinc-400">
                Selecione as áreas em que você deseja trabalhar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => (
                  <div
                    key={category}
                    className="flex items-center space-x-2 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category as any)}
                      onCheckedChange={() => toggleCategory(category)}
                      className="border-zinc-600"
                    />
                    <label
                      className="text-sm text-zinc-300 cursor-pointer flex-1"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
              {errors.categories && (
                <p className="text-red-500 text-sm mt-2">{errors.categories.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Experiência */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Experiência</CardTitle>
              <CardDescription className="text-zinc-400">
                Conte sobre sua experiência profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  checked={hasExperience}
                  onCheckedChange={(checked) => setValue('hasExperience', checked as boolean)}
                  className="border-zinc-600"
                />
                <label className="text-zinc-300 cursor-pointer">
                  Tenho experiência anterior em eventos
                </label>
              </div>

              {hasExperience && (
                <>
                  <div>
                    <Label htmlFor="yearsOfExperience" className="text-zinc-300 mb-2 block">
                      Anos de experiência
                    </Label>
                    <Select onValueChange={(value) => setValue('yearsOfExperience', value as any)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="<1">Menos de 1 ano</SelectItem>
                        <SelectItem value="1-3">1 a 3 anos</SelectItem>
                        <SelectItem value="3-5">3 a 5 anos</SelectItem>
                        <SelectItem value="5-10">5 a 10 anos</SelectItem>
                        <SelectItem value="10+">Mais de 10 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experienceDescription" className="text-zinc-300 mb-2 block">
                      Descreva sua experiência *
                    </Label>
                    <Textarea
                      id="experienceDescription"
                      {...register('experienceDescription')}
                      className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
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
              <CardTitle className="text-white">Disponibilidade</CardTitle>
              <CardDescription className="text-zinc-400">
                Quando você pode trabalhar? Selecione todas as opções que se aplicam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition">
                  <Checkbox
                    checked={availability?.weekdays || false}
                    onCheckedChange={(checked) => setValue('availability.weekdays', checked as boolean)}
                    className="border-zinc-600"
                  />
                  <label className="text-zinc-300 flex-1">Segunda a Sexta</label>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition">
                  <Checkbox
                    checked={availability?.weekends || false}
                    onCheckedChange={(checked) => setValue('availability.weekends', checked as boolean)}
                    className="border-zinc-600"
                  />
                  <label className="text-zinc-300 flex-1">Finais de Semana</label>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition">
                  <Checkbox
                    checked={availability?.holidays || false}
                    onCheckedChange={(checked) => setValue('availability.holidays', checked as boolean)}
                    className="border-zinc-600"
                  />
                  <label className="text-zinc-300 flex-1">Feriados</label>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition">
                  <Checkbox
                    checked={availability?.night || false}
                    onCheckedChange={(checked) => setValue('availability.night', checked as boolean)}
                    className="border-zinc-600"
                  />
                  <label className="text-zinc-300 flex-1">Período Noturno</label>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition">
                  <Checkbox
                    checked={availability?.travel || false}
                    onCheckedChange={(checked) => setValue('availability.travel', checked as boolean)}
                    className="border-zinc-600"
                  />
                  <label className="text-zinc-300 flex-1">Disponível para viagens</label>
                </div>
              </div>
              {errors.availability && (
                <p className="text-red-500 text-sm mt-4">{errors.availability.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Documentação</CardTitle>
              <CardDescription className="text-zinc-400">
                Envie seus documentos para validação. Documentos obrigatórios estão marcados com *
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Documentos Pessoais */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Documentos Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DocumentUpload
                    label="RG (Frente)"
                    description="Foto ou PDF do RG - frente"
                    documentType="rg_front"
                    onUpload={(file) => handleDocumentUpload(file, 'rg_front')}
                    currentUrl={uploadedDocuments.rg_front}
                    required
                  />
                  <DocumentUpload
                    label="RG (Verso)"
                    description="Foto ou PDF do RG - verso"
                    documentType="rg_back"
                    onUpload={(file) => handleDocumentUpload(file, 'rg_back')}
                    currentUrl={uploadedDocuments.rg_back}
                    required
                  />
                  <DocumentUpload
                    label="CPF"
                    description="Foto ou PDF do CPF"
                    documentType="cpf"
                    onUpload={(file) => handleDocumentUpload(file, 'cpf')}
                    currentUrl={uploadedDocuments.cpf}
                    required
                  />
                  <DocumentUpload
                    label="Comprovante de Residência"
                    description="Conta de luz, água ou telefone"
                    documentType="proof_of_address"
                    onUpload={(file) => handleDocumentUpload(file, 'proof_of_address')}
                    currentUrl={uploadedDocuments.proof_of_address}
                    required
                  />
                </div>
              </div>

              {/* CNH - Obrigatório para Motoristas */}
              {isMotorista && (
                <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                    <span>🚗</span>
                    CNH - Obrigatório para Motoristas
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    Como você selecionou a categoria "Motorista", é obrigatório enviar o número, validade e a foto da sua CNH (Carteira Nacional de Habilitação).
                  </p>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="cnhNumber" className="text-zinc-300 mb-2 block">
                          Número da CNH *
                        </Label>
                        <Input
                          id="cnhNumber"
                          value={cnhNumber}
                          onChange={(e) => setCnhNumber(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white h-11"
                          placeholder="00000000000"
                          maxLength={20}
                          required={isMotorista}
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                          Digite o número da sua CNH sem espaços ou pontos
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="cnhValidity" className="text-zinc-300 mb-2 block">
                          Validade da CNH *
                        </Label>
                        <Input
                          id="cnhValidity"
                          type="date"
                          value={cnhValidity}
                          onChange={(e) => setCnhValidity(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white h-11"
                          required={isMotorista}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                          A CNH deve estar válida para aprovação
                        </p>
                      </div>
                    </div>

                    <DocumentUpload
                      label="Foto da CNH"
                      description="Foto ou PDF da frente da CNH"
                      documentType="cnh_photo"
                      onUpload={(file) => handleDocumentUpload(file, 'cnh_photo')}
                      currentUrl={uploadedDocuments.cnh_photo}
                      required
                    />
                  </div>
                </div>
              )}

              {/* CNV - Obrigatório para Seguranças */}
              {isSeguranca && (
                <div className="p-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-500 mb-2 flex items-center gap-2">
                    <span>🛡️</span>
                    CNV - Obrigatório para Seguranças
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    Como você selecionou a categoria "Segurança", é obrigatório enviar a foto e a data de validade da sua CNV (Carteira Nacional de Vigilante).
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="cnvValidity" className="text-zinc-300 mb-2 block">
                        Data de Validade da CNV *
                      </Label>
                      <Input
                        id="cnvValidity"
                        type="date"
                        value={cnvValidity}
                        onChange={(e) => setCnvValidity(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white h-11"
                        required={isSeguranca}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        A CNV deve estar válida para aprovação do cadastro
                      </p>
                    </div>

                    <DocumentUpload
                      label="Foto da CNV"
                      description="Foto ou PDF da Carteira Nacional de Vigilante"
                      documentType="cnv"
                      onUpload={(file) => handleDocumentUpload(file, 'cnv')}
                      currentUrl={uploadedDocuments.cnv}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Certificações (Opcional) */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Certificações e Habilitações (Opcional)
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Envie o certificado e a data de validade. Isso aumenta suas chances de contratação.
                </p>
                <div className="space-y-6">
                  {/* NR-10 */}
                  <div className="p-4 bg-zinc-800/30 rounded-lg space-y-4">
                    <h4 className="text-white font-medium">NR-10 - Segurança em Eletricidade</h4>
                    <DocumentUpload
                      label="Certificado NR-10"
                      description="Foto ou PDF do certificado"
                      documentType="nr10"
                      onUpload={(file) => handleDocumentUpload(file, 'nr10')}
                      currentUrl={uploadedDocuments.nr10}
                    />
                    {uploadedDocuments.nr10 && (
                      <div>
                        <Label htmlFor="nr10Validity" className="text-zinc-300 mb-2 block">
                          Validade do NR-10
                        </Label>
                        <Input
                          id="nr10Validity"
                          type="date"
                          value={nr10Validity}
                          onChange={(e) => setNr10Validity(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white h-11"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                          Informe a data de validade do certificado
                        </p>
                      </div>
                    )}
                  </div>

                  {/* NR-35 */}
                  <div className="p-4 bg-zinc-800/30 rounded-lg space-y-4">
                    <h4 className="text-white font-medium">NR-35 - Trabalho em Altura</h4>
                    <DocumentUpload
                      label="Certificado NR-35"
                      description="Foto ou PDF do certificado"
                      documentType="nr35"
                      onUpload={(file) => handleDocumentUpload(file, 'nr35')}
                      currentUrl={uploadedDocuments.nr35}
                    />
                    {uploadedDocuments.nr35 && (
                      <div>
                        <Label htmlFor="nr35Validity" className="text-zinc-300 mb-2 block">
                          Validade do NR-35
                        </Label>
                        <Input
                          id="nr35Validity"
                          type="date"
                          value={nr35Validity}
                          onChange={(e) => setNr35Validity(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white h-11"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                          Informe a data de validade do certificado
                        </p>
                      </div>
                    )}
                  </div>

                  {/* DRT */}
                  <div className="p-4 bg-zinc-800/30 rounded-lg space-y-4">
                    <h4 className="text-white font-medium">DRT - Registro Profissional</h4>
                    <DocumentUpload
                      label="DRT"
                      description="Foto ou PDF do registro profissional"
                      documentType="drt"
                      onUpload={(file) => handleDocumentUpload(file, 'drt')}
                      currentUrl={uploadedDocuments.drt}
                    />
                    {uploadedDocuments.drt && (
                      <div>
                        <Label htmlFor="drtValidity" className="text-zinc-300 mb-2 block">
                          Validade do DRT
                        </Label>
                        <Input
                          id="drtValidity"
                          type="date"
                          value={drtValidity}
                          onChange={(e) => setDrtValidity(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white h-11"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                          Informe a data de validade do registro
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CNV só aparece aqui se NÃO for Segurança (para Segurança é obrigatório acima) */}
                  {!isSeguranca && (
                    <div className="p-4 bg-zinc-800/30 rounded-lg space-y-4">
                      <h4 className="text-white font-medium">CNV - Carteira Nacional de Vigilante</h4>
                      <DocumentUpload
                        label="CNV"
                        description="Foto ou PDF da Carteira Nacional de Vigilante"
                        documentType="cnv"
                        onUpload={(file) => handleDocumentUpload(file, 'cnv')}
                        currentUrl={uploadedDocuments.cnv}
                      />
                      {uploadedDocuments.cnv && (
                        <div>
                          <Label htmlFor="cnvValidityOptional" className="text-zinc-300 mb-2 block">
                            Validade da CNV
                          </Label>
                          <Input
                            id="cnvValidityOptional"
                            type="date"
                            value={cnvValidity}
                            onChange={(e) => setCnvValidity(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white h-11"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <p className="text-xs text-zinc-500 mt-2">
                            Informe a data de validade da CNV
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Portfólio */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Portfólio de Trabalhos</h3>
                <PortfolioUpload
                  onUpload={handlePortfolioUpload}
                  currentUrls={portfolioUrls}
                  maxFiles={10}
                />
              </div>
            </CardContent>
          </Card>

          {/* Termos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  checked={acceptsTerms || false}
                  onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                  className="border-zinc-600 mt-1"
                />
                <label className="text-zinc-300 text-sm leading-relaxed cursor-pointer">
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

              <div className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  checked={acceptsNotifications ?? true}
                  onCheckedChange={(checked) => setValue('acceptsNotifications', checked as boolean)}
                  className="border-zinc-600 mt-1"
                />
                <label className="text-zinc-300 text-sm leading-relaxed cursor-pointer">
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
              className="bg-red-600 hover:bg-red-500 text-white px-12 py-6 text-lg"
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
