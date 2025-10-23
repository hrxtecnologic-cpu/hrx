# 🧪 Como Testar o Sistema Completo - HRX Platform

## 🎯 Visão Geral

Este guia explica como executar todos os testes do sistema, desde testes automatizados de APIs até testes manuais de interface.

---

## 📋 Pré-requisitos

1. Servidor de desenvolvimento rodando:
```bash
npm run dev
```

2. Banco de dados Supabase configurado
3. Variáveis de ambiente configuradas (`.env.local`)
4. Clerk autenticação configurada

---

## 🤖 Parte 1: Testes Automatizados de APIs

⚠️ **ATENÇÃO**: Os testes automatizados têm limitações e **NÃO substituem os testes manuais**.

**Por quê?**
- As rotas requerem autenticação do Clerk
- O script não implementa autenticação
- Resultado: Todas as rotas protegidas retornam 401 ou 500

**O que os testes automatizados verificam:**
- ✅ Rotas existem (não são 404/405)
- ✅ Servidor está rodando
- ❌ **NÃO** testam funcionalidade real
- ❌ **NÃO** testam com dados reais

**RECOMENDAÇÃO**: **Pule direto para os testes manuais (Parte 2)**

### Passo 1: Executar Script de Testes (OPCIONAL)

```bash
npm run test:apis
```

### O que o script testa:

✅ **Rotas Públicas**:
- Página inicial (`/`)
- Health check (`/api/health`)
- Solicitações públicas (`/api/public/event-requests`)

✅ **Rotas de Projetos**:
- Listar projetos
- Criar projeto
- APIs de equipamentos
- APIs de equipe

✅ **Rotas de Fornecedores**:
- Listar fornecedores
- Buscar fornecedores

✅ **Rotas de Profissionais**:
- Busca avançada

✅ **Rotas de Emails**:
- Configuração
- Histórico
- Preview de templates

✅ **Rotas de Contadores**:
- Dashboard counts

### Resultado Esperado:

```
═══════════════════════════════════════════
  RESULTADOS DOS TESTES
═══════════════════════════════════════════

Rota                                      Método  Status     Código  Tempo
────────────────────────────────────────────────────────────────────────────
/                                         GET     ✓ PASS     200     150ms
/api/health                               GET     ✓ PASS     200     50ms
...

✓ Passou:  18/20
✗ Falhou:  2/20
Taxa de sucesso: 90.0%
```

**Taxa mínima aceitável**: 80%

---

## 📝 Parte 2: Testes Manuais de Interface

### Passo 2: Abrir Checklist

Abra o arquivo `TESTE_COMPLETO.md` no VS Code com preview:

```bash
code TESTE_COMPLETO.md
```

### Passo 3: Seguir o Checklist

O checklist está organizado em 14 seções:

1. **Página Inicial e Navegação** - 5 minutos
2. **Cadastro de Profissional** - 10 minutos
3. **Solicitação de Evento** - 10 minutos
4. **Admin - Projetos** - 30 minutos ⚠️ **CRÍTICO**
5. **Admin - Fornecedores** - 15 minutos
6. **Admin - Profissionais** - 15 minutos
7. **Admin - Documentos** - 10 minutos
8. **Admin - Comunicação** - 20 minutos ⚠️ **NOVO**
9. **Dashboard e Estatísticas** - 5 minutos
10. **Segurança e Autenticação** - 10 minutos
11. **Responsividade e Performance** - 15 minutos
12. **Sistema de Emails** - 10 minutos
13. **Erros e Edge Cases** - 15 minutos
14. **Build e Deploy** - 10 minutos

**Tempo total estimado**: ~3 horas

### Passo 4: Marcar Itens Testados

Conforme testa, marque os itens com `[x]`:

```markdown
- [x] Página carrega sem erros
- [x] Logo HRX visível
- [ ] Menu de navegação funcional
```

---

## 🔥 Testes Prioritários (30 minutos)

Se você tem pouco tempo, teste apenas o **ESSENCIAL**:

### 1. Projetos - Adicionar Equipamento (5 min)
```
❗ Era 500 error - agora deve funcionar
```
1. Acesse `/admin/projetos`
2. Click em um projeto
3. Aba "Equipamentos"
4. Click "Adicionar Equipamento"
5. Preencha campos
6. Salvar
7. **Verificar**: Equipamento aparece na lista?

