#!/usr/bin/env node
/**
 * Script de auditoria completa do banco de dados
 */

import { readFileSync } from 'fs';

const SQL_FILE = 'atual.sql';

console.log('🔍 Auditando Banco de Dados...\n');

const content = readFileSync(SQL_FILE, 'utf-8');

// Extrair tabelas
const tableMatches = content.matchAll(/CREATE TABLE public\.(\w+) \(/g);
const tables = [...tableMatches].map(m => m[1]);

console.log(`📊 Total de tabelas: ${tables.length}\n`);

// Analisar cada tabela
const tableDetails = {};

for (const table of tables) {
  // Encontrar a definição completa da tabela
  const tableRegex = new RegExp(`CREATE TABLE public\\.${table} \\(([\\s\\S]*?)\\);`, 'g');
  const tableMatch = tableRegex.exec(content);

  if (!tableMatch) continue;

  const tableDef = tableMatch[1];

  // Contar campos
  const fields = tableDef.split('\n').filter(line =>
    line.trim() &&
    !line.trim().startsWith('CONSTRAINT') &&
    !line.trim().startsWith('CHECK') &&
    !line.trim().startsWith('FOREIGN KEY') &&
    !line.trim().startsWith('PRIMARY KEY') &&
    !line.trim().startsWith('UNIQUE')
  );

  // Verificar campos comuns
  const hasId = tableDef.includes('id uuid');
  const hasCreatedAt = tableDef.includes('created_at timestamp');
  const hasUpdatedAt = tableDef.includes('updated_at timestamp');
  const hasStatus = tableDef.includes('status character varying') || tableDef.includes('status text');

  // Verificar foreign keys
  const fkMatches = tableDef.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES public\.(\w+)/g);
  const foreignKeys = [...fkMatches].map(m => ({ column: m[1], refTable: m[2] }));

  // Verificar constraints
  const hasChecks = tableDef.includes('CHECK (');
  const hasUnique = tableDef.includes('UNIQUE');
  const hasNotNull = tableDef.includes('NOT NULL');

  tableDetails[table] = {
    fieldCount: fields.length,
    hasId,
    hasCreatedAt,
    hasUpdatedAt,
    hasStatus,
    foreignKeys,
    hasChecks,
    hasUnique,
    hasNotNull,
  };
}

// Estatísticas
console.log('📈 Análise de Padrões:');
const withId = Object.values(tableDetails).filter(t => t.hasId).length;
const withCreatedAt = Object.values(tableDetails).filter(t => t.hasCreatedAt).length;
const withUpdatedAt = Object.values(tableDetails).filter(t => t.hasUpdatedAt).length;
const withStatus = Object.values(tableDetails).filter(t => t.hasStatus).length;

console.log(`   Tabelas com 'id': ${withId}/${tables.length} (${Math.round(withId/tables.length*100)}%)`);
console.log(`   Tabelas com 'created_at': ${withCreatedAt}/${tables.length} (${Math.round(withCreatedAt/tables.length*100)}%)`);
console.log(`   Tabelas com 'updated_at': ${withUpdatedAt}/${tables.length} (${Math.round(withUpdatedAt/tables.length*100)}%)`);
console.log(`   Tabelas com 'status': ${withStatus}/${tables.length} (${Math.round(withStatus/tables.length*100)}%)`);

// Tabelas sem padrões básicos
console.log('\n⚠️  TABELAS SEM PADRÕES BÁSICOS:');
Object.entries(tableDetails).forEach(([name, details]) => {
  const missing = [];
  if (!details.hasId) missing.push('id');
  if (!details.hasCreatedAt) missing.push('created_at');
  if (!details.hasUpdatedAt) missing.push('updated_at');

  if (missing.length > 0) {
    console.log(`   - ${name}: faltando [${missing.join(', ')}]`);
  }
});

// Relacionamentos
console.log('\n🔗 Análise de Relacionamentos:');
const allFKs = Object.entries(tableDetails).flatMap(([table, details]) =>
  details.foreignKeys.map(fk => ({ table, ...fk }))
);

console.log(`   Total de foreign keys: ${allFKs.length}`);

// Tabelas mais referenciadas
const refCounts = {};
allFKs.forEach(fk => {
  refCounts[fk.refTable] = (refCounts[fk.refTable] || 0) + 1;
});

console.log('\n   Tabelas mais referenciadas:');
Object.entries(refCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([table, count]) => {
    console.log(`      ${table}: ${count} referências`);
  });

// Tabelas órfãs (sem FK e não referenciadas)
console.log('\n⚠️  TABELAS ÓRFÃS (sem relacionamentos):');
const referencedTables = new Set(allFKs.map(fk => fk.refTable));
const orphanTables = tables.filter(t =>
  tableDetails[t].foreignKeys.length === 0 &&
  !referencedTables.has(t)
);
orphanTables.forEach(t => console.log(`   - ${t}`));

// Campos financeiros
console.log('\n💰 Tabelas com Campos Financeiros:');
['event_projects', 'project_team', 'project_equipment', 'supplier_quotations'].forEach(table => {
  if (tableDetails[table]) {
    console.log(`   ✓ ${table} (${tableDetails[table].fieldCount} campos)`);
  }
});

// Verificar triggers e functions
const hasTriggers = content.includes('CREATE TRIGGER');
const hasFunctions = content.includes('CREATE OR REPLACE FUNCTION');

console.log('\n🔧 Triggers e Functions:');
console.log(`   Triggers: ${hasTriggers ? '✓ Sim' : '✗ Não'}`);
console.log(`   Functions: ${hasFunctions ? '✓ Sim' : '✗ Não'}`);

console.log('\n✅ Auditoria concluída!');
