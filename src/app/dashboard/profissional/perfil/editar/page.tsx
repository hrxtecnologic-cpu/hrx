'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, AlertCircle, Upload, CheckCircle, FileText, XCircle } from 'lucide-react';
import Link from 'next/link';
import { DocumentUpload } from '@/components/DocumentUpload';

export default function EditProfessionalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [professional, setProfessional] = useState<any>(null);
  const [documentValidations, setDocumentValidations] = useState<any>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});

  // Estados do formulário
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cpf: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
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
          street: data.street || '',
          number: data.number || '',
          complement: data.complement || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          cep: data.cep || '',
          bio: data.bio || '',
        });

        // Buscar validações de documentos
        if (data.id) {
          try {
            const validationsResponse = await fetch(`/api/admin/professionals/${data.id}/documents`);
            if (validationsResponse.ok) {
              const validationsData = await validationsResponse.json();
              setDocumentValidations(validationsData.validations || {});
            }
          } catch (err) {
            console.error('Erro ao buscar validações:', err);
          }
        }
      } catch (error) {
        console.error('Erro:', error);
        setError('Erro ao carregar perfil. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Função para fazer upload de documento
  async function handleDocumentUpload(file: File, documentType: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro no upload');

      const { url } = await response.json();

      setUploadedDocuments((prev) => ({
        ...prev,
        [documentType]: url,
      }));

      return url;
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload. Tente novamente.');
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Mesclar documentos existentes com novos uploads
      const updatedDocuments = {
        ...professional.documents,
        ...uploadedDocuments,
      };

      const response = await fetch('/api/professional/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          documents: updatedDocuments,
        }),
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
                <Label htmlFor="cep" className="text-zinc-300">
                  CEP
                </Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cep: e.target.value }))
                  }
                  placeholder="00000-000"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street" className="text-zinc-300">
                  Rua/Avenida
                </Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, street: e.target.value }))
                  }
                  placeholder="Nome da rua"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="number" className="text-zinc-300">
                  Número
                </Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, number: e.target.value }))
                  }
                  placeholder="123"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complement" className="text-zinc-300">
                  Complemento
                </Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, complement: e.target.value }))
                  }
                  placeholder="Apto, Bloco, etc"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="neighborhood" className="text-zinc-300">
                  Bairro
                </Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))
                  }
                  placeholder="Nome do bairro"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
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

        {/* Documentos Rejeitados ou Pendentes */}
        {Object.keys(documentValidations).some(
          (key) =>
            documentValidations[key]?.status === 'rejected' ||
            !professional?.documents?.[key]
        ) && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Documentos para Corrigir
              </CardTitle>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                Envie novamente os documentos rejeitados ou faltantes
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* RG Frente */}
              {(documentValidations.rg_front?.status === 'rejected' ||
                !professional?.documents?.rg_front) && (
                <div className="space-y-2">
                  {documentValidations.rg_front?.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-500">
                            RG (Frente) - Rejeitado
                          </p>
                          <p className="text-xs text-red-400 mt-1">
                            {documentValidations.rg_front.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <DocumentUpload
                    label="RG (Frente) *"
                    documentType="rg_front"
                    onUpload={(file) => handleDocumentUpload(file, 'rg_front')}
                    required
                  />
                </div>
              )}

              {/* RG Verso */}
              {(documentValidations.rg_back?.status === 'rejected' ||
                !professional?.documents?.rg_back) && (
                <div className="space-y-2">
                  {documentValidations.rg_back?.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-500">
                            RG (Verso) - Rejeitado
                          </p>
                          <p className="text-xs text-red-400 mt-1">
                            {documentValidations.rg_back.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <DocumentUpload
                    label="RG (Verso) *"
                    documentType="rg_back"
                    onUpload={(file) => handleDocumentUpload(file, 'rg_back')}
                    required
                  />
                </div>
              )}

              {/* CPF */}
              {(documentValidations.cpf?.status === 'rejected' ||
                !professional?.documents?.cpf) && (
                <div className="space-y-2">
                  {documentValidations.cpf?.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-500">CPF - Rejeitado</p>
                          <p className="text-xs text-red-400 mt-1">
                            {documentValidations.cpf.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <DocumentUpload
                    label="CPF *"
                    documentType="cpf"
                    onUpload={(file) => handleDocumentUpload(file, 'cpf')}
                    required
                  />
                </div>
              )}

              {/* Comprovante de Residência */}
              {(documentValidations.proof_of_address?.status === 'rejected' ||
                !professional?.documents?.proof_of_address) && (
                <div className="space-y-2">
                  {documentValidations.proof_of_address?.status === 'rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-500">
                            Comprovante de Residência - Rejeitado
                          </p>
                          <p className="text-xs text-red-400 mt-1">
                            {documentValidations.proof_of_address.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <DocumentUpload
                    label="Comprovante de Residência *"
                    documentType="proof_of_address"
                    onUpload={(file) => handleDocumentUpload(file, 'proof_of_address')}
                    required
                  />
                </div>
              )}

              {/* CNH (se for motorista) */}
              {professional?.categories?.includes('Motorista') &&
                (documentValidations.cnh_photo?.status === 'rejected' ||
                  !professional?.documents?.cnh_photo) && (
                  <div className="space-y-2">
                    {documentValidations.cnh_photo?.status === 'rejected' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-500">
                              CNH - Rejeitado
                            </p>
                            <p className="text-xs text-red-400 mt-1">
                              {documentValidations.cnh_photo.rejection_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <DocumentUpload
                      label="CNH (Foto) *"
                      documentType="cnh_photo"
                      onUpload={(file) => handleDocumentUpload(file, 'cnh_photo')}
                      required
                    />
                  </div>
                )}
            </CardContent>
          </Card>
        )}

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
