'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/supabase/storage';

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
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    // Preview para imagens
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('');
    }

    // Auto-upload
    setUploading(true);
    try {
      await onUpload(selectedFile);
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

  return (
    <div className="space-y-3">
      <div>
        <label className="text-zinc-300 text-sm font-medium mb-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {description && <p className="text-zinc-500 text-xs mb-3">{description}</p>}
      </div>

      <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 bg-zinc-800/30 hover:bg-zinc-800/50 transition">
        {/* Preview da imagem */}
        {preview && (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="max-h-40 rounded-lg mx-auto" />
          </div>
        )}

        {/* Info do arquivo */}
        {file && (
          <div className="mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
              </div>
              {uploading && (
                <div className="ml-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-700 border-t-red-600" />
                </div>
              )}
              {!uploading && (
                <div className="ml-3">
                  <svg
                    className="h-5 w-5 text-green-500"
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
            className="border-zinc-600 hover:bg-zinc-700 text-zinc-300"
          >
            {file ? 'Trocar arquivo' : 'Escolher arquivo'}
          </Button>
          <p className="text-xs text-zinc-500 mt-2">
            PDF ou imagem (JPG, PNG, WEBP) - Máx. 10MB
          </p>
        </div>

        {/* Erro */}
        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
      </div>
    </div>
  );
}
