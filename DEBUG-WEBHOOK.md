# 🔍 DEBUG: Webhook não está sendo chamado

## ❌ Problema Identificado:
O webhook do Clerk **NÃO está enviando** eventos para o servidor.

Logs mostram que o usuário:
1. ✅ Fez login
2. ✅ Foi para onboarding
3. ✅ Escolheu "Sou Profissional"
4. ✅ Metadata foi atualizado

**MAS:** Nenhum webhook foi recebido!

---

## 🔧 VERIFICAÇÕES URGENTES:

### 1. Verifique a URL do Webhook no Clerk

**Acesse:** https://dashboard.clerk.com → **Webhooks**

Clique no webhook que você criou e verifique:

**URL deve ser EXATAMENTE:**
```
https://8c34703fc2d4.ngrok-free.app/api/webhooks/clerk
```

**⚠️ IMPORTANTE:**
- Tem `https://` no início?
- Tem `/api/webhooks/clerk` no final? (com S em webhooks!)
- A URL do ngrok está correta?

---

### 2. Eventos estão marcados?

No webhook, verifique se estes eventos estão **ATIVOS:**

- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`

---

### 3. Status do Webhook

No Clerk Dashboard, veja:
- **Status:** Deve estar "Enabled" (não Disabled)
- **Delivery attempts:** Se tiver tentativas falhadas, clique para ver erro

---

## 🧪 TESTE MANUAL DO WEBHOOK:

### No Clerk Dashboard:

1. **Webhooks** → Seu webhook
2. Aba **"Testing"**
3. Selecione: `user.created`
4. Clique **"Send Example"**

### O que DEVE aparecer nos logs do servidor:

```
📨 Webhook recebido: user.created
✅ Usuário criado: user@example.com
```

### Se NÃO aparecer nada:

**Problema 1:** URL está errada
- Verifique a URL no Clerk
- Tem `/api/webhooks/clerk` no final?

**Problema 2:** ngrok não está expondo
- Teste: `curl https://8c34703fc2d4.ngrok-free.app/api/webhooks/clerk`
- Deve retornar erro 400 (esperado)
- Se der timeout/404, ngrok não está funcionando

**Problema 3:** Servidor não está rodando
- Verifique: `curl http://localhost:3000/api/webhooks/clerk`
- Deve retornar erro 400

---

## ⚡ SOLUÇÃO RÁPIDA:

### Se webhook ainda não funciona, use workaround:

Crie um script para sincronizar usuários manualmente:

```bash
# No Supabase SQL Editor
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Para cada usuário do Clerk, execute:
INSERT INTO public.users (clerk_id, email, full_name, user_type, status)
VALUES (
  'user_34K2DmmqmBie0c3Mr9ZFjrooOJH',  -- ⚠️ Cole ID do usuário
  'seu-email@gmail.com',
  'Seu Nome',
  'professional',
  'active'
)
ON CONFLICT (clerk_id) DO UPDATE SET
  user_type = 'professional',
  updated_at = now();
```

---

## 📋 CHECKLIST:

Antes de testar novamente:

- [ ] Webhook configurado no Clerk com URL correta
- [ ] Eventos `user.*` marcados
- [ ] Webhook status = Enabled
- [ ] Teste manual no Clerk mostrou logs no servidor
- [ ] ngrok rodando e expondo corretamente
- [ ] Servidor Next.js reiniciado

---

## 🎯 TESTE FINAL:

Depois de verificar tudo:

1. Delete o usuário teste do Clerk
2. Crie novo usuário via `/cadastrar`
3. Veja logs do servidor
4. DEVE aparecer: `📨 Webhook recebido`
5. Verifique Supabase: usuário criado automaticamente

**Se funcionar = RESOLVIDO! ✅**

---

## 🆘 Se AINDA não funcionar:

Cole aqui:
1. Screenshot do webhook no Clerk Dashboard
2. Resultado de: `curl https://8c34703fc2d4.ngrok-free.app/api/webhooks/clerk`
3. Logs completos do servidor quando você cria usuário

Vou investigar mais a fundo!
