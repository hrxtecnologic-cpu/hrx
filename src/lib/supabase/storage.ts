import { createClient } from '@supabase/supabase-js';

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
    // Criar FormData
    const formData = new FormData();
    formData.append('file', file);
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
    return { url: '', error: 'Erro ao fazer upload do arquivo' };
  }
}

/**
 * Faz upload de múltiplas fotos de portfólio via API Route
 * @param files - Arquivos a serem enviados
 * @param clerkId - ID do usuário no Clerk (não usado, mantido para compatibilidade)
 * @returns URLs dos arquivos ou erro
 */
export async function uploadPortfolioPhotos(
  files: File[],
  clerkId: string
): Promise<{ urls: string[]; error?: string }> {
  try {
    const urls: string[] = [];

    for (const file of files) {
      // Criar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'portfolio');

      // Upload via API Route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { urls: [], error: data.error || 'Erro ao fazer upload' };
      }

      urls.push(data.url);
    }

    return { urls };
  } catch (error) {
    console.error('Erro no upload de portfólio:', error);
    return { urls: [], error: 'Erro ao fazer upload das fotos' };
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
