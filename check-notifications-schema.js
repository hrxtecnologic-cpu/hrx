const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotificationsSchema() {
  console.log('\n=== VERIFICANDO SCHEMA DA TABELA NOTIFICATIONS ===\n');

  // Tentar fazer SELECT * para ver as colunas
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(0);

  if (error) {
    console.error('❌ Erro ao acessar tabela:', error);
    return;
  }

  console.log('✅ Tabela notifications existe!\n');

  // Tentar inserir com campos mínimos
  console.log('📋 Testando INSERT com campos básicos...\n');

  // Buscar um user
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('❌ Nenhum user encontrado');
    return;
  }

  const userId = users[0].id;

  // Teste 1: Apenas user_id
  console.log('Teste 1: Apenas user_id...');
  const { data: test1, error: error1 } = await supabase
    .from('notifications')
    .insert({ user_id: userId })
    .select();

  if (error1) {
    console.log('   ❌', error1.message);
  } else {
    console.log('   ✅ Sucesso!', test1);
    // Deletar
    await supabase.from('notifications').delete().eq('id', test1[0].id);
  }

  // Teste 2: user_id + message
  console.log('\nTeste 2: user_id + message...');
  const { data: test2, error: error2 } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      message: 'Teste de notificação'
    })
    .select();

  if (error2) {
    console.log('   ❌', error2.message);
  } else {
    console.log('   ✅ Sucesso!', test2);
    // Deletar
    await supabase.from('notifications').delete().eq('id', test2[0].id);
  }

  // Teste 3: todos os campos possíveis
  console.log('\nTeste 3: Tentando todos os campos...');
  const { data: test3, error: error3 } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      message: 'Teste completo',
      title: 'Título',
      type: 'info',
      is_read: false,
      priority: 'normal',
      created_at: new Date().toISOString()
    })
    .select();

  if (error3) {
    console.log('   ❌', error3.message);
    console.log('\n   Campos que NÃO existem na tabela:', error3.details);
  } else {
    console.log('   ✅ Sucesso!');
    console.log('   Campos da notificação criada:');
    console.log('  ', JSON.stringify(test3[0], null, 2));

    // Manter essa para ver
  }

  console.log('\n');
}

checkNotificationsSchema().catch(console.error);
