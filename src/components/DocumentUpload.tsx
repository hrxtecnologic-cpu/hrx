'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { formatFileSize } from '@/lib/supabase/storage';
import { compressImage, createPreviewUrl, revokePreviewUrl, isImageFile } from '@/lib/image-utils';
import { getUploadErrorMessage } from '@/lib/upload-utils';

interface DocumentUploadProps {
  label: string;
  description?: string;
  documentType: string;
  accept?: string;
  onUpload: (file: File) => Promise<void>;
  currentUrl?: string;
  required?: boolean;
}

export function DocumentUpload({
  label,
  description,
  documentType,
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  onUpload,
  currentUrl,
  required = false,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>(currentUrl || '');
  const [hasExistingDocument, setHasExistingDocument] = useState<boolean>(!!currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar preview quando currentUrl mudar (carregamento de dados existentes)
  useEffect(() => {
    if (currentUrl) {
      setPreview(currentUrl);
      setHasExistingDocument(true);
    }
  }, [currentUrl]);

  // Limpar URL de preview ao desmontar (liberar memória)
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        revokePreviewUrl(preview);
      }
    };
  }, [preview]);

  // Handler de mudança de arquivo com compressão
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');

    // Limpar preview anterior se for blob
    if (preview && preview.startsWith('blob:')) {
      revokePreviewUrl(preview);
    }

    // Comprimir imagem antes do upload (reduz fotos de celular de 4-12MB para ~1MB)
    let fileToUpload = selectedFile;
    if (isImageFile(selectedFile)) {
      try {
        fileToUpload = await compressImage(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
      } catch (compressionError) {
        console.warn('Compressão falhou, usando arquivo original:', compressionError);
      }
    }

    setFile(fileToUpload);

    // Preview usando createObjectURL (mais eficiente que FileReader, não causa crash em iOS)
    if (isImageFile(fileToUpload)) {
      const previewUrl = createPreviewUrl(fileToUpload);
      setPreview(previewUrl);
    } else {
      setPreview('');
    }

    // Auto-upload
    setUploading(true);
    try {
      await onUpload(fileToUpload);
    } catch (err) {
      // Mensagem de erro específica baseada no tipo de erro
      const errorMessage = getUploadErrorMessage(err);
      setError(errorMessage);
      console.error('Erro no upload:', err);
    } finally {
      setUploading(false);
    }
  }, [onUpload, preview]);

  function handleButtonClick() {
    inputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-zinc-300 text-sm sm:text-base font-medium mb-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {description && <p className="text-zinc-500 text-xs sm:text-sm mb-3">{description}</p>}
      </div>

      <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 sm:p-6 bg-zinc-800/30 hover:bg-zinc-800/50 transition">
        {/* Preview da imagem - com aspect ratio fixo */}
        {preview && (
          <div className="mb-4 w-full max-w-xs mx-auto">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-zinc-900">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Info do arquivo ou documento existente */}
        {(file || hasExistingDocument) && (
          <div className="mb-4 p-2 sm:p-3 bg-zinc-900 rounded-lg border border-zinc-700">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {file ? (
                  <>
                    <p className="text-xs sm:text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                  </>
                ) : hasExistingDocument ? (
                  <>
                    <p className="text-xs sm:text-sm text-white">Documento enviado anteriormente</p>
                    <p className="text-xs text-green-500">✓ Arquivo já carregado</p>
                  </>
                ) : null}
              </div>
              {uploading && (
                <div className="ml-2 sm:ml-3 flex-shrink-0">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-zinc-700 border-t-red-600" />
                </div>
              )}
              {!uploading && (
                <div className="ml-2 sm:ml-3 flex-shrink-0">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão de upload */}
        <div className="text-center">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`upload-${documentType}`}
          />
          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-zinc-600 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm"
          >
            {file ? 'Trocar arquivo' : hasExistingDocument ? 'Atualizar documento' : 'Escolher arquivo'}
          </Button>
          <p className="text-xs text-zinc-500 mt-2 px-2">
            PDF ou imagem (JPG, PNG, WEBP) - Máx. 10MB
          </p>
        </div>

        {/* Erro */}
        {error && <p className="text-red-500 text-xs sm:text-sm mt-3 text-center px-2">{error}</p>}
      </div>
    </div>
  );
}
