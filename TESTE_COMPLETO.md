# ✅ Checklist de Testes Completo - HRX Platform

## 🎯 Como Usar Este Checklist

1. Abra este arquivo no VS Code ou editor com preview Markdown
2. Marque cada item com `[x]` conforme testa
3. Anote problemas encontrados na seção "Problemas Encontrados"
4. Execute primeiro os testes automatizados, depois os manuais

---

## 🤖 Testes Automatizados

### Executar Script de Testes de APIs

```bash
# Certifique-se que o servidor está rodando em localhost:3001
npm run dev

# Em outro terminal:
npx tsx scripts/test-apis.ts
```

**Resultado Esperado**: Taxa de sucesso >= 80%

- [ ] Script executado com sucesso
- [ ] Taxa de sucesso >= 80%
- [ ] Todos os erros críticos investigados

---

## 🏠 1. PÁGINA INICIAL E NAVEGAÇÃO

### 1.1 Página Home (`/`)
- [ ] Página carrega sem erros
- [ ] Logo HRX visível
- [ ] Menu de navegação funcional
- [ ] Links principais funcionam
- [ ] Responsivo em mobile

### 1.2 Autenticação (Clerk)
- [ ] Botão de login visível
- [ ] Modal de login abre corretamente
- [ ] Login com email funciona
- [ ] Redirect após login funciona
- [ ] Logout funciona

---

## 👤 2. CADASTRO DE PROFISSIONAL

### 2.1 Formulário de Cadastro (`/cadastro/profissional`)
- [ ] Página carrega
- [ ] Todos os campos visíveis
- [ ] Validações funcionam (campos obrigatórios)
- [ ] Upload de foto funciona
- [ ] Upload de documentos funciona
- [ ] Mensagens de erro claras
- [ ] Envio do formulário funciona
- [ ] Mensagem de sucesso aparece
- [ ] Email de boas-vindas recebido

### 2.2 Verificar no Admin
- [ ] Profissional aparece na lista
- [ ] Documentos aparecem corretamente
- [ ] Status inicial correto

---

## 🏢 3. SOLICITAÇÃO DE EVENTO (Contratante)

### 3.1 Formulário de Solicitação (`/solicitar-evento`)
- [ ] Página carrega
- [ ] Todos os campos visíveis
- [ ] Seleção de tipo de evento funciona
- [ ] Seleção de data funciona
- [ ] Campo de descrição funciona
- [ ] Validações funcionam
- [ ] Envio funciona
- [ ] Mensagem de confirmação aparece
- [ ] Email de confirmação recebido

### 3.2 Verificar no Admin
- [ ] Solicitação aparece na lista de projetos
- [ ] Dados corretos
- [ ] Status inicial correto
- [ ] Admin recebeu notificação por email

---

## 📦 4. ADMIN - PROJETOS

### 4.1 Lista de Projetos (`/admin/projetos`)
- [ ] Página carrega sem erros
- [ ] Lista de projetos aparece
- [ ] Filtros funcionam (status, urgente, etc)
- [ ] Busca por cliente funciona
- [ ] Paginação funciona
- [ ] Cards de projeto mostram dados corretos

### 4.2 Criar Novo Projeto
- [ ] Botão "Novo Projeto" funciona
- [ ] Modal abre
- [ ] Formulário completo visível
- [ ] Validações funcionam
- [ ] Criação funciona
- [ ] Projeto aparece na lista

### 4.3 Visualizar Projeto (`/admin/projetos/[id]`)
- [ ] Página carrega
- [ ] Todas as abas visíveis (Informações, Equipe, Equipamentos, Cotações)
- [ ] Dados do projeto corretos

#### Aba: Informações
- [ ] Todos os dados visíveis
- [ ] Edição funciona
- [ ] Status pode ser alterado
- [ ] Salvar alterações funciona

