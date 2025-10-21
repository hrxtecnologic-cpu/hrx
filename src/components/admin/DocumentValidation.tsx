'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, FileText, ZoomIn, ZoomOut, Maximize2, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DocumentValidationProps {
  professionalId: string;
  documentType: string;
  documentUrl?: string;
  currentStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  version?: number;
  reviewedAt?: string;
  onStatusUpdate?: () => void;
  professionalData?: {
    full_name?: string;
    cpf?: string;
    birth_date?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
    cnh_number?: string;
    cnh_validity?: string;
    cnv_validity?: string;
    nr10_validity?: string;
    nr35_validity?: string;
    drt_validity?: string;
  };
}

const DOCUMENT_LABELS: Record<string, string> = {
  rg_front: 'RG - Frente',
  rg_back: 'RG - Verso',
  cpf: 'CPF',
  proof_of_address: 'Comprovante de Residência',
  cnh_photo: 'CNH - Carteira Nacional de Habilitação',
  cnv: 'CNV - Carteira Nacional de Vigilante',
  nr10: 'NR-10 - Segurança em Eletricidade',
  nr35: 'NR-35 - Trabalho em Altura',
  drt: 'DRT - Registro Profissional',
  work_permit: 'Carteira de Trabalho',
  criminal_record: 'Antecedentes Criminais',
  vaccination_card: 'Cartão de Vacinação',
  other: 'Outro',
};

