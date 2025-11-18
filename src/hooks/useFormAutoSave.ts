import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFormAutoSaveOptions<T> {
  /**
   * Chave única para salvar no localStorage
   * Ex: 'wizard-supplier', 'wizard-client', 'onboarding-professional'
   */
  storageKey: string;

  /**
   * Dados do formulário para salvar
   */
  data: T;

  /**
   * Delay em ms antes de salvar (debounce)
   * @default 2000 (2 segundos)
   */
  debounceMs?: number;

  /**
   * Se deve mostrar toast quando salvar
   * @default true
   */
  showToast?: boolean;

  /**
   * Se deve salvar automaticamente
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook para salvar automaticamente dados do formulário no localStorage
 *
 * @example
 * ```tsx
 * const { clearDraft, hasDraft, loadDraft } = useFormAutoSave({
 *   storageKey: 'wizard-supplier',
 *   data: formData,
 *   debounceMs: 2000,
 *   showToast: true,
 * });
 *
 * // Carregar rascunho ao montar componente
 * useEffect(() => {
 *   if (hasDraft()) {
 *     const draft = loadDraft();
 *     if (draft) {
 *       reset(draft); // react-hook-form
 *     }
 *   }
 * }, []);
 *
 * // Limpar após submit bem-sucedido
 * const onSubmit = async (data) => {
 *   await api.post('/endpoint', data);
 *   clearDraft();
 * };
 * ```
 */
export function useFormAutoSave<T = unknown>({
  storageKey,
  data,
  debounceMs = 2000,
  showToast = true,
  enabled = true,
}: UseFormAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isFirstRenderRef = useRef(true);

  /**
   * Salva os dados no localStorage
   */
  const saveDraft = useCallback((dataToSave: T) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: new Date().toISOString(),
        version: '1.0',
      });

      // Só salva se houver mudanças
      if (serialized === lastSavedRef.current) {
        return;
      }

      localStorage.setItem(storageKey, serialized);
      lastSavedRef.current = serialized;

      if (showToast && !isFirstRenderRef.current) {
        toast.success('💾 Rascunho salvo automaticamente', {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('[useFormAutoSave] Erro ao salvar rascunho:', error);
    }
  }, [storageKey, showToast]);

  /**
   * Carrega o rascunho do localStorage
   */
  const loadDraft = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data as T;
    } catch (error) {
      console.error('[useFormAutoSave] Erro ao carregar rascunho:', error);
      return null;
    }
  }, [storageKey]);

  /**
   * Verifica se existe um rascunho salvo
   */
  const hasDraft = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(storageKey);
      return !!stored;
    } catch {
      return false;
    }
  }, [storageKey]);

  /**
   * Limpa o rascunho do localStorage
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      lastSavedRef.current = '';

      if (showToast) {
        toast.info('🗑️ Rascunho removido', {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('[useFormAutoSave] Erro ao limpar rascunho:', error);
    }
  }, [storageKey, showToast]);

  /**
   * Retorna idade do rascunho em minutos
   */
  const getDraftAge = useCallback((): number | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const timestamp = new Date(parsed.timestamp);
      const now = new Date();
      const ageMs = now.getTime() - timestamp.getTime();

      return Math.floor(ageMs / 1000 / 60); // minutos
    } catch {
      return null;
    }
  }, [storageKey]);

  // Auto-save com debounce
  useEffect(() => {
    if (!enabled) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Limpa timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Agenda novo save
    timeoutRef.current = setTimeout(() => {
      saveDraft(data);
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, saveDraft]);

  // Save antes de fechar a página (caso usuário feche rápido)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveDraft(data);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, enabled, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    hasDraft,
    clearDraft,
    getDraftAge,
  };
}
