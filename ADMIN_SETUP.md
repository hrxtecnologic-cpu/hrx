# 🔐 Guia de Configuração de Administradores

> **Data:** 2025-10-21
> **Problema:** Erro "Acesso negado. Apenas administradores." ao acessar rotas admin

---

## 🐛 Problema

Ao tentar acessar páginas admin (como `/admin/profissionais`), você recebe o erro:

```
❌ [ERROR] Erro na busca
Error: Acesso negado. Apenas administradores.
```

Isso acontece porque o sistema verifica se você tem permissões de administrador antes de permitir o acesso.

---

## ✅ Solução Rápida

### Passo 1: Verificar seu status de admin

Acesse o endpoint de debug:
```
http://localhost:3000/api/debug/check-admin
```

Este endpoint mostra:
- ✅ Se você já é admin
- 📧 Seu email atual
- 📝 Lista de emails admin configurados
- 🔧 Como corrigir se não for admin

### Passo 2: Tornar-se admin

Existem **2 formas** de se tornar administrador:

---

## 📧 Opção 1: Adicionar Email à Lista de Admins (Recomendado)

### 1.1. Abrir o arquivo `.env.local`

```bash
cd C:\Users\erick\HRX_OP\hrx
code .env.local
```

### 1.2. Adicionar seu email à variável `ADMIN_EMAILS`

**Antes:**
```env
ADMIN_EMAILS=hrxtecnologic@gmail.com,simulaioab@gmail.com
```

**Depois (adicione seu email):**
```env
ADMIN_EMAILS=hrxtecnologic@gmail.com,simulaioab@gmail.com,seuemail@gmail.com
```

### 1.3. Reiniciar o servidor Next.js

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 1.4. Testar

Acesse novamente:
```
http://localhost:3000/admin/profissionais
```

---

## 🗄️ Opção 2: Atualizar Role no Supabase

### 2.1. Obter seu clerk_id

Acesse:
```
http://localhost:3000/api/debug/check-admin
```

Copie o valor de `userId` (exemplo: `user_2abc123xyz`)

### 2.2. Atualizar no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o comando:

```sql
UPDATE users
SET role = 'admin'
WHERE clerk_id = 'SEU_CLERK_ID_AQUI';
```

**Exemplo:**
```sql
UPDATE users
SET role = 'admin'
WHERE clerk_id = 'user_2abc123xyz';
```

### 2.3. Verificar a mudança

```sql
SELECT id, email, role, user_type
FROM users
WHERE clerk_id = 'SEU_CLERK_ID_AQUI';
```

Deve retornar `role = 'admin'`

### 2.4. Testar

Acesse novamente:
```
http://localhost:3000/admin/profissionais
```

---

## 🔍 Como Funciona a Verificação de Admin

O sistema verifica se você é admin através da função `isAdmin()` em `src/lib/auth.ts`:

```typescript
export async function isAdmin() {
  const { userId } = await auth();

  // 1. Verificar se email está em ADMIN_EMAILS
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(',');
  const userEmail = // ... buscar email do Clerk

  if (ADMIN_EMAILS.includes(userEmail)) {
    return { isAdmin: true, userId };
  }

  // 2. Verificar role no Supabase
  const dbUser = // ... buscar no Supabase
  if (dbUser.role === 'admin') {
    return { isAdmin: true, userId };
  }

  return { isAdmin: false, userId };
}
```

**Ou seja, você é admin se:**
- Seu email está em `ADMIN_EMAILS` (.env.local) **OU**
- Seu `role` no Supabase é `'admin'`

---

## 📋 Emails Admin Atuais

Atualmente configurados em `.env.local`:
- ✅ hrxtecnologic@gmail.com
- ✅ simulaioab@gmail.com

---

## 🚨 Troubleshooting

### Problema: "Não autenticado"

**Solução:** Faça login primeiro em `/entrar`

### Problema: Ainda diz "Acesso negado" após adicionar email

**Checklist:**
1. ✅ Email adicionado corretamente em `.env.local`?
2. ✅ Sem espaços extras ou caracteres estranhos?
3. ✅ Email corresponde ao usado no Clerk?
4. ✅ Servidor Next.js foi reiniciado?

**Debug:**
```bash
# 1. Verificar se variável está carregada
http://localhost:3000/api/debug/check-admin

# 2. Verificar email no Clerk
# Deve ser exatamente o mesmo que em ADMIN_EMAILS
```

### Problema: Email está correto mas ainda não funciona

**Solução:** Use a Opção 2 (Supabase) como alternativa

```sql
-- Verificar email atual no Supabase
SELECT email, role FROM users WHERE clerk_id = 'SEU_CLERK_ID';

-- Atualizar role
UPDATE users SET role = 'admin' WHERE clerk_id = 'SEU_CLERK_ID';
```

---

## 🎯 Resultado Esperado

Após configurar corretamente, ao acessar `/api/debug/check-admin` você deve ver:

```json
{
  "authenticated": true,
  "isAdmin": true,
  "email": "seuemail@gmail.com",
  "checks": {
    "inAdminEmails": true,
    "supabaseRole": "admin"
  },
  "howToFix": "✅ Você já é admin!"
}
```

---

## 🔗 Links Úteis

- **Debug Admin:** http://localhost:3000/api/debug/check-admin
- **Painel Admin:** http://localhost:3000/admin
- **Profissionais:** http://localhost:3000/admin/profissionais
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Clerk Dashboard:** https://dashboard.clerk.com

---

## 📝 Notas

- **Produção:** Em produção, prefira usar Supabase role ao invés de ADMIN_EMAILS
- **Segurança:** Nunca commite `.env.local` no Git
- **Múltiplos Admins:** Você pode ter quantos admins quiser, basta adicionar emails separados por vírgula

---

**Dúvidas?** Acesse o endpoint de debug para diagnóstico completo!
