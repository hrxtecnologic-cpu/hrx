#!/usr/bin/env node
/**
 * Script para adicionar rate limiting em APIs públicas
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// Template do código de rate limiting
const RATE_LIMIT_CODE = `
    // Rate Limiting - Proteção contra abuse
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
`;

// Lista de APIs para adicionar rate limiting
const APIS_TO_UPDATE = [
  'src/app/api/professional/confirm/[token]/route.ts',
  'src/app/api/proposals/[id]/accept/route.ts',
  'src/app/api/proposals/[id]/reject/route.ts',
  'src/app/api/quotations/[id]/respond/route.ts',
  'src/app/api/webhooks/clerk/route.ts',
  'src/app/api/mapbox/directions/route.ts',
  'src/app/api/mapbox/isochrone/route.ts',
  'src/app/api/upload/route.ts',
];

function addRateLimiting(filePath) {
  try {
    const fullPath = join(ROOT, filePath);
    let content = readFileSync(fullPath, 'utf-8');

    // Verificar se já tem rate limiting
    if (content.includes('rateLimit(')) {
      console.log(`  ⏭️  ${filePath} - já tem rate limiting`);
      return false;
    }

    // Adicionar import se não existir
    if (!content.includes("from '@/lib/rate-limit'")) {
      // Encontrar a última linha de import
      const lastImportMatch = content.match(/import [^;]+;(?=\n\n|\nexport)/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(
          lastImport,
          `${lastImport}\nimport { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';`
        );
      }
    }

    // Encontrar a primeira função export (GET, POST, PATCH, DELETE)
    const functionMatch = content.match(/export async function (GET|POST|PATCH|DELETE)\([^)]+\) \{/);

    if (!functionMatch) {
      console.log(`  ⚠️  ${filePath} - não encontrou função export`);
      return false;
    }

    // Encontrar o primeiro try {
    const tryMatch = content.match(/export async function (?:GET|POST|PATCH|DELETE)[^{]+\{[\s\n]*try \{/);

    if (tryMatch) {
      // Adicionar rate limiting logo após o try {
      content = content.replace(
        /(\n\s*try \{\s*\n)/,
        `$1${RATE_LIMIT_CODE}\n`
      );
    } else {
      // Se não tem try, adicionar logo após a abertura da função
      content = content.replace(
        /(export async function (?:GET|POST|PATCH|DELETE)[^{]+\{\s*\n)/,
        `$1  try {${RATE_LIMIT_CODE}\n`
      );

      // Adicionar } catch no final
      content = content.replace(
        /(\n\})\s*$/,
        `\n  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`
      );
    }

    // Salvar arquivo atualizado
    writeFileSync(fullPath, content, 'utf-8');
    console.log(`  ✅ ${filePath} - rate limiting adicionado`);
    return true;

  } catch (error) {
    console.log(`  ❌ ${filePath} - erro: ${error.message}`);
    return false;
  }
}

console.log('🔐 Adicionando Rate Limiting nas APIs Públicas\n');

let updated = 0;
let skipped = 0;
let errors = 0;

APIS_TO_UPDATE.forEach(api => {
  const result = addRateLimiting(api);
  if (result === true) updated++;
  else if (result === false) skipped++;
  else errors++;
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Atualizadas: ${updated}`);
console.log(`⏭️  Ignoradas: ${skipped}`);
console.log(`❌ Erros: ${errors}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
