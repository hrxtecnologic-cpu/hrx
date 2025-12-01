/**
 * =====================================================
 * API: Unified Service Orders View
 * =====================================================
 * Retorna TODOS os dados de OS em uma única consulta
 * Otimizado com CTE e joins
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { auth, clerkClient } from '@clerk/nextjs/server';

export interface UnifiedServiceOrder {
  id: string;
  os_number: string;
  project_id: string;
  contract_id: string;

  // Event Info
  title: string;
  event_date: string;
  event_start_time: string | null;
  event_end_time: string | null;
  venue_name: string | null;
  venue_address: string;
  venue_city: string;
  venue_state: string;

  // Client
  client_name: string;
  client_phone: string | null;

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  // AI Analysis
  ai_briefing: string;
  ai_recommendations: string | null;
  ai_alerts: string | null;

  // Logistics
  distance_from_base_km: number | null;
  estimated_travel_time_minutes: number | null;
  recommended_arrival_time: string | null;

  // Timestamps
  created_at: string;
  started_at: string | null;
  completed_at: string | null;

  // Counts
  total_tasks: number;
  completed_tasks: number;
  total_professionals: number;
  total_suppliers: number;
  total_emails_sent: number;

  // Last activity
  last_log_action: string | null;
  last_log_at: string | null;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    // 🔒 Verificar autenticação
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      logger.warn('Tentativa de acesso não autenticado a service orders unified');
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 🔒 Verificar se é admin (mesma lógica do middleware)
    const metadata = sessionClaims?.metadata;
    let isAdmin = metadata?.isAdmin === true || metadata?.role === 'admin';

    if (!isAdmin) {
      // Fallback 1: verificar por email
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);

      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

      const isAdminByEmail = ADMIN_EMAILS.includes(userEmail);

      if (isAdminByEmail) {
        isAdmin = true;
        logger.info('Admin verificado por email', { email: userEmail });
      } else {
        // Fallback 2: verificar role no banco
        const supabase = await createClient();

        const { data: user } = await supabase
          .from('users')
          .select('is_admin')
          .eq('clerk_id', userId)
          .single();

        const isAdminByRole = user?.role === 'admin';

        if (!isAdminByRole) {
          logger.warn('Tentativa de acesso não autorizado a service orders unified', {
            userId,
            email: userEmail
          });
          return NextResponse.json(
            { success: false, error: 'Acesso negado - apenas admins' },
            { status: 403 }
          );
        }

        isAdmin = true;
        logger.info('Admin verificado por role no banco', { userId });
      }
    }

    logger.info('🔍 Buscando service orders unificados...', { userId });

    const supabase = await createClient();

    // Buscar todas as ordens de serviço com relacionamentos
    const { data: rawOrders, error: fetchError } = await supabase
      .from('service_orders')
      .select(`
        *,
        tasks:service_order_tasks(id, status),
        logs:service_order_logs(action_type, created_at)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Processar manualmente
    const processed: UnifiedServiceOrder[] = (rawOrders || []).map((order: Record<string, unknown>) => {
      const tasks = order.tasks || [];
      const logs = order.logs || [];

      // Extrair profissionais e fornecedores dos assignments
      const teamAssignments = order.team_assignments || [];
      const supplierAssignments = order.supplier_assignments || [];

      // Contar emails enviados (filtrar logs de email_sent)
      const emailLogs = logs.filter((log: Record<string, unknown>) => log.action_type === 'email_sent');

      // Último log
      const lastLog = logs.length > 0 ? logs[0] : null;

      return {
        id: order.id,
        os_number: order.os_number,
        project_id: order.project_id,
        contract_id: order.contract_id,

        title: order.title,
        event_date: order.event_date,
        event_start_time: order.event_start_time,
        event_end_time: order.event_end_time,
        venue_name: order.venue_name,
        venue_address: order.venue_address,
        venue_city: order.venue_city,
        venue_state: order.venue_state,

        client_name: order.client_name,
        client_phone: order.client_phone,

        status: order.status,

        ai_briefing: order.ai_briefing,
        ai_recommendations: order.ai_recommendations,
        ai_alerts: order.ai_alerts,

        distance_from_base_km: order.distance_from_base_km,
        estimated_travel_time_minutes: order.estimated_travel_time_minutes,
        recommended_arrival_time: order.recommended_arrival_time,

        created_at: order.created_at,
        started_at: order.started_at,
        completed_at: order.completed_at,

        total_tasks: tasks.length,
        completed_tasks: tasks.filter((t: Record<string, unknown>) => t.status === 'completed').length,
        total_professionals: teamAssignments.length,
        total_suppliers: supplierAssignments.length,
        total_emails_sent: emailLogs.length,

        last_log_action: lastLog?.action_type || null,
        last_log_at: lastLog?.created_at || null,
      };
    });

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logger.info(`✅ ${processed.length} service orders carregados em ${duration}s`);

    return NextResponse.json({
      success: true,
      serviceOrders: processed,
      performance: {
        total: processed.length,
        duration_seconds: parseFloat(duration),
      },
    });
  } catch (error: unknown) {
    logger.error('❌ Erro ao buscar service orders', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar service orders',
      },
      { status: 500 }
    );
  }
}
