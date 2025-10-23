import { glob } from 'glob';
import { readFileSync } from 'fs';
import path from 'path';

console.log('🔍 PROCURANDO REFERÊNCIAS AOS SISTEMAS ANTIGOS\n');
console.log('================================================================\n');

const srcDir = 'src';

// Procurar por arquivos que mencionam as tabelas antigas
const patterns = ['requests', 'contractor_requests'];
const results = {};

for (const pattern of patterns) {
  console.log(`\n📊 Procurando referências a: "${pattern}"\n`);

  const files = await glob(`${srcDir}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/node_modules/**', '**/.next/**']
  });

  const matches = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');

    // Procurar por .from('requests') ou .from('contractor_requests')
    const tableRegex = new RegExp(`\\.from\\(['"\`]${pattern}['"\`]\\)`, 'g');
    const tableMatches = content.match(tableRegex);

    if (tableMatches) {
      const lines = content.split('\n');
      const matchedLines = [];

      lines.forEach((line, idx) => {
        if (line.includes(`.from('${pattern}')`) || line.includes(`.from("${pattern}")`)) {
          matchedLines.push({
            lineNumber: idx + 1,
            content: line.trim()
          });
        }
      });

      matches.push({
        file: file.replace(/\\/g, '/'),
        count: tableMatches.length,
        lines: matchedLines
      });
    }
  }

  results[pattern] = matches;

  console.log(`   Encontrados ${matches.length} arquivos com referências:\n`);

  if (matches.length > 0) {
    matches.forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.file}`);
      console.log(`      Ocorrências: ${match.count}`);
      match.lines.forEach(line => {
        console.log(`      Linha ${line.lineNumber}: ${line.content.substring(0, 80)}...`);
      });
      console.log();
    });
  }
}

console.log('\n================================================================\n');
console.log('📋 RESUMO:\n');

const totalRequests = results['requests']?.length || 0;
const totalContractorRequests = results['contractor_requests']?.length || 0;

console.log(`   • Arquivos usando "requests": ${totalRequests}`);
console.log(`   • Arquivos usando "contractor_requests": ${totalContractorRequests}`);
console.log(`   • TOTAL de arquivos para revisar: ${totalRequests + totalContractorRequests}\n`);

console.log('================================================================\n');
console.log('✅ Análise concluída!\n');
