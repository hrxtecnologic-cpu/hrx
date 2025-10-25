import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('🔍 AUDITORIA SUPABASE - HRX');
  console.log('================================\n');

  // 1. Contar registros principais
  console.log('📈 CONTAGEM DE REGISTROS:');

  const [users, professionals, suppliers, events, deliveries, notifications] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('professionals').select('*', { count: 'exact', head: true }),
    supabase.from('equipment_suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('event_projects').select('*', { count: 'exact', head: true }),
    supabase.from('delivery_trackings').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true })
  ]);

  console.log(`Users: ${users.count || 0}`);
  console.log(`Professionals: ${professionals.count || 0}`);
  console.log(`Suppliers: ${suppliers.count || 0}`);
  console.log(`Events: ${events.count || 0}`);
  console.log(`Deliveries: ${deliveries.count || 0}`);
  console.log(`Notifications: ${notifications.count || 0}`);

  console.log('\n================================\n');

  // 2. Verificar últimos usuários criados
  console.log('👥 ÚLTIMOS 5 USUÁRIOS:');
  const { data: recentUsers } = await supabase
    .from('users')
    .select('email, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  recentUsers?.forEach(u => {
    console.log(`- ${u.email} (${u.role}) - ${new Date(u.created_at).toLocaleString('pt-BR')}`);
  });

  console.log('\n================================\n');

  // 3. Verificar entregas ativas
  console.log('🚚 ENTREGAS ATIVAS:');
  const { data: activeDeliveries } = await supabase
    .from('delivery_trackings')
    .select('status')
    .in('status', ['pending', 'preparing', 'in_transit']);

  const statusCount = activeDeliveries?.reduce((acc: any, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  console.log('Pending:', statusCount?.pending || 0);
  console.log('Preparing:', statusCount?.preparing || 0);
  console.log('In Transit:', statusCount?.in_transit || 0);

  console.log('\n================================\n');

  // 4. Verificar notificações não lidas
  console.log('🔔 NOTIFICAÇÕES NÃO LIDAS:');
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  console.log(`Total: ${unreadCount || 0}`);

  console.log('\n================================\n');

  // 5. Verificar eventos futuros
  console.log('📅 EVENTOS FUTUROS:');
  const { count: futureEvents } = await supabase
    .from('event_projects')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', new Date().toISOString());

  console.log(`Total: ${futureEvents || 0}`);

  console.log('\n✅ AUDITORIA CONCLUÍDA\n');
}

audit().catch(console.error);
