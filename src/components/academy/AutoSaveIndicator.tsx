'use client';

import { Check, Loader2, Clock, AlertCircle } from 'lucide-react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
  error?: string | null;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  error
}: AutoSaveIndicatorProps) {
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 10) return 'agora mesmo';
    if (diffSec < 60) return `há ${diffSec}s`;
    if (diffMin < 60) return `há ${diffMin}min`;

    const hours = Math.floor(diffMin / 60);
    if (hours < 24) return `há ${hours}h`;

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-zinc-400">Salvando rascunho...</span>
        </>
      )}

      {status === 'saved' && lastSaved && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-zinc-400">
            Salvo {formatTimestamp(lastSaved)}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-400">
            {error || 'Erro ao salvar'}
          </span>
        </>
      )}
    </div>
  );
}