### 2. Projetos - Adicionar Membro (5 min)
```
❗ Era 500 error - agora deve funcionar
```
1. Aba "Equipe"
2. Click "Adicionar Membro"
3. Selecione um profissional
4. Preencha função e valores
5. Salvar
6. **Verificar**: Membro aparece na lista?

### 3. Projetos - Solicitar Cotações (5 min)
```
❗ Era 404/405 error - IMPLEMENTADO AGORA
```
1. Aba "Equipamentos"
2. Click em um equipamento
3. Botão "Solicitar Cotações"
4. Selecione fornecedores
5. Enviar
6. **Verificar**: Cotações aparecem na aba "Cotações"?

### 4. Projetos - Aceitar Cotação (5 min)
```
❗ Era schema error - CORRIGIDO
```
1. Aba "Cotações"
2. Click "Aceitar" em uma cotação
3. Confirmar
4. **Verificar**:
   - Status mudou para "accepted"?
   - Custos atualizados?
   - Outras cotações rejeitadas?

### 5. Email - Configurações (5 min)
```
✨ NOVO FEATURE
```
1. Acesse `/admin/comunicacao`
2. Click "Configurações"
3. Altere uma cor
4. Salvar
5. **Verificar**: Mensagem de sucesso?
6. Recarregue a página
7. **Verificar**: Cor salva?

### 6. Email - Editar Template (5 min)
```
✨ NOVO FEATURE
```
1. Acesse `/admin/comunicacao`
2. Click "Editar" em um template
3. Altere o "Subject"
4. Salvar
5. **Verificar**: Mensagem de sucesso?
6. Click "Preview"
7. **Verificar**: Subject alterado aparece?

---

## 🐛 Reportar Problemas

### Durante os Testes

Anote problemas na seção "PROBLEMAS ENCONTRADOS" do `TESTE_COMPLETO.md`:

```markdown
### ❌ Críticos
- Adicionar equipamento ainda retorna 500 error
- Mensagem de erro: "Cannot insert null into column X"
- Testado em: 23/10/2025 15:30

### ⚠️ Importantes
- Preview de final-proposal muito lento (5s)
- Poderia ter loading state

### 💡 Melhorias Sugeridas
- Adicionar validação de CPF no cadastro
- Melhorar feedback visual ao salvar
```

---

## 📊 Interpretar Resultados

### Testes Automatizados

| Taxa de Sucesso | Status | Ação |
|---|---|---|
| >= 90% | ✅ Excelente | Pronto para produção |
| 80-89% | ⚠️ Bom | Investigar falhas |
| 70-79% | ⚠️ Atenção | Corrigir erros |
| < 70% | ❌ Crítico | Não deployar |

### Testes Manuais

- **100% passando**: ✅ Sistema perfeito
- **>= 95% passando**: ✅ Pronto para produção
- **90-94% passando**: ⚠️ Ajustes menores necessários
- **< 90% passando**: ❌ Revisar problemas

---

## 🚀 Após os Testes

### Se Passou (>= 90%)

1. ✅ Marcar como pronto no checklist
2. ✅ Documentar quaisquer problemas menores
3. ✅ Fazer commit das correções
4. ✅ Deploy para produção

### Se Falhou (< 90%)

1. ❌ Revisar todos os erros
2. ❌ Priorizar correções (críticos primeiro)
3. ❌ Corrigir problemas
4. ❌ **Executar testes novamente**
5. ❌ NÃO deployar até resolver

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs**: Console do navegador e terminal
2. **Documente o erro**: Screenshot + mensagem de erro
3. **Anote no checklist**: Seção "Problemas Encontrados"
4. **Verifique o código**: Use o documento `LIMITACOES_ADMIN_PROJETOS.md`

---

## 🎯 Comandos Rápidos

```bash
# Testes automatizados
npm run test:apis

# Build de produção
npm run build

# Servidor de produção
npm run start

# Testes E2E (Playwright)
npm run test:e2e

# Testes específicos
npm run test:e2e:prof  # Cadastro de profissional
npm run test:e2e:cont  # Solicitação de evento
```

---

## ✅ Checklist Final

Antes de considerar os testes completos:

- [ ] Testes automatizados executados (>= 80%)
- [ ] Seções prioritárias testadas (30 min)
- [ ] Checklist completo preenchido
- [ ] Problemas documentados
- [ ] Build de produção testado
- [ ] Deploy realizado com sucesso

---

**Boa sorte com os testes! 🚀**

Última atualização: 23/10/2025
