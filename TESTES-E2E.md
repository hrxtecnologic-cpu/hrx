# 🧪 TESTES E2E COM PLAYWRIGHT

**Data**: 2025-10-20
**Ferramenta**: Playwright
**Cobertura**: Formulário Profissional + Formulário Contratante

---

## 📦 INSTALAÇÃO

### 1. Instalar Playwright

```bash
npm install -D @playwright/test @types/node
```

### 2. Instalar navegadores

```bash
npx playwright install
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
hrx/
├── playwright.config.ts          # Configuração do Playwright
├── tests/
│   ├── cadastro-profissional.spec.ts    # Testes do formulário profissional
│   └── solicitar-equipe.spec.ts         # Testes do formulário contratante
├── package.json                  # Scripts adicionados
└── TESTES-E2E.md                 # Esta documentação
```

---

## 🚀 EXECUTANDO OS TESTES

### Pré-requisitos:
1. **Servidor Next.js rodando**: `npm run dev`
2. **Porta 3000 disponível**: http://localhost:3000

---

### Comandos Básicos:

#### 1. Executar TODOS os testes:
```bash
npx playwright test
```

#### 2. Executar testes de um arquivo específico:
```bash
# Formulário profissional
npx playwright test tests/cadastro-profissional.spec.ts

# Formulário contratante
npx playwright test tests/solicitar-equipe.spec.ts
```

#### 3. Executar um teste específico pelo nome:
```bash
npx playwright test -g "deve exibir o formulário"
```

#### 4. Executar em modo HEADED (ver o navegador):
```bash
npx playwright test --headed
```

#### 5. Executar em modo DEBUG (passo a passo):
```bash
npx playwright test --debug
```

#### 6. Executar testes SKIP (marcados para execução manual):
```bash
npx playwright test --grep "TESTE COMPLETO"
```

---

### Ver Relatórios:

#### Relatório HTML (após executar testes):
```bash
npx playwright show-report
```

#### Relatório em tempo real:
```bash
npx playwright test --reporter=html
```

---

## 📋 TESTES DISPONÍVEIS

### Formulário Profissional (`cadastro-profissional.spec.ts`)

**AUTENTICAÇÃO**: Este formulário requer login no Clerk. Os testes fazem **login automático** usando as credenciais configuradas antes de cada teste.

| Teste | Descrição |
|-------|-----------|
| ✅ Exibir formulário | Verifica se todas as seções aparecem |
| ✅ Validar campos obrigatórios | Tenta enviar vazio e verifica validação |
| ✅ Preencher dados pessoais | Testa preenchimento de nome, CPF, email, etc |
| ✅ Buscar CEP | Testa integração com API de CEP |
| ✅ Selecionar categorias | Testa checkboxes de categorias |
| ✅ Marcar disponibilidade | Testa checkboxes de disponibilidade |
| ✅ Upload de documentos | Testa upload de arquivos |
| ✅ Dados bancários | Testa preenchimento de banco, agência, conta |
| ✅ Aceitar termos | Testa checkbox de termos |
| ⏭️ TESTE COMPLETO | Preenche e envia formulário completo (SKIP) |

**Total**: 9 testes ativos + 1 teste manual

---

### Formulário Contratante (`solicitar-equipe.spec.ts`)

| Teste | Descrição |
|-------|-----------|
| ✅ Exibir formulário | Verifica se todas as seções aparecem |
| ✅ Validar campos obrigatórios | Tenta enviar vazio e verifica validação |
| ✅ Dados da empresa | Testa nome, CNPJ, responsável, email, telefone |
| ✅ Dados do evento | Testa nome, tipo, data, horário, público |
| ✅ Local do evento | Testa endereço, cidade, estado, CEP |
| ✅ Profissionais necessários | Testa inputs de quantidade |
| ✅ Equipamentos | Testa checkboxes de equipamentos |
| ✅ Orçamento e urgência | Testa selects de orçamento e urgência |
| ✅ Observações | Testa textarea de observações |
| ⏭️ TESTE COMPLETO | Preenche e envia formulário completo (SKIP) |
| ✅ Página de sucesso | Verifica página de sucesso |

**Total**: 10 testes ativos + 1 teste manual

---

## 🎯 SCRIPTS NO PACKAGE.JSON

Adicione estes scripts ao `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:e2e:prof": "playwright test tests/cadastro-profissional.spec.ts",
    "test:e2e:cont": "playwright test tests/solicitar-equipe.spec.ts"
  }
}
```

Depois use:
```bash
npm run test:e2e           # Todos os testes
npm run test:e2e:prof      # Só formulário profissional
npm run test:e2e:cont      # Só formulário contratante
npm run test:e2e:headed    # Ver navegador
npm run test:e2e:debug     # Debug passo a passo
npm run test:e2e:report    # Ver relatório
```

