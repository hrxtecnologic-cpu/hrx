import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICANDO DADOS DA EQUIPE\n');

// Buscar todos os membros da equipe
const { data: membros, error } = await supabase
  .from('project_team')
  .select('*')
  .limit(10);

if (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

console.log(`📊 Encontrados ${membros.length} membros\n`);

membros.forEach((membro, idx) => {
  console.log(`${idx + 1}. Membro ID: ${membro.id}`);
  console.log(`   Project: ${membro.project_id}`);
  console.log(`   Professional: ${membro.professional_id || 'EXTERNO'}`);
  console.log(`   External name: ${membro.external_name || 'N/A'}`);
  console.log(`   Role: ${membro.role}`);
  console.log(`   Category: ${membro.category}`);
  console.log(`   Quantity: ${membro.quantity}`);
  console.log(`   Duration days: ${membro.duration_days}`);
  console.log(`   Daily rate: R$ ${membro.daily_rate || 0}`);
  console.log(`   Total cost: R$ ${membro.total_cost || 0}`);
  console.log(`   Status: ${membro.status}`);

  // Calcular o que deveria ser
  const expected = (membro.daily_rate || 0) * (membro.quantity || 1) * (membro.duration_days || 1);
  console.log(`   💡 Esperado: R$ ${expected.toFixed(2)}`);

  if (Math.abs((membro.total_cost || 0) - expected) > 0.01) {
    console.log(`   ❌ INCORRETO! Diferença: R$ ${(expected - (membro.total_cost || 0)).toFixed(2)}`);
  } else {
    console.log(`   ✅ CORRETO`);
  }
  console.log('');
});

console.log('\n💡 DIAGNÓSTICO:');
console.log('Se daily_rate está NULL ou 0, o problema é que os valores não foram preenchidos ao criar o membro.');
console.log('Se daily_rate está preenchido mas total_cost está 0, o trigger de cálculo não está funcionando.');
