'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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

export default function CadastroProfissionalPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
            <span className="text-red-500 font-semibold text-sm">Passo 2 de 2</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cadastro Profissional
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Preencha todos os campos abaixo para começar a receber oportunidades de trabalho
          </p>
        </div>

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

              {/* Certificações (Opcional) */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Certificações e Habilitações (Opcional)
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Envie apenas se você possuir. Isso aumenta suas chances de contratação.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DocumentUpload
                    label="NR-10"
                    description="Certificado de segurança em eletricidade"
                    documentType="nr10"
                    onUpload={(file) => handleDocumentUpload(file, 'nr10')}
                    currentUrl={uploadedDocuments.nr10}
                  />
                  <DocumentUpload
                    label="NR-35"
                    description="Certificado de trabalho em altura"
                    documentType="nr35"
                    onUpload={(file) => handleDocumentUpload(file, 'nr35')}
                    currentUrl={uploadedDocuments.nr35}
                  />
                  <DocumentUpload
                    label="DRT"
                    description="Registro profissional de técnico"
                    documentType="drt"
                    onUpload={(file) => handleDocumentUpload(file, 'drt')}
                    currentUrl={uploadedDocuments.drt}
                  />
                  <DocumentUpload
                    label="CNV"
                    description="Carteira Nacional de Vigilante"
                    documentType="cnv"
                    onUpload={(file) => handleDocumentUpload(file, 'cnv')}
                    currentUrl={uploadedDocuments.cnv}
                  />
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
              {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