#### Aba: Equipe
- [ ] Lista de membros aparece
- [ ] Botão "Adicionar Membro" funciona
- [ ] **TESTAR**: Adicionar profissional da base
  - [ ] Modal abre
  - [ ] Busca de profissionais funciona
  - [ ] Seleção funciona
  - [ ] Função/categoria obrigatórias
  - [ ] Quantidade e dias funcionam
  - [ ] Diária funciona
  - [ ] Total calculado automaticamente
  - [ ] Salvar funciona (❗ **Era 500 error antes**)
  - [ ] Membro aparece na lista
- [ ] **TESTAR**: Adicionar profissional externo
  - [ ] Opção "Externo" funciona
  - [ ] Nome externo obrigatório
  - [ ] Salvar funciona
  - [ ] Membro aparece na lista
- [ ] Editar membro funciona
- [ ] Remover membro funciona
- [ ] Total da equipe calculado corretamente

#### Aba: Equipamentos
- [ ] Lista de equipamentos aparece
- [ ] Botão "Adicionar Equipamento" funciona
- [ ] **TESTAR**: Adicionar equipamento
  - [ ] Modal abre
  - [ ] Tipo de equipamento obrigatório
  - [ ] Categoria obrigatória
  - [ ] Nome obrigatório
  - [ ] Quantidade e dias funcionam
  - [ ] Especificações (JSONB) funcionam
  - [ ] Salvar funciona (❗ **Era 500 error antes**)
  - [ ] Equipamento aparece na lista
- [ ] Editar equipamento funciona
- [ ] Remover equipamento funciona
- [ ] Botão "Solicitar Cotações" aparece
- [ ] **TESTAR**: Solicitar cotações
  - [ ] Modal abre
  - [ ] Lista de fornecedores aparece
  - [ ] Filtro por tipo de equipamento funciona
  - [ ] Seleção múltipla de fornecedores funciona
  - [ ] Enviar solicitações funciona (❗ **Era 404/405 antes**)
  - [ ] Mensagem de sucesso aparece
  - [ ] Cotações aparecem na aba "Cotações"

#### Aba: Cotações
- [ ] Lista de cotações aparece
- [ ] Status de cada cotação visível
- [ ] Valores visíveis
- [ ] Botão "Aceitar" funciona
- [ ] **TESTAR**: Aceitar cotação
  - [ ] Confirmação aparece
  - [ ] Aceitar funciona (❗ **Schema error corrigido**)
  - [ ] Status atualiza para "accepted"
  - [ ] Outras cotações rejeitadas automaticamente
  - [ ] Custos do projeto atualizados (❗ **Era schema error antes**)
  - [ ] Total calculado corretamente
- [ ] Botão "Rejeitar" funciona
- [ ] Detalhes da cotação visíveis

### 4.4 Deletar Projeto
- [ ] Botão "Deletar" visível
- [ ] Confirmação aparece
- [ ] **TESTAR**: Deletar projeto
  - [ ] Delete funciona (❗ **Era rate-limit error antes**)
  - [ ] Projeto removido da lista
  - [ ] Sem erros no console

---

## 🏪 5. ADMIN - FORNECEDORES

### 5.1 Lista de Fornecedores (`/admin/fornecedores`)
- [ ] Página carrega
- [ ] Lista de fornecedores aparece
- [ ] Busca funciona
- [ ] Filtro por status funciona
- [ ] Filtro por tipo de equipamento funciona

### 5.2 Adicionar Fornecedor
- [ ] Botão "Novo Fornecedor" funciona
- [ ] Formulário completo
- [ ] Validações funcionam
- [ ] Salvar funciona
- [ ] Fornecedor aparece na lista

### 5.3 Editar Fornecedor
- [ ] Botão "Editar" funciona
- [ ] Dados carregam no formulário
- [ ] Alterações salvam
- [ ] Dados atualizados na lista

### 5.4 Deletar Fornecedor
- [ ] Botão "Deletar" funciona
- [ ] Confirmação aparece
- [ ] Delete funciona
- [ ] Fornecedor removido da lista

---

## 👥 6. ADMIN - PROFISSIONAIS

### 6.1 Lista de Profissionais (`/admin/profissionais`)
- [ ] Página carrega
- [ ] Lista de profissionais aparece
- [ ] Busca funciona
- [ ] Filtros funcionam
- [ ] Cards com foto e dados
- [ ] Status visível

