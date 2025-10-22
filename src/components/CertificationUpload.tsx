/**
 * Componente de Upload de Certificação - COMPACTO
 * Padrão visual: Vermelho + Zinc (sem preto)
 */

'use client';

import { useState } from 'react';
import { Upload, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Certification, CertificationConfig } from '@/types/certification';

interface CertificationUploadProps {
  config: CertificationConfig;
  certification?: Certification;
  onUpload: (file: File) => Promise<{ url?: string; error?: string }>;
  onChange: (certification: Partial<Certification>) => void;
  disabled?: boolean;
}

export function CertificationUpload({
  config,
  certification,
  onUpload,
  onChange,
  disabled = false,
}: CertificationUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Apenas JPG, PNG ou PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande (máx 10MB)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await onUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        alert(`Erro: ${result.error}`);
        return;
      }

      onChange({
        ...certification,
        document_url: result.url,
        status: 'pending' as const,
      });

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = () => {
    if (!certification?.status) return 'border-zinc-800';
    switch (certification.status) {
      case 'approved':
        return 'border-green-600/50 bg-green-600/5';
      case 'rejected':
        return 'border-red-600/50 bg-red-600/5';
      default:
        return 'border-yellow-600/50 bg-yellow-600/5';
    }
  };

  const getStatusIcon = () => {
    if (!certification?.status) return null;
    switch (certification.status) {
      case 'approved':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    }
  };

  return (
    <div className={cn('p-3 border rounded-md transition-all space-y-2', getStatusColor())}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-zinc-200">{config.label}</Label>
        {certification?.status && (
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs text-zinc-500">
              {certification.status === 'approved' ? 'OK' : certification.status === 'rejected' ? 'Rejeitado' : 'Análise'}
            </span>
          </div>
        )}
      </div>

      {/* Campos em grid compacto */}
      <div className="grid grid-cols-2 gap-3">
        {/* Número */}
        {config.requiresNumber && (
          <div>
            <Label className="text-xs text-zinc-400">Número</Label>
            <Input
              type="text"
              placeholder="Digite"
              value={certification?.number || ''}
              onChange={(e) => onChange({ ...certification, number: e.target.value })}
              disabled={disabled}
              className="h-9 bg-zinc-800 border-zinc-700 text-white text-sm mt-1.5"
            />
          </div>
        )}

        {/* Categoria (CNH) */}
        {config.requiresCategory && config.categories && (
          <div>
            <Label className="text-xs text-zinc-400">Categoria</Label>
            <Select
              value={certification?.category || ''}
              onValueChange={(value) => onChange({ ...certification, category: value })}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 text-white text-sm mt-1.5">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {config.categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Validade */}
        {config.requiresValidity && (
          <div className={config.requiresNumber || config.requiresCategory ? '' : 'col-span-2'}>
            <Label className="text-xs text-zinc-400">Validade</Label>
            <Input
              type="date"
              value={certification?.validity || ''}
              onChange={(e) => onChange({ ...certification, validity: e.target.value })}
              disabled={disabled}
              className="h-9 bg-zinc-800 border-zinc-700 text-white text-sm mt-1.5"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}
      </div>

      {/* Upload */}
      <div>
        {certification?.document_url ? (
          <div className="flex items-center gap-2 p-2 bg-zinc-800/50 border border-zinc-700 rounded-md text-sm">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-zinc-300 flex-1 truncate">Documento enviado</span>
            <a
              href={certification.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Ver
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...certification,
                    document_url: undefined,
                    status: 'pending' as const,
                  })
                }
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
              disabled={disabled || uploading}
              className="hidden"
              id={`cert-upload-${config.code}`}
            />
            <label
              htmlFor={`cert-upload-${config.code}`}
              className={cn(
                'flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-md cursor-pointer transition-all',
                'hover:border-red-600/50 hover:bg-red-600/5',
                'border-zinc-700 bg-zinc-800/30',
                (disabled || uploading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Upload className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </span>
            </label>

            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-700 rounded-b overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mensagem de rejeição */}
      {certification?.status === 'rejected' && certification?.rejection_reason && (
        <div className="p-2 bg-red-600/10 border border-red-600/30 rounded">
          <p className="text-xs text-red-400">{certification.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}
