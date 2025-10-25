const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminUserTypes() {
  console.log('\n=== CORRIGINDO ADMINS ===\n');

  const ADMIN_EMAILS = ['hrxtecnologic@gmail.com', 'simulaioab@gmail.com'];

  console.log('Emails admin configurados:', ADMIN_EMAILS.join(', '), '\n');

  // Corrigir admins que estão com user_type errado
  for (const email of ADMIN_EMAILS) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', email)
      .single();

    if (!user) {
      console.log(`⚠️  ${email}: User não encontrado`);
      continue;
    }

    if (user.user_type === 'admin') {
      console.log(`✅ ${email}: Já é admin`);
      continue;
    }

    console.log(`🔧 ${email}: user_type="${user.user_type}" → "admin"`);

    const { error } = await supabase
      .from('users')
      .update({ user_type: 'admin' })
      .eq('id', user.id);

    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    } else {
      console.log(`   ✅ Corrigido!`);
    }
  }

  console.log('\n=== RESULTADO ===\n');

  const { count: adminCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'admin');

  console.log(`Total de admins: ${adminCount}\n`);

  // Mostrar todos os admins
  const { data: admins } = await supabase
    .from('users')
    .select('email, user_type, created_at')
    .eq('user_type', 'admin');

  console.log('Admins no sistema:');
  admins.forEach(a => {
    console.log(`   - ${a.email}`);
  });

  console.log('\n✅ Correção concluída!\n');
}

fixAdminUserTypes().catch(console.error);
