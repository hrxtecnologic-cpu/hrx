# 🧪 GUIA DE TESTE DO SISTEMA HRX

**Data:** 2025-10-19
**Status:** Banco configurado, pronto para testes

---

## ⚠️ CONFIGURAÇÃO OBRIGATÓRIA ANTES DOS TESTES

### 1. Configurar Webhook do Clerk

O webhook é **ESSENCIAL** para sincronizar usuários do Clerk com o Supabase.

**Passo a passo:**

1. **Acesse o Dashboard do Clerk:**
   - Vá em: https://dashboard.clerk.com
   - Selecione seu projeto

2. **Configure o Webhook:**
   - Menu lateral: **Webhooks**
   - Clique em **+ Add Endpoint**

3. **Configurações do Endpoint:**
   ```
   Endpoint URL: https://SEU_DOMINIO.vercel.app/api/webhooks/clerk

   OU para desenvolvimento local (usando ngrok/localtunnel):
   https://SEU_TUNNEL.ngrok.io/api/webhooks/clerk
   ```

4. **Selecione os eventos:**
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

5. **Copie o Signing Secret:**
   - Após criar o webhook, você verá o **Signing Secret**
   - Copie esse valor (começa com `whsec_...`)

6. **Adicione ao `.env.local`:**
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI
   ```

7. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

---

## 🧪 TESTES A REALIZAR

### **Teste 1: Sistema de Emails** ✉️

**Objetivo:** Verificar se o Resend está enviando emails

**Como testar:**

1. Servidor deve estar rodando: `npm run dev`

2. Abra o navegador em: http://localhost:3000/api/send-test

3. **Resultado esperado:**
   ```json
   {
     "success": true,
     "message": "Email enviado com sucesso para hrxtecnologic@gmail.com"
   }
   ```

4. **Verificação:**
   - ✅ Verifique a inbox de `hrxtecnologic@gmail.com`
   - ✅ Deve chegar um email de teste do HRX
   - ✅ Se não chegou, verifique SPAM

**Se falhar:**
- Verifique se `RESEND_API_KEY` está correto no `.env.local`
- Verifique se o servidor reiniciou após adicionar a chave
- Veja os logs do terminal para mensagens de erro

---

### **Teste 2: Cadastro de Profissional** 👷

**Objetivo:** Testar fluxo completo de registro

**Como testar:**

1. Acesse: http://localhost:3000/cadastrar-profissional

2. Preencha o formulário completo:
   - **Seção 1:** Dados pessoais (CPF, nome, email, telefone)
   - **Seção 2:** Endereço (CEP, rua, número, cidade, estado)
   - **Seção 3:** Categorias (escolha 1-3 categorias)
   - **Seção 4:** Experiência (anos de experiência)
   - **Seção 5:** Disponibilidade (dias da semana)
   - **Seção 6:** Documentos (opcional - pode pular)
   - **Seção 7:** Portfolio (opcional - pode pular)
   - **Seção 8:** Dados bancários (opcional - pode pular)
   - **Seção 9:** Aceite de termos

3. Clique em **Enviar Cadastro**

4. **Resultado esperado:**
   - ✅ Formulário aceita e processa
   - ✅ Redireciona para página de sucesso
   - ✅ Mostra mensagem de confirmação

5. **Verificação no Supabase:**
   - Vá em: https://supabase.com/dashboard
   - Acesse seu projeto
   - Vá em **Table Editor** → **professionals**
   - ✅ Deve aparecer o novo registro
   - Confira se os dados estão corretos

**Se falhar:**
- Verifique o console do navegador (F12) para erros
- Verifique o terminal do servidor para logs
- Verifique se as tabelas foram criadas corretamente no Supabase

---

### **Teste 3: Webhook do Clerk** 🔗

**Objetivo:** Verificar sincronização de usuários

**Pré-requisito:** Webhook do Clerk configurado (passo 1)

**Como testar:**

1. Acesse: http://localhost:3000/cadastrar

2. Clique em **Sign up**

3. Crie uma conta de teste:
   - Email: `teste@exemplo.com`
   - Senha: `Teste123!`

4. Complete o cadastro

5. **Verificação no Supabase:**
   - Vá em **Table Editor** → **users**
   - ✅ Deve aparecer o usuário que você acabou de criar
   - ✅ `clerk_id` deve estar preenchido
   - ✅ `email` deve ser `teste@exemplo.com`
   - ✅ `status` deve ser `active`

6. **Verificação nos logs do servidor:**
   - No terminal, procure por:
   ```
   📨 Webhook recebido: user.created
   ✅ Usuário criado: teste@exemplo.com
   ```

**Se falhar:**
- ❌ Se não aparecer no Supabase: webhook não está configurado
- ❌ Se aparecer erro no terminal: verifique logs e permissões do banco
- ❌ Se não aparecer nada nos logs: webhook não está chegando ao servidor

---

### **Teste 4: Solicitação de Equipe (Contractor)** 🏢

**Objetivo:** Testar fluxo completo de solicitação

**Como testar:**

1. Acesse: http://localhost:3000/solicitar-equipe

2. Preencha o formulário:

   **Seção 1: Dados da Empresa**
   - Nome: `Empresa Teste LTDA`
   - CNPJ: `12.345.678/0001-99`
   - Responsável: `João da Silva`
   - Email: `joao@empresateste.com`
   - Telefone: `(21) 99999-9999`

   **Seção 2: Dados do Evento**
   - Nome: `Festival de Música 2025`
   - Tipo: `Show/Apresentação`
   - Descrição: `Festival com 3 dias de música`

   **Seção 3: Local**
   - Endereço: `Rua dos Eventos, 123`
   - Cidade: `Rio de Janeiro`
   - Estado: `RJ`

   **Seção 4: Datas**
   - Data início: escolha uma data futura
   - Data fim: escolha uma data futura (após início)

   **Seção 5: Profissionais Necessários**
   - Clique em **+ Adicionar Profissional**
   - Categoria: `Segurança`
   - Quantidade: `10`
   - Adicione mais 1-2 categorias

   **Seção 6: Equipamentos** (opcional)
   - Marque `Sim, preciso de equipamentos`
   - Selecione alguns equipamentos

   **Seção 7: Orçamento**
   - Faixa: `R$ 10.000 - R$ 25.000`
   - Urgência: `Normal`

   **Seção 8: Termos**
   - ✅ Aceitar os termos

3. Clique em **Enviar Solicitação**

4. **Resultado esperado:**
   - ✅ Processa a solicitação
   - ✅ Redireciona para `/solicitar-equipe/sucesso`
   - ✅ Mostra o **número da solicitação** (ex: HRX-2025-0001)

5. **Verificação no Supabase:**

   **Tabela `contractors`:**
   - Vá em **Table Editor** → **contractors**
   - ✅ Deve aparecer "Empresa Teste LTDA"
   - ✅ CNPJ deve estar salvo

   **Tabela `requests`:**
   - Vá em **Table Editor** → **requests**
   - ✅ Deve aparecer a solicitação
   - ✅ `request_number` deve ser gerado (ex: HRX-2025-0001)
   - ✅ `status` deve ser `new`
   - ✅ `professionals_needed` deve ser um array JSON

6. **Verificação de Emails:**

   **Email 1 - Confirmação para o Contratante:**
   - ✅ Verifique inbox de `joao@empresateste.com`
   - ✅ Assunto: "Solicitação Recebida - HRX-2025-0001"
   - ✅ Conteúdo deve ter resumo do evento

   **Email 2 - Notificação para Admin:**
   - ✅ Verifique inbox de `hrxtecnologic@gmail.com`
   - ✅ Assunto: "🚨 Nova Solicitação - HRX-2025-0001"
   - ✅ Conteúdo deve ter todos os detalhes

**Se falhar:**
- Verifique o console do navegador para erros
- Verifique o terminal do servidor para logs
- Verifique se os emails estão sendo enviados (veja logs)

---

### **Teste 5: Páginas Institucionais** 📄

**Objetivo:** Verificar se todas as páginas estão acessíveis

**Como testar:**

1. **Landing Page:** http://localhost:3000
   - ✅ Hero com CTA funciona
   - ✅ Seção de serviços (10 categorias)
   - ✅ Seção de estatísticas
   - ✅ Seção de diferenciais
   - ✅ CTA final
   - ✅ Footer completo

2. **Sobre:** http://localhost:3000/sobre
   - ✅ História da empresa
   - ✅ Missão, visão, valores
   - ✅ Diferenciais

3. **Serviços:** http://localhost:3000/servicos
   - ✅ 10 categorias de profissionais
   - ✅ Detalhes de cada categoria
   - ✅ Processo de contratação

4. **Contato:** http://localhost:3000/contato
   - ✅ Formulário de contato funciona
   - ✅ Informações de contato
   - ✅ FAQ

5. **Termos:** http://localhost:3000/termos
   - ✅ Termos de uso completos
   - ✅ 12 seções

6. **Privacidade:** http://localhost:3000/privacidade
   - ✅ Política de privacidade
   - ✅ Conformidade LGPD
   - ✅ 15 seções

**Se falhar:**
- Verifique se há erros no console
- Verifique se o servidor está rodando

---

### **Teste 6: Navegação e Links** 🔗

**Objetivo:** Verificar se todos os links funcionam

**Como testar:**

1. **Footer:**
   - Clique em todos os links do footer
   - ✅ Todos devem levar às páginas corretas

2. **Menu de navegação:**
   - Verifique se o menu existe em todas as páginas
   - ✅ Links devem funcionar

3. **CTAs:**
   - Verifique se os botões "Solicitar Equipe" levam para `/solicitar-equipe`
   - Verifique se os botões "Cadastrar Profissional" levam para `/cadastrar-profissional`

---

## 📊 CHECKLIST FINAL

Use este checklist após completar todos os testes:

- [ ] ✅ Webhook do Clerk configurado
- [ ] ✅ Emails de teste chegando
- [ ] ✅ Cadastro de profissional funcionando
- [ ] ✅ Usuários sendo sincronizados com Supabase
- [ ] ✅ Solicitação de equipe funcionando
- [ ] ✅ Número de solicitação sendo gerado (HRX-2025-0001)
- [ ] ✅ Emails de confirmação chegando
- [ ] ✅ Dados salvos corretamente no Supabase
- [ ] ✅ Todas as páginas institucionais acessíveis
- [ ] ✅ Todos os links funcionando
- [ ] ✅ Nenhum erro no console do navegador
- [ ] ✅ Nenhum erro nos logs do servidor

---

## 🐛 TROUBLESHOOTING

### Erro: "Webhook signature invalid"
**Solução:** Verifique se o `CLERK_WEBHOOK_SECRET` está correto no `.env.local`

### Erro: "Failed to send email"
**Solução:**
1. Verifique se `RESEND_API_KEY` está correto
2. Verifique se a conta Resend está ativa
3. Verifique se o email de origem está verificado

### Erro: "Database error" ou "RLS policy"
**Solução:**
1. Verifique se RLS está desabilitado (já deve estar pelo ALL_IN_ONE.sql)
2. Execute: `ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;`

### Erro: "CNPJ inválido"
**Solução:** Use um CNPJ válido de teste: `11.222.333/0001-81`

### Erro: "CPF inválido"
**Solução:** Use um CPF válido de teste: `123.456.789-09`

---

## 🎉 PRÓXIMOS PASSOS

Após todos os testes passarem:

1. **Backoffice Admin:**
   - Dashboard para aprovar profissionais
   - Dashboard para gerenciar solicitações
   - Relatórios e estatísticas

2. **Melhorias:**
   - Sistema de notificações por email/SMS
   - Sistema de avaliações de profissionais
   - Sistema de propostas/orçamentos
   - Chat entre contratante e HRX

3. **Deploy:**
   - Configurar domínio customizado
   - Deploy na Vercel
   - Configurar webhook em produção
   - Configurar emails transacionais

---

**Boa sorte com os testes! 🚀**
