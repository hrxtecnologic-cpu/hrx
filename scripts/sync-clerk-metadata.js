require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Clerk } = require('@clerk/clerk-sdk-node');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// Mapear role do Supabase para userType do Clerk
const roleToUserType = {
  'professional': 'professional',
  'supplier': 'supplier',
  'admin': 'contractor', // Admin usa contractor como base
  'client': 'contractor',
  'user': null // Usuários sem tipo definido
};

async function syncClerkMetadata() {
  console.log('🔄 SINCRONIZANDO CLERK METADATA COM SUPABASE ROLES\n');
  console.log('==================================================\n');

  try {
    // 1. Buscar todos os usuários do Supabase
    console.log('📊 Passo 1: Buscando usuários do Supabase...\n');

    const { data: users, error } = await supabase
      .from('users')
      .select('clerk_id, email, role, user_type')
      .not('clerk_id', 'is', null);

    if (error) throw error;

    console.log(`✅ Encontrados ${users.length} usuários\n`);

    // 2. Contar por role
    const roleCount = users.reduce((acc, u) => {
      acc[u.role || 'null'] = (acc[u.role || 'null'] || 0) + 1;
      return acc;
    }, {});

    console.log('Distribuição de roles:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    console.log('');

    // 3. Sincronizar com Clerk
    console.log('🔄 Passo 2: Sincronizando com Clerk...\n');

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      const userType = roleToUserType[user.role];

      // Pular se não tem role ou se role é 'user'
      if (!userType || user.role === 'user') {
        skipped++;
        continue;
      }

      try {
        // Atualizar publicMetadata no Clerk
        await clerk.users.updateUser(user.clerk_id, {
          publicMetadata: {
            userType: userType,
            role: user.role,
          }
        });

        console.log(`✅ ${user.email}: role="${user.role}" → userType="${userType}"`);
        updated++;

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erro ao atualizar ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n==================================================\n');
    console.log('📊 RESUMO DA SINCRONIZAÇÃO:\n');
    console.log(`✅ Atualizados: ${updated}`);
    console.log(`⏭️  Pulados (sem role definido): ${skipped}`);
    console.log(`❌ Erros: ${errors}`);
    console.log('\n==================================================\n');
    console.log('🎉 SINCRONIZAÇÃO CONCLUÍDA!\n');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncClerkMetadata();
