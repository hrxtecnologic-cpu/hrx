const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestSMU() {
  console.log('\n=== DELETANDO PROFISSIONAIS DE TESTE SMU ===\n');

  const testEmail = 'smucortes@gmail.com';

  // Buscar profissionais
  const { data: testProfs, error: fetchError } = await supabase
    .from('professionals')
    .select('id, full_name, email, status')
    .eq('email', testEmail);

  if (fetchError) {
    console.error('❌ Erro:', fetchError);
    return;
  }

  console.log(`📋 Encontrados: ${testProfs.length} profissionais com email ${testEmail}\n`);

  if (testProfs.length === 0) {
    console.log('✅ Nenhum profissional encontrado.\n');
    return;
  }

  testProfs.forEach(p => {
    console.log(`   - ${p.full_name} | Status: ${p.status} | ID: ${p.id}`);
  });

  const professionalIds = testProfs.map(p => p.id);

  // Deletar relacionamentos primeiro
  console.log('\n🗑️  Deletando relacionamentos...');

  // project_team
  const { data: teamData } = await supabase
    .from('project_team')
    .delete()
    .in('professional_id', professionalIds)
    .select();
  console.log(`   - project_team: ${teamData?.length || 0} registros`);

  // professional_reviews
  const { data: reviewData } = await supabase
    .from('professional_reviews')
    .delete()
    .in('professional_id', professionalIds)
    .select();
  console.log(`   - professional_reviews: ${reviewData?.length || 0} registros`);

  // document_validations
  const { data: docData } = await supabase
    .from('document_validations')
    .delete()
    .in('professional_id', professionalIds)
    .select();
  console.log(`   - document_validations: ${docData?.length || 0} registros`);

  // Deletar users associados
  console.log('\n🗑️  Deletando users associados...');
  const { data: usersData } = await supabase
    .from('users')
    .delete()
    .eq('email', testEmail)
    .select();
  console.log(`   - users: ${usersData?.length || 0} registros`);

  // Finalmente, deletar profissionais
  console.log('\n🗑️  Deletando profissionais...');
  const { error: deleteError } = await supabase
    .from('professionals')
    .delete()
    .eq('email', testEmail);

  if (deleteError) {
    console.error('   ❌ Erro:', deleteError.message);
    return;
  }

  console.log(`   ✅ ${testProfs.length} profissionais deletados!\n`);

  // Verificação final
  const { count: total } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  console.log('=== RESULTADO FINAL ===');
  console.log(`Total de profissionais: ${total}`);
  console.log('======================\n');
}

deleteTestSMU().catch(console.error);
