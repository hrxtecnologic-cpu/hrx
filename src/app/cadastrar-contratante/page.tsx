'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contractorRegistrationSchema, ContractorRegistrationData } from '@/lib/validations/contractor-registration';
import { formatCNPJ, formatPhone } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, User, Mail, Phone, MapPin, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CadastrarContratantePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractorRegistrationData>({
    resolver: zodResolver(contractorRegistrationSchema),
  });

  const onSubmit = async (data: ContractorRegistrationData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cadastrar empresa');
      }

      console.log('✅ Empresa cadastrada:', result);

      // Redireciona para página de sucesso
      router.push('/cadastrar-contratante/sucesso');
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar empresa');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-6 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
            <span className="text-red-500 font-semibold">Cadastro de Empresa 🏢</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cadastre sua Empresa
          </h1>
          <div className="w-20 h-1 bg-red-600 mx-auto rounded-full mb-4" />
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Preencha os dados da sua empresa para começar a solicitar profissionais
          </p>
        </div>

        {/* Form */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Dados da Empresa</CardTitle>
            <CardDescription className="text-zinc-400">
              Todas as informações são mantidas em sigilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Seção 1: Dados da Empresa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-white">Dados da Empresa</h3>
                </div>

                {/* Nome da Empresa */}
                <div>
                  <Label htmlFor="companyName" className="text-white">
                    Nome da Empresa / Razão Social *
                  </Label>
                  <Input
                    id="companyName"
                    {...register('companyName')}
                    placeholder="Ex: Eventos Premium Ltda"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500 mt-1">{errors.companyName.message}</p>
                  )}
                </div>

                {/* CNPJ */}
                <div>
                  <Label htmlFor="cnpj" className="text-white">
                    CNPJ *
                  </Label>
                  <Input
                    id="cnpj"
                    {...register('cnpj')}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    onChange={(e) => {
                      const formatted = formatCNPJ(e.target.value);
                      setValue('cnpj', formatted);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.cnpj && (
                    <p className="text-sm text-red-500 mt-1">{errors.cnpj.message}</p>
                  )}
                </div>
              </div>

              {/* Seção 2: Responsável */}
              <div className="space-y-4 pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-white">Responsável</h3>
                </div>

                {/* Nome do Responsável */}
                <div>
                  <Label htmlFor="responsibleName" className="text-white">
                    Nome Completo *
                  </Label>
                  <Input
                    id="responsibleName"
                    {...register('responsibleName')}
                    placeholder="Ex: João da Silva"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.responsibleName && (
                    <p className="text-sm text-red-500 mt-1">{errors.responsibleName.message}</p>
                  )}
                </div>

                {/* Cargo */}
                <div>
                  <Label htmlFor="responsibleRole" className="text-white">
                    Cargo
                  </Label>
                  <Input
                    id="responsibleRole"
                    {...register('responsibleRole')}
                    placeholder="Ex: Gerente de Eventos"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.responsibleRole && (
                    <p className="text-sm text-red-500 mt-1">{errors.responsibleRole.message}</p>
                  )}
                </div>
              </div>

              {/* Seção 3: Contato */}
              <div className="space-y-4 pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-white">Contato</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-white">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="contato@empresa.com.br"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <Label htmlFor="phone" className="text-white">
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setValue('phone', formatted);
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 4: Informações Adicionais (Opcional) */}
              <div className="space-y-4 pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-white">
                    Informações Adicionais <span className="text-sm text-zinc-500">(Opcional)</span>
                  </h3>
                </div>

                {/* Endereço */}
                <div>
                  <Label htmlFor="companyAddress" className="text-white">
                    Endereço da Empresa
                  </Label>
                  <Input
                    id="companyAddress"
                    {...register('companyAddress')}
                    placeholder="Rua, número, bairro, cidade - UF"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.companyAddress && (
                    <p className="text-sm text-red-500 mt-1">{errors.companyAddress.message}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-white">
                    Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://www.empresa.com.br"
                      className="bg-zinc-800 border-zinc-700 text-white pl-10"
                    />
                  </div>
                  {errors.website && (
                    <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>

              {/* Termos */}
              <div className="pt-6 border-t border-zinc-800">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptsTerms"
                    checked={watch('acceptsTerms')}
                    onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="acceptsTerms" className="text-white cursor-pointer">
                      Li e aceito os{' '}
                      <Link href="/termos" target="_blank" className="text-red-500 hover:underline">
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link href="/privacidade" target="_blank" className="text-red-500 hover:underline">
                        Política de Privacidade
                      </Link>
                    </Label>
                    {errors.acceptsTerms && (
                      <p className="text-sm text-red-500 mt-1">{errors.acceptsTerms.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-6 text-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Cadastrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Cadastrar e Continuar
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>

              <p className="text-sm text-zinc-500 text-center">
                Após o cadastro, você poderá solicitar profissionais para seus eventos
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-semibold mb-2">Por que precisamos desses dados?</h4>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>• Para identificar sua empresa em nossas solicitações</li>
                <li>• Para entrar em contato sobre propostas e orçamentos</li>
                <li>• Para emitir notas fiscais e contratos quando necessário</li>
                <li>• Todos os dados são protegidos conforme a LGPD</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
