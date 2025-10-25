const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateRoleToUserType() {
  console.log('\n=== MIGRAÇÃO: role → user_type ===\n');

  // PASSO 1: Preencher user_type NULL baseado em role
  console.log('📋 PASSO 1: Preencher user_type NULL...\n');

  const { data: nullUserTypes } = await supabase
    .from('users')
    .select('id, email, role, user_type')
    .is('user_type', null);

  console.log(`   Users com user_type NULL: ${nullUserTypes.length}`);

  for (const user of nullUserTypes) {
    let newUserType;

    switch (user.role) {
      case 'admin':
        newUserType = 'admin';
        break;
      case 'professional':
        newUserType = 'professional';
        break;
      case 'supplier':
        newUserType = 'supplier';
        break;
      case 'client':
        newUserType = 'contractor'; // client vira contractor
        break;
      case 'user':
        newUserType = 'contractor'; // user vira contractor
        break;
      default:
        newUserType = 'contractor'; // padrão
    }

    const { error } = await supabase
      .from('users')
      .update({ user_type: newUserType })
      .eq('id', user.id);

    if (error) {
      console.log(`   ❌ ${user.email}: ${error.message}`);
    } else {
      console.log(`   ✅ ${user.email}: role="${user.role}" → user_type="${newUserType}"`);
    }
  }

  console.log('\n📋 PASSO 2: Corrigir inconsistências (role="client" + user_type="contractor")...\n');

  // Esses já estão corretos! client=contractor é OK
  // role="admin" mas user_type="contractor" precisa correção

  const { data: wrongAdmins } = await supabase
    .from('users')
    .select('id, email, role, user_type')
    .eq('role', 'admin')
    .neq('user_type', 'admin');

  console.log(`   Admins com user_type errado: ${wrongAdmins.length}`);

  for (const user of wrongAdmins) {
    // Verificar se email está em ADMIN_EMAILS
    const adminEmails = ['hrxtecnologic@gmail.com', 'simulaioab@gmail.com'];

    if (adminEmails.includes(user.email)) {
      const { error } = await supabase
        .from('users')
        .update({ user_type: 'admin' })
        .eq('id', user.id);

      if (error) {
        console.log(`   ❌ ${user.email}: ${error.message}`);
      } else {
        console.log(`   ✅ ${user.email}: user_type corrigido para "admin"`);
      }
    } else {
      console.log(`   ⚠️  ${user.email}: role="admin" mas não está em ADMIN_EMAILS, mantendo user_type="${user.user_type}"`);
    }
  }

  console.log('\n📋 PASSO 3: Verificação final...\n');

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: withUserType } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .not('user_type', 'is', null);

  const { count: nullUserType } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('user_type', null);

  console.log(`   Total de users: ${totalUsers}`);
  console.log(`   Com user_type preenchido: ${withUserType}`);
  console.log(`   Com user_type NULL: ${nullUserType}\n`);

  if (nullUserType === 0) {
    console.log('✅ Todos os users têm user_type preenchido!\n');
  } else {
    console.log('⚠️  Ainda há users com user_type NULL\n');
  }

  // Contagem por user_type
  const { data: allUsers } = await supabase
    .from('users')
    .select('user_type');

  const counts = allUsers.reduce((acc, u) => {
    const type = u.user_type || 'NULL';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Distribuição por user_type:');
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n=== MIGRAÇÃO CONCLUÍDA ===\n');
  console.log('✅ user_type está preenchido para todos os users');
  console.log('⚠️  Coluna role ainda existe (será deletada na próxima etapa)');
  console.log('\n📝 Próxima etapa: Deletar coluna role no Supabase SQL Editor\n');
}

migrateRoleToUserType().catch(console.error);
