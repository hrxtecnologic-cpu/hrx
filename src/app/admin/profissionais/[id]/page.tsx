import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { ProfessionalActions } from '@/components/admin/ProfessionalActions';
import { DocumentViewer } from '@/components/admin/DocumentViewer';
import { DocumentValidation } from '@/components/admin/DocumentValidation';
import { ProfessionalHistory } from '@/components/admin/ProfessionalHistory';
import { EditProfessionalModal } from '@/components/admin/EditProfessionalModal';

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar profissional
  const { data: professional, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !professional) {
    notFound();
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl p-4 sm:p-0">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
            {professional.full_name}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {professional.status === 'approved' ? (
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm bg-green-500/10 text-green-500 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Aprovado
              </span>
            ) : professional.status === 'pending' ? (
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm bg-yellow-500/10 text-yellow-500 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Pendente de Validação
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm bg-red-500/10 text-red-500 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Rejeitado
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
          <EditProfessionalModal professional={professional} />
          <ProfessionalActions professionalId={id} currentStatus={professional.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Coluna Principal - Documentos */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Documentos Obrigatórios - NOVA VALIDAÇÃO INDIVIDUAL */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Validação de Documentos
              </CardTitle>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                Aprove ou rejeite cada documento individualmente com feedback específico
              </p>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <DocumentValidation
                professionalId={id}
                documentType="rg_front"
                documentUrl={professional.documents?.rg_front}
                professionalData={{
                  full_name: professional.full_name,
                  cpf: professional.cpf,
                  birth_date: professional.birth_date,
                  street: professional.street,
                  number: professional.number,
                  complement: professional.complement,
                  neighborhood: professional.neighborhood,
                  city: professional.city,
                  state: professional.state,
                  cep: professional.cep,
                }}
              />
              <DocumentValidation
                professionalId={id}
                documentType="rg_back"
                documentUrl={professional.documents?.rg_back}
                professionalData={{
                  full_name: professional.full_name,
                  cpf: professional.cpf,
                  birth_date: professional.birth_date,
                  street: professional.street,
                  number: professional.number,
                  complement: professional.complement,
                  neighborhood: professional.neighborhood,
                  city: professional.city,
                  state: professional.state,
                  cep: professional.cep,
                }}
              />
              <DocumentValidation
                professionalId={id}
                documentType="cpf"
                documentUrl={professional.documents?.cpf}
                professionalData={{
                  full_name: professional.full_name,
                  cpf: professional.cpf,
                  birth_date: professional.birth_date,
                  street: professional.street,
                  number: professional.number,
                  complement: professional.complement,
                  neighborhood: professional.neighborhood,
                  city: professional.city,
                  state: professional.state,
                  cep: professional.cep,
                }}
              />
              <DocumentValidation
                professionalId={id}
                documentType="proof_of_address"
                documentUrl={professional.documents?.proof_of_address}
                professionalData={{
                  full_name: professional.full_name,
                  cpf: professional.cpf,
                  birth_date: professional.birth_date,
                  street: professional.street,
                  number: professional.number,
                  complement: professional.complement,
                  neighborhood: professional.neighborhood,
                  city: professional.city,
                  state: professional.state,
                  cep: professional.cep,
                }}
              />

              {/* CNH - Obrigatório para Motoristas */}
              {professional.categories?.includes('Motorista') && (
                <DocumentValidation
                  professionalId={id}
                  documentType="cnh_photo"
                  documentUrl={professional.documents?.cnh_photo}
                  professionalData={{
                    full_name: professional.full_name,
                    cnh_number: professional.cnh_number,
                    cnh_validity: professional.cnh_validity,
                  }}
                />
              )}

              {/* CNV - Obrigatório para Seguranças */}
              {professional.categories?.includes('Segurança') && (
                <DocumentValidation
                  professionalId={id}
                  documentType="cnv"
                  documentUrl={professional.documents?.cnv}
                  professionalData={{
                    full_name: professional.full_name,
                    cnv_validity: professional.cnv_validity,
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Histórico de Alterações */}
          <ProfessionalHistory professionalId={id} />

          {/* Certificações (Opcional) */}
          {(professional.documents?.nr10 ||
            professional.documents?.nr35 ||
            professional.documents?.drt ||
            (professional.documents?.cnv && !professional.categories?.includes('Segurança'))) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Certificações
                </CardTitle>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                  Certificações opcionais que aumentam as chances de contratação
                </p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {professional.documents?.nr10 && (
                  <DocumentValidation
                    professionalId={id}
                    documentType="nr10"
                    documentUrl={professional.documents.nr10}
                    professionalData={{
                      full_name: professional.full_name,
                      nr10_validity: professional.nr10_validity,
                    }}
                  />
                )}
                {professional.documents?.nr35 && (
                  <DocumentValidation
                    professionalId={id}
                    documentType="nr35"
                    documentUrl={professional.documents.nr35}
                    professionalData={{
                      full_name: professional.full_name,
                      nr35_validity: professional.nr35_validity,
                    }}
                  />
                )}
                {professional.documents?.drt && (
                  <DocumentValidation
                    professionalId={id}
                    documentType="drt"
                    documentUrl={professional.documents.drt}
                    professionalData={{
                      full_name: professional.full_name,
                      drt_validity: professional.drt_validity,
                    }}
                  />
                )}
                {/* CNV só aparece aqui se NÃO for Segurança (para Segurança aparece na seção obrigatória) */}
                {professional.documents?.cnv && !professional.categories?.includes('Segurança') && (
                  <DocumentValidation
                    professionalId={id}
                    documentType="cnv"
                    documentUrl={professional.documents.cnv}
                    professionalData={{
                      full_name: professional.full_name,
                      cnv_validity: professional.cnv_validity,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Portfólio */}
          {professional.portfolio && professional.portfolio.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">Portfólio</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {professional.portfolio.map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-red-600 transition"
                    >
                      <img
                        src={url}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral - Informações */}
        <div className="space-y-4 sm:space-y-6">
          {/* Dados Pessoais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-sm sm:text-base">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Nome Completo</p>
                  <p className="text-sm text-white">{professional.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">CPF</p>
                  <p className="text-sm text-white">{professional.cpf}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Data de Nascimento</p>
                  <p className="text-sm text-white">
                    {new Date(professional.birth_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-white break-all">{professional.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Telefone</p>
                  <p className="text-sm text-white">{professional.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Endereço</p>
                  <p className="text-sm text-white">
                    {professional.street}, {professional.number}
                    {professional.complement && `, ${professional.complement}`}
                  </p>
                  <p className="text-sm text-white">
                    {professional.neighborhood}, {professional.city} - {professional.state}
                  </p>
                  <p className="text-sm text-white">CEP: {professional.cep}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorias */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-sm sm:text-base">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap gap-2">
                {professional.categories?.map((cat: string) => (
                  <span
                    key={cat}
                    className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Experiência */}
          {professional.has_experience && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-sm sm:text-base flex items-center gap-2">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                  Experiência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                {professional.years_of_experience && (
                  <div>
                    <p className="text-xs text-zinc-500">Anos de Experiência</p>
                    <p className="text-sm text-white">{professional.years_of_experience}</p>
                  </div>
                )}
                {professional.experience_description && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Descrição</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {professional.experience_description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disponibilidade */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-sm sm:text-base">Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm">
                {professional.availability?.weekdays && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-zinc-300">Segunda a Sexta</span>
                  </div>
                )}
                {professional.availability?.weekends && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-zinc-300">Finais de Semana</span>
                  </div>
                )}
                {professional.availability?.holidays && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-zinc-300">Feriados</span>
                  </div>
                )}
                {professional.availability?.night && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-zinc-300">Período Noturno</span>
                  </div>
                )}
                {professional.availability?.travel && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-zinc-300">Viagens</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-1.5 sm:space-y-2 text-xs">
                <div>
                  <span className="text-zinc-500">Cadastrado em:</span>
                  <p className="text-white">
                    {new Date(professional.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {professional.updated_at && (
                  <div>
                    <span className="text-zinc-500">Última atualização:</span>
                    <p className="text-white">
                      {new Date(professional.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
