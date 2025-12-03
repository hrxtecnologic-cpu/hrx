import { createClient } from '@supabase/supabase-js';
import { compressImage } from '@/lib/image-utils';
import { getUploadErrorMessage } from '@/lib/upload-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente somente se as variáveis estiverem configuradas
export const supabaseClient = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export type DocumentType =
  | 'rg_front'
  | 'rg_back'
  | 'cpf'
  | 'proof_of_address'
  | 'cnh_photo'
  | 'nr10'
  | 'nr35'
  | 'drt'
  | 'cnv'
  | 'portfolio';

export interface DocumentMetadata {
  url: string;
  uploaded_at: string;
  file_name: string;
  file_size: number;
}

/**
 * Faz upload de um documento via API Route (mais seguro)
 * Inclui compressão automática de imagens para mobile
 *
 * @param file - Arquivo a ser enviado
 * @param clerkId - ID do usuário no Clerk (não usado, mantido para compatibilidade)
 * @param documentType - Tipo do documento
 * @returns URL do arquivo ou erro
 */
export async function uploadDocument(
  file: File,
  clerkId: string,
  documentType: DocumentType
): Promise<{ url: string; error?: string }> {
  try {
    // Comprimir imagem antes do upload (reduz fotos de celular de 4-12MB para ~1MB)
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
      } catch (compressionError) {
        console.warn('Compressão falhou, usando arquivo original:', compressionError);
      }
    }

    // Criar FormData
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('documentType', documentType);

    // Upload via API Route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: '', error: data.error || 'Erro ao fazer upload' };
    }

    return { url: data.url };
  } catch (error) {
    console.error('Erro no upload:', error);
    const errorMessage = getUploadErrorMessage(error);
    return { url: '', error: errorMessage };
  }
}

/**
 * Faz upload de múltiplas fotos de portfólio via API Route
 * Upload PARALELO com compressão automática - muito mais rápido que sequencial
 *
 * @param files - Arquivos a serem enviados
 * @param clerkId - ID do usuário no Clerk (não usado, mantido para compatibilidade)
 * @param onProgress - Callback opcional de progresso (completed, total)
 * @returns URLs dos arquivos ou erro
 */
export async function uploadPortfolioPhotos(
  files: File[],
  clerkId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{ urls: string[]; error?: string; failures?: number }> {
  try {
    const total = files.length;
    let completed = 0;

    // Upload PARALELO - muito mais rápido que sequencial
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Comprimir imagem antes do upload
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
            });
          } catch (compressionError) {
            console.warn(`Compressão falhou para arquivo ${index}:`, compressionError);
          }
        }

        // Criar FormData
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('documentType', 'portfolio');

        // Upload via API Route
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        completed++;
        onProgress?.(completed, total);

        if (!response.ok) {
          return { success: false, url: '', index, error: data.error };
        }

        return { success: true, url: data.url, index };
      } catch (error) {
        completed++;
        onProgress?.(completed, total);

        return { success: false, url: '', index, error: getUploadErrorMessage(error) };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Separar sucessos e falhas
    const successfulUploads = results.filter((r) => r.success);
    const failedUploads = results.filter((r) => !r.success);

    // Se todos falharam, retornar erro
    if (successfulUploads.length === 0 && failedUploads.length > 0) {
      return {
        urls: [],
        error: failedUploads[0].error || 'Erro ao fazer upload das fotos',
        failures: failedUploads.length,
      };
    }

    // Se alguns falharam, retornar os sucessos com aviso
    if (failedUploads.length > 0) {
      console.warn(`${failedUploads.length} de ${total} uploads falharam`);
    }

    return {
      urls: successfulUploads.map((r) => r.url),
      failures: failedUploads.length,
    };
  } catch (error) {
    console.error('Erro no upload de portfólio:', error);
    const errorMessage = getUploadErrorMessage(error);
    return { urls: [], error: errorMessage };
  }
}

/**
 * Deleta um documento do Storage
 * @param clerkId - ID do usuário no Clerk
 * @param documentType - Tipo do documento
 */
export async function deleteDocument(
  clerkId: string,
  documentType: DocumentType
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se o cliente Supabase está disponível
    if (!supabaseClient) {
      return { success: false, error: 'Supabase não configurado. Configure as variáveis de ambiente.' };
    }

    // Listar arquivos com o prefixo
    const { data: files } = await supabaseClient.storage
      .from('professional-documents')
      .list(clerkId);

    if (!files) {
      return { success: false, error: 'Nenhum arquivo encontrado' };
    }

    // Encontrar arquivo do tipo especificado
    const fileToDelete = files.find((f) => f.name.startsWith(documentType));

    if (!fileToDelete) {
      return { success: false, error: 'Arquivo não encontrado' };
    }

    // Deletar
    const { error } = await supabaseClient.storage
      .from('professional-documents')
      .remove([`${clerkId}/${fileToDelete.name}`]);

    if (error) {
      console.error('Erro ao deletar:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    return { success: false, error: 'Erro ao deletar arquivo' };
  }
}

/**
 * Formata tamanho de arquivo para exibição
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
