const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPCFunction() {
  console.log('\n=== VERIFICANDO FUNÇÃO RPC create_notification ===\n');

  // Buscar um user para teste
  const { data: users } = await supabase
    .from('users')
    .select('id, user_type')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('❌ Nenhum user encontrado');
    return;
  }

  const user = users[0];

  console.log('📋 Testando função create_notification via RPC...\n');

  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: user.id,
    p_user_type: user.user_type,
    p_notification_type: 'system_alert',
    p_title: 'Teste via RPC',
    p_message: 'Esta notificação foi criada via função RPC',
    p_action_url: null,
    p_project_id: null,
    p_professional_id: null,
    p_supplier_id: null,
    p_priority: 'normal',
    p_metadata: { test: true, method: 'rpc' }
  });

  if (error) {
    console.log('❌ Função RPC NÃO EXISTE ou erro:');
    console.log(`   ${error.message}\n`);
    console.log('📝 A função precisa ser criada. Execute a migration 021:\n');
    console.log('   Arquivo: supabase/migrations/021_create_notifications_system.sql\n');
    return;
  }

  console.log('✅ Função RPC existe e funciona!');
  console.log(`   Notification ID retornado: ${data}\n`);

  // Verificar se foi criada
  const { data: notification } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', data)
    .single();

  if (notification) {
    console.log('✅ Notificação criada com sucesso via RPC:');
    console.log(`   Título: ${notification.title}`);
    console.log(`   Tipo: ${notification.notification_type}`);
    console.log(`   Prioridade: ${notification.priority}\n`);

    // Deletar notificação de teste
    await supabase
      .from('notifications')
      .delete()
      .eq('id', data);

    console.log('🧹 Notificação de teste deletada\n');
  }

  console.log('=== RESULTADO ===');
  console.log('✅ Função create_notification: FUNCIONANDO');
  console.log('✅ Triggers podem usar esta função');
  console.log('================\n');
}

checkRPCFunction().catch(console.error);