export function DocumentValidation({
  professionalId,
  documentType,
  documentUrl,
  currentStatus: initialStatus = 'pending',
  rejectionReason: initialRejectionReason,
  version: initialVersion = 1,
  reviewedAt: initialReviewedAt,
  onStatusUpdate,
  professionalData,
}: DocumentValidationProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100); // Zoom em porcentagem
  const [rotation, setRotation] = useState(0); // Rotação em graus (0, 90, 180, 270)

  // Estado local para status, rejection reason e reviewedAt
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'approved' | 'rejected'>(initialStatus);
  const [rejectionReason, setRejectionReason] = useState(initialRejectionReason);
  const [version, setVersion] = useState(initialVersion);
  const [reviewedAt, setReviewedAt] = useState(initialReviewedAt);

  const isPDF = documentUrl?.toLowerCase().includes('.pdf') || false;

  // Resetar zoom e rotação quando modal fecha
  useEffect(() => {
    if (!isModalOpen) {
      setZoom(100);
      setRotation(0);
    }
  }, [isModalOpen]);

  // Carregar status do documento
  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch(`/api/admin/professionals/${professionalId}/documents`);
        if (!response.ok) return;

        const data = await response.json();
        const validation = data.validations?.[documentType];

        if (validation) {
          setCurrentStatus(validation.status);
          setRejectionReason(validation.rejection_reason);
          setVersion(validation.version);
          setReviewedAt(validation.reviewed_at);
        }
      } catch (error) {
        console.error('Erro ao carregar status:', error);
      }
    }

    loadStatus();
  }, [professionalId, documentType]);

  async function handleApprove() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: documentType,
          status: 'approved',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao aprovar');
      }

      // Atualizar estado local
      setCurrentStatus('approved');
      setRejectionReason(undefined);
      setReviewedAt(new Date().toISOString());

      onStatusUpdate?.();
    } catch (error) {
      console.error('Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao aprovar documento');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      alert('Digite o motivo da rejeição');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: documentType,
          status: 'rejected',
          rejection_reason: rejectReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao rejeitar');
      }

      // Atualizar estado local
      setCurrentStatus('rejected');
      setRejectionReason(rejectReason);
      setReviewedAt(new Date().toISOString());

      setShowRejectForm(false);
      setRejectReason('');
      onStatusUpdate?.();
    } catch (error) {
      console.error('Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao rejeitar documento');
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
      label: 'Pendente',
    },
    approved: {
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
      label: 'Aprovado',
    },
    rejected: {
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-500',
      label: 'Rejeitado',
    },
  };

  const status = statusConfig[currentStatus];
  const StatusIcon = status.icon;

  // Determinar quais dados mostrar baseado no tipo de documento
  const getRelevantData = () => {
    if (!professionalData) return null;

    switch (documentType) {
      case 'rg_front':
      case 'rg_back':
        return [
          { label: 'Nome', value: professionalData.full_name },
          { label: 'CPF', value: professionalData.cpf },
          {
            label: 'Nascimento',
            value: professionalData.birth_date
              ? new Date(professionalData.birth_date).toLocaleDateString('pt-BR')
              : undefined,
          },
        ];
      case 'cpf':
        return [
          { label: 'Nome', value: professionalData.full_name },
          { label: 'CPF', value: professionalData.cpf },
        ];
      case 'proof_of_address':
        const address = [
          professionalData.street,
          professionalData.number,
          professionalData.complement,
        ]
          .filter(Boolean)
          .join(', ');
        const cityState = [professionalData.city, professionalData.state]
          .filter(Boolean)
          .join(' - ');
        return [
          { label: 'Endereço', value: address || undefined },
          { label: 'Bairro', value: professionalData.neighborhood },
          { label: 'Cidade/Estado', value: cityState || undefined },
          { label: 'CEP', value: professionalData.cep },
        ];
      case 'cnh_photo':
        return [
          { label: 'Nome', value: professionalData.full_name },
          { label: 'Número da CNH', value: professionalData.cnh_number },
          {
            label: 'Validade da CNH',
            value: professionalData.cnh_validity
              ? new Date(professionalData.cnh_validity).toLocaleDateString('pt-BR')
              : undefined,
          },
        ];
      case 'cnv':
        return [
          { label: 'Nome', value: professionalData.full_name },
          {
            label: 'Validade da CNV',
            value: professionalData.cnv_validity
              ? new Date(professionalData.cnv_validity).toLocaleDateString('pt-BR')
              : undefined,
          },
        ];
      case 'nr10':
        return [
          { label: 'Nome', value: professionalData.full_name },
          {
            label: 'Validade do NR-10',
            value: professionalData.nr10_validity
              ? new Date(professionalData.nr10_validity).toLocaleDateString('pt-BR')
              : undefined,
          },
        ];
      case 'nr35':
        return [
          { label: 'Nome', value: professionalData.full_name },
          {
            label: 'Validade do NR-35',
            value: professionalData.nr35_validity
              ? new Date(professionalData.nr35_validity).toLocaleDateString('pt-BR')
              : undefined,
          },
        ];
      case 'drt':
        return [
          { label: 'Nome', value: professionalData.full_name },
          {
            label: 'Validade do DRT',
            value: professionalData.drt_validity
              ? new Date(professionalData.drt_validity).toLocaleDateString('pt-BR')
              : undefined,
          },
        ];
      default:
        return null;
    }
  };

  const relevantData = getRelevantData();

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-medium text-sm sm:text-base">
              {DOCUMENT_LABELS[documentType] || documentType}
            </h4>
            {version > 1 && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                v{version}
              </span>
            )}
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap ${status.bgColor}`}>
            <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${status.textColor}`} />
            <span className={`text-xs font-medium ${status.textColor}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Documento */}
        {documentUrl ? (
          <div className="mb-3 flex flex-col sm:flex-row gap-2">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-zinc-300 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white text-xs sm:text-sm"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Visualizar Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-white text-sm sm:text-base">
                      {DOCUMENT_LABELS[documentType] || documentType}
                    </DialogTitle>

                    {/* Controles de Zoom e Rotação (só para imagens) */}
                    {!isPDF && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Rotação */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRotation((prev) => (prev + 90) % 360)}
                          className="h-8 w-8 p-0 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
                          title="Girar 90°"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-zinc-700 hidden sm:block" />

                        {/* Zoom */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setZoom((prev) => Math.max(50, prev - 25))}
                          disabled={zoom <= 50}
                          className="h-8 w-8 p-0 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
                          title="Diminuir zoom"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>

                        <span className="text-xs text-zinc-400 min-w-[50px] text-center font-medium">
                          {zoom}%
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setZoom((prev) => Math.min(300, prev + 25))}
                          disabled={zoom >= 300}
                          className="h-8 w-8 p-0 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
                          title="Aumentar zoom"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setZoom(100)}
                          disabled={zoom === 100}
                          className="h-8 w-8 p-0 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
                          title="Resetar zoom"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-auto space-y-4">
                  {/* Documento */}
                  <div className="rounded-lg overflow-auto bg-zinc-800 flex items-center justify-center min-h-[400px]">
                    {isPDF ? (
                      <iframe
                        src={documentUrl}
                        className="w-full h-full min-h-[400px] sm:min-h-[600px]"
                        title={DOCUMENT_LABELS[documentType]}
                      />
                    ) : (
                      <img
                        src={documentUrl}
                        alt={DOCUMENT_LABELS[documentType]}
                        className="max-w-full h-auto transition-transform duration-300"
                        style={{
                          transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                          transformOrigin: 'center',
                          cursor: zoom > 100 ? 'move' : 'default'
                        }}
                      />
                    )}
                  </div>

                  {/* Dados para validação no modal */}
                  {relevantData && relevantData.length > 0 && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <p className="text-sm font-semibold text-blue-400">
                          Dados para validação:
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {relevantData.map((item, index) => (
                          item.value && (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="text-zinc-400 text-xs sm:text-sm font-medium">
                                {item.label}:
                              </span>
                              <span className="text-white text-sm sm:text-base font-semibold break-words">
                                {item.value}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end border-t border-zinc-800 pt-4">
                  <Button size="sm" variant="outline" asChild className="text-xs sm:text-sm border-zinc-300 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white">
                    <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Abrir em nova aba</span>
                      <span className="sm:hidden">Nova aba</span>
                    </a>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="ghost" asChild className="text-zinc-400 sm:w-auto">
              <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="mb-3 p-2 sm:p-3 bg-zinc-800/50 rounded text-xs sm:text-sm text-zinc-500 text-center">
            Documento não enviado
          </div>
        )}

        {/* Dados para validação */}
        {relevantData && relevantData.length > 0 && (
          <div className="mb-3 p-3 sm:p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
              <p className="text-xs sm:text-sm font-medium text-blue-400">
                Dados para validação:
              </p>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {relevantData.map((item, index) => (
                item.value && (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-zinc-500 text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">
                      {item.label}:
                    </span>
                    <span className="text-white text-xs sm:text-sm font-medium break-words flex-1">
                      {item.value}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Motivo da rejeição */}
        {currentStatus === 'rejected' && rejectionReason && (
          <div className="mb-3 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-red-400 mb-1">Motivo da rejeição:</p>
                <p className="text-xs text-red-300 break-words">{rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info de revisão */}
        {reviewedAt && (
          <p className="text-xs text-zinc-500 mb-3 break-words">
            Revisado em {new Date(reviewedAt).toLocaleString('pt-BR')}
          </p>
        )}

        {/* Ações */}
        {documentUrl && currentStatus === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleApprove}
              disabled={loading}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-500 text-xs sm:text-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Aprovar
            </Button>
            <Button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={loading}
              size="sm"
              variant="destructive"
              className="flex-1 text-xs sm:text-sm"
            >
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}

        {/* Formulário de rejeição */}
        {showRejectForm && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Digite o motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleReject}
                disabled={loading}
                size="sm"
                variant="destructive"
                className="flex-1 text-xs sm:text-sm"
              >
                Confirmar Rejeição
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                disabled={loading}
                size="sm"
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
