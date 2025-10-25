require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateRoles() {
  console.log('🚀 MIGRAÇÃO DE ROLES - INICIANDO\n');
  console.log('==================================================\n');

  try {
    // PASSO 1: BACKUP
    console.log('📦 Passo 1: Criando backup...\n');

    const { data: allUsers, error: backupError } = await supabase
      .from('users')
      .select('id, email, role, created_at');

    if (backupError) throw backupError;

    console.log(`✅ Backup criado: ${allUsers.length} usuários salvos em memória\n`);

    // PASSO 2: ESTADO ATUAL
    console.log('📊 Passo 2: Estado ANTES da migração:\n');

    const { data: beforeUsers } = await supabase
      .from('users')
      .select('role');

    const beforeCount = beforeUsers?.reduce((acc, u) => {
      acc[u.role || 'null'] = (acc[u.role || 'null'] || 0) + 1;
      return acc;
    }, {});

    console.log('Contagem por role:');
    Object.entries(beforeCount || {}).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    console.log('');

    // PASSO 3: MIGRAR PROFISSIONAIS
    console.log('👨‍💼 Passo 3: Migrando PROFISSIONAIS...\n');

    const { data: professionals } = await supabase
      .from('professionals')
      .select('user_id');

    const professionalIds = professionals?.map(p => p.user_id).filter(Boolean) || [];

    if (professionalIds.length > 0) {
      const { error: profError } = await supabase
        .from('users')
        .update({ role: 'professional' })
        .in('id', professionalIds);

      if (profError) throw profError;
      console.log(`✅ ${professionalIds.length} usuários migrados para PROFESSIONAL\n`);
    } else {
      console.log('⚠️ Nenhum profissional encontrado\n');
    }

    // PASSO 4: MIGRAR FORNECEDORES
    console.log('🏢 Passo 4: Migrando FORNECEDORES...\n');

    const { data: suppliers } = await supabase
      .from('equipment_suppliers')
      .select('user_id');

    const supplierIds = suppliers?.map(s => s.user_id).filter(Boolean) || [];

    if (supplierIds.length > 0) {
      const { error: suppError } = await supabase
        .from('users')
        .update({ role: 'supplier' })
        .in('id', supplierIds);

      if (suppError) throw suppError;
      console.log(`✅ ${supplierIds.length} usuários migrados para SUPPLIER\n`);
    } else {
      console.log('⚠️ Nenhum fornecedor encontrado\n');
    }

    // PASSO 5: MIGRAR ADMINS
    console.log('👑 Passo 5: Migrando ADMINS...\n');

    const adminEmails = ['hrxtecnologic@gmail.com', 'simulaioab@gmail.com'];

    const { error: adminError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .in('email', adminEmails);

    if (adminError) throw adminError;
    console.log(`✅ Admins migrados: ${adminEmails.join(', ')}\n`);

    // PASSO 6: MIGRAR RESTO PARA CLIENT
    console.log('👤 Passo 6: Migrando resto para CLIENT...\n');

    const { error: clientError } = await supabase
      .from('users')
      .update({ role: 'client' })
      .eq('role', 'user');

    if (clientError) throw clientError;
    console.log(`✅ Usuários restantes migrados para CLIENT\n`);

    // PASSO 7: VERIFICAÇÃO FINAL
    console.log('==================================================\n');
    console.log('✅ Passo 7: Verificação DEPOIS da migração:\n');

    const { data: afterUsers } = await supabase
      .from('users')
      .select('role');

    const afterCount = afterUsers?.reduce((acc, u) => {
      acc[u.role || 'null'] = (acc[u.role || 'null'] || 0) + 1;
      return acc;
    }, {});

    console.log('Contagem por role:');
    Object.entries(afterCount || {}).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    console.log('');

    // PASSO 8: COMPARAÇÃO
    console.log('==================================================\n');
    console.log('📊 RESUMO DA MIGRAÇÃO:\n');

    console.log('ANTES:');
    Object.entries(beforeCount || {}).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log('\nDEPOIS:');
    Object.entries(afterCount || {}).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    // Verificar se ainda tem "user"
    const hasUser = afterCount?.['user'] || 0;
    if (hasUser > 0) {
      console.log(`\n⚠️ ATENÇÃO: Ainda existem ${hasUser} usuários com role "user"`);
    } else {
      console.log('\n✅ SUCESSO: Nenhum usuário com role "user" restante!');
    }

    console.log('\n==================================================\n');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');

    // Salvar backup em arquivo
    const fs = require('fs');
    fs.writeFileSync(
      'backup-users-roles.json',
      JSON.stringify(allUsers, null, 2)
    );
    console.log('💾 Backup salvo em: backup-users-roles.json\n');

  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
    console.error('\n🔄 EXECUTE ROLLBACK SE NECESSÁRIO!\n');
    throw error;
  }
}

migrateRoles().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
