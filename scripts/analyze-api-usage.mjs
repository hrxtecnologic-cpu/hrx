#!/usr/bin/env node
/**
 * Análise de uso de APIs - Identifica APIs antigas/não utilizadas
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

console.log('🔍 ANÁLISE DE USO DE APIs - Identificando APIs antigas/não utilizadas\n');

// Listar todas as APIs
const apiFiles = execSync('find src/app/api -type f -name "route.ts" | sort', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`📊 Total de APIs encontradas: ${apiFiles.length}\n`);

// Categorias de análise
const categories = {
  'TESTE/DEBUG': [],
  'DELIVERY (não implementado)': [],
  'SISTEMA ANTIGO (quotes/requests)': [],
  'DUPLICADAS': [],
  'EM USO - ADMIN': [],
  'EM USO - PUBLIC': [],
  'EM USO - PROFESSIONAL': [],
  'EM USO - CONTRACTOR': [],
  'EM USO - SUPPLIER': [],
  'EM USO - CORE': [],
};

const suspicious = [];
const definitelyRemove = [];

// Analisar cada API
apiFiles.forEach(file => {
  const path = file.replace('src/app/api/', '').replace('/route.ts', '');

  // TESTE/DEBUG - REMOVER
  if (path.match(/^(test|debug|send-test|send|test-simple|test-supabase)/)) {
    categories['TESTE/DEBUG'].push(path);
    definitelyRemove.push(file);
  }

  // DELIVERY - Sistema não implementado
  else if (path.includes('deliveries')) {
    categories['DELIVERY (não implementado)'].push(path);
    suspicious.push({ path, reason: 'Sistema de delivery não implementado' });
  }

  // SISTEMA ANTIGO - quotes vs quotations
  else if (path.match(/admin\/(quotes|projects\/.*\/quotations)/)) {
    categories['SISTEMA ANTIGO (quotes/requests)'].push(path);
    suspicious.push({ path, reason: 'Possível duplicação com event-projects' });
  }

  // APIs EM USO - ADMIN
  else if (path.startsWith('admin/event-projects') ||
           path.startsWith('admin/professionals') ||
           path.startsWith('admin/suppliers') ||
           path.startsWith('admin/users') ||
           path.startsWith('admin/categories') ||
           path.startsWith('admin/event-types') ||
           path.startsWith('admin/emails') ||
           path.startsWith('admin/cache') ||
           path.startsWith('admin/counts') ||
           path.startsWith('admin/geocode') ||
           path.startsWith('admin/map-data') ||
           path.startsWith('admin/reports')) {
    categories['EM USO - ADMIN'].push(path);
  }

  // APIs EM USO - PUBLIC
  else if (path.startsWith('public/')) {
    categories['EM USO - PUBLIC'].push(path);
  }

  // APIs EM USO - PROFESSIONAL
  else if (path.startsWith('professional/')) {
    categories['EM USO - PROFESSIONAL'].push(path);
  }

  // APIs EM USO - CONTRACTOR
  else if (path.startsWith('contratante/')) {
    categories['EM USO - CONTRACTOR'].push(path);
  }

  // APIs EM USO - SUPPLIER
  else if (path.startsWith('supplier/')) {
    categories['EM USO - SUPPLIER'].push(path);
  }

  // APIs CORE
  else if (path.match(/^(contact|webhooks|upload|notifications|mapbox|user\/(metadata|check-registration)|professionals\/(route|me)|contractors)/)) {
    categories['EM USO - CORE'].push(path);
  }

  // Proposals (aceitar/rejeitar)
  else if (path.startsWith('proposals/')) {
    categories['EM USO - CORE'].push(path);
  }

  // Quotations (fornecedor responder)
  else if (path.startsWith('quotations/')) {
    categories['EM USO - CORE'].push(path);
  }

  else {
    suspicious.push({ path, reason: 'Não categorizada' });
  }
});

// Exibir categorias
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📂 CATEGORIZAÇÃO DAS APIs:\n');

Object.entries(categories).forEach(([category, apis]) => {
  if (apis.length > 0) {
    console.log(`\n${category} (${apis.length} APIs):`);
    apis.forEach(api => console.log(`  • ${api}`));
  }
});

// APIs suspeitas
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  APIs SUSPEITAS (revisar):\n');
suspicious.forEach(({ path, reason }) => {
  console.log(`  • ${path}`);
  console.log(`    └─ Motivo: ${reason}`);
});

// APIs para REMOVER
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('❌ APIs PARA REMOVER DEFINITIVAMENTE:\n');
definitelyRemove.forEach(file => {
  console.log(`  • ${file}`);
});

// Verificar referências no código
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🔍 VERIFICANDO REFERÊNCIAS NO CÓDIGO...\n');

const testApis = categories['TESTE/DEBUG'];
const deliveryApis = categories['DELIVERY (não implementado)'];
const oldSystemApis = categories['SISTEMA ANTIGO (quotes/requests)'];

console.log('Verificando se APIs de TESTE são usadas no frontend...');
let testApisUsed = false;
testApis.forEach(api => {
  const endpoint = api.replace(/\[.*?\]/g, '*'); // Substituir [id] por *
  try {
    const result = execSync(`grep -r "api/${api}" src/app --include="*.tsx" --include="*.ts" | grep -v "src/app/api" || true`, { encoding: 'utf-8' });
    if (result.trim()) {
      console.log(`  ⚠️  ${api} é USADA:`);
      console.log(`      ${result.trim().split('\n')[0]}`);
      testApisUsed = true;
    }
  } catch (e) {}
});
if (!testApisUsed) {
  console.log('  ✓ Nenhuma API de teste é usada no frontend');
}

console.log('\nVerificando se APIs de DELIVERY são usadas...');
let deliveryApisUsed = false;
deliveryApis.forEach(api => {
  try {
    const result = execSync(`grep -r "api/${api}" src/app --include="*.tsx" --include="*.ts" | grep -v "src/app/api" || true`, { encoding: 'utf-8' });
    if (result.trim()) {
      console.log(`  ⚠️  ${api} é USADA:`);
      console.log(`      ${result.trim().split('\n')[0]}`);
      deliveryApisUsed = true;
    }
  } catch (e) {}
});
if (!deliveryApisUsed) {
  console.log('  ✓ Nenhuma API de delivery é usada no frontend');
}

// Resumo final
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📊 RESUMO FINAL:\n');

const inUse = categories['EM USO - ADMIN'].length +
              categories['EM USO - PUBLIC'].length +
              categories['EM USO - PROFESSIONAL'].length +
              categories['EM USO - CONTRACTOR'].length +
              categories['EM USO - SUPPLIER'].length +
              categories['EM USO - CORE'].length;

console.log(`✅ APIs EM USO: ${inUse}`);
console.log(`❌ APIs para REMOVER: ${definitelyRemove.length}`);
console.log(`⚠️  APIs SUSPEITAS (revisar): ${suspicious.length}`);
console.log(`📊 TOTAL: ${apiFiles.length}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ Análise concluída!\n');

// Recomendações
console.log('📋 RECOMENDAÇÕES:\n');
console.log('1. REMOVER imediatamente:');
console.log('   - APIs de teste/debug (antes de produção!)');
console.log('   - APIs de delivery (não implementadas)\n');

console.log('2. REVISAR APIs suspeitas:');
console.log('   - Verificar se admin/quotes é duplicado de admin/event-projects/quotations');
console.log('   - Verificar se admin/projects é antigo (deve usar event-projects)\n');

console.log('3. MANTER APIs em uso:');
console.log(`   - ${inUse} APIs categorizadas como ativas\n`);
