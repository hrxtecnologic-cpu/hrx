import { redirect } from 'next/navigation';

/**
 * Redirect: /admin/solicitacoes → /admin/projetos
 *
 * Esta página foi consolidada com a página de projetos.
 * O sistema antigo de "contractor_requests" foi migrado para "event_projects".
 */
export default function SolicitacoesPage() {
  redirect('/admin/projetos');
}
