const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waplbfawlcavwtvfwprf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateContractors() {
  console.log('\n=== INVESTIGAÇÃO: CONTRACTORS vs PROFESSIONALS ===\n');

  // 1. Total de contractors
  const { data: contractors } = await supabase
    .from('users')
    .select('id, email, full_name, clerk_id, created_at')
    .eq('user_type', 'contractor');

  console.log(`📊 Total de CONTRACTORS: ${contractors.length}\n`);

  // 2. Verificar quais contractors têm perfil de professional
  console.log('🔍 Verificando contractors que têm perfil de professional...\n');

  let contractorsWithProfessionalProfile = 0;
  let contractorsWithoutProfile = 0;
  let contractorsWithDocuments = 0;

  const details = [];

  for (const contractor of contractors) {
    // Verificar se tem perfil professional
    const { data: professional } = await supabase
      .from('professionals')
      .select('id, full_name, status, created_at, user_id')
      .eq('user_id', contractor.id)
      .single();

    // Verificar se tem documentos órfãos (pelo email)
    const { count: docsCount } = await supabase
      .from('document_validations')
      .select('*', { count: 'exact', head: true })
      .is('professional_id', null)
      .ilike('document_url', `%${contractor.email}%`);

    const hasProfessionalProfile = !!professional;
    const hasDocuments = docsCount > 0;

    if (hasProfessionalProfile) {
      contractorsWithProfessionalProfile++;
    } else {
      contractorsWithoutProfile++;
    }

    if (hasDocuments) {
      contractorsWithDocuments++;
    }

    details.push({
      email: contractor.email,
      hasProfessionalProfile,
      professionalStatus: professional?.status || null,
      hasDocuments,
      docsCount: docsCount || 0,
    });
  }

  console.log(`   Contractors COM perfil professional: ${contractorsWithProfessionalProfile}`);
  console.log(`   Contractors SEM perfil professional: ${contractorsWithoutProfile}`);
  console.log(`   Contractors COM documentos órfãos: ${contractorsWithDocuments}\n`);

  // 3. Contractors que DEVERIAM ser profissionais
  const shouldBeProfessional = details.filter(d =>
    d.hasProfessionalProfile || d.hasDocuments
  );

  console.log(`⚠️  CONTRACTORS QUE DEVERIAM SER PROFISSIONAIS: ${shouldBeProfessional.length}\n`);

  if (shouldBeProfessional.length > 0) {
    console.log('   Exemplos (primeiros 10):');
    shouldBeProfessional.slice(0, 10).forEach(d => {
      const reasons = [];
      if (d.hasProfessionalProfile) reasons.push(`tem perfil (${d.professionalStatus})`);
      if (d.hasDocuments) reasons.push(`${d.docsCount} docs`);
      console.log(`   - ${d.email}: ${reasons.join(', ')}`);
    });
    console.log('');
  }

  // 4. Total de professionals na tabela
  const { count: totalProfessionals } = await supabase
    .from('professionals')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total de PROFESSIONALS (tabela): ${totalProfessionals}`);

  const { count: professionalsUserType } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'professional');

  console.log(`📊 Total de users com user_type=professional: ${professionalsUserType}\n`);

  // 5. Diferença
  const difference = totalProfessionals - professionalsUserType;
  console.log(`❌ DIFERENÇA: ${difference} profissionais na tabela mas sem user_type=professional\n`);

  // 6. Verificar profissionais sem user correto
  const { data: professionalsWithWrongUserType } = await supabase
    .from('professionals')
    .select(`
      id,
      full_name,
      email,
      status,
      user_id,
      users!inner(id, user_type)
    `)
    .neq('users.user_type', 'professional');

  console.log(`⚠️  Profissionais com user_type ERRADO: ${professionalsWithWrongUserType?.length || 0}\n`);

  if (professionalsWithWrongUserType && professionalsWithWrongUserType.length > 0) {
    console.log('   Detalhes:');
    professionalsWithWrongUserType.forEach(p => {
      console.log(`   - ${p.full_name} (${p.email}): user_type="${p.users.user_type}" deveria ser "professional"`);
    });
    console.log('');
  }

  // 7. Solução proposta
  console.log('=== SOLUÇÃO PROPOSTA ===\n');
  console.log(`1. Corrigir ${professionalsWithWrongUserType?.length || 0} users que têm perfil professional`);
  console.log(`   mas user_type != "professional"\n`);
  console.log('2. Investigar contractors sem perfil (podem ser clientes reais)\n');
  console.log('=======================\n');

  return professionalsWithWrongUserType;
}

investigateContractors().then(async (toFix) => {
  if (!toFix || toFix.length === 0) {
    console.log('✅ Tudo certo! Nada para corrigir.\n');
    return;
  }

  console.log('🔧 CORREÇÃO AUTOMÁTICA?\n');
  console.log(`Posso corrigir automaticamente os ${toFix.length} users.\n`);
  console.log('Execute: node fix-professional-user-types.js\n');
}).catch(console.error);
