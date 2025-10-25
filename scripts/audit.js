require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fullAudit() {
  console.log('🔍 AUDITORIA COMPLETA SUPABASE - HRX\n');
  console.log('==================================================\n');

  // 1. REGISTROS POR TABELA
  console.log('📊 REGISTROS POR TABELA:\n');

  const [users, professionals, suppliers, events, requests, deliveries, locations, notifications, teamMembers, emails] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('professionals').select('*', { count: 'exact', head: true }),
    supabase.from('equipment_suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('event_projects').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }),
    supabase.from('delivery_trackings').select('*', { count: 'exact', head: true }),
    supabase.from('delivery_location_history').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase.from('team_members').select('*', { count: 'exact', head: true }),
    supabase.from('email_logs').select('*', { count: 'exact', head: true })
  ]);

  console.log(`Users: ${users.count || 0}`);
  console.log(`Professionals: ${professionals.count || 0}`);
  console.log(`Suppliers: ${suppliers.count || 0}`);
  console.log(`Events: ${events.count || 0}`);
  console.log(`Requests: ${requests.count || 0}`);
  console.log(`Delivery Trackings: ${deliveries.count || 0}`);
  console.log(`Location History: ${locations.count || 0}`);
  console.log(`Notifications: ${notifications.count || 0}`);
  console.log(`Team Members: ${teamMembers.count || 0}`);
  console.log(`Email Logs: ${emails.count || 0}`);

  console.log('\n==================================================\n');

  // 2. USUÁRIOS POR ROLE
  console.log('👥 USUÁRIOS POR ROLE:\n');
  const { data: allUsers } = await supabase
    .from('users')
    .select('role');

  const roleCount = allUsers?.reduce((acc, u) => {
    const role = u.role || 'null';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  Object.entries(roleCount || {}).forEach(([role, count]) => {
    console.log(`${role}: ${count}`);
  });

  console.log('\nÚltimos 5 usuários criados:');
  const { data: recentUsers } = await supabase
    .from('users')
    .select('email, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  recentUsers?.forEach(u => {
    const date = new Date(u.created_at).toLocaleDateString('pt-BR');
    console.log(`- ${u.email} (${u.role || 'sem role'}) - ${date}`);
  });

  console.log('\n==================================================\n');

  // 3. EVENTOS
  console.log('📅 ANÁLISE DE EVENTOS:\n');
  const now = new Date().toISOString();

  const { count: futureEvents } = await supabase
    .from('event_projects')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', now);

  const { count: pastEvents } = await supabase
    .from('event_projects')
    .select('*', { count: 'exact', head: true })
    .lt('event_date', now);

  console.log(`Eventos futuros: ${futureEvents || 0}`);
  console.log(`Eventos passados: ${pastEvents || 0}`);

  const { data: nextEvents } = await supabase
    .from('event_projects')
    .select('event_name, event_date, venue_city')
    .gte('event_date', now)
    .order('event_date', { ascending: true })
    .limit(3);

  if (nextEvents && nextEvents.length > 0) {
    console.log('\nPróximos eventos:');
    nextEvents.forEach(e => {
      const date = new Date(e.event_date).toLocaleDateString('pt-BR');
      console.log(`- ${e.event_name} em ${e.venue_city || '?'} - ${date}`);
    });
  } else {
    console.log('\nNenhum evento futuro agendado');
  }

  console.log('\n==================================================\n');

  // 4. ENTREGAS
  console.log('🚚 ANÁLISE DE ENTREGAS:\n');
  const { data: allDeliveries } = await supabase
    .from('delivery_trackings')
    .select('status');

  if (allDeliveries && allDeliveries.length > 0) {
    const statusCount = allDeliveries.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Por status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  } else {
    console.log('Nenhuma entrega cadastrada');
  }

  console.log('\n==================================================\n');

  // 5. NOTIFICAÇÕES
  console.log('🔔 ANÁLISE DE NOTIFICAÇÕES:\n');
  const { count: totalNotif } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  const { count: unreadNotif } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  console.log(`Total: ${totalNotif || 0}`);
  console.log(`Não lidas: ${unreadNotif || 0}`);

  if (totalNotif && totalNotif > 0) {
    const readRate = Math.round((1 - (unreadNotif || 0) / totalNotif) * 100);
    console.log(`Taxa de leitura: ${readRate}%`);
  }

  console.log('\n==================================================\n');

  // 6. VERIFICAR RLS
  console.log('🔒 VERIFICAÇÃO RLS:\n');
  const { data: rlsStatus } = await supabase.rpc('pg_tables_info');

  if (rlsStatus && rlsStatus.length > 0) {
    console.log('Tabelas com RLS habilitado:');
    rlsStatus.filter(t => t.rowsecurity).forEach(t => {
      console.log(`- ${t.tablename}`);
    });
  }

  console.log('\n==================================================\n');
  console.log('✅ AUDITORIA CONCLUÍDA\n');
}

fullAudit().catch(e => {
  console.error('❌ Erro na auditoria:', e.message);
  console.error(e);
});
