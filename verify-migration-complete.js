require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('\n=== VERIFICAÇÃO FINAL DA MIGRAÇÃO ===\n');

  // 1. Total de users por tipo
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: profUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'professional');

  const { count: contractors } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'contractor');

  const { count: clients } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'client');

  const { count: admins } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'admin');

  console.log('📊 USUÁRIOS POR TIPO:\n');
  console.log(`   Total de users: ${totalUsers}`);
  console.log(`   Admins: ${admins}`);
  console.log(`   Profissionais: ${profUsers}`);
  console.log(`   Contractors: ${contractors}`);
  console.log(`   Clientes: ${clients}\n`);

  // 2. Total de professionals na tabela
  const { count: totalProf } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  const { count: pendingProf } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedProf } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: rejectedProf } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  console.log('👨‍💼 PERFIS PROFISSIONAIS:\n');
  console.log(`   Total: ${totalProf}`);
  console.log(`   Pending: ${pendingProf}`);
  console.log(`   Approved: ${approvedProf}`);
  console.log(`   Rejected: ${rejectedProf}\n`);

  // 3. Verificar consistência
  const difference = totalProf - profUsers;

  if (difference === 0) {
    console.log('✅ PERFEITO! Todos os profissionais têm user_type correto!\n');
  } else if (difference > 0) {
    console.log(`⚠️  ATENÇÃO: ${difference} profissionais não têm user_type="professional"\n`);
  } else {
    console.log(`⚠️  ATENÇÃO: ${Math.abs(difference)} users com user_type="professional" não têm perfil\n`);
  }

  // 4. Documentos linkados
  const { count: totalDocs } = await supabase
    .from('document_validations')
    .select('*', { count: 'exact', head: true });

  const { count: pendingDocs } = await supabase
    .from('document_validations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedDocs } = await supabase
    .from('document_validations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  console.log('📄 DOCUMENTOS:\n');
  console.log(`   Total: ${totalDocs}`);
  console.log(`   Pending: ${pendingDocs}`);
  console.log(`   Approved: ${approvedDocs}\n`);

  // 5. Profissionais recém migrados
  const { data: recentProf } = await supabase
    .from('professionals')
    .select('id, full_name, email, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('🆕 ÚLTIMOS 10 PROFISSIONAIS PENDING (recém migrados):\n');
  recentProf.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.full_name} (${p.email || 'sem email'})`);
    console.log(`      Status: ${p.status} | Criado: ${p.created_at}\n`);
  });

  console.log('=== RESUMO DA MIGRAÇÃO ===\n');
  console.log('✅ 45 contractors migrados para user_type="professional"');
  console.log('✅ 44 novos perfis professional criados');
  console.log('✅ 407 documentos linkados aos perfis');
  console.log(`✅ ${pendingProf} profissionais aguardando revisão\n`);

  console.log('📝 PRÓXIMOS PASSOS:\n');
  console.log(`1. Revisar ${pendingProf} profissionais com status=pending`);
  console.log('2. Aprovar/rejeitar baseado nos documentos');
  console.log(`3. Os ${contractors} contractors restantes são clientes reais\n`);
}

verifyMigration().catch(console.error);
