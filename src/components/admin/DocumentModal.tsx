'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ZoomIn, ZoomOut, Maximize2, RotateCw, ExternalLink, X } from 'lucide-react';

interface DocumentModalProps {
  documentUrl: string;
  documentName: string;
  trigger?: React.ReactNode;
  professionalData?: {
    full_name?: string;
    cpf?: string;
    birth_date?: string;
    cnh_number?: string;
    cnh_validity?: string;
    cnv_validity?: string;
    nr10_validity?: string;
    nr35_validity?: string;
    drt_validity?: string;
  };
}

export function DocumentModal({
  documentUrl,
  documentName,
  trigger,
  professionalData,
}: DocumentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const isPDF = documentUrl?.toLowerCase().includes('.pdf');

  // Reset zoom e rotação ao fechar
  useEffect(() => {
    if (!isOpen) {
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleFullscreen = () => window.open(documentUrl, '_blank');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none border-zinc-300 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white text-xs sm:text-sm"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ver Documento</span>
            <span className="sm:hidden">Ver</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] bg-zinc-900 border-zinc-800 p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-white text-sm sm:text-base truncate pr-8">
              {documentName}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Toolbar - Responsivo */}
        <div className="px-3 sm:px-6 py-3 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/50">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isPDF && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 px-2 sm:px-3"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">-</span>
                </Button>

                <span className="text-xs sm:text-sm text-zinc-400 min-w-[50px] text-center font-medium px-1">
                  {zoom}%
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 px-2 sm:px-3"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">+</span>
                </Button>

                <div className="w-px h-6 bg-zinc-700 hidden sm:block" />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRotate}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 px-2 sm:px-3"
                  title="Girar imagem"
                >
                  <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">Girar</span>
                </Button>

                <div className="w-px h-6 bg-zinc-700 hidden sm:block" />
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleFullscreen}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 px-2 sm:px-3"
              title="Abrir em nova aba"
            >
              <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Tela cheia</span>
            </Button>
          </div>
        </div>

        {/* Document Viewer - Flex-1 para preencher espaço */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 min-h-0">
          <div className="rounded-lg overflow-auto bg-zinc-800 flex items-center justify-center min-h-full">
            {isPDF ? (
              <iframe
                src={documentUrl}
                className="w-full h-full min-h-[400px] sm:min-h-[600px]"
                title={documentName}
              />
            ) : (
              <img
                src={documentUrl}
                alt={documentName}
                className="max-w-full h-auto transition-transform duration-300 object-contain"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              />
            )}
          </div>
        </div>

        {/* Informações do Profissional - Opcional */}
        {professionalData && (
          <div className="px-3 sm:px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 flex-shrink-0 max-h-[30vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                <h4 className="text-white font-medium text-sm">Informações do Profissional</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { label: 'Nome', value: professionalData.full_name },
                  { label: 'CPF', value: professionalData.cpf },
                  { label: 'Data Nasc.', value: professionalData.birth_date },
                  { label: 'CNH', value: professionalData.cnh_number },
                  { label: 'Validade CNH', value: professionalData.cnh_validity },
                  { label: 'Validade CNV', value: professionalData.cnv_validity },
                  { label: 'Validade NR-10', value: professionalData.nr10_validity },
                  { label: 'Validade NR-35', value: professionalData.nr35_validity },
                  { label: 'Validade DRT', value: professionalData.drt_validity },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-zinc-400 text-xs sm:text-sm font-medium whitespace-nowrap">
                        {item.label}:
                      </span>
                      <span className="text-white text-sm sm:text-base font-semibold break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions - Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-t border-zinc-800 flex-shrink-0 bg-zinc-900/50">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="w-full sm:w-auto text-xs sm:text-sm border-zinc-300 text-zinc-300 hover:bg-zinc-800 hover:border-white hover:text-white"
          >
            <a href={documentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Abrir em nova aba</span>
              <span className="sm:hidden">Nova aba</span>
            </a>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
