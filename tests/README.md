# 🎭 Testes Automatizados - HRX

## ⚠️ ATENÇÃO: Testes e Produção

### 🚨 NUNCA execute testes em produção!

Os testes automatizados do Playwright criam dados reais no banco de dados. Por isso:

1. **Execute APENAS em localhost** (`http://localhost:3000`)
2. **NUNCA aponte para URL de produção**
3. **Verifique o `.env` antes de rodar testes**

### 🛡️ Proteção Implementada

Os testes verificam automaticamente se estão rodando em localhost:

```typescript
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

if (!BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
  throw new Error('🚨 Testes não podem ser executados em produção!');
}
```

## 🧹 Limpando Dados de Teste

Se dados de teste foram criados acidentalmente em produção:

### Opção 1: SQL Script (Recomendado)

Execute o script `LIMPAR_TESTES_PLAYWRIGHT.sql` no Supabase SQL Editor:

```sql
-- Ver dados antes de deletar
SELECT * FROM event_projects
WHERE client_name LIKE 'Teste Rate Limit%'
   OR event_name LIKE 'Evento Rate Test%';

-- Deletar
DELETE FROM event_projects
WHERE client_name LIKE 'Teste Rate Limit%'
   OR event_name LIKE 'Evento Rate Test%';
```

### Opção 2: Interface Admin

1. Vá para `/admin` ou `/backoffice`
2. Filtre projetos com:
   - Nome do cliente: "Teste Rate Limit"
   - Nome do evento: "Evento Rate Test"
   - Email: contém "@teste.com"
3. Delete manualmente

## 📋 Tipos de Testes

### `cadastros-api.spec.ts` - Testes de API ✅
- **8 testes passando**
- Testa endpoints REST diretamente
- Mais rápido e confiável
- **Cria dados no banco** (por isso só em dev!)

Testes incluídos:
1. ✅ Cadastro de Cliente/Evento (sem autenticação)
2. ✅ Validação de campos obrigatórios
3. ✅ Validação de formato de email
4. ✅ Bloqueio de fornecedor sem autenticação
5. ✅ Verificação de autenticação necessária
6. ✅ Rate Limiting (20 req/min)
7. ✅ Proteção SQL Injection
8. ✅ Validação de tipos de dados

### `cadastros-completo.spec.ts` - Testes E2E (legado)
- Testes de navegação completa no browser
- Mais lentos e com timeouts
- **Recomendado usar `cadastros-api.spec.ts` ao invés**

## 🚀 Executando os Testes

### Pré-requisitos
```bash
# 1. Servidor deve estar rodando
npm run dev

# 2. Verificar que está em localhost
echo $NEXT_PUBLIC_SITE_URL  # deve ser http://localhost:3000
```

### Comandos

```bash
# Rodar todos os testes API
npm run test:api

# Rodar com interface visual
npm run test:api:headed

# Modo debug (passo a passo)
npm run test:api:debug

# Rodar testes específicos
npx playwright test tests/cadastros-api.spec.ts -g "Rate limiting"
```

## 📊 Dados Criados nos Testes

Os testes de **Rate Limiting** criam ~25 projetos com:
- Nome: "Teste Rate Limit 1" até "Teste Rate Limit 25"
- Email: `ratelimit{timestamp}-{numero}@teste.com`
- Evento: "Evento Rate Test 1" até "Evento Rate Test 25"

Outros testes criam:
- Nome: "João Silva Teste E2E"
- Email: `cliente{timestamp}@teste.com`
- Evento: "Show de Rock E2E {timestamp}"

## 🔧 Troubleshooting

### "Testes não podem ser executados em produção!"
✅ **Correto!** Isso significa que a proteção está funcionando.

Verifique:
```bash
# .env ou .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ✅ Correto
# NEXT_PUBLIC_SITE_URL=https://hrx.com.br  # ❌ Erro!
```

### Cloudflare Turnstile bloqueando teste do Clerk
O Teste #5 (cadastro com autenticação Clerk) não consegue passar pelo Cloudflare Turnstile automaticamente.

**Solução**: Teste foi simplificado para apenas verificar proteção da API. Para testar o fluxo completo:
1. Abra o navegador manualmente
2. Vá para `/cadastrar`
3. Complete o cadastro
4. Vá para `/solicitar-evento?type=supplier`
5. Preencha e envie

## ✅ Boas Práticas

1. ✅ Execute testes **antes** de cada deploy
2. ✅ Verifique que todos passam
3. ✅ Nunca commite `.env` com URLs de produção
4. ✅ Se adicionar novos testes, use padrão identificável:
   - Nome: comece com "Teste" ou "E2E"
   - Email: termine com `@teste.com`
   - Isso facilita limpeza futura

## 🎯 Próximos Passos

- [ ] Adicionar validação Zod na API (melhorar Teste #8)
- [ ] Criar ambiente de staging separado para testes
- [ ] Implementar cleanup automático de dados de teste
- [ ] Adicionar testes de performance
