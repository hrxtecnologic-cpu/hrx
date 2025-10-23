import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local from current directory (hrx)
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 DIAGNÓSTICO DE PROFISSIONAIS CADASTRADOS\n');
console.log('================================================\n');

// 1. Check total professionals in database
console.log('📊 CONTAGEM TOTAL DE PROFISSIONAIS NO BANCO:');
const { data: allProfessionals, error: allError } = await supabase
  .from('professionals')
  .select('id, full_name, email, status, approved_at, approved_by, created_at')
  .order('created_at', { ascending: false });

if (allError) {
  console.error('❌ Erro ao buscar profissionais:', allError);
  process.exit(1);
}

console.log(`   Total de profissionais cadastrados: ${allProfessionals.length}\n`);

// 2. Group by status
console.log('📈 PROFISSIONAIS POR STATUS:');
const byStatus = allProfessionals.reduce((acc, prof) => {
  const status = prof.status || 'null';
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

Object.entries(byStatus).forEach(([status, count]) => {
  console.log(`   ${status}: ${count}`);
});
console.log();

// 3. Check approved flag
console.log('✅ PROFISSIONAIS POR APROVAÇÃO:');
const byApproved = allProfessionals.reduce((acc, prof) => {
  const approved = prof.approved_at ? 'approved' : 'not_approved';
  acc[approved] = (acc[approved] || 0) + 1;
  return acc;
}, {});

Object.entries(byApproved).forEach(([approved, count]) => {
  console.log(`   ${approved}: ${count}`);
});
console.log();

// 4. Check professionals with documents
console.log('📄 PROFISSIONAIS COM DOCUMENTOS:');
const { data: withDocs, error: docsError } = await supabase
  .from('professionals')
  .select(`
    id,
    full_name,
    email,
    status,
    approved_at,
    documents:professional_documents(id, document_type, file_url)
  `)
  .order('created_at', { ascending: false });

if (docsError) {
  console.error('❌ Erro ao buscar documentos:', docsError);
} else {
  const withDocsCount = withDocs.filter(p => p.documents && p.documents.length > 0).length;
  const withoutDocsCount = withDocs.filter(p => !p.documents || p.documents.length === 0).length;
  console.log(`   Com documentos: ${withDocsCount}`);
  console.log(`   Sem documentos: ${withoutDocsCount}\n`);
}

// 5. Check document validations
console.log('🔐 VALIDAÇÕES DE DOCUMENTOS:');
const { data: validations, error: validError } = await supabase
  .from('document_validations')
  .select(`
    id,
    professional_id,
    validation_status,
    created_at,
    professional:professionals(full_name, email)
  `)
  .order('created_at', { ascending: false });

if (validError) {
  console.error('❌ Erro ao buscar validações:', validError);
} else {
  console.log(`   Total de validações: ${validations.length}`);

  const byValidationStatus = validations.reduce((acc, val) => {
    const status = val.validation_status || 'null';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  Object.entries(byValidationStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  console.log();
}

// 6. List all professionals with details
console.log('📋 LISTA COMPLETA DE PROFISSIONAIS:\n');
console.log('ID | Nome | Email | Status | Aprovado | Data Cadastro');
console.log('─'.repeat(100));

allProfessionals.forEach(prof => {
  const id = prof.id.substring(0, 8);
  const name = (prof.full_name || 'SEM NOME').padEnd(25).substring(0, 25);
  const email = (prof.email || 'SEM EMAIL').padEnd(30).substring(0, 30);
  const status = (prof.status || 'null').padEnd(12).substring(0, 12);
  const approved = prof.approved_at ? 'SIM' : 'NÃO';
  const date = new Date(prof.created_at).toLocaleDateString('pt-BR');

  console.log(`${id} | ${name} | ${email} | ${status} | ${approved.padEnd(8)} | ${date}`);
});

console.log('\n================================================\n');

// 7. Find potentially hidden professionals
console.log('🚨 PROFISSIONAIS QUE PODEM ESTAR OCULTOS NO ADMIN:\n');

const potentiallyHidden = allProfessionals.filter(prof => {
  // These are common filtering conditions that might hide professionals
  return !prof.approved_at ||
         prof.status === 'pending' ||
         prof.status === null;
});

if (potentiallyHidden.length > 0) {
  console.log(`⚠️  Encontrados ${potentiallyHidden.length} profissionais potencialmente ocultos:\n`);
  potentiallyHidden.forEach(prof => {
    console.log(`   - ${prof.full_name || 'SEM NOME'} (${prof.email})`);
    console.log(`     Status: ${prof.status || 'null'} | Aprovado: ${prof.approved_at ? 'SIM' : 'NÃO'}`);
    console.log(`     Cadastrado em: ${new Date(prof.created_at).toLocaleString('pt-BR')}\n`);
  });
} else {
  console.log('✅ Todos os profissionais parecem estar visíveis (sem filtros óbvios)\n');
}

console.log('================================================\n');
console.log('✅ Diagnóstico completo!\n');
