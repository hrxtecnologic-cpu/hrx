import { test, expect } from '@playwright/test';

/**
 * Testes E2E do Formulário de Solicitação de Equipe (Contratante)
 *
 * IMPORTANTE: Este formulário é PÚBLICO, não requer autenticação
 */

test.describe('Formulário de Solicitação de Equipe', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página do formulário
    await page.goto('/solicitar-equipe');

    // Esperar página carregar completamente
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir o formulário corretamente', async ({ page }) => {
    // Verificar título
    await expect(page.locator('h1')).toContainText(/solicite.*equipe/i);

    // Verificar seções principais
    await expect(page.getByText(/dados.*empresa/i)).toBeVisible();
    await expect(page.getByText(/dados.*evento/i)).toBeVisible();
    await expect(page.getByText(/local.*evento/i)).toBeVisible();
    await expect(page.getByText(/profissionais.*necessários/i)).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Rolar até o final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Tentar enviar formulário vazio
    const submitButton = page.getByRole('button', { name: /enviar solicitação/i });
    await submitButton.click();

    // Verificar que não enviou (ainda está na mesma página)
    await expect(page).toHaveURL(/solicitar-equipe/);

    // HTML5 validation deve impedir submit
    const companyNameInput = page.getByLabel(/nome.*empresa/i).first();
    await expect(companyNameInput).toHaveAttribute('required', '');
  });

  test('deve preencher dados da empresa', async ({ page }) => {
    // Nome da empresa
    await page.getByLabel(/nome.*empresa/i).first().fill('Empresa Teste LTDA');

    // CNPJ
    const cnpjInput = page.getByLabel(/cnpj/i);
    if (await cnpjInput.isVisible()) {
      await cnpjInput.fill('12345678000190');
    }

    // Responsável
    await page.getByLabel(/nome.*responsável/i).fill('Maria da Silva');

    // Email
    await page.getByLabel(/email/i).first().fill('maria@empresateste.com');

    // Telefone
    await page.getByLabel(/telefone/i).first().fill('21987654321');

    // Verificar que valores foram preenchidos
    await expect(page.getByLabel(/nome.*empresa/i).first()).toHaveValue('Empresa Teste LTDA');
  });

  test('deve preencher dados do evento', async ({ page }) => {
    // Rolar até dados do evento
    await page.getByText(/dados.*evento/i).scrollIntoViewIfNeeded();

    // Nome do evento
    await page.getByLabel(/nome.*evento/i).fill('Festival de Música 2025');

    // Tipo de evento (select/combobox)
    const tipoEventoButton = page.getByRole('combobox').first();
    if (await tipoEventoButton.isVisible()) {
      await tipoEventoButton.click();

      // Selecionar um tipo
      const showOption = page.getByText('Show', { exact: true });
      if (await showOption.isVisible()) {
        await showOption.click();
      }
    }

    // Descrição
    await page
      .getByLabel(/descrição.*evento/i)
      .fill('Festival de música com diversas atrações nacionais e internacionais');

    // Data de início
    await page.getByLabel(/data.*início/i).fill('2025-12-15');

    // Data de término
    await page.getByLabel(/data.*término/i).fill('2025-12-17');

    // Horário
    await page.getByLabel(/horário.*início/i).fill('18:00');
    await page.getByLabel(/horário.*término/i).fill('23:00');

    // Público esperado
    await page.getByLabel(/público.*esperado/i).fill('5000');
  });

  test('deve preencher local do evento', async ({ page }) => {
    // Rolar até local
    await page.getByText(/local.*evento/i).scrollIntoViewIfNeeded();

    // Nome do local
    await page.getByLabel(/nome.*local/i).fill('Arena Cultural');

    // Endereço
    await page.getByLabel(/endereço.*completo/i).fill('Av. Brasil, 1000');

    // Cidade
    await page.getByLabel(/cidade/i).fill('Rio de Janeiro');

    // Estado (select/combobox)
    const estadoButton = page.locator('button:has-text("estado")').first();
    if (await estadoButton.isVisible()) {
      await estadoButton.click();

      const rjOption = page.getByText('RJ', { exact: true });
      if (await rjOption.isVisible()) {
        await rjOption.click();
      }
    }

    // CEP
    await page.getByLabel(/cep/i).fill('20000000');
  });

  test('deve selecionar profissionais necessários', async ({ page }) => {
    // Rolar até profissionais
    await page.getByText(/profissionais.*necessários/i).scrollIntoViewIfNeeded();

    // Procurar por inputs de quantidade (podem estar como spinbutton ou number)
    const quantidadeInputs = page.locator('input[type="number"]');
    const count = await quantidadeInputs.count();

    console.log(`Encontrados ${count} inputs de quantidade`);

    if (count > 0) {
      // Preencher primeiro input (ex: Garçom)
      await quantidadeInputs.first().fill('10');

      // Preencher segundo input se existir
      if (count > 1) {
        await quantidadeInputs.nth(1).fill('5');
      }
    }
  });

  test('deve preencher informações sobre equipamentos', async ({ page }) => {
    // Rolar até equipamentos
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Marcar que precisa de equipamentos
    const precisaEquipamentosCheckbox = page.getByText(/precisa.*equipamentos/i);
    if (await precisaEquipamentosCheckbox.isVisible()) {
      await precisaEquipamentosCheckbox.click();

      // Aguardar campos condicionais aparecerem
      await page.waitForTimeout(500);

      // Marcar alguns equipamentos
      const somCheckbox = page.getByText(/sistema.*som/i);
      if (await somCheckbox.isVisible()) {
        await somCheckbox.click();
      }

      const iluminacaoCheckbox = page.getByText(/iluminação/i);
      if (await iluminacaoCheckbox.isVisible()) {
        await iluminacaoCheckbox.click();
      }
    }
  });

  test('deve preencher orçamento e urgência', async ({ page }) => {
    // Rolar até final do formulário
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Faixa de orçamento (se existir)
    const orcamentoButton = page.getByRole('combobox').last();
    if (await orcamentoButton.isVisible()) {
      await orcamentoButton.click();

      const faixaOption = page.getByText(/10.000.*50.000/i).first();
      if (await faixaOption.isVisible()) {
        await faixaOption.click();
      }
    }

    // Urgência
    const normalRadio = page.getByText(/normal/i);
    if (await normalRadio.isVisible()) {
      await normalRadio.click();
    }
  });

  test('deve preencher observações adicionais', async ({ page }) => {
    // Rolar até o final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Observações
    const observacoesTextarea = page.getByLabel(/observações/i);
    if (await observacoesTextarea.isVisible()) {
      await observacoesTextarea.fill(
        'Evento de grande porte. Precisamos de profissionais experientes e pontuais.'
      );
    }
  });

  test.skip('TESTE COMPLETO: preencher e enviar formulário', async ({ page }) => {
    /**
     * TESTE SKIP: Execute manualmente quando quiser testar o envio completo
     *
     * Para executar: npx playwright test --grep "TESTE COMPLETO" solicitar-equipe
     */

    // 1. Dados da Empresa
    await page.getByLabel(/nome.*empresa/i).first().fill('Empresa Teste Playwright');
    await page.getByLabel(/nome.*responsável/i).fill('João Responsável');
    await page.getByLabel(/email/i).first().fill('joao@empresatest.com');
    await page.getByLabel(/telefone/i).first().fill('21987654321');

    // 2. Dados do Evento
    await page.getByLabel(/nome.*evento/i).fill('Evento Teste Playwright');

    // Tipo de evento
    const tipoButton = page.getByRole('combobox').first();
    await tipoButton.click();
    await page.getByText('Show', { exact: true }).click();

    await page.getByLabel(/data.*início/i).fill('2025-12-15');
    await page.getByLabel(/público.*esperado/i).fill('1000');

    // 3. Local
    await page.getByLabel(/endereço.*completo/i).fill('Rua Teste, 123');
    await page.getByLabel(/cidade/i).fill('Rio de Janeiro');
    await page.getByLabel(/cep/i).fill('20000000');

    // 4. Profissionais (preencher pelo menos um)
    const quantidadeInputs = page.locator('input[type="number"]');
    if ((await quantidadeInputs.count()) > 0) {
      await quantidadeInputs.first().fill('5');
    }

    // 5. Rolar até o final e enviar
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const submitButton = page.getByRole('button', { name: /enviar solicitação/i });
    await submitButton.click();

    // 6. Verificar redirecionamento para página de sucesso
    await expect(page).toHaveURL(/sucesso/, { timeout: 30000 });
    await expect(page.getByText(/solicitação.*enviada/i)).toBeVisible();
  });

  test('deve exibir mensagem de sucesso após envio', async ({ page }) => {
    /**
     * Este teste verifica apenas a página de sucesso
     * sem enviar o formulário
     */
    await page.goto('/solicitar-equipe/sucesso');
    await expect(page.getByText(/sucesso/i)).toBeVisible();
  });
});

/**
 * COMO EXECUTAR ESTES TESTES:
 *
 * 1. Certifique-se que o servidor está rodando: npm run dev
 *
 * 2. Execute todos os testes:
 *    npx playwright test tests/solicitar-equipe.spec.ts
 *
 * 3. Execute um teste específico:
 *    npx playwright test -g "deve exibir o formulário"
 *
 * 4. Execute em modo headless (sem abrir navegador):
 *    npx playwright test --headed
 *
 * 5. Execute em modo debug (passo a passo):
 *    npx playwright test --debug tests/solicitar-equipe.spec.ts
 *
 * 6. Ver relatório HTML:
 *    npx playwright show-report
 */
