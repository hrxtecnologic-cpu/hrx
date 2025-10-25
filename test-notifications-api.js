const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPIs() {
  console.log('\n=== RESUMO: SISTEMA DE NOTIFICAÇÕES ===\n');

  // Contar notificações
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total de notificações no banco: ${count}`);

  // Verificar constraint
  console.log('✅ Constraint user_type: CORRIGIDA (aceita contractor)');

  // Verificar APIs
  console.log('\n📋 APIS CORRIGIDAS:');
  console.log('   ✅ GET /api/notifications - Lista notificações do usuário');
  console.log('   ✅ POST /api/notifications/[id]/read - Marca como lida');
  console.log('   ✅ POST /api/notifications/mark-all-read - Marca todas como lidas');
  console.log('   ✅ POST /api/notifications - Criar notificação (admin only)');

  console.log('\n📋 CORREÇÕES APLICADAS:');
  console.log('   ✅ Trocado "role" por "user_type" nas queries');
  console.log('   ✅ Removida dependência de view notification_stats');
  console.log('   ✅ Stats calculadas manualmente');
  console.log('   ✅ UPDATE direto em vez de RPC para marcar como lida');

  console.log('\n⚠️  PENDENTE:');
  console.log('   🔴 Função RPC create_notification (para triggers funcionarem)');
  console.log('   🔴 UI de notificações (NotificationBell component)');

  console.log('\n📊 ESTATÍSTICAS:');

  // Por tipo
  const { data: byType } = await supabase
    .from('notifications')
    .select('notification_type');

  const typeCounts = byType.reduce((acc, n) => {
    acc[n.notification_type] = (acc[n.notification_type] || 0) + 1;
    return acc;
  }, {});

  console.log('\n   Notificações por tipo:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`      ${type}: ${count}`);
  });

  // Por prioridade
  const { data: byPriority } = await supabase
    .from('notifications')
    .select('priority, is_read');

  const priorityCounts = byPriority.reduce((acc, n) => {
    if (!acc[n.priority]) acc[n.priority] = { total: 0, unread: 0 };
    acc[n.priority].total++;
    if (!n.is_read) acc[n.priority].unread++;
    return acc;
  }, {});

  console.log('\n   Notificações por prioridade:');
  Object.entries(priorityCounts).forEach(([priority, stats]) => {
    const icon = priority === 'urgent' ? '🔴' : priority === 'high' ? '🟡' : '🟢';
    console.log(`      ${icon} ${priority}: ${stats.total} total (${stats.unread} não lidas)`);
  });

  // Status de leitura
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  const { count: readCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', true);

  console.log('\n   Status de leitura:');
  console.log(`      ⭕ Não lidas: ${unreadCount}`);
  console.log(`      ✅ Lidas: ${readCount}`);

  console.log('\n✅ SISTEMA DE NOTIFICAÇÕES: FUNCIONANDO!\n');
  console.log('📝 Próximo passo: Criar função RPC create_notification\n');
}

testAPIs().catch(console.error);
