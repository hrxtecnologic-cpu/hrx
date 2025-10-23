import { redirect } from 'next/navigation';

/**
 * =====================================================
 * REDIRECT: Dashboard Antigo → Dashboard Novo
 * =====================================================
 * Este dashboard foi consolidado com o novo sistema
 * Redireciona para: /professional/dashboard
 * =====================================================
 */
export default function DashboardProfissionalRedirectPage() {
  redirect('/professional/dashboard');
}
