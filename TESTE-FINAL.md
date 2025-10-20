# ✅ Teste Final - Cadastro Profissional

## 🔍 Checklist Pré-Teste

Antes de começar, confirme:

- [x] ngrok rodando → `https://8c34703fc2d4.ngrok-free.app`
- [x] Webhook configurado no Clerk
- [x] `CLERK_WEBHOOK_SECRET` adicionado no `.env.local`
- [ ] **Servidor Next.js REINICIADO** (importante!)

---

## 🔄 1. REINICIE O SERVIDOR (se ainda não fez)

No terminal do Next.js:
```bash
# Pressione Ctrl + C
npm run dev
```

Aguarde:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

---

## 🧪 2. TESTE O WEBHOOK

### Opção A: Teste Rápido no Clerk Dashboard

1. Acesse: https://dashboard.clerk.com
2. **Webhooks** → Clique no webhook criado
3. Aba **"Testing"**
4. Selecione evento: `user.created`
5. Clique **"Send Example"**

**Veja logs do servidor (terminal Next.js):**
```bash
📨 Webhook recebido: user.created
✅ Usuário criado: user@example.com
```

**Se aparecer = WEBHOOK OK! ✅**

### Opção B: Criar Usuário Real

1. Abra aba anônima (Ctrl + Shift + N)
2. Acesse: https://8c34703fc2d4.ngrok-free.app/cadastrar
3. Crie conta com email de teste

**Logs esperados:**
```bash
📨 Webhook recebido: user.created
✅ Usuário criado: seu-email-teste@gmail.com
```

---

## 👤 3. VERIFICAR USUÁRIO NO SUPABASE

1. Acesse: https://supabase.com/dashboard
2. Selecione projeto HRX
3. **Table Editor** → `users`
4. Procure seu email

**Deve ter:**
- ✅ `clerk_id`: user_xxxxx
- ✅ `email`: seu-email@gmail.com
- ✅ `status`: active
- ⚠️ `user_type`: NULL (ainda não definido)

---

## 🎯 4. DEFINIR userType (IMPORTANTE!)

Seu usuário precisa ter `userType: "professional"` para cadastrar.

### Via Onboarding:
1. Acesse: https://8c34703fc2d4.ngrok-free.app/onboarding
2. Clique em **"Sou Profissional"**
3. Será redirecionado para `/cadastro-profissional`

**Logs esperados:**
```bash
📨 Webhook recebido: user.updated
✅ Usuário atualizado: user_xxxxx
```

**Verifique Supabase novamente:**
- ✅ `user_type`: professional (atualizado!)

---

## 📝 5. TESTAR CADASTRO PROFISSIONAL COMPLETO

### A. Preencher Formulário

Acesse: https://8c34703fc2d4.ngrok-free.app/cadastro-profissional

**Dados de Teste Rápido:**

**Dados Pessoais:**
- Nome: João da Silva Teste
- CPF: 123.456.789-10
- Data Nasc: 01/01/1990
- Email: (seu email)
- Telefone: (21) 99999-9999

**Endereço:**
- CEP: 20040-020 (auto-preenche)
- Número: 123

**Categorias:**
- Marque: Segurança, Logística

**Experiência:**
- ☑️ Tenho experiência
- Anos: 3-5
- Descrição: "Trabalhei em mais de 50 eventos de grande porte incluindo shows e festivais musicais."

**Disponibilidade:**
- Marque: Segunda a Sexta, Finais de Semana

**Documentos:**
- Upload qualquer imagem JPG/PNG (4 fotos)

**Termos:**
- ☑️ Aceito os termos
- ☑️ Aceito notificações

### B. Enviar Formulário

Clique em **"Finalizar Cadastro"**

---

## ✅ 6. VERIFICAR SUCESSO

### Logs do Servidor (terminal):
```bash
POST /api/upload 200 (uploads funcionando)
POST /api/upload 200
POST /api/upload 200
POST /api/upload 200
POST /api/professionals 201 (cadastro criado!)
✅ Profissional cadastrado: seu-email@gmail.com
✅ Email de boas-vindas enviado para: seu-email@gmail.com (ID: xxx)
✅ Notificação enviada para admin: hrxtecnologic@gmail.com (ID: xxx)
```

### Navegador:
- ✅ Redirecionado para: `/cadastro-profissional/sucesso`
- ✅ Mensagem: "Cadastro realizado com sucesso! 🎉"

### Supabase:
1. **Table Editor** → `professionals`
   - ✅ Novo registro com todos os dados
   - ✅ `status`: pending
   - ✅ `documents`: {...}
   - ✅ `portfolio`: [...]

2. **Storage** → `professional-documents`
   - ✅ Pasta com seu `clerk_id`
   - ✅ Arquivos: rg_front, rg_back, cpf, proof_of_address

### Emails:
1. **Seu inbox:**
   - ✅ "Bem-vindo à HRX, João! 🎉"

2. **hrxtecnologic@gmail.com:**
   - ✅ "🆕 Novo Cadastro: João da Silva - Rio de Janeiro/RJ"

---

## 🎉 SE TUDO DEU CERTO:

**PARABÉNS! O sistema está 100% funcional!** ✅

Agora você tem:
- ✅ Autenticação Clerk funcionando
- ✅ Webhook sincronizando usuários
- ✅ Upload de documentos via API
- ✅ Cadastro profissional salvando no Supabase
- ✅ Emails automáticos sendo enviados
- ✅ Página de sucesso funcionando

---

## 🐛 Se Der Erro:

### Erro 401 (Não autenticado):
- ❌ Não está logado → Faça login

### Erro 403 (Apenas profissionais):
- ❌ userType ≠ professional
- ✅ Vá para `/onboarding` e escolha "Sou Profissional"

### Erro 404 (Usuário não encontrado):
- ❌ Usuário não existe no Supabase
- ✅ Verifique se webhook foi chamado (logs do servidor)
- ✅ Verifique tabela `users` no Supabase

### Upload falha:
- ❌ Arquivo muito grande (> 10MB)
- ❌ Formato inválido (use JPG, PNG, PDF)

### Emails não chegam:
- ⚠️ Pode estar em spam
- ❌ `RESEND_API_KEY` incorreta no `.env.local`

---

## 📊 Fluxo Completo Testado:

```
1. Usuário cria conta no Clerk ✅
        ↓
2. Webhook sincroniza para Supabase ✅
        ↓
3. Usuário define userType no onboarding ✅
        ↓
4. Webhook atualiza userType ✅
        ↓
5. Usuário acessa formulário profissional ✅
        ↓
6. Upload de documentos (4 arquivos) ✅
        ↓
7. Submissão do formulário ✅
        ↓
8. API busca user_id via clerk_id ✅
        ↓
9. Profissional criado no Supabase ✅
        ↓
10. 2 emails enviados (profissional + admin) ✅
        ↓
11. Redireciona para página de sucesso ✅
        ↓
SUCESSO TOTAL! 🎉
```

---

## 🚀 Próximos Passos:

1. ✅ Testar cadastro de contratante
2. ✅ Testar fluxo de solicitação de equipe
3. ✅ Testar painel administrativo
4. ✅ Preparar para deploy em produção
5. ✅ Configurar domínio próprio
6. ✅ Atualizar webhook para domínio de produção

---

**Boa sorte com o teste! 🍀**
