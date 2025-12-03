/**
 * Utilitários para upload de arquivos
 * - Upload com progresso real
 * - Mensagens de erro específicas
 * - Upload paralelo de múltiplos arquivos
 */

import { compressImage } from './image-utils';

export type UploadProgressCallback = (percent: number) => void;

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

export interface ParallelUploadResult {
  urls: string[];
  failures: { index: number; error: string }[];
  totalUploaded: number;
}

/**
 * Faz upload de um arquivo com progresso real usando XMLHttpRequest
 *
 * @param file - Arquivo a enviar
 * @param documentType - Tipo do documento
 * @param onProgress - Callback de progresso (0-100)
 * @returns Resultado do upload
 */
export function uploadFileWithProgress(
  file: File,
  documentType: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Listener de progresso real
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    // Sucesso
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.url || '',
            success: true,
          });
        } catch {
          resolve({
            url: '',
            success: false,
            error: 'Resposta inválida do servidor',
          });
        }
      } else {
        let errorMessage = 'Erro no upload';
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.error || errorMessage;
        } catch {
          // Usar status HTTP como fallback
          errorMessage = getHttpErrorMessage(xhr.status);
        }
        resolve({
          url: '',
          success: false,
          error: errorMessage,
        });
      }
    });

    // Erro de rede
    xhr.addEventListener('error', () => {
      resolve({
        url: '',
        success: false,
        error: 'Erro de conexão. Verifique sua internet.',
      });
    });

    // Timeout
    xhr.addEventListener('timeout', () => {
      resolve({
        url: '',
        success: false,
        error: 'Upload demorou muito. Tente com uma conexão melhor.',
      });
    });

    // Cancelado
    xhr.addEventListener('abort', () => {
      resolve({
        url: '',
        success: false,
        error: 'Upload cancelado',
      });
    });

    // Configurar requisição
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    xhr.open('POST', '/api/upload');
    xhr.timeout = 120000; // 2 minutos
    xhr.send(formData);
  });
}

/**
 * Faz upload de múltiplos arquivos em paralelo com compressão
 *
 * @param files - Arquivos a enviar
 * @param documentType - Tipo do documento
 * @param onProgress - Callback de progresso (completed, total)
 * @returns Resultado do upload paralelo
 */
export async function uploadFilesParallel(
  files: File[],
  documentType: string,
  onProgress?: (completed: number, total: number) => void
): Promise<ParallelUploadResult> {
  const total = files.length;
  let completed = 0;

  const uploadPromises = files.map(async (file, index) => {
    try {
      // Comprimir imagem antes de enviar
      const compressedFile = await compressImage(file);

      // Usar fetch para simplificar (já funciona bem)
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('documentType', documentType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      completed++;
      onProgress?.(completed, total);

      if (!response.ok) {
        return {
          index,
          success: false,
          url: '',
          error: data.error || 'Erro no upload',
        };
      }

      return {
        index,
        success: true,
        url: data.url,
      };
    } catch (error) {
      completed++;
      onProgress?.(completed, total);

      return {
        index,
        success: false,
        url: '',
        error: getUploadErrorMessage(error),
      };
    }
  });

  const results = await Promise.all(uploadPromises);

  return {
    urls: results.filter((r) => r.success).map((r) => r.url),
    failures: results
      .filter((r) => !r.success)
      .map((r) => ({ index: r.index, error: r.error || 'Erro desconhecido' })),
    totalUploaded: results.filter((r) => r.success).length,
  };
}

/**
 * Retorna mensagem de erro amigável baseada no erro
 *
 * @param error - Erro capturado
 * @returns Mensagem amigável para o usuário
 */
export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Erros de rede
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
    }

    // Erros de tamanho
    if (msg.includes('size') || msg.includes('grande') || msg.includes('large')) {
      return 'Arquivo muito grande. O tamanho máximo é 10MB.';
    }

    // Erros de tipo
    if (msg.includes('type') || msg.includes('formato') || msg.includes('format')) {
      return 'Formato inválido. Use apenas fotos (JPG, PNG) ou PDF.';
    }

    // Erros de autenticação
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('autenticação')) {
      return 'Sessão expirada. Por favor, faça login novamente.';
    }

    // Rate limit
    if (msg.includes('429') || msg.includes('many requests') || msg.includes('rate')) {
      return 'Muitos uploads em pouco tempo. Aguarde 1 minuto e tente novamente.';
    }

    // Servidor
    if (msg.includes('500') || msg.includes('server') || msg.includes('servidor')) {
      return 'Erro no servidor. Tente novamente em alguns minutos.';
    }

    // Timeout
    if (msg.includes('timeout') || msg.includes('tempo')) {
      return 'Upload demorou muito. Tente com uma conexão melhor.';
    }
  }

  // Erro genérico
  return 'Erro ao fazer upload. Tente novamente.';
}

/**
 * Retorna mensagem de erro baseada no código HTTP
 *
 * @param status - Código HTTP
 * @returns Mensagem amigável
 */
function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Arquivo inválido. Verifique o formato e tamanho.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para fazer upload.';
    case 404:
      return 'Serviço de upload não encontrado.';
    case 413:
      return 'Arquivo muito grande. Máximo 10MB.';
    case 429:
      return 'Muitos uploads. Aguarde 1 minuto.';
    case 500:
    case 502:
    case 503:
      return 'Erro no servidor. Tente novamente em alguns minutos.';
    default:
      return `Erro no upload (código ${status})`;
  }
}
