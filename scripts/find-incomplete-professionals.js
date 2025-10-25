require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Clerk } = require('@clerk/clerk-sdk-node');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

async function findIncompleteProfessionals() {
  console.log('🔍 BUSCANDO PROFISSIONAIS INCOMPLETOS\n');
  console.log('==================================================\n');

  try {
    // 1. Buscar TODOS os usuários do Supabase
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, clerk_id, email, role')
      .not('clerk_id', 'is', null);

    console.log(`Total de usuários no Supabase: ${allUsers.length}\n`);

    // 2. Buscar profissionais COM cadastro completo
    const { data: completeProfessionals } = await supabase
      .from('professionals')
      .select('user_id');

    const completeIds = new Set(completeProfessionals?.map(p => p.user_id) || []);
    console.log(`Profissionais COM cadastro completo: ${completeIds.size}\n`);

    // 3. Verificar quem tem userType=professional no Clerk mas NÃO está na tabela professionals
    console.log('Buscando profissionais incompletos no Clerk...\n');

    let incompleteProfessionals = [];
    let checked = 0;

    for (const user of allUsers) {
      checked++;

      if (checked % 20 === 0) {
        console.log(`Verificados: ${checked}/${allUsers.length}...`);
      }

      try {
        const clerkUser = await clerk.users.getUser(user.clerk_id);
        const userType = clerkUser.publicMetadata?.userType;

        // É profissional no Clerk mas NÃO tem cadastro completo no Supabase
        if (userType === 'professional' && !completeIds.has(user.id)) {
          incompleteProfessionals.push({
            email: user.email,
            clerk_id: user.clerk_id,
            supabase_id: user.id,
            current_role: user.role
          });
        }

        // Delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        // Ignorar erros (usuário não existe no Clerk)
      }
    }

    console.log('\n==================================================\n');
    console.log(`📊 RESULTADO:\n`);
    console.log(`Total de profissionais incompletos: ${incompleteProfessionals.length}\n`);

    if (incompleteProfessionals.length > 0) {
      console.log('Primeiros 20 profissionais incompletos:\n');
      incompleteProfessionals.slice(0, 20).forEach((p, i) => {
        console.log(`${i + 1}. ${p.email} (role atual: ${p.current_role})`);
      });

      // Salvar lista completa
      const fs = require('fs');
      fs.writeFileSync(
        'incomplete-professionals.json',
        JSON.stringify(incompleteProfessionals, null, 2)
      );
      console.log(`\n💾 Lista completa salva em: incomplete-professionals.json`);
    }

    console.log('\n==================================================\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

findIncompleteProfessionals();
