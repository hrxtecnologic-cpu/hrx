'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { professionalSchema, type ProfessionalFormData } from '@/lib/validations/professional';
import { formatCPF, formatPhone, formatCEP, fetchAddressByCEP } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MapPin, User, Briefcase, Clock } from 'lucide-react';
import { CategorySubcategorySelector } from '@/components/CategorySubcategorySelector';
import { ServiceRadiusSelector } from '@/components/ServiceRadiusSelector';
import { LocationPicker, ParsedAddress } from '@/components/LocationPicker';
import { MapboxAutocomplete, AddressSuggestion } from '@/components/MapboxAutocomplete';
import type { Subcategories, Certifications } from '@/types/certification';

export function ManualProfessionalForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingCEP, setSearchingCEP] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategories>({});
  const [certifications, setCertifications] = useState<Certifications>({});
  const [mapLatitude, setMapLatitude] = useState<number | undefined>();
  const [mapLongitude, setMapLongitude] = useState<number | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    mode: 'onChange',
    defaultValues: {
      hasExperience: false,
      acceptsTerms: true,
      acceptsNotifications: true,
      availability: {
        weekdays: true,
        weekends: true,
        holidays: false,
        night: false,
        travel: false,
      },
      categories: [],
    },
  });

  const availability = watch('availability');
  const hasExperience = watch('hasExperience');

  // Buscar endereço ao digitar CEP
  const handleCEPBlur = useCallback(async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setSearchingCEP(true);
    const address = await fetchAddressByCEP(cep);

    if (address) {
      setValue('street', address.street);
      setValue('neighborhood', address.neighborhood);
      setValue('city', address.city);
      setValue('state', address.state);
    }

    setSearchingCEP(false);
  }, [setValue]);

  // Handler para seleção do Mapbox Autocomplete
  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    setValue('street', suggestion.address || '');
    setValue('city', suggestion.city || '');
    setValue('state', suggestion.state || '');
    setMapLatitude(suggestion.coordinates.latitude);
    setMapLongitude(suggestion.coordinates.longitude);
  }, [setValue]);

  // Handler para mudança de subcategorias
  const handleSubcategoriesChange = useCallback((newSubcategories: Subcategories) => {
    setSubcategories(newSubcategories);
    const categories = Object.keys(newSubcategories).filter(
      (key) => newSubcategories[key].length > 0
    );
    setValue('categories', categories);
  }, [setValue]);

  // Handler para seleção de localização no mapa
  const handleLocationSelect = useCallback(async (
    lat: number,
    lng: number,
    address?: string,
    parsedAddress?: ParsedAddress
  ) => {
    setMapLatitude(lat);
    setMapLongitude(lng);

    if (parsedAddress) {
      if (parsedAddress.postalCode) setValue('cep', parsedAddress.postalCode);
      if (parsedAddress.street) setValue('street', parsedAddress.street);
      if (parsedAddress.number) setValue('number', parsedAddress.number);
      if (parsedAddress.neighborhood) setValue('neighborhood', parsedAddress.neighborhood);
      if (parsedAddress.city) setValue('city', parsedAddress.city);
      if (parsedAddress.state) setValue('state', parsedAddress.state.toUpperCase());
    }
  }, [setValue]);

  const onSubmit = async (data: ProfessionalFormData) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        subcategories,
        certifications,
        latitude: mapLatitude,
        longitude: mapLongitude,
        documents: {},
        portfolio: [],
      };

      const response = await fetch('/api/admin/professionals/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar profissional');
      }

      toast.success('✅ Profissional cadastrado com sucesso!');
      reset();
      setSubcategories({});
      setCertifications({});
      setMapLatitude(undefined);
      setMapLongitude(undefined);
    } catch (error: unknown) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar profissional');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* SEÇÃO 1: Dados Pessoais */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-700">
          <User className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Dados Pessoais</h3>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cpf" className="text-sm font-medium text-zinc-200">
              CPF *
            </Label>
            <Input
              id="cpf"
              {...register('cpf')}
              onChange={(e) => setValue('cpf', formatCPF(e.target.value))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onChange={(e) => setValue('phone', formatPhone(e.target.value))}
              className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-2">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Endereço */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-700">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Endereço e Localização</h3>
        </div>

        <div className="mb-4">
          <Label className="text-sm font-medium text-zinc-200 mb-2 block">
            Buscar Endereço (Opcional)
          </Label>
          <MapboxAutocomplete
            value={watch('street') || ''}
            onChange={(value) => setValue('street', value)}
            onSelect={handleAddressSelect}
            placeholder="Digite o endereço completo..."
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cep" className="text-sm font-medium text-zinc-200">
              CEP *
            </Label>
            <Input
              id="cep"
              {...register('cep')}
              onChange={(e) => setValue('cep', formatCEP(e.target.value))}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* SEÇÃO 3: Categorias */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-700">
          <Briefcase className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Categorias e Especialidades</h3>
        </div>

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
          onCertificationUpload={async () => ({ url: '' })}
          disabled={isSubmitting}
        />
        {errors.categories && (
          <p className="text-red-500 text-sm mt-4">{errors.categories.message}</p>
        )}
      </div>

      {/* SEÇÃO 4: Experiência e Disponibilidade */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-700">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Experiência e Disponibilidade</h3>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-zinc-800/50 rounded-lg">
          <Checkbox
            checked={hasExperience}
            onCheckedChange={(checked) => setValue('hasExperience', checked as boolean)}
            className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <label className="text-sm text-zinc-200 cursor-pointer">
            Tem experiência anterior em eventos
          </label>
        </div>

        {hasExperience && (
          <>
            <div>
              <Label htmlFor="yearsOfExperience" className="text-sm font-medium text-zinc-200">
                Anos de experiência
              </Label>
              <Select onValueChange={(value) => setValue('yearsOfExperience', value as 'availability.monday' | 'availability.tuesday' | 'availability.wednesday' | 'availability.thursday' | 'availability.friday' | 'availability.saturday' | 'availability.sunday')}>
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
                Descrição da experiência
              </Label>
              <Textarea
                id="experienceDescription"
                {...register('experienceDescription')}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[120px] mt-1.5"
                placeholder="Descreva a experiência..."
                rows={4}
              />
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
              <div key={key} className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  checked={availability?.[key as keyof typeof availability] || false}
                  onCheckedChange={(checked) => setValue(`availability.${key}` as 'availability.monday' | 'availability.tuesday' | 'availability.wednesday' | 'availability.thursday' | 'availability.friday' | 'availability.saturday' | 'availability.sunday', checked as boolean)}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label className="text-sm text-zinc-200 flex-1 cursor-pointer">{label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-700">
          <ServiceRadiusSelector
            value={watch('serviceRadiusKm') || 50}
            onChange={(value) => setValue('serviceRadiusKm', value)}
          />
        </div>
      </div>

      {/* Botão de Submit */}
      <div className="flex justify-end pt-6 border-t border-zinc-700">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cadastrando...
            </>
          ) : (
            'Cadastrar Profissional'
          )}
        </Button>
      </div>
    </form>
  );
}
