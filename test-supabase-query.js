// Teste para verificar a estrutura dos dados no Supabase
// Execute: node test-supabase-query.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://waplbfawlcavwtvfwprf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGxiZmF3bGNhdnd0dmZ3cHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MDE2MSwiZXhwIjoyMDc2NDU2MTYxfQ.4f_wtj8epcr-39D3LX71Tw4TmalNRVJQPMxdOL689Yk'
);

async function checkDocuments() {
  console.log('🔍 Buscando último profissional cadastrado...\n');

  const { data, error } = await supabase
    .from('professionals')
    .select('id, full_name, email, documents')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('✅ Profissional encontrado:');
  console.log('ID:', data.id);
  console.log('Nome:', data.full_name);
  console.log('Email:', data.email);
  console.log('\n📄 Campo documents (JSONB):');
  console.log(JSON.stringify(data.documents, null, 2));

  console.log('\n🔍 Verificando cada documento:');
  console.log('rg_front:', data.documents?.rg_front ? '✅ EXISTE' : '❌ NÃO EXISTE');
  console.log('rg_back:', data.documents?.rg_back ? '✅ EXISTE' : '❌ NÃO EXISTE');
  console.log('cpf:', data.documents?.cpf ? '✅ EXISTE' : '❌ NÃO EXISTE');
  console.log('proof_of_address:', data.documents?.proof_of_address ? '✅ EXISTE' : '❌ NÃO EXISTE');
}

checkDocuments();
