import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 ANÁLISE DE SISTEMAS ANTIGOS DE PROJETOS\n');
console.log('================================================================\n');

// 1. Analisar tabela "requests"
console.log('📊 TABELA: requests (Sistema Antigo)\n');

const { data: requests, error: requestsError } = await supabase
  .from('requests')
  .select('*')
  .order('created_at', { ascending: false });

if (requestsError) {
  console.log('❌ Erro ao buscar requests:', requestsError.message);
} else {
  console.log(`   Total de registros: ${requests.length}`);

  if (requests.length > 0) {
    console.log('\n   📋 Amostra dos dados (primeiros 3 registros):\n');
    requests.slice(0, 3).forEach((req, idx) => {
      console.log(`   ${idx + 1}. ID: ${req.id}`);
      console.log(`      Criado em: ${new Date(req.created_at).toLocaleDateString('pt-BR')}`);
      console.log(`      Campos disponíveis: ${Object.keys(req).join(', ')}`);
      console.log(`      Dados: ${JSON.stringify(req, null, 2).substring(0, 200)}...\n`);
    });

    // Análise de status
    const statusCount = requests.reduce((acc, req) => {
      const status = req.status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('   Status distribuição:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
  } else {
    console.log('   ✅ Tabela vazia - nada para migrar');
  }
}

console.log('\n================================================================\n');

// 2. Analisar tabela "contractor_requests"
console.log('📊 TABELA: contractor_requests (Sistema Intermediário)\n');

const { data: contractorRequests, error: contractorError } = await supabase
  .from('contractor_requests')
  .select('*')
  .order('created_at', { ascending: false });

if (contractorError) {
  console.log('❌ Erro ao buscar contractor_requests:', contractorError.message);
} else {
  console.log(`   Total de registros: ${contractorRequests.length}`);

  if (contractorRequests.length > 0) {
    console.log('\n   📋 Amostra dos dados (primeiros 3 registros):\n');
    contractorRequests.slice(0, 3).forEach((req, idx) => {
      console.log(`   ${idx + 1}. ID: ${req.id}`);
      console.log(`      Criado em: ${new Date(req.created_at).toLocaleDateString('pt-BR')}`);
      console.log(`      Campos disponíveis: ${Object.keys(req).join(', ')}`);
      console.log(`      Dados: ${JSON.stringify(req, null, 2).substring(0, 200)}...\n`);
    });

    // Análise de status
    const statusCount = contractorRequests.reduce((acc, req) => {
      const status = req.status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('   Status distribuição:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
  } else {
    console.log('   ✅ Tabela vazia - nada para migrar');
  }
}

console.log('\n================================================================\n');

// 3. Analisar tabela "event_projects" (sistema atual)
console.log('📊 TABELA: event_projects (Sistema Atual)\n');

const { data: eventProjects, error: projectsError } = await supabase
  .from('event_projects')
  .select('*')
  .order('created_at', { ascending: false });

if (projectsError) {
  console.log('❌ Erro ao buscar event_projects:', projectsError.message);
} else {
  console.log(`   Total de registros: ${eventProjects.length}\n`);

  if (eventProjects.length > 0) {
    // Análise de status
    const statusCount = eventProjects.reduce((acc, proj) => {
      const status = proj.status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('   Status distribuição:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });

    console.log(`\n   Último projeto criado: ${new Date(eventProjects[0].created_at).toLocaleDateString('pt-BR')}`);
  }
}

console.log('\n================================================================\n');

// 4. Verificar APIs que usam sistemas antigos
console.log('🔍 RESUMO E RECOMENDAÇÕES:\n');

console.log(`   • requests: ${requests?.length || 0} registros`);
console.log(`   • contractor_requests: ${contractorRequests?.length || 0} registros`);
console.log(`   • event_projects: ${eventProjects?.length || 0} registros (sistema atual)\n`);

if ((requests?.length || 0) === 0 && (contractorRequests?.length || 0) === 0) {
  console.log('   ✅ EXCELENTE! As tabelas antigas estão vazias.');
  console.log('   ✅ Podemos remover com segurança o código que referencia elas.\n');
} else {
  console.log('   ⚠️  Existem dados nas tabelas antigas que precisam ser migrados.\n');
}

console.log('================================================================\n');
console.log('✅ Análise concluída!\n');
