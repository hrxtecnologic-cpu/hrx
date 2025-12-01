'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  maxSize?: number; // in bytes
  bucket?: string;
  folder?: string;
}

export function ImageUploader({
  value,
  onChange,
  maxSize = 5 * 1024 * 1024, // 5MB default
  bucket = 'documents',
  folder = 'course-covers'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Apenas arquivos de imagem são permitidos');
        return;
      }

      setError(null);
      setUploading(true);

      try {
        // Fazer upload via API para usar service_role_key (bypass RLS)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('folder', folder);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao fazer upload');
        }

        const publicUrl = result.data.url;

        setPreview(publicUrl);
        onChange(publicUrl);
      } catch (err) {
        console.error('Upload error:', err);
        setError('Erro ao fazer upload da imagem. Tente novamente.');
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSize, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const removeImage = () => {
    setPreview(null);
    onChange('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="relative group">
            <div className="relative h-48 rounded-lg overflow-hidden bg-zinc-800">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-zinc-900/90 border-zinc-700 hover:bg-red-500 hover:border-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-3 truncate">{preview}</p>
        </Card>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900'
            }
            ${uploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                <p className="text-sm text-zinc-400">Fazendo upload...</p>
              </>
            ) : (
              <>
                {isDragActive ? (
                  <Upload className="h-10 w-10 text-blue-500" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-zinc-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    PNG, JPG, WEBP até {(maxSize / 1024 / 1024).toFixed(0)}MB
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Recomendado: 1200x630px
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
