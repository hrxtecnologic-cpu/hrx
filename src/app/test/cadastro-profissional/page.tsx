'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { professionalSchema, type ProfessionalFormData } from '@/lib/validations/professional';
import { formatCPF, formatPhone, formatCEP } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function TestCadastroProfissionalPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

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

  const toggleCategory = (category: string) => {
    const current = selectedCategories;
    if (current.includes(category as any)) {
      setValue(
        'categories',
        current.filter((c) => c !== category) as any
      );
    } else {
      setValue('categories', [...current, category] as any);
    }
  };

  async function onSubmit(data: ProfessionalFormData) {
    setIsSubmitting(true);
    setTestResult(null);

    try {
      console.log('🧪 Enviando dados de teste:', data);

      const response = await fetch('/api/test/professional-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao testar cadastro');
      }

      console.log('✅ Resultado do teste:', result);
      setTestResult(result);

    } catch (error) {
      console.error('❌ Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao testar cadastro');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de Teste */}
        <div className="mb-8 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
          <h2 className="text-yellow-500 font-bold text-lg mb-2">🧪 MODO DE TESTE</h2>
          <p className="text-yellow-400 text-sm">
            Esta é uma página de teste que NÃO requer autenticação Clerk. Use para validar o funcionamento do formulário e salvamento no banco de dados.
          </p>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <Alert className="mb-8 bg-green-600/10 border-green-600/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <AlertDescription className="text-green-400 ml-2">
              <strong>Teste concluído com sucesso!</strong>
              <div className="mt-2 space-y-1 text-sm">
                <div>• Professional ID: {testResult.data.professional.id}</div>
                <div>• User ID: {testResult.data.user.id}</div>
                <div>• Status: {testResult.data.professional.status}</div>
                <div>• Email: {testResult.data.professional.email}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Teste: Cadastro Profissional
          </h1>
          <p className="text-lg text-zinc-400">
            Preencha os campos para testar o salvamento no banco
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Dados Pessoais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Dados Pessoais</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Informações básicas
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
                  placeholder="João da Silva Teste"
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
                    placeholder="teste@exemplo.com"
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

          {/* Endereço Simplificado */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Endereço</CardTitle>
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
                    className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                    placeholder="00000-000"
                    maxLength={9}
                  />
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
                    placeholder="Rua Teste"
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
            </CardContent>
          </Card>

          {/* Categorias Simplificadas */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Categorias *</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Selecione pelo menos uma categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Segurança', 'Limpeza', 'Técnico', 'Recepção', 'Outros'].map((cat) => (
                  <div key={cat} className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                    <Checkbox
                      checked={selectedCategories.includes(cat as any)}
                      onCheckedChange={() => toggleCategory(cat)}
                      className="border-zinc-700 data-[state=checked]:bg-red-600"
                    />
                    <label className="text-sm text-zinc-200 cursor-pointer">{cat}</label>
                  </div>
                ))}
              </div>
              {errors.categories && (
                <p className="text-red-500 text-sm mt-4">{errors.categories.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Disponibilidade */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-200">Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                  <Checkbox
                    checked={availability?.weekdays || false}
                    onCheckedChange={(checked) => setValue('availability.weekdays', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600"
                  />
                  <label className="text-sm text-zinc-200">Segunda a Sexta</label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                  <Checkbox
                    checked={availability?.weekends || false}
                    onCheckedChange={(checked) => setValue('availability.weekends', checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-red-600"
                  />
                  <label className="text-sm text-zinc-200">Finais de Semana</label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                <Checkbox
                  checked={acceptsTerms || false}
                  onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                  className="border-zinc-700 data-[state=checked]:bg-red-600 mt-1"
                />
                <label className="text-sm text-zinc-200">
                  Aceito os termos (obrigatório para teste) *
                </label>
              </div>
              {errors.acceptsTerms && (
                <p className="text-red-500 text-sm mt-2">{errors.acceptsTerms.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Botão Submit */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg"
            >
              {isSubmitting ? 'Testando...' : '🧪 Testar Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
