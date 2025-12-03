'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { createPreviewUrl, revokePreviewUrl } from '@/lib/image-utils';
import { getUploadErrorMessage } from '@/lib/upload-utils';

interface PortfolioUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  currentUrls?: string[];
  maxFiles?: number;
}

interface UploadProgress {
  completed: number;
  total: number;
}

export function PortfolioUpload({
  onUpload,
  currentUrls = [],
  maxFiles = 10,
}: PortfolioUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ completed: 0, total: 0 });
  const [previews, setPreviews] = useState<string[]>(currentUrls);
  const [blobUrls, setBlobUrls] = useState<string[]>([]); // Para rastrear URLs de blob criadas
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar previews quando currentUrls mudar (carregamento de dados existentes)
  useEffect(() => {
    if (currentUrls && currentUrls.length > 0) {
      setPreviews(currentUrls);
    }
  }, [currentUrls]);

  // Limpar URLs de blob ao desmontar (liberar memória)
  useEffect(() => {
    return () => {
      blobUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          revokePreviewUrl(url);
        }
      });
    };
  }, [blobUrls]);

  // Handler de mudança de arquivo com compressão e upload paralelo
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Validar quantidade
    if (selectedFiles.length + previews.length > maxFiles) {
      setError(`Você pode enviar no máximo ${maxFiles} fotos`);
      return;
    }

    setError('');
    setUploadProgress({ completed: 0, total: selectedFiles.length });

    // Gerar previews usando createObjectURL (mais eficiente que FileReader)
    const newPreviews: string[] = [];
    const newBlobUrls: string[] = [];

    for (const file of selectedFiles) {
      const previewUrl = createPreviewUrl(file);
      newPreviews.push(previewUrl);
      newBlobUrls.push(previewUrl);
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
    setBlobUrls((prev) => [...prev, ...newBlobUrls]);

    // Auto-upload
    setUploading(true);
    try {
      await onUpload(selectedFiles);
    } catch (err) {
      // Mensagem de erro específica
      const errorMessage = getUploadErrorMessage(err);
      setError(errorMessage);
      console.error('Erro no upload do portfólio:', err);
    } finally {
      setUploading(false);
      setUploadProgress({ completed: 0, total: 0 });
    }
  }, [maxFiles, onUpload, previews.length]);

  const handleButtonClick = useCallback(() => {
    // Fechar teclado virtual antes de abrir seletor de arquivos (melhoria mobile)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      inputRef.current?.click();
    }, 100);
  }, []);

  const removePreview = useCallback((index: number) => {
    // Limpar URL de blob se necessário
    const urlToRemove = previews[index];
    if (urlToRemove && urlToRemove.startsWith('blob:')) {
      revokePreviewUrl(urlToRemove);
      setBlobUrls((prev) => prev.filter((url) => url !== urlToRemove));
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, [previews]);

  return (
    <div className="space-y-3">
      {/* Grid de previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group h-32">
              <Image
                src={preview}
                alt={`Portfolio ${index + 1}`}
                fill
                className="object-cover rounded-md border border-zinc-700"
              />
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {previews.length < maxFiles && (
        <div className="border-2 border-dashed border-zinc-700 rounded-md p-6 bg-zinc-800/50 hover:bg-zinc-700/50 transition text-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            multiple
            id="upload-portfolio"
          />

          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div>
              <Button
                type="button"
                onClick={handleButtonClick}
                disabled={uploading}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-700 text-white"
              >
                {uploading ? 'Enviando...' : 'Adicionar fotos'}
              </Button>
              <p className="text-xs text-zinc-400 mt-2">
                Imagens JPG, PNG ou WEBP - Máx. 10MB cada
              </p>
            </div>
          </div>

          {/* Progresso */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-700 border-t-red-600" />
                <span className="text-sm text-zinc-400">
                  {uploadProgress.total > 0
                    ? `Enviando ${uploadProgress.completed + 1} de ${uploadProgress.total}...`
                    : 'Processando fotos...'}
                </span>
              </div>
              {uploadProgress.total > 0 && (
                <div className="w-full bg-zinc-700 rounded h-1.5">
                  <div
                    className="h-full bg-red-600 rounded transition-all duration-300"
                    style={{
                      width: `${((uploadProgress.completed) / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Erro */}
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      )}

      {/* Contador */}
      <p className="text-xs text-zinc-400 text-center">
        {previews.length} de {maxFiles} fotos
      </p>
    </div>
  );
}
