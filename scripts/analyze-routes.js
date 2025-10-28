const fs = require('fs');
const path = require('path');

// Encontrar todos os arquivos route.ts
function findRoutes(dir, routes = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRoutes(filePath, routes);
    } else if (file === 'route.ts') {
      routes.push(filePath);
    }
  });

  return routes;
}

// Analisar arquivo de rota
function analyzeRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extrair caminho da API
  const apiPath = filePath
    .replace(/\\/g, '/')
    .replace(/.*src\/app\/api/, '')
    .replace('/route.ts', '')
    .replace(/\[([^\]]+)\]/g, '{$1}'); // Converter [id] para {id}

  // Detectar métodos HTTP
  const methods = [];
  if (content.includes('export const GET') || content.includes('export async function GET')) {
    methods.push('GET');
  }
  if (content.includes('export const POST') || content.includes('export async function POST')) {
    methods.push('POST');
  }
  if (content.includes('export const PUT') || content.includes('export async function PUT')) {
    methods.push('PUT');
  }
  if (content.includes('export const PATCH') || content.includes('export async function PATCH')) {
    methods.push('PATCH');
  }
  if (content.includes('export const DELETE') || content.includes('export async function DELETE')) {
    methods.push('DELETE');
  }

  // Extrair descrição do comentário
  const descMatch = content.match(/\/\*\*[\s\S]*?\*\/|\/\/.*(?:\n|$)/);
  let description = 'Sem descrição';
  if (descMatch) {
    description = descMatch[0]
      .replace(/\/\*\*|\*\/|\/\/|\*/g, '')
      .trim()
      .split('\n')[0]
      .trim();
  }

  // Detectar autenticação
  const requiresAuth =
    content.includes('withAdmin') ||
    content.includes('withAuth') ||
    content.includes('auth()') ||
    content.includes('@clerk/nextjs');

  // Detectar rate limiting
  const hasRateLimit = content.includes('rateLimit');

  // Detectar otimizações
  const optimizations = [];
  if (content.includes('Promise.all')) optimizations.push('Queries paralelas');
  if (content.includes('.rpc(')) optimizations.push('RPC otimizada');
  if (content.includes('select(') && !content.includes("select('*')")) optimizations.push('Select otimizado');
  if (content.includes('.in(')) optimizations.push('Batch query');

  // Categorizar rota
  let category = 'Outros';
  if (apiPath.includes('/admin/')) category = 'Admin';
  else if (apiPath.includes('/professional/')) category = 'Professional';
  else if (apiPath.includes('/contractor/')) category = 'Contractor';
  else if (apiPath.includes('/supplier/')) category = 'Supplier';
  else if (apiPath.includes('/public/')) category = 'Public';

  // Subcategoria
  let subcategory = 'Geral';
  if (apiPath.includes('/professionals')) subcategory = 'Professionals';
  else if (apiPath.includes('/event-projects')) subcategory = 'Event Projects';
  else if (apiPath.includes('/suppliers')) subcategory = 'Suppliers';
  else if (apiPath.includes('/categories')) subcategory = 'Categories';
  else if (apiPath.includes('/users')) subcategory = 'Users';
  else if (apiPath.includes('/geocode')) subcategory = 'Geocoding';
  else if (apiPath.includes('/map-data')) subcategory = 'Map Data';
  else if (apiPath.includes('/deliveries')) subcategory = 'Deliveries';
  else if (apiPath.includes('/quotations')) subcategory = 'Quotations';
  else if (apiPath.includes('/email')) subcategory = 'Email';
  else if (apiPath.includes('/documents')) subcategory = 'Documents';
  else if (apiPath.includes('/notifications')) subcategory = 'Notifications';

  return {
    path: apiPath,
    methods,
    description,
    requiresAuth,
    hasRateLimit,
    optimizations,
    category,
    subcategory,
    filePath: filePath.replace(/\\/g, '/'),
  };
}

// Main
const apiDir = path.join(__dirname, '../src/app/api');
const routes = findRoutes(apiDir);

console.log(`\n🔍 Analisando ${routes.length} rotas...\n`);

const analyzed = routes.map(analyzeRoute);

