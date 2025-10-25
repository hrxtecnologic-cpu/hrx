const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrphanProfessionals() {
  console.log('\n=== INICIANDO CORREÇÃO DE PROFISSIONAIS ÓRFÃOS ===\n');

  // PASSO 1: Diagnóstico
  console.log('📊 PASSO 1: Diagnóstico inicial...');
  const { data: orphans, error: orphansError } = await supabase
    .from('professionals')
    .select('id, full_name, email, clerk_id, user_id, created_at')
    .is('user_id', null);

  if (orphansError) {
    console.error('❌ Erro ao buscar órfãos:', orphansError);
    return;
  }

  const withClerkId = orphans.filter(p => p.clerk_id);
  const withoutClerkId = orphans.filter(p => !p.clerk_id);

  console.log(`   Total de órfãos: ${orphans.length}`);
  console.log(`   - Com clerk_id: ${withClerkId.length}`);
  console.log(`   - Sem clerk_id: ${withoutClerkId.length}\n`);

  if (orphans.length === 0) {
    console.log('✅ Nenhum profissional órfão encontrado!\n');
    return;
  }

  // PASSO 2: Buscar users existentes para linkar
  console.log('🔗 PASSO 2: Buscando users existentes...');
  const clerkIds = withClerkId.map(p => p.clerk_id);

  const { data: existingUsers, error: usersError } = await supabase
    .from('users')
    .select('id, clerk_id')
    .in('clerk_id', clerkIds);

  if (usersError) {
    console.error('❌ Erro ao buscar users:', usersError);
    return;
  }

  console.log(`   Users encontrados: ${existingUsers.length}\n`);

  // PASSO 3: Linkar profissionais com users existentes
  console.log('🔗 PASSO 3: Linkando profissionais com users existentes...');
  let linked = 0;

  for (const professional of withClerkId) {
    const user = existingUsers.find(u => u.clerk_id === professional.clerk_id);

    if (user) {
      const { error: updateError } = await supabase
        .from('professionals')
        .update({ user_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', professional.id);

      if (updateError) {
        console.error(`   ❌ Erro ao linkar ${professional.full_name}:`, updateError.message);
      } else {
        linked++;
        console.log(`   ✅ ${professional.full_name} linkado com user ${user.clerk_id}`);
      }
    }
  }

  console.log(`   Total linkados: ${linked}\n`);

  // PASSO 4: Criar users faltantes
  const needsUser = withClerkId.filter(p => {
    return !existingUsers.find(u => u.clerk_id === p.clerk_id);
  });

  console.log(`🆕 PASSO 4: Criando users faltantes (${needsUser.length})...`);
  let created = 0;

  for (const professional of needsUser) {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        clerk_id: professional.clerk_id,
        email: professional.email,
        full_name: professional.full_name,
        user_type: 'professional',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error(`   ❌ Erro ao criar user para ${professional.full_name}:`, createError.message);
    } else {
      created++;
      console.log(`   ✅ User criado para ${professional.full_name}`);

      // Linkar profissional com novo user
      const { error: linkError } = await supabase
        .from('professionals')
        .update({ user_id: newUser.id, updated_at: new Date().toISOString() })
        .eq('id', professional.id);

      if (linkError) {
        console.error(`   ❌ Erro ao linkar ${professional.full_name} com novo user:`, linkError.message);
      } else {
        console.log(`   🔗 ${professional.full_name} linkado com novo user`);
      }
    }
  }

  console.log(`   Total de users criados: ${created}\n`);

  // PASSO 5: Verificação final
  console.log('📊 PASSO 5: Verificação final...');
  const { data: remainingOrphans, error: finalError } = await supabase
    .from('professionals')
    .select('id, full_name, email, clerk_id')
    .is('user_id', null);

  if (finalError) {
    console.error('❌ Erro na verificação final:', finalError);
    return;
  }

  console.log(`   Órfãos restantes: ${remainingOrphans.length}`);

  if (remainingOrphans.length > 0) {
    console.log('\n⚠️  Profissionais ainda órfãos:');
    remainingOrphans.forEach(p => {
      const reason = p.clerk_id ? 'Tem clerk_id mas algo falhou' : 'Sem clerk_id (cadastro antigo)';
      console.log(`   - ${p.full_name} (${p.email}): ${reason}`);
    });
  } else {
    console.log('\n✅ SUCESSO: Todos os profissionais foram corrigidos!');
  }

  // Estatísticas finais
  const { count: totalProfessionals } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  const { count: withUserId } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .not('user_id', 'is', null);

  console.log('\n=== RELATÓRIO FINAL ===');
  console.log(`Total de profissionais: ${totalProfessionals}`);
  console.log(`Com user_id: ${withUserId} (${((withUserId / totalProfessionals) * 100).toFixed(2)}%)`);
  console.log(`Órfãos: ${remainingOrphans.length}`);
  console.log(`\nProfissionais linkados nesta execução: ${linked}`);
  console.log(`Users criados nesta execução: ${created}`);
  console.log('======================\n');
}

fixOrphanProfessionals().catch(console.error);