### 6.2 Visualizar Profissional
- [ ] Click no card funciona
- [ ] Página de detalhes abre
- [ ] Todos os dados visíveis
- [ ] Documentos visíveis
- [ ] Fotos visíveis

### 6.3 Aprovar/Rejeitar Documentos
- [ ] Botões de aprovar/rejeitar visíveis
- [ ] Aprovar funciona
- [ ] Rejeitar funciona
- [ ] Status atualiza
- [ ] Email enviado ao profissional

---

## 📄 7. ADMIN - DOCUMENTOS

### 7.1 Lista de Documentos (`/admin/documentos`)
- [ ] Página carrega
- [ ] Lista de documentos pendentes aparece
- [ ] Filtros funcionam
- [ ] Preview de documentos funciona
- [ ] Aprovar em lote funciona
- [ ] Rejeitar funciona

---

## 📧 8. ADMIN - COMUNICAÇÃO

### 8.1 Lista de Templates (`/admin/comunicacao`)
- [ ] Página carrega
- [ ] Todos os 13 templates aparecem
- [ ] Estatísticas corretas
- [ ] Busca funciona
- [ ] Filtro por categoria funciona
- [ ] Botão "Configurações" funciona
- [ ] Botão "Ver Histórico" funciona

### 8.2 Preview de Templates
- [ ] **TESTAR CADA TEMPLATE**:
  - [ ] professional-welcome
  - [ ] simple-welcome
  - [ ] contractor-confirmation
  - [ ] contact-confirmation
  - [ ] pending-documents
  - [ ] quote-request
  - [ ] quote-accepted
  - [ ] quote-rejected
  - [ ] admin-notification
  - [ ] admin-request-notification
  - [ ] urgent-quote-admin
  - [ ] contact-notification
  - [ ] final-proposal (❗ **Era erro antes**)
- [ ] Botão "Preview" abre popup
- [ ] Template renderizado corretamente
- [ ] Cores aplicadas
- [ ] Dados mock visíveis

### 8.3 Editar Template (`/admin/comunicacao/editar/[templateId]`)
- [ ] Botão "Editar" funciona (❗ **Novo**)
- [ ] Página carrega
- [ ] Campos específicos do template visíveis
- [ ] Valores atuais carregados
- [ ] Edição funciona
- [ ] Preview atualizado
- [ ] Salvar funciona
- [ ] Mensagem de sucesso aparece
- [ ] **TESTAR para pelo menos 3 templates diferentes**

### 8.4 Configurações Globais (`/admin/comunicacao/configuracoes`)
- [ ] Página carrega (❗ **Novo**)
- [ ] **Seção Branding**:
  - [ ] Nome da empresa editável
  - [ ] URL do logo editável
- [ ] **Seção Cores**:
  - [ ] Color pickers funcionam
  - [ ] Input hex funciona
  - [ ] Cores sincronizadas
- [ ] **Seção Contato**:
  - [ ] Todos os campos editáveis
  - [ ] Validações funcionam
- [ ] **Seção Rodapé**:
  - [ ] Textarea funciona
- [ ] Botão "Salvar Alterações" funciona
- [ ] Mensagem de sucesso aparece
- [ ] Botão "Resetar" funciona
- [ ] Confirmação de reset aparece
- [ ] Reset funciona
- [ ] Valores voltam ao padrão
- [ ] Recarregar página mantém alterações

### 8.5 Histórico de Emails (`/admin/comunicacao/historico`)
- [ ] Página carrega
- [ ] Lista de emails enviados aparece
- [ ] Filtros funcionam
- [ ] Paginação funciona
- [ ] Detalhes de cada email visíveis
- [ ] Status de entrega visível

---

## 📊 9. DASHBOARD E ESTATÍSTICAS

### 9.1 Dashboard Admin (`/admin`)
- [ ] Página carrega
- [ ] Cards de estatísticas aparecem
- [ ] Números corretos
- [ ] Gráficos funcionam
- [ ] Links para seções funcionam

