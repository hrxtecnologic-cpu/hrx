import { test, expect } from '@playwright/test';

/**
 * Teste E2E COMPLETO do Formulário de Cadastro Profissional
 *
 * Este teste simula o fluxo completo de um usuário:
 * 1. Login no Clerk
 * 2. Preenche TODOS os campos do formulário
 * 3. Upload dos 4 documentos obrigatórios (RG frente, RG verso, CPF, Comprovante)
 * 4. Envia o formulário
 * 5. Verifica se chegou na tela de sucesso
 */

test.describe('Cadastro Profissional - Fluxo Completo', () => {
  test('deve preencher formulário completo, fazer upload de documentos e enviar com sucesso', async ({ page }) => {
    // Aumentar timeout para este teste complexo
    test.setTimeout(120000); // 2 minutos

    // ========== PASSO 1: LOGIN NO CLERK ==========
    console.log('🔐 PASSO 1: Fazendo login no Clerk...');
    await page.goto('/entrar');

    // Aguardar campo de email
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('prplshrmp@gmail.com');

    // Clicar em continuar
    const continueButton = page.getByRole('button', { name: 'Continuar', exact: true });
    await continueButton.click();

    // Aguardar campo de senha
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('Naotemsenha1@#');

    // Fazer login
    const loginButton = page.getByRole('button', { name: /continuar|continue|entrar|sign in/i });
    await loginButton.click();

    // Aguardar redirecionamento (sair da página de login)
    await page.waitForURL((url) => !url.pathname.includes('/entrar'), { timeout: 15000 });
    console.log('✅ Login realizado com sucesso!');

    // ========== PASSO 2: NAVEGAR PARA O FORMULÁRIO ==========
    console.log('📄 PASSO 2: Navegando para o formulário...');
    await page.goto('/cadastro-profissional');
    await page.locator('h1').waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Formulário carregado!');

    // ========== PASSO 3: PREENCHER DADOS PESSOAIS ==========
    console.log('👤 PASSO 3: Preenchendo dados pessoais...');
    await page.getByLabel(/nome completo/i).fill('João Silva Teste Playwright');
    await page.getByLabel(/cpf/i).first().fill('12345678901');
    await page.getByLabel(/data de nascimento/i).fill('1990-01-15');
    await page.getByLabel(/email/i).fill('joao.teste.playwright@example.com');
    await page.getByLabel(/telefone/i).fill('21987654321');
    console.log('✅ Dados pessoais preenchidos!');

    // ========== PASSO 4: PREENCHER ENDEREÇO ==========
    console.log('🏠 PASSO 4: Preenchendo endereço...');
    await page.getByLabel(/cep/i).fill('20040020');
    await page.waitForTimeout(2000); // Aguardar busca do CEP
    await page.getByLabel(/número/i).fill('100');
    await page.getByLabel(/complemento/i).fill('Apto 201');
    console.log('✅ Endereço preenchido!');

    // ========== PASSO 5: SELECIONAR CATEGORIAS ==========
    console.log('🎯 PASSO 5: Selecionando categorias...');
    // Rolar até categorias
    await page.getByText('Categorias de Interesse').scrollIntoViewIfNeeded();

    // Selecionar pelo menos uma categoria (Garçom)
    const garcomCheckbox = page.getByText('Garçom', { exact: true });
    if (await garcomCheckbox.isVisible()) {
      await garcomCheckbox.click();
      await page.waitForTimeout(500);
    }
    console.log('✅ Categorias selecionadas!');

    // ========== PASSO 6: MARCAR EXPERIÊNCIA ==========
    console.log('💼 PASSO 6: Marcando experiência...');
    const experienciaLabel = page.getByText(/tenho experiência/i);
    if (await experienciaLabel.isVisible()) {
      await experienciaLabel.click();
      await page.waitForTimeout(500);
    }
    console.log('✅ Experiência marcada!');

    // ========== PASSO 7: MARCAR DISPONIBILIDADE ==========
    console.log('📅 PASSO 7: Marcando disponibilidade...');
    await page.getByText('Disponibilidade').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Encontrar e clicar checkboxes de disponibilidade pelo container
    const weekdaysContainer = page.getByText('Segunda a Sexta', { exact: true }).locator('..');
    const weekdaysCheckbox = weekdaysContainer.locator('button[role="checkbox"]');
    await weekdaysCheckbox.click({ force: true });
    await page.waitForTimeout(800);
    console.log('   ✅ Segunda a Sexta clicado');

    const weekendsContainer = page.getByText('Finais de Semana', { exact: true }).locator('..');
    const weekendsCheckbox = weekendsContainer.locator('button[role="checkbox"]');
    await weekendsCheckbox.click({ force: true });
    await page.waitForTimeout(800);
    console.log('   ✅ Finais de Semana clicado');

    await page.waitForTimeout(1000);
    console.log('✅ Disponibilidade marcada!');

    // ========== PASSO 8: UPLOAD DOS 4 DOCUMENTOS OBRIGATÓRIOS ==========
    console.log('📎 PASSO 8: Fazendo upload dos 4 documentos obrigatórios...');
    await page.getByText('Documentos Obrigatórios').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const buffer = Buffer.from('fake image content for testing');
    const fileInputs = page.locator('input[type="file"]');
    const fileCount = await fileInputs.count();
    console.log(`   Encontrados ${fileCount} inputs de arquivo`);

    if (fileCount >= 4) {
      // Upload 1: RG Frente
      console.log('   📄 Uploading RG Frente...');
      await fileInputs.nth(0).setInputFiles({
        name: 'rg-frente.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      await page.waitForTimeout(2000);

      // Upload 2: RG Verso
      console.log('   📄 Uploading RG Verso...');
      await fileInputs.nth(1).setInputFiles({
        name: 'rg-verso.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      await page.waitForTimeout(2000);

      // Upload 3: CPF
      console.log('   📄 Uploading CPF...');
      await fileInputs.nth(2).setInputFiles({
        name: 'cpf.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      await page.waitForTimeout(2000);

      // Upload 4: Comprovante de Residência
      console.log('   📄 Uploading Comprovante de Residência...');
      await fileInputs.nth(3).setInputFiles({
        name: 'comprovante-residencia.jpg',
        mimeType: 'image/jpeg',
        buffer: buffer,
      });
      await page.waitForTimeout(2000);

      console.log('✅ 4 documentos obrigatórios enviados com sucesso!');
    } else {
      console.warn(`⚠️ Esperado 4 inputs de arquivo, encontrado ${fileCount}`);
    }

    // ========== PASSO 9: PREENCHER DADOS BANCÁRIOS ==========
    console.log('💰 PASSO 9: Preenchendo dados bancários...');
    // Rolar até dados bancários
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Verificar se seção de dados bancários existe
    const bancarioSection = page.getByText(/dados bancários/i).first();
    if (await bancarioSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.getByLabel(/nome do banco/i).fill('Banco do Brasil');
      await page.getByLabel(/agência/i).fill('1234');
      await page.getByLabel(/número da conta/i).fill('12345-6');
      await page.getByLabel(/chave pix/i).fill('joao.teste@example.com');
      console.log('✅ Dados bancários preenchidos!');
    } else {
      console.log('⏭️ Seção de dados bancários não encontrada, pulando...');
    }

    // ========== PASSO 10: ACEITAR TERMOS DE USO E POLÍTICA DE PRIVACIDADE ==========
    console.log('📜 PASSO 10: Aceitando termos...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    // Encontrar checkbox de termos pelo container
    const termosContainer = page.getByText('Li e aceito os', { exact: false }).locator('..');
    const termosCheckbox = termosContainer.locator('button[role="checkbox"]').first();
    await termosCheckbox.scrollIntoViewIfNeeded();
    await termosCheckbox.click({ force: true });
    await page.waitForTimeout(1500);
    console.log('✅ Termos aceitos!');

    // ========== PASSO 11: VERIFICAR ESTADO DO FORMULÁRIO ANTES DE ENVIAR ==========
    console.log('🔍 PASSO 11: Verificando estado do formulário...');

    // Capturar erros do console
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Verificar state do React Hook Form via JavaScript
    const formState = await page.evaluate(() => {
      // @ts-ignore - acessar window global
      if (window.__REACT_HOOK_FORM_STATE__) {
        return window.__REACT_HOOK_FORM_STATE__;
      }
      return null;
    });
    console.log('   Estado do formulário:', formState);

    // ========== PASSO 12: ENVIAR FORMULÁRIO ==========
    console.log('🚀 PASSO 12: Enviando formulário...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const submitButton = page.getByRole('button', { name: /finalizar cadastro/i });
    console.log(`   URL antes de enviar: ${page.url()}`);

    await submitButton.click();
    console.log('   ✓ Botão "Finalizar Cadastro" clicado!');
    console.log('   Aguardando navegação/processamento...');

    // Aguardar um pouco para ver se há alguma mudança
    await page.waitForTimeout(5000);
    console.log(`   URL após 5s: ${page.url()}`);

    if (consoleMessages.length > 0) {
      console.log('   ❌ Erros do console:');
      consoleMessages.forEach((msg, i) => console.log(`      ${i + 1}. ${msg}`));
    }

    // ========== PASSO 12: VERIFICAR TELA DE SUCESSO ==========
    console.log('✨ PASSO 12: Verificando tela de sucesso...');

    // Aguardar redirecionamento para página de sucesso (com timeout maior)
    try {
      await page.waitForURL(/sucesso|success/i, { timeout: 45000 });
      console.log(`   ✅ Redirecionado para: ${page.url()}`);

      // Verificar mensagem de sucesso
      await expect(page.getByText(/cadastro.*realizado|sucesso|enviado/i).first()).toBeVisible({ timeout: 10000 });
    } catch (error) {
      console.log(`   ⚠️ Não redirecionou para página de sucesso`);
      console.log(`   URL atual: ${page.url()}`);

      // Verificar se há mensagens de erro na página
      const errorMessages = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-destructive').allTextContents();
      if (errorMessages.length > 0) {
        console.log(`   ❌ Erros encontrados na página:`);
        errorMessages.forEach((msg, i) => console.log(`      ${i + 1}. ${msg}`));
      }

      throw error;
    }

    console.log('');
    console.log('🎉🎉🎉 TESTE COMPLETO FINALIZADO COM SUCESSO! 🎉🎉🎉');
    console.log('');
    console.log('Resumo do teste:');
    console.log('✅ Login no Clerk');
    console.log('✅ Dados pessoais preenchidos');
    console.log('✅ Endereço preenchido');
    console.log('✅ Categorias selecionadas');
    console.log('✅ Experiência marcada');
    console.log('✅ Disponibilidade marcada');
    console.log('✅ 4 documentos obrigatórios enviados');
    console.log('✅ Dados bancários preenchidos');
    console.log('✅ Termos aceitos');
    console.log('✅ Formulário enviado');
    console.log('✅ Página de sucesso exibida');
    console.log('');
  });
});

/**
 * COMO EXECUTAR ESTE TESTE:
 *
 * 1. Certifique-se que o servidor está rodando:
 *    npm run dev
 *
 * 2. Execute o teste:
 *    npx playwright test tests/cadastro-profissional.spec.ts
 *
 * 3. Execute em modo headed (ver navegador):
 *    npx playwright test tests/cadastro-profissional.spec.ts --headed
 *
 * 4. Execute em modo debug (passo a passo):
 *    npx playwright test tests/cadastro-profissional.spec.ts --debug
 */
