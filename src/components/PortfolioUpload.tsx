'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/supabase/storage';

interface PortfolioUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  currentUrls?: string[];
  maxFiles?: number;
}

export function PortfolioUpload({
  onUpload,
  currentUrls = [],
  maxFiles = 10,
}: PortfolioUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(currentUrls);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar previews quando currentUrls mudar (carregamento de dados existentes)
  useEffect(() => {
    if (currentUrls && currentUrls.length > 0) {
      setPreviews(currentUrls);
    }
  }, [currentUrls]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Validar quantidade
    if (selectedFiles.length + previews.length > maxFiles) {
      setError(`Você pode enviar no máximo ${maxFiles} fotos`);
      return;
    }

    setError('');
    setFiles(selectedFiles);

    // Gerar previews
    const newPreviews: string[] = [];
    for (const file of selectedFiles) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === selectedFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    // Auto-upload
    setUploading(true);
    try {
      await onUpload(selectedFiles);
    } catch (err) {
      setError('Erro ao fazer upload. Tente novamente.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function removePreview(index: number) {
    setPreviews(previews.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Grid de previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-32 object-cover rounded-md border border-zinc-700"
              />
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
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
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-700 border-t-red-600" />
                <span className="text-sm text-zinc-400">Enviando fotos...</span>
              </div>
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
