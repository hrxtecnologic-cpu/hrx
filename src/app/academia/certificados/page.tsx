'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Award,
  Calendar,
  Download,
  ExternalLink,
  Loader2,
  Search,
  CheckCircle,
  Copy,
  Share2,
} from 'lucide-react';

interface Certificate {
  id: string;
  certificate_code: string;
  course_id: string;
  issued_at: string;
  courses?: {
    title: string;
    category: string;
    workload_hours: number;
  };
}

export default function CertificadosPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/entrar');
      return;
    }

    const fetchCertificates = async () => {
      try {
        const res = await fetch('/api/academy/my-certificates');
        const data = await res.json();

        if (data.success) {
          setCertificates(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar certificados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user, isLoaded, router]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShare = (certificate: Certificate) => {
    const validationUrl = `${window.location.origin}/api/academy/certificates/${certificate.certificate_code}/validate`;

    if (navigator.share) {
      navigator.share({
        title: `Certificado - ${certificate.courses?.title}`,
        text: `Confira meu certificado do curso ${certificate.courses?.title}!`,
        url: validationUrl,
      });
    } else {
      navigator.clipboard.writeText(validationUrl);
      alert('Link de validação copiado para a área de transferência!');
    }
  };

  const filteredCertificates = certificates.filter((cert) =>
    cert.courses?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Meus Certificados</h1>
          </div>
          <p className="text-zinc-400">
            Visualize e compartilhe seus certificados de conclusão
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total de Certificados</p>
                  <p className="text-2xl font-bold text-white">{certificates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Horas de Estudo</p>
                  <p className="text-2xl font-bold text-white">
                    {certificates.reduce((total, cert) => total + (cert.courses?.workload_hours || 0), 0)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Último Certificado</p>
                  <p className="text-sm font-medium text-white">
                    {certificates.length > 0
                      ? new Date(certificates[0].issued_at).toLocaleDateString('pt-BR')
                      : 'Nenhum'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {certificates.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por curso ou código..."
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates List */}
        {filteredCertificates.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <div className="inline-block p-6 bg-zinc-800/50 rounded-full mb-4">
                <Award className="h-12 w-12 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Nenhum certificado encontrado' : 'Nenhum certificado ainda'}
              </h3>
              <p className="text-zinc-400 mb-6">
                {searchTerm
                  ? 'Tente buscar por outro termo'
                  : 'Complete cursos para ganhar certificados'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push('/academia')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Explorar Cursos
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCertificates.map((certificate) => (
              <Card
                key={certificate.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Certificate Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                    </div>

                    {/* Certificate Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {certificate.courses?.title || 'Curso'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="border-zinc-700">
                              {certificate.courses?.category}
                            </Badge>
                            <span>{certificate.courses?.workload_hours}h</span>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Code */}
                      <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Código de Validação</p>
                            <p className="text-sm font-mono text-white">
                              {certificate.certificate_code}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyCode(certificate.certificate_code)}
                            className="flex items-center gap-2"
                          >
                            {copiedCode === certificate.certificate_code ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => alert('Funcionalidade de download do PDF em desenvolvimento')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleShare(certificate)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/api/academy/certificates/${certificate.certificate_code}/validate`,
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Validar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        {certificates.length > 0 && (
          <Card className="bg-blue-500/10 border-blue-500/20 mt-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Validação de Certificados</h3>
                  <p className="text-sm text-zinc-300">
                    Todos os certificados podem ser validados através do código único. Empresas e
                    instituições podem verificar a autenticidade acessando o link de validação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
