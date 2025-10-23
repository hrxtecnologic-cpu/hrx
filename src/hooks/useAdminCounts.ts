import { useEffect, useState } from 'react';

interface AdminCounts {
  documents: number;
}

interface UseAdminCountsResult {
  counts: AdminCounts;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar contadores do menu admin (badges)
 *
 * Busca:
 * - documents: Profissionais com status 'pending'
 *
 * Atualiza automaticamente a cada 30 segundos
 *
 * @example
 * const { counts, loading, refetch } = useAdminCounts();
 * console.log(counts.documents); // 12
 */
export function useAdminCounts(): UseAdminCountsResult {
  const [counts, setCounts] = useState<AdminCounts>({
    documents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/admin/counts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Se não é admin ou não autenticado, silenciosamente retorna 0
        if (response.status === 401 || response.status === 403) {
          setCounts({ documents: 0 });
          setError(null);
          return;
        }

        throw new Error('Erro ao buscar contadores');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setCounts(data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao buscar contadores admin:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Em caso de erro, manter valores anteriores ao invés de zerar
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      fetchCounts();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts,
  };
}
