const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrphanProfessionals() {
  console.log('\n=== BUSCANDO 2 PROFISSIONAIS ÓRFÃOS ===\n');

  // Buscar todos profissionais com seus users
  const { data: professionals } = await supabase
    .from('professionals')
    .select(`
      id,
      full_name,
      email,
      status,
      user_id,
      clerk_id,
      created_at
    `);

  console.log(`Total de profissionais: ${professionals.length}\n`);

  // Verificar cada um
  const orphans = [];

  for (const prof of professionals) {
    if (!prof.user_id) {
      orphans.push({ ...prof, reason: 'Sem user_id' });
      continue;
    }

    // Verificar se o user existe
    const { data: user } = await supabase
      .from('users')
      .select('id, user_type, email')
      .eq('id', prof.user_id)
      .single();

    if (!user) {
      orphans.push({ ...prof, reason: 'user_id aponta para user inexistente' });
      continue;
    }

    if (user.user_type !== 'professional') {
      orphans.push({
        ...prof,
        reason: `user existe mas user_type="${user.user_type}" (deveria ser "professional")`,
        userEmail: user.email,
        userType: user.user_type
      });
    }
  }

  console.log(`🔍 Profissionais órfãos/incorretos encontrados: ${orphans.length}\n`);

  if (orphans.length > 0) {
    orphans.forEach((p, i) => {
      console.log(`${i + 1}. ${p.full_name} (${p.email})`);
      console.log(`   Motivo: ${p.reason}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   user_id: ${p.user_id || 'NULL'}`);
      if (p.userType) {
        console.log(`   User type atual: ${p.userType}`);
        console.log(`   Email do user: ${p.userEmail}`);
      }
      console.log('');
    });

    console.log('=== CORREÇÃO ===\n');
    console.log('Vou corrigir agora...\n');

    for (const orphan of orphans) {
      if (orphan.user_id && orphan.userType !== 'professional') {
        // Corrigir user_type
        const { error } = await supabase
          .from('users')
          .update({ user_type: 'professional' })
          .eq('id', orphan.user_id);

        if (error) {
          console.log(`❌ ${orphan.full_name}: Erro ao corrigir - ${error.message}`);
        } else {
          console.log(`✅ ${orphan.full_name}: user_type corrigido para "professional"`);
        }
      } else if (!orphan.user_id) {
        console.log(`⚠️  ${orphan.full_name}: Sem user_id (não posso corrigir automaticamente)`);
      }
    }

  } else {
    console.log('✅ Nenhum órfão encontrado!\n');
  }

  // Verificar novamente
  console.log('\n=== VERIFICAÇÃO FINAL ===\n');

  const { count: totalProf } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  const { count: profUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'professional');

  console.log(`Total de profissionais (tabela): ${totalProf}`);
  console.log(`Total de users (user_type=professional): ${profUsers}`);
  console.log(`Diferença: ${totalProf - profUsers}\n`);

  if (totalProf === profUsers) {
    console.log('✅ PERFEITO! Números batendo!\n');
  } else {
    console.log(`⚠️  Ainda há diferença de ${totalProf - profUsers}\n`);
  }
}

findOrphanProfessionals().catch(console.error);
