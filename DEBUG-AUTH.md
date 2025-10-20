# 🔍 Debug - Erro 401 (Não Autenticado)

## ❌ Problema Identificado:
A API retorna **401** porque você **não está autenticado** ou o **token não está sendo enviado**.

---

## ✅ Checklist de Autenticação

### 1. Você está logado no Clerk?

**Como verificar:**
- Abra o site: http://localhost:3000
- Olhe no canto superior direito
- Deve ter seu nome/avatar visível

**Se NÃO estiver logado:**
- Vá para: http://localhost:3000/entrar
- Faça login ou crie uma conta

---

### 2. Seu usuário tem userType = "professional"?

**A API exige que você tenha `userType: "professional"` no Clerk.**

**Como verificar no Clerk Dashboard:**

1. Acesse: https://dashboard.clerk.com
2. Vá em **Users**
3. Clique no seu usuário
4. Vá na aba **Metadata** → **Public metadata**
5. Deve ter:
```json
{
  "userType": "professional"
}
```

**Se NÃO tiver ou for diferente:**

Adicione/altere para:
```json
{
  "userType": "professional"
}
```

Clique em **Save**.

---

### 3. Fluxo Correto de Onboarding

O fluxo normal do app é:

```
Cadastro no Clerk
    ↓
Redireciona para /onboarding
    ↓
Usuário escolhe: "Sou Profissional" ou "Sou Contratante"
    ↓
userType é definido no Clerk
    ↓
Redireciona para /cadastro-profissional
    ↓
Preenche formulário completo
    ↓
API verifica se userType === "professional" ✅
```

**Se você pulou o onboarding:**
1. Acesse: http://localhost:3000/onboarding
2. Escolha "Sou Profissional"
3. Isso vai definir o userType automaticamente

---

## 🔧 Solução Rápida (Desenvolvimento)

### Opção A: Via API
Crie um arquivo de teste:

```bash
curl -X POST http://localhost:3000/api/user/metadata \
  -H "Content-Type: application/json" \
  -d '{"userType": "professional"}'
```

### Opção B: Direto no Clerk Dashboard
1. https://dashboard.clerk.com → Users
2. Seu usuário → Metadata → Public metadata
3. Adicione: `{"userType": "professional"}`
4. Save

---

## 🧪 Como Testar se Funcionou

### Teste 1: Verificar no Console do Navegador
```javascript
// Cole isso no console (F12):
fetch('/api/professionals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(console.log)
```

**Resultados possíveis:**

| Resposta | Significa |
|----------|-----------|
| `{"error": "Não autenticado"}` | ❌ Você não está logado |
| `{"error": "Apenas profissionais podem acessar esta rota"}` | ⚠️ Está logado mas userType ≠ professional |
| `{"error": "Dados inválidos"}` | ✅ Autenticação OK! (erro é normal, payload era vazio) |

### Teste 2: Verificar userType via API
```javascript
// Console do navegador (F12):
fetch('/api/user/metadata')
  .then(r => r.json())
  .then(console.log)
```

Deve retornar:
```json
{
  "userType": "professional"
}
```

---

## 🚨 Se Ainda Não Funcionar

### Verifique variáveis de ambiente:

```bash
# .env.local deve ter:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Verifique se middleware não está bloqueando:

O arquivo `middleware.ts` deve ter:
```typescript
export default clerkMiddleware((auth, req) => {
  // /api/professionals precisa estar protegido
  if (req.nextUrl.pathname.startsWith('/api/professionals')) {
    auth.protect(); // Exige autenticação
  }
});
```

---

## 📝 Resumo dos Erros e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| **401** Não autenticado | Não está logado | Fazer login em /entrar |
| **403** Apenas profissionais | userType ≠ professional | Definir userType no Clerk |
| **404** Usuário não encontrado | User não existe no Clerk | Verificar se conta foi criada |
| **400** Dados inválidos | Validação Zod falhou | Preencher formulário corretamente |

---

## ✅ Passo a Passo Final

1. **Faça login:** http://localhost:3000/entrar
2. **Vá para onboarding:** http://localhost:3000/onboarding
3. **Escolha:** "Sou Profissional"
4. **Será redirecionado:** /cadastro-profissional
5. **Preencha o formulário**
6. **Envie**

Agora deve funcionar! 🎉

---

## 🔍 Debug Adicional

Se ainda der erro, adicione console.log na API:

```typescript
// Em src/app/api/professionals/route.ts (linha 18)
export async function POST(req: Request) {
  const { userId } = await auth();
  console.log('🔍 DEBUG - userId:', userId); // <- Adicione isso

  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const user = await currentUser();
  console.log('🔍 DEBUG - user:', user?.id, user?.publicMetadata); // <- E isso

  // ...resto do código
}
```

Reinicie o servidor e veja os logs!