---

## 🔍 EXEMPLOS DE USO

### Exemplo 1: Testar formulário profissional em modo headed

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Executar testes
npx playwright test tests/cadastro-profissional.spec.ts --headed
```

### Exemplo 2: Executar apenas validação de campos

```bash
npx playwright test -g "deve validar campos"
```

### Exemplo 3: Debug de um teste específico

```bash
npx playwright test --debug -g "deve preencher dados pessoais"
```

### Exemplo 4: Executar teste completo manual

```bash
# Este teste preenche e envia o formulário de verdade
npx playwright test --grep "TESTE COMPLETO" cadastro-profissional
```

---

## 📸 SCREENSHOTS E VÍDEOS

Por padrão, Playwright captura:
- **Screenshots** quando um teste falha
- **Vídeos** quando um teste falha
- **Traces** para debugging

Locais:
```
test-results/
├── screenshots/
├── videos/
└── traces/
```

Para ver o trace:
```bash
npx playwright show-trace test-results/.../trace.zip
```

---

## ⚙️ CONFIGURAÇÃO AVANÇADA

### Alterar timeout:

Em `playwright.config.ts`:
```typescript
export default defineConfig({
  timeout: 60 * 1000,  // 60 segundos por teste
  use: {
    actionTimeout: 15 * 1000,  // 15 segundos por ação
  },
});
```

### Adicionar mais navegadores:

Em `playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

Depois execute:
```bash
npx playwright test --project=firefox
```

### Executar em mobile:

```typescript
projects: [
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
],
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Timeout 30000ms exceeded"

**Solução**:
- Aumentar timeout em `playwright.config.ts`
- Verificar se servidor está rodando
- Verificar se página carrega corretamente

### Problema: "Target page is closed"

**Solução**:
- Formulário pode ter redirecionado
- Usar `await page.waitForLoadState('networkidle')`
- Verificar se não há erros no console

### Problema: "Element not found"

**Solução**:
- Elemento pode ter seletor diferente
- Usar Playwright Inspector: `npx playwright test --debug`
- Verificar HTML no navegador

### Problema: "No tests found"

**Solução**:
- Verificar caminho do arquivo de teste
- Verificar se arquivo termina com `.spec.ts`
- Executar `npx playwright test --list`

---

## 📊 CI/CD

### GitHub Actions (exemplo):

```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 📝 BOAS PRÁTICAS

### 1. Sempre esperar elementos carregarem:
```typescript
await page.waitForLoadState('networkidle');
await element.waitFor({ state: 'visible' });
```

### 2. Usar locators semânticos:
```typescript
// ✅ BOM
await page.getByRole('button', { name: 'Enviar' });
await page.getByLabel('Nome completo');

// ❌ EVITAR
await page.locator('#submit-btn');
```

### 3. Não hardcodar URLs:
```typescript
// ✅ BOM
await page.goto('/cadastro-profissional');

// ❌ EVITAR
await page.goto('http://localhost:3000/cadastro-profissional');
```

### 4. Usar Page Object Pattern para formulários complexos:
```typescript
class CadastroProfissionalPage {
  constructor(private page: Page) {}

  async preencherDadosPessoais(dados: DadosPessoais) {
    await this.page.getByLabel('Nome').fill(dados.nome);
    // ...
  }
}
```

---

## 🎓 APRENDENDO MAIS

### Documentação Oficial:
- https://playwright.dev/
- https://playwright.dev/docs/intro

### Seletores:
- https://playwright.dev/docs/locators

### Debugging:
- https://playwright.dev/docs/debug

### CI/CD:
- https://playwright.dev/docs/ci

---

## 🎉 RESULTADO ESPERADO

Após executar os testes, você verá:

```
Running 20 tests using 1 worker

  ✓ [chromium] › cadastro-profissional.spec.ts:8:3 › deve exibir o formulário corretamente (2.5s)
  ✓ [chromium] › cadastro-profissional.spec.ts:18:3 › deve validar campos obrigatórios (1.8s)
  ✓ [chromium] › cadastro-profissional.spec.ts:28:3 › deve preencher dados pessoais (3.1s)
  ...

  20 passed (45.3s)
```

E um relatório HTML bonito com:
- ✅ Testes que passaram (verde)
- ❌ Testes que falharam (vermelho)
- ⏭️ Testes pulados (amarelo)
- 📸 Screenshots de falhas
- 🎥 Vídeos de falhas
- 📊 Traces para debugging

---

**✅ TESTES E2E CONFIGURADOS E PRONTOS!**

Execute `npm run test:e2e` para começar a testar! 🚀
