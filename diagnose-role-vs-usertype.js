const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseRoleVsUserType() {
  console.log('\n=== DIAGNÓSTICO: role vs user_type ===\n');

  // Buscar todos os users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, user_type, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar users:', error.message);
    return;
  }

  console.log(`📊 Total de users: ${users.length}\n`);

  // Agrupar por combinação role + user_type
  const combinations = {};
  users.forEach(u => {
    const key = `role:${u.role || 'NULL'} | user_type:${u.user_type || 'NULL'}`;
    if (!combinations[key]) {
      combinations[key] = { count: 0, emails: [] };
    }
    combinations[key].count++;
    if (combinations[key].emails.length < 3) {
      combinations[key].emails.push(u.email);
    }
  });

  console.log('📋 COMBINAÇÕES role + user_type:\n');
  Object.entries(combinations).forEach(([combo, data]) => {
    console.log(`   ${combo}`);
    console.log(`      Quantidade: ${data.count}`);
    console.log(`      Exemplos: ${data.emails.join(', ')}`);
    console.log('');
  });

  // Verificar inconsistências
  console.log('⚠️  INCONSISTÊNCIAS ENCONTRADAS:\n');

  const inconsistencies = users.filter(u => {
    // role e user_type deveriam ser iguais ou um mapeado do outro
    if (u.role === 'user' && u.user_type === 'contractor') return false; // OK
    if (u.role === 'admin' && u.user_type === 'admin') return false; // OK
    if (u.role === 'professional' && u.user_type === 'professional') return false; // OK
    if (u.role === 'supplier' && u.user_type === 'supplier') return false; // OK
    if (u.role === 'client' && u.user_type === 'client') return false; // OK

    // Se chegou aqui, há inconsistência
    return true;
  });

  if (inconsistencies.length > 0) {
    console.log(`   Encontradas ${inconsistencies.length} inconsistências:`);
    inconsistencies.forEach(u => {
      console.log(`   - ${u.email}: role="${u.role}" != user_type="${u.user_type}"`);
    });
    console.log('');
  } else {
    console.log('   ✅ Nenhuma inconsistência encontrada!\n');
  }

  // Valores únicos de role
  const roleValues = [...new Set(users.map(u => u.role).filter(Boolean))];
  console.log('📋 Valores únicos de ROLE:');
  roleValues.forEach(val => {
    const count = users.filter(u => u.role === val).length;
    console.log(`   - "${val}": ${count} users`);
  });

  // Valores únicos de user_type
  const userTypeValues = [...new Set(users.map(u => u.user_type).filter(Boolean))];
  console.log('\n📋 Valores únicos de USER_TYPE:');
  userTypeValues.forEach(val => {
    const count = users.filter(u => u.user_type === val).length;
    console.log(`   - "${val}": ${count} users`);
  });

  // Users com role NULL
  const nullRole = users.filter(u => !u.role);
  console.log(`\n⚠️  Users com role NULL: ${nullRole.length}`);
  if (nullRole.length > 0 && nullRole.length <= 5) {
    nullRole.forEach(u => console.log(`   - ${u.email} (user_type: ${u.user_type})`));
  }

  // Users com user_type NULL
  const nullUserType = users.filter(u => !u.user_type);
  console.log(`\n⚠️  Users com user_type NULL: ${nullUserType.length}`);
  if (nullUserType.length > 0 && nullUserType.length <= 5) {
    nullUserType.forEach(u => console.log(`   - ${u.email} (role: ${u.role})`));
  }

  console.log('\n=== RECOMENDAÇÃO ===');
  console.log('\n✅ Manter: user_type');
  console.log('❌ Deletar: role');
  console.log('\nMotivo:');
  console.log('   1. user_type tem valores mais específicos (contractor, professional, supplier, admin, client)');
  console.log('   2. role tem valores genéricos (user, admin)');
  console.log('   3. Tabelas relacionadas usam user_type (professionals, contractors, equipment_suppliers)');
  console.log('   4. Sistema de notificações usa user_type');
  console.log('\n===================\n');

  // Plano de migração
  console.log('📋 PLANO DE MIGRAÇÃO:\n');
  console.log('1. Preencher user_type NULL baseado em role');
  console.log('   - role="user" → user_type="contractor" (padrão)');
  console.log('   - role="admin" → user_type="admin"');
  console.log('   - role="professional" → user_type="professional"');
  console.log('   - role="supplier" → user_type="supplier"');
  console.log('   - role="client" → user_type="client"');
  console.log('');
  console.log('2. Deletar coluna role');
  console.log('');
  console.log('3. Atualizar código que usa user.role → user.user_type');
  console.log('   - middleware.ts');
  console.log('   - APIs');
  console.log('   - Tipos TypeScript');
  console.log('\n');
}

diagnoseRoleVsUserType().catch(console.error);
