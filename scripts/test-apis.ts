/**
 * Script de Testes de APIs
 *
 * ⚠️ LIMITAÇÃO: Este script NÃO pode testar rotas autenticadas (401 esperado)
 *
 * USO: npx tsx scripts/test-apis.ts
 *
 * RECOMENDAÇÃO: Use os testes manuais no arquivo TESTE_COMPLETO.md
 * Este script serve apenas para verificar se as rotas existem (não são 404/405)
 */

const BASE_URL = 'http://localhost:3001';
const PROD_URL = 'https://seu-dominio.com'; // Atualizar com URL de produção

interface TestResult {
  route: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

const results: TestResult[] = [];

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

async function testRoute(
  route: string,
  method: string = 'GET',
  body?: any,
  requiresAuth: boolean = false
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const url = `${BASE_URL}${route}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`${colors.gray}Testing ${method} ${route}...${colors.reset}`);

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    // Se requer autenticação, 401 é esperado
    if (requiresAuth && response.status === 401) {
      return {
        route,
        method,
        status: 'PASS',
        statusCode: 401,
        responseTime,
      };
    }

    // Códigos de sucesso
    const successCodes = [200, 201, 204];
    const status = successCodes.includes(response.status) ? 'PASS' : 'FAIL';

    return {
      route,
      method,
      status,
      statusCode: response.status,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      route,
      method,
      status: 'FAIL',
      error: error.message,
      responseTime,
    };
  }
}

async function runTests() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  TESTE COMPLETO DE APIS - HRX PLATFORM${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.gray}Base URL: ${BASE_URL}${colors.reset}\n`);

  // =============================================
  // ROTAS PÚBLICAS
  // =============================================
  console.log(`\n${colors.yellow}📋 ROTAS PÚBLICAS${colors.reset}`);
  console.log(`${colors.gray}─────────────────────────────────${colors.reset}`);

  results.push(await testRoute('/'));
  results.push(await testRoute('/api/health'));
  results.push(await testRoute('/api/public/event-requests'));

  // =============================================
  // ROTAS DE PROJETOS (Admin)
  // =============================================
  console.log(`\n${colors.yellow}📦 ROTAS DE PROJETOS${colors.reset}`);
  console.log(`${colors.gray}─────────────────────────────────${colors.reset}`);

  results.push(await testRoute('/api/admin/event-projects', 'GET', null, true));
  results.push(await testRoute('/api/admin/event-projects', 'POST', {
    client_name: 'Teste',
    event_type: 'Corporate',
    event_date: '2025-12-31',
  }, true));

  // =============================================
  // ROTAS DE FORNECEDORES (Admin)
  // =============================================
  console.log(`\n${colors.yellow}🏪 ROTAS DE FORNECEDORES${colors.reset}`);
  console.log(`${colors.gray}─────────────────────────────────${colors.reset}`);

  results.push(await testRoute('/api/admin/suppliers', 'GET', null, true));
  results.push(await testRoute('/api/admin/suppliers/search', 'POST', {
    query: '',
    status: 'all',
  }, true));

  // =============================================
  // ROTAS DE PROFISSIONAIS (Admin)
  // =============================================
  console.log(`\n${colors.yellow}👥 ROTAS DE PROFISSIONAIS${colors.reset}`);
  console.log(`${colors.gray}─────────────────────────────────${colors.reset}`);

  results.push(await testRoute('/api/admin/professionals/search', 'POST', {
    filters: {},
    page: 1,
    limit: 20,
  }, true));

  // =============================================
  // ROTAS DE EMAILS (Admin)
  // =============================================
  console.log(`\n${colors.yellow}📧 ROTAS DE EMAILS${colors.reset}`);
  console.log(`${colors.gray}─────────────────────────────────${colors.reset}`);

  results.push(await testRoute('/api/admin/emails/config', 'GET', null, true));
  results.push(await testRoute('/api/admin/emails/history', 'GET', null, true));
  results.push(await testRoute('/api/admin/emails/preview?template=professional-welcome', 'GET', null, false));

  // =============================================
  // ROTAS DE CONTADORES (Admin)
  // =============================================
  console.log(`\n${colors.yellow}📊 ROTAS DE CONTADORES${colors.reset}`);
  console.log(`${colors.gray}─────────────────────────────────${colors.reset}`);

  results.push(await testRoute('/api/admin/counts', 'GET', null, true));

  // =============================================
  // RESULTADOS
  // =============================================
  console.log(`\n\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  RESULTADOS DOS TESTES${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  // Tabela de resultados
  console.log(`${colors.gray}Rota                                      Método  Status     Código  Tempo${colors.reset}`);
  console.log(`${colors.gray}────────────────────────────────────────────────────────────────────────────${colors.reset}`);

  results.forEach(result => {
    const statusColor = result.status === 'PASS' ? colors.green :
                       result.status === 'FAIL' ? colors.red : colors.yellow;
    const statusIcon = result.status === 'PASS' ? '✓' :
                      result.status === 'FAIL' ? '✗' : '○';

    const route = result.route.padEnd(42);
    const method = result.method.padEnd(6);
    const status = `${statusColor}${statusIcon} ${result.status}${colors.reset}`.padEnd(20);
    const code = result.statusCode ? String(result.statusCode).padEnd(6) : '      ';
    const time = result.responseTime ? `${result.responseTime}ms` : '';

    console.log(`${route} ${method} ${status} ${code} ${time}`);

    if (result.error) {
      console.log(`  ${colors.red}↳ ${result.error}${colors.reset}`);
    }
  });

  // Estatísticas
  console.log(`\n${colors.gray}────────────────────────────────────────────────────────────────────────────${colors.reset}\n`);
  console.log(`${colors.green}✓ Passou:${colors.reset}  ${passed}/${total}`);
  console.log(`${colors.red}✗ Falhou:${colors.reset}  ${failed}/${total}`);
  console.log(`${colors.yellow}○ Pulou:${colors.reset}   ${skipped}/${total}`);

  const avgTime = results.reduce((acc, r) => acc + (r.responseTime || 0), 0) / results.length;
  console.log(`\n${colors.gray}Tempo médio de resposta: ${avgTime.toFixed(0)}ms${colors.reset}`);

  // Taxa de sucesso
  const successRate = (passed / total) * 100;
  const rateColor = successRate >= 80 ? colors.green :
                   successRate >= 60 ? colors.yellow : colors.red;
  console.log(`${rateColor}Taxa de sucesso: ${successRate.toFixed(1)}%${colors.reset}`);

  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Executar testes
runTests().catch(error => {
  console.error(`${colors.red}Erro ao executar testes:${colors.reset}`, error);
  process.exit(1);
});
