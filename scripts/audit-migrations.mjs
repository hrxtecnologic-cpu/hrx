#!/usr/bin/env node
/**
 * Script de auditoria completa das migrations (triggers, functions, etc)
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = 'supabase/migrations';

console.log('🔍 Auditando Migrations e Database Logic...\n');

// Listar todas as migrations
const files = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📊 Total de migrations: ${files.length}\n`);

// Analisar cada migration
const allFunctions = [];
const allTriggers = [];
const allViews = [];
const allPolicies = [];

files.forEach(file => {
  const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

  // Extrair functions
  const funcMatches = content.matchAll(/CREATE (?:OR REPLACE )?FUNCTION (\w+)\(/g);
  [...funcMatches].forEach(m => {
    allFunctions.push({ name: m[1], file });
  });

  // Extrair triggers
  const triggerMatches = content.matchAll(/CREATE TRIGGER (\w+)/g);
  [...triggerMatches].forEach(m => {
    allTriggers.push({ name: m[1], file });
  });

  // Extrair views
  const viewMatches = content.matchAll(/CREATE (?:OR REPLACE )?VIEW (\w+)/g);
  [...viewMatches].forEach(m => {
    allViews.push({ name: m[1], file });
  });

  // Extrair policies
  const policyMatches = content.matchAll(/CREATE POLICY "(.+?)"/g);
  [...policyMatches].forEach(m => {
    allPolicies.push({ name: m[1], file });
  });
});

// Mostrar estatísticas
console.log('📈 Estatísticas Gerais:');
console.log(`   Functions: ${allFunctions.length}`);
console.log(`   Triggers: ${allTriggers.length}`);
console.log(`   Views: ${allViews.length}`);
console.log(`   Policies (RLS): ${allPolicies.length}`);

// Agrupar por tipo
console.log('\n🔧 Functions por Categoria:');
const functionsByCategory = {
  update: allFunctions.filter(f => f.name.includes('update')),
  calculate: allFunctions.filter(f => f.name.includes('calculate')),
  generate: allFunctions.filter(f => f.name.includes('generate')),
  get: allFunctions.filter(f => f.name.includes('get') || f.name.includes('search')),
  validate: allFunctions.filter(f => f.name.includes('validate') || f.name.includes('check')),
  other: allFunctions.filter(f =>
    !f.name.includes('update') &&
    !f.name.includes('calculate') &&
    !f.name.includes('generate') &&
    !f.name.includes('get') &&
    !f.name.includes('search') &&
    !f.name.includes('validate') &&
    !f.name.includes('check')
  ),
};

Object.entries(functionsByCategory).forEach(([cat, funcs]) => {
  console.log(`   ${cat}: ${funcs.length} functions`);
});

// Functions financeiras
console.log('\n💰 Functions Financeiras (CRÍTICAS):');
const financialFunctions = allFunctions.filter(f =>
  f.name.includes('cost') ||
  f.name.includes('price') ||
  f.name.includes('profit') ||
  f.name.includes('margin') ||
  f.name.includes('quotation')
);
financialFunctions.forEach(f => {
  console.log(`   - ${f.name} (${f.file})`);
});

// Triggers financeiros
console.log('\n💰 Triggers Financeiros (CRÍTICOS):');
const financialTriggers = allTriggers.filter(t =>
  t.name.includes('cost') ||
  t.name.includes('price') ||
  t.name.includes('profit') ||
  t.name.includes('margin') ||
  t.name.includes('quotation') ||
  t.name.includes('team') ||
  t.name.includes('equipment')
);
financialTriggers.forEach(t => {
  console.log(`   - ${t.name} (${t.file})`);
});

// Verificar duplicados
console.log('\n⚠️  Functions Duplicadas:');
const funcNames = allFunctions.map(f => f.name);
const duplicateFuncs = funcNames.filter((name, index) => funcNames.indexOf(name) !== index);
const uniqueDuplicates = [...new Set(duplicateFuncs)];
if (uniqueDuplicates.length > 0) {
  uniqueDuplicates.forEach(name => {
    const instances = allFunctions.filter(f => f.name === name);
    console.log(`   - ${name}: ${instances.length}x`);
    instances.forEach(i => console.log(`      └─ ${i.file}`));
  });
} else {
  console.log('   ✓ Nenhuma duplicação encontrada');
}

// Verificar triggers duplicados
console.log('\n⚠️  Triggers Duplicados:');
const triggerNames = allTriggers.map(t => t.name);
const duplicateTriggers = triggerNames.filter((name, index) => triggerNames.indexOf(name) !== index);
const uniqueDuplicateTriggers = [...new Set(duplicateTriggers)];
if (uniqueDuplicateTriggers.length > 0) {
  uniqueDuplicateTriggers.forEach(name => {
    const instances = allTriggers.filter(t => t.name === name);
    console.log(`   - ${name}: ${instances.length}x`);
    instances.forEach(i => console.log(`      └─ ${i.file}`));
  });
} else {
  console.log('   ✓ Nenhuma duplicação encontrada');
}

// Verificar migration 016 especificamente
console.log('\n🔍 Análise da Migration 016 (Financial Calculations):');
const migration016 = files.find(f => f.startsWith('016'));
if (migration016) {
  const content = readFileSync(join(MIGRATIONS_DIR, migration016), 'utf-8');

  const hasPart1 = content.includes('update_project_team_cost');
  const hasPart2 = content.includes('update_project_equipment_cost');
  const hasPart3 = content.includes('update_project_totals');

  console.log(`   Arquivo: ${migration016}`);
  console.log(`   Função 1 (team_cost): ${hasPart1 ? '✓' : '✗'}`);
  console.log(`   Função 2 (equipment_cost): ${hasPart2 ? '✓' : '✗'}`);
  console.log(`   Função 3 (totals): ${hasPart3 ? '✓' : '✗'}`);

  // Verificar se tem recálculo inicial
  const hasRecalculation = content.includes('FOR v_project IN SELECT id FROM event_projects');
  console.log(`   Recálculo inicial: ${hasRecalculation ? '✓' : '✗'}`);
}

console.log('\n✅ Auditoria de migrations concluída!');
