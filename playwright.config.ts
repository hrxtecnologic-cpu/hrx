import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * Documentação: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // Timeout padrão para cada teste
  timeout: 60 * 1000,

  // Executar testes em paralelo
  fullyParallel: true,

  // Falhar se houver testes com .only
  forbidOnly: !!process.env.CI,

  // Tentar novamente em caso de falha (CI)
  retries: process.env.CI ? 2 : 0,

  // Número de workers (testes paralelos)
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'],
    ['list'],
  ],

  // Configurações compartilhadas para todos os testes
  use: {
    // URL base do app
    baseURL: 'http://localhost:3000',

    // Coletar trace em caso de falha
    trace: 'on-first-retry',

    // Screenshots em falhas
    screenshot: 'only-on-failure',

    // Vídeo em falhas
    video: 'retain-on-failure',

    // Timeout para ações individuais
    actionTimeout: 15 * 1000,
  },

  // Configurar projetos para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Descomente para testar em outros navegadores
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Iniciar servidor Next.js antes dos testes (opcional)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
