import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verifica se um usuário tem documentos no storage (mesmo sem cadastro completo)
 */
export async function checkUserHasDocumentsInStorage(clerkId: string): Promise<{
  hasDocuments: boolean;
  documentsCount: number;
  files: string[];
}> {
  try {
    const { data: files, error } = await supabase.storage
      .from('professional-documents')
      .list(clerkId, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`Erro ao verificar documentos para ${clerkId}:`, error);
      return { hasDocuments: false, documentsCount: 0, files: [] };
    }

    if (!files || files.length === 0) {
      return { hasDocuments: false, documentsCount: 0, files: [] };
    }

    // Filtrar apenas arquivos (não pastas)
    const actualFiles = files.filter(file => file.name !== '.emptyFolderPlaceholder' && file.id);

    return {
      hasDocuments: actualFiles.length > 0,
      documentsCount: actualFiles.length,
      files: actualFiles.map(f => f.name)
    };
  } catch (error) {
    console.error(`Exceção ao verificar documentos para ${clerkId}:`, error);
    return { hasDocuments: false, documentsCount: 0, files: [] };
  }
}

/**
 * Verifica documentos no storage para múltiplos usuários (batch)
 */
export async function checkMultipleUsersDocuments(clerkIds: string[]): Promise<Map<string, {
  hasDocuments: boolean;
  documentsCount: number;
  files: string[];
}>> {
  const results = new Map();

  // Processar em batches de 10 para não sobrecarregar
  const batchSize = 10;
  for (let i = 0; i < clerkIds.length; i += batchSize) {
    const batch = clerkIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (clerkId) => {
        const result = await checkUserHasDocumentsInStorage(clerkId);
        return [clerkId, result] as [string, typeof result];
      })
    );

    batchResults.forEach(([clerkId, result]) => {
      results.set(clerkId, result);
    });
  }

  return results;
}
