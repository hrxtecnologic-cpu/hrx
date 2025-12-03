/**
 * Utilitários para processamento de imagens
 * - Compressão client-side para mobile
 * - Criação de previews eficientes
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Comprime uma imagem antes do upload
 * Reduz drasticamente o tamanho de fotos de celular (4-12MB -> ~1MB)
 *
 * @param file - Arquivo de imagem
 * @param options - Opções de compressão
 * @returns Arquivo comprimido ou original se não for imagem/já pequeno
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Não comprimir se não for imagem
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Não comprimir se já for pequeno (menor que 1MB)
  if (file.size < 1024 * 1024) {
    return file;
  }

  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
  } = options;

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    });

    // Manter o nome original
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
    });
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    // Retorna arquivo original se compressão falhar
    return file;
  }
}

/**
 * Cria URL de preview para arquivo (mais eficiente que FileReader)
 * Usa URL.createObjectURL que não carrega tudo na memória
 *
 * @param file - Arquivo para preview
 * @returns URL do blob
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoga URL de preview para liberar memória
 * IMPORTANTE: Chamar quando o componente desmontar ou preview mudar
 *
 * @param url - URL do blob a ser revogada
 */
export function revokePreviewUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Verifica se um arquivo é uma imagem válida
 *
 * @param file - Arquivo a verificar
 * @returns true se for imagem
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Verifica se um arquivo é PDF
 *
 * @param file - Arquivo a verificar
 * @returns true se for PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}
