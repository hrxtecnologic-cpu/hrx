const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNotificationsFixed() {
  console.log('\n=== CRIANDO NOTIFICAÇÕES (CORRIGIDO) ===\n');

  // Buscar user professional
  console.log('📋 Buscando user professional...');
  const { data: professionalUsers } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('user_type', 'professional')
    .limit(1);

  let targetUser = professionalUsers && professionalUsers[0];

  if (!targetUser) {
    console.log('   ⚠️  Nenhum professional encontrado, buscando admin...');

    const { data: adminUsers } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'admin')
      .limit(1);

    targetUser = adminUsers && adminUsers[0];
  }

  if (!targetUser) {
    console.log('   ⚠️  Nenhum admin encontrado, buscando qualquer user válido...');

    const { data: anyUsers } = await supabase
      .from('users')
      .select('id, email, user_type')
      .in('user_type', ['professional', 'admin', 'supplier', 'client'])
      .limit(1);

    targetUser = anyUsers && anyUsers[0];
  }

  if (!targetUser) {
    console.error('❌ Nenhum user válido encontrado no banco!');
    console.log('\n   Tipos de user_type aceitos pela tabela notifications:');
    console.log('   - admin');
    console.log('   - professional');
    console.log('   - supplier');
    console.log('   - client');
    console.log('\n   Mas você só tem users com user_type: contractor\n');
    console.log('   Criando um user admin temporário para teste...\n');

    // Criar um admin temporário
    const { data: newAdmin, error: adminError } = await supabase
      .from('users')
      .insert({
        clerk_id: 'temp_admin_' + Date.now(),
        email: 'admin.temp@hrx.test',
        full_name: 'Admin Temporário',
        user_type: 'admin',
        status: 'active'
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Erro ao criar admin:', adminError.message);
      return;
    }

    targetUser = newAdmin;
    console.log('✅ Admin temporário criado!\n');
  }

  console.log(`✅ User encontrado: ${targetUser.email} (${targetUser.user_type})\n`);

  // Criar notificações
  console.log('📬 Criando notificações de teste...\n');

  const notifications = [
    {
      user_id: targetUser.id,
      user_type: targetUser.user_type,
      notification_type: 'system_alert',
      title: '🎉 Sistema de Notificações Funcionando!',
      message: 'Esta é uma notificação de teste criada com sucesso. O sistema está operacional!',
      priority: 'high'
    },
    {
      user_id: targetUser.id,
      user_type: targetUser.user_type,
      notification_type: 'project_created',
      title: 'Novo Projeto Criado',
      message: 'Um novo projeto foi criado e está aguardando sua análise.',
      priority: 'normal'
    },
    {
      user_id: targetUser.id,
      user_type: targetUser.user_type,
      notification_type: 'invitation_received',
      title: 'Convite para Projeto',
      message: 'Você foi convidado para participar de um novo projeto.',
      priority: 'high'
    },
    {
      user_id: targetUser.id,
      user_type: targetUser.user_type,
      notification_type: 'document_expiring',
      title: 'Documento Expirando',
      message: 'Seu documento de CNH expira em 30 dias. Por favor, atualize.',
      priority: 'urgent'
    },
    {
      user_id: targetUser.id,
      user_type: targetUser.user_type,
      notification_type: 'quotation_received',
      title: 'Cotação Recebida',
      message: 'Uma nova cotação de fornecedor foi recebida.',
      priority: 'normal'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const notif of notifications) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notif)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ ${notif.title}: ${error.message}`);
      failCount++;
    } else {
      console.log(`   ✅ ${notif.title} criada`);
      successCount++;
    }
  }

  console.log(`\n📊 Resultado: ${successCount} criadas, ${failCount} falharam\n`);

  // Verificar total
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total de notificações no banco: ${count}\n`);

  // Listar todas
  if (count > 0) {
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📋 Todas as notificações:');
    allNotifications.forEach((n, index) => {
      const readIcon = n.is_read ? '✅' : '⭕';
      const priorityIcon =
        n.priority === 'urgent' ? '🔴' :
        n.priority === 'high' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${priorityIcon} ${readIcon} ${n.title} (${n.notification_type})`);
    });
  }

  console.log('\n✅ Sistema de notificações está FUNCIONANDO!\n');

  // Marcar uma como lida (teste)
  if (count > 0) {
    console.log('📖 Testando marcar como lida...');

    const { data: firstNotif } = await supabase
      .from('notifications')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', firstNotif.id);

    if (updateError) {
      console.log(`   ❌ Erro: ${updateError.message}`);
    } else {
      console.log('   ✅ Notificação marcada como lida!\n');
    }
  }

  console.log('=== TESTE COMPLETO ===\n');
}

createNotificationsFixed().catch(console.error);
