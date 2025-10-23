# 🎯 TESTES PRIORITÁRIOS - 30 MINUTOS

**USE ESTE GUIA**. Esqueça os testes automatizados - eles não funcionam sem autenticação.

Este guia testa **APENAS** as funcionalidades que foram corrigidas/implementadas hoje.

---

## ✅ Checklist Rápido

### 1. ✨ NOVO: Configurações de Email (5 min)

**URL**: http://localhost:3000/admin/comunicacao/configuracoes

- [ ] Página carrega sem erros
- [ ] Altere o **nome da empresa** para "Teste HRX"
- [ ] Altere a **cor primária** para azul (#0000FF)
- [ ] Click em **"Salvar Alterações"**
- [ ] Veja mensagem: "Configurações salvas com sucesso"
- [ ] **Recarregue a página** (F5)
- [ ] Verifique: Nome e cor foram mantidos?

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

---

### 2. ✨ NOVO: Editar Template de Email (5 min)

**URL**: http://localhost:3000/admin/comunicacao

- [ ] Click no botão **"Editar"** do template "Boas-vindas Profissional"
- [ ] Página `/admin/comunicacao/editar/professional-welcome` abre
- [ ] Altere o **"Assunto do Email"** para "Teste Bem-vindo"
- [ ] Altere a **"Saudação"** para "Olá, teste"
- [ ] Click em **"Salvar"**
- [ ] Veja mensagem: "Template atualizado com sucesso"
- [ ] Click em **"Preview"**
- [ ] Verifique: Assunto e saudação alterados aparecem?

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

---

### 3. 🔧 CORRIGIDO: Solicitar Cotações (5 min)

**Era**: 404/405 error
**Agora**: Deve funcionar

**URL**: http://localhost:3000/admin/projetos

- [ ] Abra um projeto existente
- [ ] Vá para aba **"Equipamentos"**
- [ ] Click em um equipamento
- [ ] Click no botão **"Solicitar Cotações"**
- [ ] Modal abre sem erros
- [ ] Selecione 2-3 fornecedores
- [ ] Click em **"Enviar Solicitações"**
- [ ] Veja mensagem de sucesso (não 404/405!)
- [ ] Vá para aba **"Cotações"**
- [ ] Verifique: Cotações pendentes aparecem?

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

---

### 4. 🔧 CORRIGIDO: Aceitar Cotação (5 min)

**Era**: Schema error (`equipment_supplier_id` não existe)
**Agora**: Deve funcionar

**URL**: http://localhost:3000/admin/projetos (mesmo projeto)

- [ ] Aba **"Cotações"**
- [ ] Click em **"Aceitar"** em uma cotação
- [ ] Confirmação aparece
- [ ] Click em **"Confirmar"**
- [ ] **SEM ERRO** (antes dava erro de schema)
- [ ] Status muda para "accepted"
- [ ] Outras cotações do mesmo equipamento rejeitadas?
- [ ] Verifique custos do projeto atualizados

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

---

### 5. 🔧 MELHORADO: Adicionar Equipamento (5 min)

**Era**: 500 error (mensagem "undefined")
**Agora**: Erro detalhado (se falhar)

**URL**: http://localhost:3000/admin/projetos

- [ ] Abra um projeto
- [ ] Aba **"Equipamentos"**
- [ ] Click **"Adicionar Equipamento"**
- [ ] Preencha:
  - Tipo: "Som"
  - Categoria: "Caixas de Som"
  - Nome: "Caixa JBL EON615"
  - Quantidade: 4
  - Dias: 2
- [ ] Click **"Salvar"**
- [ ] **Se der erro**: Copie a mensagem (não será mais "undefined")
- [ ] **Se funcionar**: Equipamento aparece na lista

**Status**: [ ] ✅ PASSOU  [ ] ⚠️ ERRO (mas com mensagem clara)  [ ] ❌ ERRO "undefined"

**Se deu erro, copie aqui**:
```


```

---

### 6. 🔧 MELHORADO: Adicionar Membro à Equipe (5 min)

**Era**: 500 error (mensagem "undefined")
**Agora**: Erro detalhado (se falhar)

**URL**: http://localhost:3000/admin/projetos (mesmo projeto)

- [ ] Aba **"Equipe"**
- [ ] Click **"Adicionar Membro"**
- [ ] Selecione um profissional da lista
- [ ] Preencha:
  - Função: "Técnico de Som"
  - Quantidade: 2
  - Dias: 2
  - Diária: 300
- [ ] Total calculado automaticamente (R$ 1.200,00)
- [ ] Click **"Salvar"**
- [ ] **Se der erro**: Copie a mensagem (não será mais "undefined")
- [ ] **Se funcionar**: Membro aparece na lista

**Status**: [ ] ✅ PASSOU  [ ] ⚠️ ERRO (mas com mensagem clara)  [ ] ❌ ERRO "undefined"

**Se deu erro, copie aqui**:
```


```

---

## 📊 RESULTADO FINAL

**Total de Testes**: 6
**Passou**: ___
**Falhou**: ___
**Taxa de Sucesso**: ___%

### Status Geral:
- [ ] ✅ **Tudo funcionando** (6/6 ou 5/6)
- [ ] ⚠️ **Problemas menores** (4/6)
- [ ] ❌ **Muitos problemas** (< 4/6)

---

## 🐛 Se Encontrar Erros:

### Para Erros de Equipamento/Equipe:

1. Abra o **Console do Navegador** (F12)
2. Abra o **Terminal do Next.js**
3. Copie a mensagem de erro **COMPLETA**
4. Anote aqui:

```
Erro em: [ ] Equipamento  [ ] Equipe

Console do navegador:


Terminal do Next.js:


```

### Para Erros de Email/Cotações:

Mesma coisa - copie tudo e anote.

---

## ✅ Após Completar:

Se tudo passou (ou quase tudo), você pode:

1. Fazer commit das alterações
2. Deploy para produção
3. Testar em produção com dados reais

Se muita coisa falhou:

1. Reporte os erros (com mensagens completas)
2. Investigue no console/terminal
3. Não faça deploy ainda

---

**Data do Teste**: ___/___/2025
**Horário**: ___:___
**Ambiente**: [ ] Dev (localhost:3000)  [ ] Produção

---

**Tempo estimado**: 30 minutos
**Última atualização**: 23/10/2025
