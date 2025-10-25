'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function TestSolicitarEventoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [requestType, setRequestType] = useState<'client' | 'supplier' | null>(null);

  const { register, handleSubmit } = useForm();

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    setTestResult(null);

    try {
      const payload = {
        ...data,
        request_type: requestType,
        // Para cliente - usar o nome correto do campo
        ...(requestType === 'client' && {
          professionals: [
            {
              category_group: 'Segurança',
              category: 'Segurança Patrimonial',
              quantity: 2,
              requirements: 'Com experiência'
            }
          ]
        }),
        // Para fornecedor
        ...(requestType === 'supplier' && {
          equipment_types: ['Mesa', 'Cadeira']
        }),
      };

      console.log('🧪 Enviando dados de teste:', payload);

      const response = await fetch('/api/test/event-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao testar solicitação');
      }

      console.log('✅ Resultado do teste:', result);
      setTestResult(result);

    } catch (error) {
      console.error('❌ Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao testar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!requestType) {
    return (
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
            <h2 className="text-yellow-500 font-bold text-lg mb-2">🧪 MODO DE TESTE</h2>
            <p className="text-yellow-400 text-sm">
              Escolha o tipo de solicitação para testar
            </p>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Teste: Solicitar Evento
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setRequestType('client')}
              className="p-8 bg-zinc-900 border-2 border-zinc-800 hover:border-red-600 rounded-lg transition-all hover:scale-105"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Cliente</h3>
              <p className="text-zinc-400">Testar solicitação de evento</p>
            </button>

            <button
              onClick={() => setRequestType('supplier')}
              className="p-8 bg-zinc-900 border-2 border-zinc-800 hover:border-red-600 rounded-lg transition-all hover:scale-105"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Fornecedor</h3>
              <p className="text-zinc-400">Testar cadastro de fornecedor</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
          <h2 className="text-yellow-500 font-bold text-lg mb-2">
            🧪 MODO DE TESTE - {requestType === 'client' ? 'CLIENTE' : 'FORNECEDOR'}
          </h2>
          <button
            onClick={() => setRequestType(null)}
            className="text-yellow-400 text-sm underline"
          >
            ← Voltar para seleção
          </button>
        </div>

        {testResult && (
          <Alert className="mb-8 bg-green-600/10 border-green-600/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <AlertDescription className="text-green-400 ml-2">
              <strong>Teste concluído com sucesso!</strong>
              <div className="mt-2 space-y-1 text-sm">
                <div>• ID: {testResult.data.id}</div>
                {requestType === 'client' && (
                  <>
                    <div>• Cliente: {testResult.data.client_name}</div>
                    <div>• Evento: {testResult.data.event_name}</div>
                  </>
                )}
                {requestType === 'supplier' && (
                  <>
                    <div>• Empresa: {testResult.data.company_name}</div>
                    <div>• Contato: {testResult.data.contact_name}</div>
                  </>
                )}
                <div>• Status: {testResult.data.status}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {requestType === 'client' ? 'Teste: Solicitar Evento' : 'Teste: Cadastro Fornecedor'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {requestType === 'client' ? (
            // FORMULÁRIO CLIENTE
            <>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-200">Seus Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Nome *</Label>
                    <Input
                      {...register('client_name')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="João Silva Teste"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-zinc-200">Email *</Label>
                      <Input
                        {...register('client_email')}
                        type="email"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                        placeholder="teste@exemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-zinc-200">Telefone *</Label>
                      <Input
                        {...register('client_phone')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-200">Dados do Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Nome do Evento *</Label>
                    <Input
                      {...register('event_name')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Festa Corporativa de Fim de Ano"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Tipo de Evento *</Label>
                    <Input
                      {...register('event_type')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Corporativo"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Descrição *</Label>
                    <Textarea
                      {...register('event_description')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Descreva seu evento..."
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-200">Localização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Endereço *</Label>
                    <Input
                      {...register('venue_address')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Rua Teste, 123"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-zinc-200">Cidade *</Label>
                      <Input
                        {...register('venue_city')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                        placeholder="São Paulo"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-zinc-200">Estado *</Label>
                      <Input
                        {...register('venue_state')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                        placeholder="SP"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            // FORMULÁRIO FORNECEDOR
            <>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-200">Dados da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Nome da Empresa *</Label>
                    <Input
                      {...register('company_name')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Empresa Teste Ltda"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Nome do Contato *</Label>
                    <Input
                      {...register('contact_name')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-zinc-200">Email *</Label>
                      <Input
                        {...register('email')}
                        type="email"
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                        placeholder="contato@empresa.com"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-zinc-200">Telefone *</Label>
                      <Input
                        {...register('phone')}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-zinc-200">Observações</Label>
                    <Textarea
                      {...register('notes')}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1.5"
                      placeholder="Informações adicionais sobre sua empresa..."
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg"
            >
              {isSubmitting ? 'Testando...' : '🧪 Testar Solicitação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
