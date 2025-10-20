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
    <div className="space-y-6 max-w-7xl">
      {/* Header com ações */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{professional.full_name}</h1>
          <div className="flex items-center gap-3">
            {professional.status === 'approved' ? (
              <span className="inline-flex items-center gap-1 text-sm bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                Aprovado
              </span>
            ) : professional.status === 'pending' ? (
              <span className="inline-flex items-center gap-1 text-sm bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full">
                <AlertCircle className="h-4 w-4" />
                Pendente de Validação
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                <XCircle className="h-4 w-4" />
                Rejeitado
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <ProfessionalActions professionalId={id} currentStatus={professional.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Documentos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documentos Obrigatórios */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Documentos Obrigatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentViewer
                label="RG - Frente"
                url={professional.documents?.rg_front}
                required
              />
              <DocumentViewer
                label="RG - Verso"
                url={professional.documents?.rg_back}
                required
              />
              <DocumentViewer
                label="CPF"
                url={professional.documents?.cpf}
                required
              />
              <DocumentViewer
                label="Comprovante de Residência"
                url={professional.documents?.proof_of_address}
                required
              />
            </CardContent>
          </Card>

          {/* Certificações (Opcional) */}
          {(professional.documents?.nr10 ||
            professional.documents?.nr35 ||
            professional.documents?.drt ||
            professional.documents?.cnv) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Certificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional.documents?.nr10 && (
                  <DocumentViewer label="NR-10" url={professional.documents.nr10} />
                )}
                {professional.documents?.nr35 && (
                  <DocumentViewer label="NR-35" url={professional.documents.nr35} />
                )}
                {professional.documents?.drt && (
                  <DocumentViewer label="DRT" url={professional.documents.drt} />
                )}
                {professional.documents?.cnv && (
                  <DocumentViewer label="CNV" url={professional.documents.cnv} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Portfólio */}
          {professional.portfolio && professional.portfolio.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Portfólio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <div className="space-y-6">
          {/* Dados Pessoais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            <CardHeader>
              <CardTitle className="text-white text-base">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
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
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Experiência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
            <CardHeader>
              <CardTitle className="text-white text-base">Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent>
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
            <CardContent className="p-4">
              <div className="space-y-2 text-xs">
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
