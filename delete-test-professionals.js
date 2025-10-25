const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestProfessionals() {
  console.log('\n=== DELETANDO PROFISSIONAIS DE TESTE ===\n');

  const testEmail = 'erickrussomat@gmail.com';

  // Primeiro, listar os que serão deletados
  console.log(`📋 Buscando profissionais com email: ${testEmail}...`);

  const { data: testProfessionals, error: fetchError } = await supabase
    .from('professionals')
    .select('id, full_name, email, clerk_id, user_id, created_at')
    .eq('email', testEmail);

  if (fetchError) {
    console.error('❌ Erro ao buscar profissionais:', fetchError);
    return;
  }

  console.log(`\n   Encontrados: ${testProfessionals.length} profissionais\n`);

  if (testProfessionals.length === 0) {
    console.log('✅ Nenhum profissional de teste encontrado.\n');
    return;
  }

  // Mostrar lista
  console.log('   Profissionais que serão deletados:');
  testProfessionals.forEach(p => {
    console.log(`   - ${p.full_name} (ID: ${p.id})`);
  });

  console.log('\n🗑️  Deletando...\n');

  // Deletar
  const { error: deleteError } = await supabase
    .from('professionals')
    .delete()
    .eq('email', testEmail);

  if (deleteError) {
    console.error('❌ Erro ao deletar:', deleteError);
    return;
  }

  console.log(`✅ ${testProfessionals.length} profissionais de teste deletados com sucesso!\n`);

  // Verificação final
  console.log('📊 Verificação final...');

  const { count: remainingTest } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .eq('email', testEmail);

  const { count: totalProfessionals } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  const { count: orphans } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log(`\n=== RELATÓRIO FINAL ===`);
  console.log(`Profissionais de teste restantes: ${remainingTest}`);
  console.log(`Total de profissionais: ${totalProfessionals}`);
  console.log(`Órfãos restantes: ${orphans}`);
  console.log('======================\n');

  if (orphans === 0) {
    console.log('🎉 PERFEITO! Não há mais profissionais órfãos!\n');
  }
}

deleteTestProfessionals().catch(console.error);
