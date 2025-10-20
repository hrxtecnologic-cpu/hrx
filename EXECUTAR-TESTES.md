# 🚀 COMO EXECUTAR OS TESTES

## ✅ INSTALAÇÃO COMPLETA!

Playwright está instalado e configurado com **21 testes E2E**.

**IMPORTANTE**: Os testes do formulário profissional fazem **login automático** no Clerk usando as credenciais configuradas. Não é necessário fazer login manualmente!

---

## 📊 TESTES DISPONÍVEIS:

### Formulário Profissional: 10 testes
- ✅ Exibir formulário
- ✅ Validar campos obrigatórios
- ✅ Preencher dados pessoais
- ✅ Buscar CEP automaticamente
- ✅ Selecionar categorias
- ✅ Marcar disponibilidade
- ✅ Upload de documentos
- ✅ Dados bancários
- ✅ Aceitar termos
- ⏭️ Teste completo (skip - executar manualmente)

### Formulário Contratante: 11 testes
- ✅ Exibir formulário
- ✅ Validar campos obrigatórios
- ✅ Dados da empresa
- ✅ Dados do evento
- ✅ Local do evento
- ✅ Profissionais necessários
- ✅ Equipamentos
- ✅ Orçamento e urgência
- ✅ Observações
- ⏭️ Teste completo (skip - executar manualmente)
- ✅ Página de sucesso

---

## 🎯 COMANDOS RÁPIDOS:

### 1. Executar TODOS os testes:
```bash
npm run test:e2e
```

### 2. Executar apenas formulário profissional:
```bash
npm run test:e2e:prof
```

### 3. Executar apenas formulário contratante:
```bash
npm run test:e2e:cont
```

### 4. Ver navegador (modo headed):
```bash
npm run test:e2e:headed
```

### 5. Debug passo a passo:
```bash
npm run test:e2e:debug
```

### 6. Ver relatório HTML:
```bash
npm run test:e2e:report
```

---

## 📝 PASSO A PASSO:

### Passo 1: Iniciar servidor Next.js
```bash
# Terminal 1
npm run dev
```

### Passo 2: Executar testes
```bash
# Terminal 2
npm run test:e2e
```

### Passo 3: Ver resultados
```bash
npm run test:e2e:report
```

---

## 🎬 EXEMPLO DE SAÍDA:

```
Running 19 tests using 1 worker

  ✓ [chromium] › cadastro-profissional.spec.ts:19:7 › deve exibir o formulário (2.1s)
  ✓ [chromium] › cadastro-profissional.spec.ts:31:7 › deve validar campos (1.5s)
  ✓ [chromium] › cadastro-profissional.spec.ts:44:7 › deve preencher dados (2.3s)
  ...

  19 passed (45.2s)
  2 skipped
```

---

## 🐛 TROUBLESHOOTING:

### Servidor não está rodando?
```bash
# Erro: "Target page is closed" ou "net::ERR_CONNECTION_REFUSED"
# Solução: Inicie o servidor
npm run dev
```

### Porta 3000 ocupada?
```bash
# Erro: "EADDRINUSE"
# Solução: Mude a porta ou mate o processo
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Teste muito lento?
```bash
# Aumentar timeout em playwright.config.ts
timeout: 90 * 1000  // 90 segundos
```

---

## 📸 RECURSOS ÚTEIS:

### Ver trace de um teste que falhou:
```bash
npx playwright show-trace test-results/[nome-do-teste]/trace.zip
```

### Executar um teste específico:
```bash
npx playwright test -g "deve preencher dados pessoais"
```

### Executar em modo interativo:
```bash
npx playwright test --ui
```

---

## 🎓 PRÓXIMOS PASSOS:

1. **Execute os testes básicos**: `npm run test:e2e`
2. **Veja o relatório**: `npm run test:e2e:report`
3. **Teste manualmente o completo**: Ver documentação TESTES-E2E.md

---

## 📞 SUPORTE:

Documentação completa em: **TESTES-E2E.md**
Documentação Playwright: https://playwright.dev

---

**✅ TUDO PRONTO PARA TESTAR!** 🚀
