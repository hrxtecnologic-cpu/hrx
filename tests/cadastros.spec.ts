import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Cadastros
 * Email de teste: washington5247@uorak.com
 */

const TEST_EMAIL = 'washington5247@uorak.com';
const TEST_PASSWORD = 'TesteSenha123!'; // Você precisará definir ao criar a conta

test.describe('Fluxo de Cadastros', () => {
  test.beforeEach(async ({ page }) => {
    // Ir para a página inicial
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Cliente consegue solicitar evento SEM login', async ({ page }) => {
    // 1. Clicar em "Começar Agora"
    await page.click('text=Começar Agora');

    // 2. Deve ir para /onboarding
    await expect(page).toHaveURL('/onboarding');

    // 3. Escolher "Contratante / Solicitar Evento"
    await page.click('text=Contratante');

    // 4. Deve redirecionar para /solicitar-evento
    await expect(page).toHaveURL(/\/solicitar-evento/);

    // 5. Clicar em "Sou Cliente"
    await page.click('text=Sou Cliente');

    // 6. Preencher formulário
    await page.fill('input[name="client_name"]', 'João Silva Teste');
    await page.fill('input[name="client_email"]', 'joao.teste@email.com');
    await page.fill('input[name="client_phone"]', '(11) 99999-8888');

    await page.fill('input[name="event_name"]', 'Show de Rock Teste E2E');
    await page.selectOption('select[name="event_type"]', 'show');
    await page.fill('textarea[name="event_description"]', 'Show de rock com 3 bandas - Teste automatizado');

    await page.fill('input[name="event_date"]', '2025-12-15');
    await page.fill('input[name="start_time"]', '20:00');

    await page.fill('input[name="venue_address"]', 'Av. Paulista, 1000');
    await page.fill('input[name="venue_city"]', 'São Paulo');
    await page.fill('input[name="venue_state"]', 'SP');

    // Adicionar profissional (aguardar carregar)
    await page.waitForTimeout(1000);
    const addProfessionalBtn = page.locator('button:has-text("Adicionar Profissional")');
    if (await addProfessionalBtn.isVisible()) {
      await addProfessionalBtn.click();
      await page.waitForTimeout(500);
    }

    // 7. Submeter formulário
    await page.click('button[type="submit"]');

    // 8. Aguardar resposta e verificar sucesso
    await page.waitForResponse(response =>
      response.url().includes('/api/public/event-requests') &&
      response.status() === 201
    , { timeout: 10000 });

    // 9. Deve redirecionar para página de sucesso ou mostrar mensagem
    await page.waitForTimeout(2000);

    // Verificar se há mensagem de sucesso ou redirecionamento
    const successMessage = page.locator('text=/sucesso|recebida|obrigado/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Teste 1 passou: Cliente solicitou evento sem login');
  });

  test('2. Fornecedor PRECISA de login para cadastrar', async ({ page }) => {
    // 1. Ir para onboarding
    await page.goto('/onboarding');

    // 2. Escolher "Fornecedor"
    await page.click('text=Fornecedor');

    // 3. Deve redirecionar para login do Clerk
    await page.waitForURL(/sign-in|entrar/, { timeout: 10000 });

    // 4. Verificar que está na página de login
    const clerkLogin = page.locator('text=/sign in|entrar|login/i');
    await expect(clerkLogin).toBeVisible();

    console.log('✅ Teste 2 passou: Sistema exige login para fornecedor');
  });

  test('3. Fornecedor consegue cadastrar COM login', async ({ page }) => {
    // NOTA: Este teste requer que você já tenha criado uma conta no Clerk
    // com o email washington5247@uorak.com e definido uma senha

    // 1. Fazer login no Clerk
    await page.goto('/entrar');

    // Aguardar formulário de login do Clerk carregar
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

    // Preencher email
    await page.fill('input[name="identifier"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    // Aguardar campo de senha
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Aguardar autenticação completar
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 2. Ir para cadastro de fornecedor
    await page.goto('/solicitar-evento?type=supplier');

    // 3. Clicar em "Sou Fornecedor"
    await page.click('text=Sou Fornecedor');

    // 4. Preencher formulário
    await page.fill('input[name="company_name"]', 'AudioPro Equipamentos Teste');
    await page.fill('input[name="contact_name"]', 'Maria Santos');
    await page.fill('input[name="email"]', 'maria@audiopro-teste.com');
    await page.fill('input[name="phone"]', '(11) 98888-7777');

    // Selecionar tipos de equipamento (checkboxes)
    await page.check('input[value="Som e Áudio"]');
    await page.check('input[value="Iluminação"]');

    await page.fill('textarea[name="notes"]', 'Trabalhamos com eventos de médio e grande porte');

    // 5. Submeter
    await page.click('button[type="submit"]');

    // 6. Aguardar resposta
    await page.waitForResponse(response =>
      response.url().includes('/api/public/event-requests') &&
      (response.status() === 201 || response.status() === 400)
    , { timeout: 10000 });

    await page.waitForTimeout(2000);

    // 7. Verificar sucesso OU erro de duplicação (se já cadastrou antes)
    const body = await page.textContent('body');
    const isSuccess = body?.includes('sucesso') || body?.includes('cadastrado');
    const isDuplicate = body?.includes('já tem um cadastro') || body?.includes('já possui');

    expect(isSuccess || isDuplicate).toBeTruthy();

    if (isSuccess) {
      console.log('✅ Teste 3 passou: Fornecedor cadastrado com sucesso');
    } else {
      console.log('✅ Teste 3 passou: Duplicação detectada corretamente');
    }
  });

  test('4. Rate Limiting bloqueia após 20 requisições', async ({ page }) => {
    // Este teste faz chamadas diretas à API para testar rate limiting
    const successfulRequests = [];
    const blockedRequests = [];

    for (let i = 1; i <= 25; i++) {
      const response = await page.request.post('/api/public/event-requests', {
        data: {
          client_name: `Teste Rate Limit ${i}`,
          client_email: `teste${i}@ratelimit.com`,
          client_phone: '11999999999',
          event_name: `Evento Teste ${i}`,
          event_type: 'show',
          event_description: 'Teste de rate limiting',
          venue_address: 'Rua Teste',
          venue_city: 'São Paulo',
          venue_state: 'SP',
          professionals: [{ category: 'seguranca', quantity: 1 }],
        },
      });

      if (response.status() === 201) {
        successfulRequests.push(i);
      } else if (response.status() === 429) {
        blockedRequests.push(i);
      }

      // Pequeno delay entre requisições
      await page.waitForTimeout(100);
    }

    console.log(`📊 Requests bem-sucedidos: ${successfulRequests.length}`);
    console.log(`🚫 Requests bloqueados: ${blockedRequests.length}`);

    // Deve ter cerca de 20 sucessos e 5 bloqueios
    expect(successfulRequests.length).toBeGreaterThanOrEqual(18);
    expect(successfulRequests.length).toBeLessThanOrEqual(22);
    expect(blockedRequests.length).toBeGreaterThanOrEqual(3);

    console.log('✅ Teste 4 passou: Rate limiting funcionando');
  });

  test('5. API rejeita fornecedor sem autenticação', async ({ page }) => {
    // Fazer requisição direta sem autenticação
    const response = await page.request.post('/api/public/event-requests', {
      data: {
        request_type: 'supplier',
        company_name: 'Teste Sem Auth',
        contact_name: 'Teste',
        email: 'teste@noauth.com',
        phone: '11999999999',
        equipment_types: ['Som e Áudio'],
      },
    });

    // Deve retornar 401
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toContain('Autenticação necessária');

    console.log('✅ Teste 5 passou: API bloqueia fornecedor sem auth');
  });
});

test.describe('Validações de Dados', () => {
  test('6. Formulário de cliente valida campos obrigatórios', async ({ page }) => {
    await page.goto('/solicitar-evento?type=client');

    // Tentar submeter sem preencher
    await page.click('button[type="submit"]');

    // Deve mostrar erros de validação
    await page.waitForTimeout(1000);

    // Verificar se há mensagens de erro ou campos inválidos
    const invalidFields = page.locator('input:invalid, textarea:invalid');
    const count = await invalidFields.count();

    expect(count).toBeGreaterThan(0);

    console.log('✅ Teste 6 passou: Validação de campos funcionando');
  });
});
