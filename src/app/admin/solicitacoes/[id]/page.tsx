import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Redirect: /admin/solicitacoes/[id] → /admin/projetos/[migrated_id]
 *
 * Esta página foi consolidada com a página de projetos.
 * Tenta encontrar o projeto migrado correspondente.
 */
export default async function SolicitacaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Tentar encontrar o projeto migrado a partir do contractor_request_id
  const { data: migratedProject } = await supabase
    .from('event_projects')
    .select('id')
    .eq('migrated_from_contractor_request_id', id)
    .single();

  if (migratedProject) {
    // Redirecionar para o projeto migrado
    redirect(`/admin/projetos/${migratedProject.id}`);
  }

  // Se não encontrou, redirecionar para a lista de projetos
  redirect('/admin/projetos');
}
