'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Trash2, FileText } from 'lucide-react';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';

interface FormDraftManagerProps<T> {
  storageKey: string;
  onLoadDraft: (draft: T) => void;
  children: React.ReactNode;
}

/**
 * Componente que mostra banner para restaurar rascunho salvo
 *
 * @example
 * ```tsx
 * <FormDraftManager
 *   storageKey="wizard-supplier"
 *   onLoadDraft={(draft) => reset(draft)}
 * >
 *   {formulário aqui}
 * </FormDraftManager>
 * ```
 */
export function FormDraftManager<T = any>({
  storageKey,
  onLoadDraft,
  children,
}: FormDraftManagerProps<T>) {
  const { hasDraft, loadDraft, clearDraft, getDraftAge } = useFormAutoSave<T>({
    storageKey,
    data: {}, // Não salva automaticamente aqui, só gerencia rascunho
    enabled: false,
  });

  const [showBanner, setShowBanner] = useState(false);
  const [draftAge, setDraftAge] = useState<number | null>(null);

  useEffect(() => {
    // Verifica se tem rascunho ao montar
    if (hasDraft()) {
      setShowBanner(true);
      setDraftAge(getDraftAge());
    }
  }, [hasDraft, getDraftAge]);

  const handleLoadDraft = () => {
    const draft = loadDraft();
    if (draft) {
      onLoadDraft(draft);
      setShowBanner(false);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowBanner(false);
  };

  const formatDraftAge = (minutes: number | null): string => {
    if (minutes === null) return '';
    if (minutes < 1) return 'há alguns segundos';
    if (minutes < 60) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;

    const hours = Math.floor(minutes / 60);
    return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  };

  return (
    <>
      {showBanner && (
        <Card className="bg-blue-950/20 border-blue-900/30 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">
                  Rascunho Encontrado
                </h3>
                <p className="text-zinc-400 text-sm mb-3">
                  Encontramos um rascunho salvo{' '}
                  {draftAge !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDraftAge(draftAge)}
                    </span>
                  )}
                  . Deseja restaurá-lo?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleLoadDraft}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Restaurar Rascunho
                  </Button>
                  <Button
                    onClick={handleDiscardDraft}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {children}
    </>
  );
}
