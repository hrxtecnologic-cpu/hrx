require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n=== VERIFICANDO SCHEMA DA TABELA PROFESSIONALS ===\n');

  // Tentar inserir um registro vazio para ver quais campos são obrigatórios
  const { data, error } = await supabase
    .from('professionals')
    .insert({})
    .select()
    .single();

  if (error) {
    console.log('Erro ao tentar inserir registro vazio:');
    console.log(error.message);
    console.log('\n');
  }

  // Verificar um professional existente para ver a estrutura
  const { data: sample } = await supabase
    .from('professionals')
    .select('*')
    .limit(1)
    .single();

  if (sample) {
    console.log('Estrutura de um professional existente:\n');
    console.log(JSON.stringify(sample, null, 2));
  }
}

checkSchema().catch(console.error);
