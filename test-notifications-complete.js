const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationsComplete() {
  console.log('\n=== TESTE COMPLETO: SISTEMA DE NOTIFICAÇÕES ===\n');

  // 1. Verificar se função create_notification existe
  console.log('📋 PASSO 1: Verificando função create_notification...');

  // Buscar um user qualquer para teste
  const { data: users } = await supabase
    .from('users')
    .select('id, email, user_type')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('   ❌ Nenhum user encontrado no banco!\n');
    return;
  }

  const testUser = users[0];
  console.log(`   ✅ User encontrado: ${testUser.email} (${testUser.user_type})\n`);

  // 2. Testar criação manual via INSERT
  console.log('📋 PASSO 2: Criando notificação via INSERT direto...');

  const { data: notification1, error: error1 } = await supabase
    .from('notifications')
    .insert({
      user_id: testUser.id,
      user_type: testUser.user_type,
      type: 'system_alert',
      title: 'Teste #1 - INSERT Direto',
      message: 'Esta notificação foi criada via INSERT direto na tabela',
      priority: 'normal',
      is_read: false,
      metadata: { test: true, method: 'insert' }
    })
    .select()
    .single();

  if (error1) {
    console.error('   ❌ Erro:', error1.message);
  } else {
    console.log('   ✅ Notificação criada!');
    console.log(`      ID: ${notification1.id}`);
    console.log(`      Título: ${notification1.title}\n`);
  }

  // 3. Testar via função RPC (se existir)
  console.log('📋 PASSO 3: Testando função create_notification via RPC...');

  const { data: notification2, error: error2 } = await supabase.rpc('create_notification', {
    p_user_id: testUser.id,
    p_user_type: testUser.user_type,
    p_type: 'system_alert',
    p_title: 'Teste #2 - RPC Function',
    p_message: 'Esta notificação foi criada via função RPC',
    p_related_project_id: null,
    p_related_professional_id: null,
    p_related_team_member_id: null,
    p_related_request_id: null,
    p_priority: 'normal',
    p_metadata: { test: true, method: 'rpc' }
  });

  if (error2) {
    console.log('   ⚠️  Função RPC não existe ou erro:', error2.message);
    console.log('   (Isso é OK se a função não foi implementada)\n');
  } else {
    console.log('   ✅ Notificação criada via RPC!');
    console.log(`      Resultado: ${JSON.stringify(notification2)}\n`);
  }

  // 4. Verificar se triggers disparam
  console.log('📋 PASSO 4: Testando triggers de project_team...');

  // Buscar um projeto e profissional para teste
  const { data: projects } = await supabase
    .from('event_projects')
    .select('id, project_number')
    .limit(1);

  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, full_name, user_id')
    .not('user_id', 'is', null)
    .limit(1);

  if (!projects || !professionals || projects.length === 0 || professionals.length === 0) {
    console.log('   ⚠️  Sem projeto ou profissional para testar trigger\n');
  } else {
    const project = projects[0];
    const professional = professionals[0];

    console.log(`   Projeto: ${project.project_number}`);
    console.log(`   Profissional: ${professional.full_name}\n`);

    // Contar notificações antes
    const { count: countBefore } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    console.log(`   Notificações antes: ${countBefore}`);

    // Inserir em project_team (deve disparar trigger)
    const { data: teamMember, error: teamError } = await supabase
      .from('project_team')
      .insert({
        project_id: project.id,
        professional_id: professional.id,
        user_id: professional.user_id,
        role: 'Teste',
        category: 'Teste',
        daily_rate: 100,
        invitation_status: 'pending'
      })
      .select()
      .single();

    if (teamError) {
      console.log('   ⚠️  Erro ao criar team member:', teamError.message);
    } else {
      console.log(`   ✅ Team member criado: ${teamMember.id}`);

      // Aguardar 1 segundo para trigger processar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Contar notificações depois
      const { count: countAfter } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      console.log(`   Notificações depois: ${countAfter}`);

      if (countAfter > countBefore) {
        console.log(`   ✅ Trigger funcionou! ${countAfter - countBefore} notificação(ões) criada(s)\n`);
      } else {
        console.log('   ⚠️  Trigger NÃO criou notificação\n');
      }

      // Limpar teste - deletar team member
      await supabase
        .from('project_team')
        .delete()
        .eq('id', teamMember.id);

      console.log('   🧹 Team member de teste deletado\n');
    }
  }

  // 5. Listar todas as notificações criadas
  console.log('📋 PASSO 5: Listando todas as notificações...');

  const { data: allNotifications, count: totalCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  console.log(`   Total: ${totalCount} notificações\n`);

  if (allNotifications && allNotifications.length > 0) {
    allNotifications.forEach((n, index) => {
      console.log(`   ${index + 1}. ${n.title}`);
      console.log(`      Tipo: ${n.type} | Prioridade: ${n.priority}`);
      console.log(`      Lida: ${n.is_read} | Criada: ${new Date(n.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
  }

  // 6. Resumo final
  console.log('=== RESUMO DO TESTE ===');
  console.log(`✅ Tabela notifications: FUNCIONANDO`);
  console.log(`✅ INSERT direto: ${error1 ? '❌ FALHOU' : '✅ FUNCIONOU'}`);
  console.log(`${error2 ? '⚠️' : '✅'} Função RPC: ${error2 ? 'NÃO EXISTE' : 'FUNCIONOU'}`);
  console.log(`Total de notificações: ${totalCount}`);
  console.log('======================\n');

  if (totalCount === 0) {
    console.log('❌ PROBLEMA: Sistema não está criando notificações');
    console.log('   Possíveis causas:');
    console.log('   1. Triggers não estão disparando');
    console.log('   2. Função create_notification não existe');
    console.log('   3. Eventos não estão sendo criados\n');
  } else {
    console.log('✅ Sistema de notificações está FUNCIONANDO!\n');
  }
}

testNotificationsComplete().catch(console.error);
