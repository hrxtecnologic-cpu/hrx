'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, AlertCircle, Upload, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditProfessionalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [professional, setProfessional] = useState<any>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cpf: '',
    city: '',
    state: '',
    address: '',
    zip_code: '',
    bio: '',
  });

  // Carregar dados do profissional
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/professional/profile');
        if (!response.ok) throw new Error('Erro ao carregar perfil');

        const data = await response.json();
        setProfessional(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          cpf: data.cpf || '',
          city: data.city || '',
          state: data.state || '',
          address: data.address || '',
          zip_code: data.zip_code || '',
          bio: data.bio || '',
        });
      } catch (error) {
        console.error('Erro:', error);
        setError('Erro ao carregar perfil. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/professional/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      setSuccess(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/profissional');
      }, 2000);
    } catch (error) {
      setError('Erro ao salvar. Tente novamente.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <Link href="/dashboard/profissional">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Editar Perfil</h1>
          <p className="text-sm sm:text-base text-zinc-400">Atualize suas informações cadastrais</p>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {success && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-500">
                  Perfil atualizado com sucesso!
                </p>
                <p className="text-xs text-green-400">
                  Redirecionando para o dashboard...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-400 break-words">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta se foi rejeitado */}
      {professional?.status === 'rejected' && professional?.rejection_reason && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-500 mb-2">
                  Seu cadastro precisa de ajustes:
                </p>
                <p className="text-xs sm:text-sm text-red-400 whitespace-pre-line break-words">
                  {professional.rejection_reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Informações Pessoais */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-base sm:text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="full_name" className="text-zinc-300 text-xs sm:text-sm">
                  Nome Completo *
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-zinc-300">
                  Telefone/WhatsApp *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                  placeholder="(11) 99999-9999"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="cpf" className="text-zinc-300">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cpf: e.target.value }))
                  }
                  required
                  placeholder="000.000.000-00"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="zip_code" className="text-zinc-300">
                  CEP
                </Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, zip_code: e.target.value }))
                  }
                  placeholder="00000-000"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-zinc-300">
                Endereço Completo
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Rua, número, complemento"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-zinc-300">
                  Cidade *
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-zinc-300">
                  Estado *
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, state: e.target.value }))
                  }
                  required
                  placeholder="SP"
                  maxLength={2}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-zinc-300">
                Sobre Você (Opcional)
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Conte um pouco sobre sua experiência profissional..."
                rows={4}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-500">
                ⚠️ Para reenviar documentos, entre em contato com o suporte ou use o formulário de cadastro completo.
              </p>
              <p className="text-xs text-yellow-500/70 mt-2">
                Em breve você poderá enviar documentos diretamente por aqui.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-500 text-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-2" />
                <span className="text-xs sm:text-sm">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="text-xs sm:text-sm">Salvar Alterações</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
