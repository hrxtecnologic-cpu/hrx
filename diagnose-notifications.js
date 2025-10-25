const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseNotifications() {
  console.log('\n=== DIAGNÓSTICO: SISTEMA DE NOTIFICAÇÕES ===\n');

  // 1. Verificar se tabela existe
  console.log('📋 PASSO 1: Verificando tabela notifications...');
  const { count, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('   ❌ Erro ao acessar tabela:', countError.message);
    return;
  }

  console.log(`   ✅ Tabela existe! Total de notificações: ${count}\n`);

  // 2. Ver se há notificações
  if (count > 0) {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('   Últimas notificações:');
    notifications.forEach(n => {
      console.log(`   - ${n.title} | Tipo: ${n.type} | Lida: ${n.is_read}`);
    });
    console.log('');
  }

  // 3. Verificar triggers
  console.log('📋 PASSO 2: Verificando triggers...');
  const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%notify%'
      ORDER BY trigger_name;
    `
  });

  if (triggerError) {
    // Tentar método alternativo
    console.log('   ⚠️  Não foi possível verificar triggers via RPC\n');
  } else {
    console.log(`   Triggers encontrados: ${triggers?.length || 0}\n`);
  }

  // 4. Verificar função create_notification
  console.log('📋 PASSO 3: Verificando função create_notification...');
  const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name LIKE '%notification%'
      ORDER BY routine_name;
    `
  });

  if (funcError) {
    console.log('   ⚠️  Não foi possível verificar funções via RPC\n');
  } else {
    console.log(`   Funções encontradas: ${functions?.length || 0}\n`);
  }

  // 5. Testar criação manual
  console.log('📋 PASSO 4: Testando criação manual de notificação...');

  // Buscar um admin para testar
  const { data: admins } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('user_type', 'admin')
    .limit(1);

  if (!admins || admins.length === 0) {
    console.log('   ⚠️  Nenhum admin encontrado para teste\n');
  } else {
    const admin = admins[0];
    console.log(`   Admin encontrado: ${admin.email}`);

    // Tentar criar notificação diretamente
    const { data: newNotif, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: admin.id,
        user_type: 'admin',
        type: 'system_alert',
        title: 'Teste do Sistema',
        message: 'Esta é uma notificação de teste criada pelo diagnóstico',
        priority: 'normal',
        is_read: false,
        metadata: {}
      })
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Erro ao criar notificação:', createError.message);
    } else {
      console.log('   ✅ Notificação de teste criada com sucesso!');
      console.log(`      ID: ${newNotif.id}`);
      console.log(`      Título: ${newNotif.title}\n`);
    }
  }

  // 6. Verificar contagem final
  const { count: finalCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  console.log('=== RESUMO DO DIAGNÓSTICO ===');
  console.log(`Total de notificações: ${finalCount}`);
  console.log(`Tabela funcionando: ✅`);
  console.log(`Triggers: ${triggers?.length || '?'} encontrados`);
  console.log(`Funções: ${functions?.length || '?'} encontradas`);
  console.log('============================\n');

  // 7. Ver notificações por tipo
  if (finalCount > 0) {
    console.log('📊 Notificações por tipo:');
    const { data: byType } = await supabase
      .from('notifications')
      .select('type, is_read');

    const grouped = byType.reduce((acc, n) => {
      if (!acc[n.type]) acc[n.type] = { total: 0, read: 0, unread: 0 };
      acc[n.type].total++;
      if (n.is_read) acc[n.type].read++;
      else acc[n.type].unread++;
      return acc;
    }, {});

    Object.entries(grouped).forEach(([type, stats]) => {
      console.log(`   ${type}: ${stats.total} total (${stats.unread} não lidas)`);
    });
    console.log('');
  }
}

diagnoseNotifications().catch(console.error);
