#!/usr/bin/env node
/**
 * Script de auditoria completa das APIs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const API_DIR = 'src/app/api';

// Encontrar todos os route.ts
function findAllRoutes(dir, base = dir) {
  const entries = readdirSync(dir);
  let routes = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      routes = routes.concat(findAllRoutes(fullPath, base));
    } else if (entry === 'route.ts') {
      routes.push(relative(base, fullPath).replace(/\\/g, '/'));
    }
  }

  return routes;
}

// Analisar um arquivo route.ts
function analyzeRoute(filePath) {
  const content = readFileSync(join(API_DIR, filePath), 'utf-8');

  const methods = {
    GET: content.includes('export async function GET'),
    POST: content.includes('export async function POST'),
    PUT: content.includes('export async function PUT'),
    PATCH: content.includes('export async function PATCH'),
    DELETE: content.includes('export async function DELETE'),
  };

  const hasAuth = content.includes('await auth()') || content.includes('const { userId } = await auth()');
  const hasRateLimit = content.includes('rateLimit(');
  const hasValidation = content.includes('z.object') || content.includes('zodResolver');
  const hasTryCatch = content.includes('try {') && content.includes('} catch');

  return {
    path: filePath.replace('/route.ts', ''),
    methods: Object.keys(methods).filter(m => methods[m]),
    hasAuth,
    hasRateLimit,
    hasValidation,
    hasTryCatch,
  };
}

// Main
console.log('🔍 Auditando APIs...\n');

const routes = findAllRoutes(API_DIR);
console.log(`📊 Total de rotas encontradas: ${routes.length}\n`);

const results = routes.map(analyzeRoute);

// Estatísticas
const stats = {
  total: results.length,
  withAuth: results.filter(r => r.hasAuth).length,
  withoutAuth: results.filter(r => !r.hasAuth).length,
  withRateLimit: results.filter(r => r.hasRateLimit).length,
  withValidation: results.filter(r => r.hasValidation).length,
  withTryCatch: results.filter(r => r.hasTryCatch).length,
};

console.log('📈 Estatísticas:');
console.log(`   Total de rotas: ${stats.total}`);
console.log(`   Com autenticação: ${stats.withAuth} (${Math.round(stats.withAuth/stats.total*100)}%)`);
console.log(`   Sem autenticação: ${stats.withoutAuth} (${Math.round(stats.withoutAuth/stats.total*100)}%)`);
console.log(`   Com rate limiting: ${stats.withRateLimit} (${Math.round(stats.withRateLimit/stats.total*100)}%)`);
console.log(`   Com validação: ${stats.withValidation} (${Math.round(stats.withValidation/stats.total*100)}%)`);
console.log(`   Com try/catch: ${stats.withTryCatch} (${Math.round(stats.withTryCatch/stats.total*100)}%)`);

// Rotas públicas sem rate limiting (RISCO)
console.log('\n⚠️  ROTAS PÚBLICAS SEM RATE LIMITING:');
const riskyRoutes = results.filter(r => !r.hasAuth && !r.hasRateLimit);
riskyRoutes.forEach(r => {
  console.log(`   - ${r.path} [${r.methods.join(', ')}]`);
});

// Rotas sem try/catch (RISCO)
console.log('\n⚠️  ROTAS SEM TRY/CATCH:');
const noCatch = results.filter(r => !r.hasTryCatch);
noCatch.forEach(r => {
  console.log(`   - ${r.path} [${r.methods.join(', ')}]`);
});

console.log('\n✅ Auditoria concluída!');
