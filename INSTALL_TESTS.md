# 🧪 Instalação e Configuração de Testes

## 1. Instalar Dependências

```bash
# Vitest + Testing Library
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitejs/plugin-react jsdom

# MSW para mock de APIs (opcional mas recomendado)
npm install -D msw

# Utilitários de teste
npm install -D happy-dom
```

## 2. Adicionar Scripts ao package.json

Adicione estes scripts na seção `"scripts"` do `package.json`:

```json
{
  "scripts": {
    // ... scripts existentes ...

    // Novos scripts de teste
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=verbose"
  }
}
```

## 3. Estrutura de Arquivos Criada

```
hrx/
├── vitest.config.ts          ✅ Criado - Configuração do Vitest
├── tests/
│   ├── setup.ts               ✅ Criado - Setup global de testes
│   └── api/
│       └── admin/
│           ├── professionals/
│           │   └── search.test.ts  ✅ Criado - Testes de busca
│           └── event-projects/
│               └── route.test.ts   ✅ Criado - Testes de projetos
└── INSTALL_TESTS.md          ✅ Este arquivo
```

## 4. Como Rodar os Testes

### Modo Watch (desenvolvimento)
```bash
npm run test
# ou
npm run test:watch
```

### Rodar todos os testes uma vez
```bash
npm run test:run
```

### Com UI interativa
```bash
npm run test:ui
```

### Com coverage
```bash
npm run test:coverage
```

### Para CI/CD
```bash
npm run test:ci
```

## 5. Próximos Passos

### A. Implementar os TODOs nos testes
Os arquivos de teste foram criados com esqueletos. Você precisa:

1. **search.test.ts**: Implementar os 40+ casos de teste marcados com TODO
2. **route.test.ts**: Implementar os testes de CRUD de projetos

### B. Criar mais testes para rotas críticas

**Rotas que PRECISAM de testes:**
```
✅ /api/admin/professionals/search (criado)
✅ /api/admin/event-projects (criado)
❌ /api/admin/event-projects/[id] (detalhes)
❌ /api/admin/geocode/batch (geocoding)
❌ /api/admin/map-data (mapa)
❌ /api/professional/profile
❌ /api/supplier/quotations
```

### C. Testes de Integração

Criar testes que testam fluxos completos:

```typescript
// tests/integration/professional-flow.test.ts
describe('Fluxo Completo de Profissional', () => {
  it('deve cadastrar, aprovar e buscar profissional', async () => {
    // 1. Cadastrar
    // 2. Aprovar
    // 3. Buscar geograficamente
    // 4. Verificar se aparece nos resultados
  });
});
```

## 6. Cobertura de Testes Alvo

### Metas:
- ✅ Rotas críticas: **100%** coverage
- ✅ Utilitários (lib/): **80%** coverage
- ✅ Validações (lib/validations): **90%** coverage
- ⚠️ Componentes React: **70%** coverage (opcional por enquanto)

### Verificar Coverage:
```bash
npm run test:coverage

# Abrir relatório HTML
open coverage/index.html  # Mac/Linux
start coverage/index.html # Windows
```

## 7. Exemplo de Teste Completo

```typescript
// tests/api/example.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

describe('Example API Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 200 com dados válidos', async () => {
    // Arrange
    const mockData = { name: 'Test' };
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null })
          }))
        }))
      }))
    };

    // Act
    const result = await mockSupabase.from('test').select('*').eq('id', '123').single();

    // Assert
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
  });
});
```

## 8. Integrando com CI/CD

O arquivo `.github/workflows/test.yml` foi criado e vai rodar automaticamente:
- ✅ Em cada push
- ✅ Em cada Pull Request
- ✅ Verifica coverage mínimo de 70%

## 9. Troubleshooting

### Erro: "Cannot find module '@testing-library/react'"
```bash
npm install -D @testing-library/react
```

### Erro: "ReferenceError: document is not defined"
Verifique que `vitest.config.ts` tem:
```typescript
test: {
  environment: 'jsdom', // ou 'happy-dom'
}
```

### Tests muito lentos
```bash
# Rodar em paralelo (padrão do Vitest)
npm run test

# Ou especificar workers
vitest --threads --pool=threads
```

## 10. Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Coverage Reports](https://vitest.dev/guide/coverage.html)
