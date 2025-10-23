import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local from current directory (hrx)
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 CORRIGINDO PROFISSIONAIS APROVADOS SEM DATA DE APROVAÇÃO\n');
console.log('================================================================\n');

// 1. Buscar profissionais com status=approved mas sem approved_at
console.log('📊 Buscando profissionais aprovados sem data de aprovação...\n');

const { data: professionalsToFix, error: fetchError } = await supabase
  .from('professionals')
  .select('id, full_name, email, status, approved_at, created_at')
  .eq('status', 'approved')
  .is('approved_at', null);

if (fetchError) {
  console.error('❌ Erro ao buscar profissionais:', fetchError);
  process.exit(1);
}

console.log(`Encontrados ${professionalsToFix.length} profissionais para corrigir\n`);

if (professionalsToFix.length === 0) {
  console.log('✅ Nenhum profissional precisa de correção!\n');
  process.exit(0);
}

// 2. Listar profissionais que serão corrigidos
console.log('📋 PROFISSIONAIS QUE SERÃO CORRIGIDOS:\n');
professionalsToFix.forEach((prof, index) => {
  console.log(`${index + 1}. ${prof.full_name} (${prof.email})`);
  console.log(`   Cadastrado em: ${new Date(prof.created_at).toLocaleString('pt-BR')}`);
  console.log(`   Status: ${prof.status} | approved_at: ${prof.approved_at || 'NULL'}\n`);
});

console.log('================================================================\n');
console.log('🚀 Iniciando correção...\n');

// 3. Corrigir cada profissional
let successCount = 0;
let errorCount = 0;

for (const prof of professionalsToFix) {
  try {
    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        approved_at: prof.created_at, // Usar data de cadastro como data de aprovação
        updated_at: new Date().toISOString(),
      })
      .eq('id', prof.id);

    if (updateError) {
      console.error(`❌ Erro ao atualizar ${prof.full_name}:`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ ${prof.full_name} - approved_at definido como ${new Date(prof.created_at).toLocaleString('pt-BR')}`);
      successCount++;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${prof.full_name}:`, error.message);
    errorCount++;
  }
}

console.log('\n================================================================\n');
console.log('📊 RESULTADO DA CORREÇÃO:\n');
console.log(`   ✅ Corrigidos com sucesso: ${successCount}`);
console.log(`   ❌ Erros: ${errorCount}`);
console.log(`   📝 Total processado: ${professionalsToFix.length}\n`);

// 4. Verificar resultado
const { data: verification } = await supabase
  .from('professionals')
  .select('id')
  .eq('status', 'approved')
  .is('approved_at', null);

console.log('🔍 VERIFICAÇÃO FINAL:\n');
if (verification && verification.length === 0) {
  console.log('✅ Todos os profissionais aprovados agora têm data de aprovação!\n');
} else {
  console.log(`⚠️  Ainda existem ${verification.length} profissionais aprovados sem data de aprovação.\n`);
}

console.log('================================================================\n');
console.log('✅ Correção concluída!\n');
