const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function fixUserTypeConstraint() {
  console.log('\n=== CORRIGINDO CONSTRAINT user_type ===\n');

  console.log('📋 Executando SQL para corrigir constraint...\n');

  // Não podemos executar ALTER TABLE via Supabase client direto
  // Mas podemos fazer via uma função ou mostrar instruções

  console.log('⚠️  ATENÇÃO: Esta correção precisa ser feita no SQL Editor do Supabase\n');

  console.log('📝 COPIE E EXECUTE NO SUPABASE SQL EDITOR:\n');
  console.log('```sql');
  console.log('-- Remover constraint antiga');
  console.log('ALTER TABLE notifications');
  console.log('DROP CONSTRAINT IF EXISTS notifications_user_type_check;');
  console.log('');
  console.log('-- Adicionar nova constraint com \'contractor\'');
  console.log('ALTER TABLE notifications');
  console.log('ADD CONSTRAINT notifications_user_type_check');
  console.log('CHECK (user_type IN (\'admin\', \'professional\', \'contractor\', \'supplier\', \'client\'));');
  console.log('```\n');

  console.log('Após executar, contractors poderão receber notificações!\n');

  // Testar se já foi corrigido
  console.log('📋 Testando se constraint já foi corrigida...\n');

  const { data: contractors } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('user_type', 'contractor')
    .limit(1);

  if (contractors && contractors.length > 0) {
    const contractor = contractors[0];

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: contractor.id,
        user_type: 'contractor',
        notification_type: 'system_alert',
        title: 'Teste Contractor',
        message: 'Testando se contractor pode receber notificações',
        priority: 'normal'
      })
      .select();

    if (error) {
      if (error.code === '23514') {
        console.log('❌ Constraint AINDA NÃO foi corrigida');
        console.log('   Execute o SQL acima no Supabase SQL Editor\n');
      } else {
        console.log('❌ Outro erro:', error.message);
      }
    } else {
      console.log('✅ Constraint JÁ ESTÁ CORRIGIDA!');
      console.log('   Contractors podem receber notificações!\n');

      // Deletar notificação de teste
      await supabase
        .from('notifications')
        .delete()
        .eq('id', data[0].id);
    }
  } else {
    console.log('⚠️  Nenhum contractor encontrado para testar\n');
  }
}

fixUserTypeConstraint().catch(console.error);
