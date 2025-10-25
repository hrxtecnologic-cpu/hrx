require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n=== VERIFICANDO SCHEMA DA TABELA DOCUMENT_VALIDATIONS ===\n');

  // Verificar um documento existente para ver a estrutura
  const { data: sample } = await supabase
    .from('document_validations')
    .select('*')
    .limit(1)
    .single();

  if (sample) {
    console.log('Estrutura de um documento existente:\n');
    console.log(JSON.stringify(sample, null, 2));
  } else {
    console.log('Nenhum documento encontrado. Tentando inserir para ver campos obrigatórios...\n');

    const { error } = await supabase
      .from('document_validations')
      .insert({})
      .select()
      .single();

    if (error) {
      console.log('Erro ao inserir vazio:');
      console.log(error.message);
    }
  }
}

checkSchema().catch(console.error);
