# 🔗 Configurar Webhook do Clerk com ngrok

## 📋 O que vamos fazer:

1. ✅ Expor localhost com ngrok
2. ✅ Configurar webhook no Clerk Dashboard
3. ✅ Gerar WEBHOOK_SECRET
4. ✅ Testar sincronização

---

## 🚀 Passo 1: Iniciar ngrok

### Abra um NOVO terminal (separado do servidor Next.js)

```bash
ngrok http 3000
```

Você verá algo assim:
```
ngrok

Session Status                online
Account                       seu-email (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### ⚡ IMPORTANTE: Copie a URL do Forwarding

Exemplo: `https://abc123xyz.ngrok-free.app`

**⚠️ Deixe este terminal ABERTO! O ngrok precisa ficar rodando.**

---

## 🔧 Passo 2: Configurar Webhook no Clerk

### A. Acesse Clerk Dashboard
https://dashboard.clerk.com

### B. Vá em Webhooks
1. No menu lateral → **Webhooks**
2. Clique em **+ Add Endpoint**

### C. Configure o Endpoint

**Endpoint URL:**
```
https://abc123xyz.ngrok-free.app/api/webhooks/clerk
```
⚠️ Substitua `abc123xyz` pela SUA URL do ngrok!

**Description:** (opcional)
```
Sync users to Supabase
```

**Subscribe to events:**
Marque estas 3 opções:
- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`

**Clique em "Create"**

### D. Copiar Signing Secret

Após criar, você verá:
```
Signing Secret
whsec_xxxxxxxxxxxxxxxxxxxxx
```

**⚡ COPIE este secret!** Você vai precisar dele.

---

## 🔐 Passo 3: Adicionar Secret ao .env.local

### Abra o arquivo `.env.local`

```bash
# No VS Code ou editor
code C:\Users\erick\HRX_OP\hrx\.env.local
```

### Adicione/Atualize a linha:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

⚠️ Substitua pelo secret que você copiou!

### Salve o arquivo (Ctrl + S)

---

## 🔄 Passo 4: Reiniciar Servidor

O servidor precisa recarregar as variáveis de ambiente:

```bash
# No terminal do servidor Next.js
# Pressione Ctrl + C para parar

# Reinicie
npm run dev
```

Aguarde aparecer:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

---

## 🧪 Passo 5: Testar Webhook

### Opção A: Criar novo usuário de teste

1. Abra aba anônima (Ctrl + Shift + N)
2. Acesse: https://abc123xyz.ngrok-free.app/cadastrar
   - ⚠️ Use URL do ngrok!
3. Crie uma conta de teste
4. Veja logs no terminal do servidor:

```bash
📨 Webhook recebido: user.created
✅ Usuário criado: teste@email.com
```

5. Verifique no Supabase:
   - Table Editor → `users`
   - Deve aparecer o novo usuário!

### Opção B: Re-sync usuário existente (mais fácil)

No Clerk Dashboard:
1. Vá em **Webhooks**
2. Clique no webhook que você criou
3. Vá na aba **Testing**
4. Selecione evento: `user.created`
5. Clique em **Send Example**

Veja logs no terminal:
```bash
📨 Webhook recebido: user.created
✅ Usuário criado: user@example.com
```

---

## ✅ Passo 6: Verificar no Supabase

### Acesse Supabase Dashboard:
https://supabase.com/dashboard

1. Selecione seu projeto
2. Vá em **Table Editor**
3. Abra tabela `users`
4. Você deve ver seu usuário com:
   - `clerk_id`: user_xxxxx
   - `email`: seu-email@gmail.com
   - `user_type`: professional (se já definiu no onboarding)
   - `status`: active

**Se aparecer = FUNCIONOU! 🎉**

---

## 🎯 Passo 7: Testar Cadastro Profissional

Agora que o usuário existe no Supabase:

1. Acesse: https://abc123xyz.ngrok-free.app/cadastro-profissional
   - ⚠️ Use URL do ngrok!
2. Preencha o formulário
3. Envie

**Deve funcionar agora!** ✅

---

## 📊 Fluxo Completo Funcionando

```
Usuário cria conta no Clerk
        ↓
Clerk envia webhook (user.created)
        ↓
Sua API recebe em /api/webhooks/clerk
        ↓
Usuário é inserido na tabela users do Supabase
        ↓
Usuário vai para /onboarding
        ↓
Define userType = "professional"
        ↓
Clerk envia webhook (user.updated)
        ↓
userType é atualizado no Supabase
        ↓
Usuário acessa /cadastro-profissional
        ↓
Preenche formulário e envia
        ↓
API busca user_id via clerk_id (ENCONTRA!) ✅
        ↓
Profissional é criado na tabela professionals
        ↓
Emails são enviados
        ↓
SUCESSO! 🎉
```

---

## 🐛 Troubleshooting

### Webhook não está sendo chamado?

**Verifique:**
1. ngrok está rodando?
2. URL do webhook está correta no Clerk?
3. Tem `/api/webhooks/clerk` no final?
4. Eventos `user.*` estão marcados?

**Teste manualmente:**
```bash
curl https://abc123xyz.ngrok-free.app/api/webhooks/clerk
```

Deve retornar erro 400 (esperado, mas mostra que rota existe)

### Erro: "Assinatura inválida"?

**Causa:** `CLERK_WEBHOOK_SECRET` incorreto

**Solução:**
1. Copie o secret novamente no Clerk Dashboard
2. Cole no `.env.local`
3. Reinicie o servidor

### Erro: "CLERK_WEBHOOK_SECRET não configurado"?

**Causa:** Variável não foi carregada

**Solução:**
1. Verifique se salvou `.env.local`
2. Reinicie o servidor (Ctrl+C e npm run dev)
3. Verifique se não tem espaços extras na linha

### Usuário não aparece no Supabase?

**Verifique logs do servidor:**
```bash
❌ Erro criando usuário no Supabase: [mensagem de erro]
```

**Possíveis causas:**
- RLS habilitado (execute `fix-rls-simple.sql`)
- SERVICE_ROLE_KEY incorreta
- Tabela users não existe

---

## 🔒 Segurança em Produção

Quando for para produção:

1. **Use domínio próprio** (não ngrok)
2. **HTTPS obrigatório** (Clerk exige)
3. **Webhook secret SEMPRE configurado**
4. **Não exponha seu localhost publicamente por muito tempo**

---

## 📝 Checklist Final

Antes de testar o cadastro:

- [ ] ngrok rodando (`ngrok http 3000`)
- [ ] Webhook configurado no Clerk Dashboard
- [ ] CLERK_WEBHOOK_SECRET no `.env.local`
- [ ] Servidor reiniciado
- [ ] Webhook testado (logs aparecem no terminal)
- [ ] Usuário existe na tabela `users` do Supabase
- [ ] userType definido como "professional"

**Se todos estiverem ✅, o cadastro vai funcionar!**

---

## ⚠️ Lembrete Importante

**O ngrok gera uma URL diferente cada vez que você inicia!**

Quando reiniciar o ngrok:
1. Pegue a nova URL
2. Atualize no Clerk Dashboard (Webhooks → Edit Endpoint)
3. Pronto!

**Alternativa:** Use ngrok com domínio fixo (plano pago) para não precisar ficar atualizando.

---

## 🎉 Próximos Passos

Depois que tudo funcionar:

1. ✅ Testar cadastro completo
2. ✅ Verificar emails sendo enviados
3. ✅ Testar onboarding → cadastro → sucesso
4. ✅ Verificar dados no Supabase
5. ✅ Preparar para deploy em produção

Boa sorte! 🚀