// Agrupar por categoria
const grouped = analyzed.reduce((acc, route) => {
  if (!acc[route.category]) acc[route.category] = {};
  if (!acc[route.category][route.subcategory]) acc[route.category][route.subcategory] = [];
  acc[route.category][route.subcategory].push(route);
  return acc;
}, {});

// Gerar relatório
let markdown = '# 📋 Análise Completa das APIs - HRX\n\n';
markdown += `**Total de rotas:** ${routes.length}\n`;
markdown += `**Data:** ${new Date().toISOString().split('T')[0]}\n\n`;
markdown += '---\n\n';

// Estatísticas gerais
markdown += '## 📊 Estatísticas Gerais\n\n';
markdown += `| Métrica | Valor |\n`;
markdown += `|---------|-------|\n`;
markdown += `| **Total de rotas** | ${routes.length} |\n`;
markdown += `| **Com autenticação** | ${analyzed.filter(r => r.requiresAuth).length} |\n`;
markdown += `| **Com rate limiting** | ${analyzed.filter(r => r.hasRateLimit).length} |\n`;
markdown += `| **Otimizadas** | ${analyzed.filter(r => r.optimizations.length > 0).length} |\n`;
markdown += `| **Categorias** | ${Object.keys(grouped).length} |\n`;
markdown += '\n---\n\n';

// Por categoria
markdown += '## 🗂️ Rotas por Categoria\n\n';
Object.entries(grouped).forEach(([category, subcats]) => {
  const totalInCategory = Object.values(subcats).flat().length;
  markdown += `### ${category} (${totalInCategory} rotas)\n\n`;

  Object.entries(subcats).forEach(([subcat, routes]) => {
    markdown += `#### ${subcat} (${routes.length})\n\n`;
    markdown += `| Método | Rota | Descrição | Auth | Rate Limit | Otimizações |\n`;
    markdown += `|--------|------|-----------|------|------------|-------------|\n`;

    routes.forEach(route => {
      const methodsStr = route.methods.join(', ');
      const authStr = route.requiresAuth ? '✅' : '❌';
      const rateLimitStr = route.hasRateLimit ? '✅' : '❌';
      const optsStr = route.optimizations.length > 0
        ? route.optimizations.join(', ')
        : '-';

      markdown += `| ${methodsStr} | \`${route.path}\` | ${route.description} | ${authStr} | ${rateLimitStr} | ${optsStr} |\n`;
    });

    markdown += '\n';
  });
});

// Rotas não otimizadas
markdown += '---\n\n';
markdown += '## ⚠️ Rotas SEM Otimizações\n\n';
const notOptimized = analyzed.filter(r => r.optimizations.length === 0);
markdown += `**Total:** ${notOptimized.length} rotas\n\n`;

if (notOptimized.length > 0) {
  markdown += `| Rota | Métodos | Sugestões |\n`;
  markdown += `|------|---------|----------|\n`;

  notOptimized.forEach(route => {
    let suggestions = [];

    // Sugestões baseadas na rota
    if (route.path.includes('search') || route.path.includes('list')) {
      suggestions.push('Considerar paginação');
      suggestions.push('Adicionar índices');
    }
    if (route.methods.includes('GET') && route.path.includes('{id}')) {
      suggestions.push('Verificar se usa select específico');
    }
    if (!route.hasRateLimit) {
      suggestions.push('⚠️ Adicionar rate limiting');
    }

    markdown += `| \`${route.path}\` | ${route.methods.join(', ')} | ${suggestions.join('; ') || 'N/A'} |\n`;
  });
}

// Rotas sem autenticação
markdown += '\n---\n\n';
markdown += '## 🔓 Rotas SEM Autenticação\n\n';
const noAuth = analyzed.filter(r => !r.requiresAuth);
markdown += `**Total:** ${noAuth.length} rotas\n\n`;

if (noAuth.length > 0) {
  markdown += `| Rota | Métodos | Ação Recomendada |\n`;
  markdown += `|------|---------|------------------|\n`;

  noAuth.forEach(route => {
    let action = 'Verificar se deve ser pública';
    if (route.path.includes('/admin/')) action = '⚠️ **CRÍTICO**: Admin deve ter auth';
    else if (route.path.includes('/professional/') || route.path.includes('/supplier/')) {
      action = '⚠️ Adicionar autenticação';
    }

    markdown += `| \`${route.path}\` | ${route.methods.join(', ')} | ${action} |\n`;
  });
}

