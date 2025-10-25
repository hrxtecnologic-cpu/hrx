const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestProfessionalsCascade() {
  console.log('\n=== DELETANDO PROFISSIONAIS DE TESTE (COM CASCADE) ===\n');

  const testEmail = 'erickrussomat@gmail.com';

  // Buscar IDs dos profissionais de teste
  console.log(`📋 Buscando profissionais com email: ${testEmail}...`);

  const { data: testProfessionals, error: fetchError } = await supabase
    .from('professionals')
    .select('id, full_name')
    .eq('email', testEmail);

  if (fetchError) {
    console.error('❌ Erro ao buscar profissionais:', fetchError);
    return;
  }

  console.log(`   Encontrados: ${testProfessionals.length} profissionais\n`);

  if (testProfessionals.length === 0) {
    console.log('✅ Nenhum profissional de teste encontrado.\n');
    return;
  }

  const professionalIds = testProfessionals.map(p => p.id);

  // Listar
  console.log('   Profissionais:');
  testProfessionals.forEach(p => {
    console.log(`   - ${p.full_name} (${p.id})`);
  });

  // PASSO 1: Deletar de project_team
  console.log('\n🗑️  PASSO 1: Deletando de project_team...');
  const { data: teamData, error: teamError } = await supabase
    .from('project_team')
    .delete()
    .in('professional_id', professionalIds)
    .select();

  if (teamError) {
    console.error('   ❌ Erro:', teamError.message);
  } else {
    console.log(`   ✅ ${teamData?.length || 0} registros deletados de project_team`);
  }

  // PASSO 2: Deletar de professional_reviews (se existir)
  console.log('\n🗑️  PASSO 2: Deletando de professional_reviews...');
  const { data: reviewData, error: reviewError } = await supabase
    .from('professional_reviews')
    .delete()
    .in('professional_id', professionalIds)
    .select();

  if (reviewError) {
    console.log('   ⚠️  Tabela pode não existir ou sem registros:', reviewError.message);
  } else {
    console.log(`   ✅ ${reviewData?.length || 0} registros deletados de professional_reviews`);
  }

  // PASSO 3: Deletar de document_validations (se existir)
  console.log('\n🗑️  PASSO 3: Deletando de document_validations...');
  const { data: docData, error: docError } = await supabase
    .from('document_validations')
    .delete()
    .in('professional_id', professionalIds)
    .select();

  if (docError) {
    console.log('   ⚠️  Tabela pode não existir ou sem registros:', docError.message);
  } else {
    console.log(`   ✅ ${docData?.length || 0} registros deletados de document_validations`);
  }

  // PASSO 4: Finalmente, deletar os profissionais
  console.log('\n🗑️  PASSO 4: Deletando profissionais...');
  const { error: deleteError } = await supabase
    .from('professionals')
    .delete()
    .eq('email', testEmail);

  if (deleteError) {
    console.error('   ❌ Erro ao deletar:', deleteError.message);
    return;
  }

  console.log(`   ✅ ${testProfessionals.length} profissionais deletados!\n`);

  // Verificação final
  console.log('📊 Verificação final...');

  const { count: totalProfessionals } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  const { count: orphans } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log(`\n=== RELATÓRIO FINAL ===`);
  console.log(`Total de profissionais: ${totalProfessionals}`);
  console.log(`Órfãos restantes: ${orphans}`);
  console.log('======================\n');

  if (orphans === 0) {
    console.log('🎉 PERFEITO! NÃO HÁ MAIS PROFISSIONAIS ÓRFÃOS!\n');
  } else {
    console.log(`⚠️  Ainda existem ${orphans} órfãos (verifique manualmente)\n`);
  }
}

deleteTestProfessionalsCascade().catch(console.error);
