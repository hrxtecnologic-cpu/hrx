const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestNotification() {
  console.log('\n=== CRIANDO NOTIFICAÇÃO DE TESTE ===\n');

  // Buscar um user
  const { data: users } = await supabase
    .from('users')
    .select('id, email, user_type')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('❌ Nenhum user encontrado');
    return;
  }

  const user = users[0];
  console.log(`✅ User encontrado: ${user.email} (${user.user_type})\n`);

  // Criar notificação com schema correto
  console.log('📬 Criando notificação de teste...');

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      user_type: user.user_type,
      notification_type: 'system_alert',
      title: '🎉 Sistema de Notificações Funcionando!',
      message: 'Esta é uma notificação de teste criada com sucesso. O sistema está operacional!',
      priority: 'high',
      is_read: false,
      metadata: {
        test: true,
        created_by: 'diagnostic_script',
        timestamp: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar notificação:', error.message);
    console.error('   Detalhes:', error);
    return;
  }

  console.log('✅ Notificação criada com sucesso!\n');
  console.log('📋 Detalhes da notificação:');
  console.log(`   ID: ${notification.id}`);
  console.log(`   Título: ${notification.title}`);
  console.log(`   Mensagem: ${notification.message}`);
  console.log(`   Tipo: ${notification.notification_type}`);
  console.log(`   Prioridade: ${notification.priority}`);
  console.log(`   Lida: ${notification.is_read}`);
  console.log(`   Criada em: ${new Date(notification.created_at).toLocaleString('pt-BR')}\n`);

  // Criar mais algumas notificações de exemplo
  console.log('📬 Criando notificações adicionais...\n');

  const notifications = [
    {
      user_id: user.id,
      user_type: user.user_type,
      notification_type: 'project_created',
      title: 'Novo Projeto Criado',
      message: 'Um novo projeto foi criado e está aguardando sua análise.',
      priority: 'normal'
    },
    {
      user_id: user.id,
      user_type: user.user_type,
      notification_type: 'invitation_received',
      title: 'Convite para Projeto',
      message: 'Você foi convidado para participar de um novo projeto.',
      priority: 'high'
    },
    {
      user_id: user.id,
      user_type: user.user_type,
      notification_type: 'document_expiring',
      title: 'Documento Expirando',
      message: 'Seu documento de CNH expira em 30 dias. Por favor, atualize.',
      priority: 'urgent'
    }
  ];

  for (const notif of notifications) {
    const { data, error: insertError } = await supabase
      .from('notifications')
      .insert(notif)
      .select()
      .single();

    if (insertError) {
      console.log(`   ❌ ${notif.title}: ${insertError.message}`);
    } else {
      console.log(`   ✅ ${notif.title} criada`);
    }
  }

  // Verificar total de notificações
  console.log('\n📊 Verificando total de notificações...');

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total de notificações no banco: ${count}\n`);

  // Listar todas
  const { data: allNotifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('📋 Todas as notificações:');
  allNotifications.forEach((n, index) => {
    const readIcon = n.is_read ? '✅' : '⭕';
    const priorityIcon = n.priority === 'urgent' ? '🔴' : n.priority === 'high' ? '🟡' : '🟢';
    console.log(`   ${index + 1}. ${priorityIcon} ${readIcon} ${n.title}`);
  });

  console.log('\n✅ Sistema de notificações está FUNCIONANDO!\n');
}

createTestNotification().catch(console.error);