// Rotas otimizadas
markdown += '\n---\n\n';
markdown += '## ✅ Rotas COM Otimizações\n\n';
const optimized = analyzed.filter(r => r.optimizations.length > 0);
markdown += `**Total:** ${optimized.length} rotas\n\n`;

if (optimized.length > 0) {
  markdown += `| Rota | Otimizações |\n`;
  markdown += `|------|-------------|\n`;

  optimized.forEach(route => {
    markdown += `| \`${route.path}\` | ${route.optimizations.join(', ')} |\n`;
  });
}

// Recomendações finais
markdown += '\n---\n\n';
markdown += '## 💡 Recomendações\n\n';
markdown += '### 🔴 CRÍTICO (fazer imediatamente)\n\n';
const criticalIssues = analyzed.filter(r =>
  (r.path.includes('/admin/') && !r.requiresAuth) ||
  (!r.hasRateLimit && r.methods.includes('POST'))
);
if (criticalIssues.length > 0) {
  markdown += `- **${criticalIssues.filter(r => r.path.includes('/admin/') && !r.requiresAuth).length} rotas admin sem autenticação**\n`;
  markdown += `- **${criticalIssues.filter(r => !r.hasRateLimit && r.methods.includes('POST')).length} rotas POST sem rate limiting**\n\n`;
} else {
  markdown += '✅ Nenhum problema crítico encontrado!\n\n';
}

markdown += '### 🟡 IMPORTANTE (fazer esta semana)\n\n';
markdown += `- Otimizar ${notOptimized.length} rotas sem otimizações\n`;
markdown += `- Adicionar rate limiting em ${analyzed.filter(r => !r.hasRateLimit).length} rotas\n`;
markdown += `- Revisar ${noAuth.length} rotas sem autenticação\n\n`;

markdown += '### 🟢 OPCIONAL (melhorias futuras)\n\n';
markdown += '- Adicionar caching em rotas de leitura frequente\n';
markdown += '- Implementar GraphQL para queries complexas\n';
markdown += '- Adicionar WebSockets para updates em tempo real\n\n';

// Rotas candidatas a remoção
markdown += '---\n\n';
markdown += '## 🗑️ Candidatas a Remoção/Consolidação\n\n';
markdown += 'Rotas que podem ser desnecessárias ou duplicadas:\n\n';

// Detectar rotas similares
const duplicates = analyzed.reduce((acc, route) => {
  const basePath = route.path.replace(/\{[^}]+\}/g, '{id}');
  if (!acc[basePath]) acc[basePath] = [];
  acc[basePath].push(route);
  return acc;
}, {});

let foundDuplicates = false;
Object.entries(duplicates).forEach(([basePath, routes]) => {
  if (routes.length > 1) {
    foundDuplicates = true;
    markdown += `\n**${basePath}:**\n`;
    routes.forEach(r => {
      markdown += `- \`${r.path}\` (${r.methods.join(', ')})\n`;
    });
  }
});

if (!foundDuplicates) {
  markdown += '✅ Nenhuma duplicação óbvia encontrada.\n';
}

// Salvar arquivos
const reportPath = path.join(__dirname, '../API_ROUTES_ANALYSIS.md');
fs.writeFileSync(reportPath, markdown);

// JSON para processamento
const jsonPath = path.join(__dirname, '../api-routes.json');
fs.writeFileSync(jsonPath, JSON.stringify(analyzed, null, 2));

console.log('✅ Análise concluída!\n');
console.log(`📄 Relatório Markdown: ${reportPath}`);
console.log(`📊 JSON: ${jsonPath}`);
console.log(`\n📈 Resumo:`);
console.log(`   Total: ${routes.length} rotas`);
console.log(`   Com Auth: ${analyzed.filter(r => r.requiresAuth).length}`);
console.log(`   Com Rate Limit: ${analyzed.filter(r => r.hasRateLimit).length}`);
console.log(`   Otimizadas: ${analyzed.filter(r => r.optimizations.length > 0).length}`);
console.log(`   ⚠️ Sem Auth: ${noAuth.length}`);
console.log(`   ⚠️ Sem Otimização: ${notOptimized.length}`);