### 9.2 Contadores (`/api/admin/counts`)
- [ ] API retorna dados corretos
- [ ] Todos os contadores presentes
- [ ] Valores fazem sentido

---

## 🔒 10. SEGURANÇA E AUTENTICAÇÃO

### 10.1 Proteção de Rotas Admin
- [ ] Logout e tentar acessar `/admin` redireciona
- [ ] Tentar acessar rota admin sem auth retorna 401
- [ ] Middleware funciona corretamente

### 10.2 Rate Limiting
- [ ] Rate limiting funciona (testar com muitas requisições)
- [ ] Mensagem de rate limit clara
- [ ] Tempo de reset correto

---

## 🌐 11. RESPONSIVIDADE E PERFORMANCE

### 11.1 Desktop (1920x1080)
- [ ] Layout perfeito
- [ ] Todos os elementos visíveis
- [ ] Sem scroll horizontal

### 11.2 Tablet (768x1024)
- [ ] Layout adaptado
- [ ] Menu responsivo
- [ ] Cards reorganizados

### 11.3 Mobile (375x667)
- [ ] Menu hamburguer funciona
- [ ] Layout mobile adequado
- [ ] Botões clicáveis
- [ ] Sem elementos cortados

### 11.4 Performance
- [ ] Tempo de carregamento inicial < 3s
- [ ] Transições suaves
- [ ] Sem travamentos
- [ ] Imagens otimizadas

---

## 📧 12. SISTEMA DE EMAILS (Resend)

### 12.1 Envio de Emails
- [ ] Email de boas-vindas enviado após cadastro
- [ ] Email de confirmação enviado após solicitação
- [ ] Emails aparecem no histórico
- [ ] Templates corretos aplicados
- [ ] Configurações personalizadas aplicadas

### 12.2 Histórico de Emails
- [ ] Todos os emails enviados aparecem
- [ ] Status correto (sent, delivered, failed)
- [ ] Filtros funcionam
- [ ] Busca funciona

---

## 🐛 13. ERROS E EDGE CASES

### 13.1 Tratamento de Erros
- [ ] Erro 404 customizado
- [ ] Erro 500 com mensagem clara
- [ ] Erros de validação claros
- [ ] Erros de rede tratados

### 13.2 Estados Vazios
- [ ] Lista vazia de projetos mostra mensagem
- [ ] Lista vazia de fornecedores mostra mensagem
- [ ] Lista vazia de profissionais mostra mensagem
- [ ] Sem dados em dashboard mostra placeholder

### 13.3 Validações
- [ ] Campos obrigatórios validados
- [ ] Emails validados
- [ ] Telefones validados
- [ ] Datas validadas
- [ ] Arquivos validados (tipo e tamanho)

---

## 🚀 14. BUILD E DEPLOY

### 14.1 Build de Produção
```bash
npm run build
```
- [ ] Build completa sem erros
- [ ] Sem warnings críticos
- [ ] Bundle size razoável

### 14.2 Servidor de Produção
```bash
npm run start
```
- [ ] Servidor inicia sem erros
- [ ] Todas as rotas funcionam
- [ ] Performance adequada

---

## 📋 PROBLEMAS ENCONTRADOS

### ❌ Críticos
```
[Anote aqui problemas críticos que impedem uso]

```

### ⚠️ Importantes
```
[Anote aqui problemas importantes mas não bloqueantes]

```

### 💡 Melhorias Sugeridas
```
[Anote aqui sugestões de melhorias]

```

---

## 📊 RESUMO FINAL

**Data do Teste**: ___/___/2025
**Testador**: ________________
**Ambiente**: [ ] Desenvolvimento [ ] Produção

### Estatísticas
- Total de testes: ___
- Passaram: ___
- Falharam: ___
- Taxa de sucesso: ___%

### Status Geral
- [ ] ✅ Sistema pronto para produção
- [ ] ⚠️ Sistema precisa de ajustes
- [ ] ❌ Sistema não está pronto

### Observações Finais
```
[Suas observações gerais sobre o sistema]

```

---

**Última atualização**: 23/10/2025
