# 🚀 PASSO A PASSO FINAL - Corrigir Admin e Storage

## ✅ O que foi corrigido no CÓDIGO (já aplicado)

1. **Layout Admin** - Agora verifica permissões antes de renderizar
2. **Função `isAdmin()`** - Atualizada para usar `is_admin` em vez de `role`
3. **9 APIs do /admin** - Todas corrigidas para usar `is_admin`
4. **API /api/auth/check-admin** - Criada para verificação de permissões

---

## ⚠️ O que VOCÊ precisa fazer AGORA

### 🔴 PASSO 1: Executar Migration 060 no Supabase

**Esta migration cria o campo `is_admin` na tabela `users`**

1. Acesse: **https://waplbfawlcavwtvfwprf.supabase.co**
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Copie TODO o conteúdo do arquivo:
   ```
   supabase/migrations/060_ensure_admin_role.sql
   ```
5. Cole no SQL Editor
6. Clique em **Run** (ou Ctrl+Enter)

**Resultado esperado:**
```
Coluna is_admin criada com sucesso
✅ MIGRATION 060 - ADD is_admin COLUMN
Admins encontrados: 1
Emails admin: {hrxtecnologic@gmail.com}
👑 Campo is_admin criado e configurado!
```

---

### 🔴 PASSO 2: Executar Migration 059 (Storage - Opcional)

**Só execute se ainda tiver erro de upload**

1. No mesmo **SQL Editor**, crie **New Query**
2. Copie TODO o conteúdo do arquivo:
   ```
   supabase/migrations/059_fix_storage_policies_simple.sql
   ```
3. Cole e clique em **Run**

**Resultado esperado:**
```
✅ MIGRATION 059 - FIX STORAGE POLICIES
Policies antigas: REMOVIDAS
Policies novas: 4 configuradas
🎯 Storage 100% liberado!
```

---

### 🔴 PASSO 3: Reiniciar Servidor Next.js

```bash
# No terminal onde o servidor está rodando
Ctrl+C

# Iniciar novamente
npm run dev
```

---

### 🔴 PASSO 4: Testar

1. **Faça logout e login novamente** com `hrxtecnologic@gmail.com`
2. Acesse: `http://localhost:3000/admin/academia/cursos`
3. ✅ Deve listar os cursos sem erro 403
4. Clique em **Novo Curso**
5. Preencha os campos e teste upload de imagem
6. ✅ Tudo deve funcionar sem erros!

---

## 🔍 Como Saber se Funcionou

### ✅ Migration 060 executada com sucesso
- No Supabase, vá em **Database** → **Tables** → **users**
- Clique em **Columns**
- Deve aparecer a coluna **`is_admin`** (BOOLEAN)

### ✅ Seu email marcado como admin
- Na tabela **users**, encontre seu registro
- O campo **`is_admin`** deve estar **`true`**

### ✅ APIs funcionando
- Acessar `/admin/academia/cursos` deve retornar **200** (não 403)
- Console do navegador NÃO deve mostrar erros

---

## 🆘 Se Ainda Tiver Erro 403

Execute este comando no SQL Editor do Supabase:

```sql
-- Forçar is_admin = true para seu email
UPDATE users
SET is_admin = true
WHERE email = 'hrxtecnologic@gmail.com';

-- Verificar
SELECT email, is_admin FROM users WHERE email = 'hrxtecnologic@gmail.com';
```

Resultado esperado: `is_admin` deve ser `true`

---

## 📝 Resumo Técnico

### Antes (❌ Não funcionava):
```typescript
// Buscava campo que não existe
.select('role')
if (user?.role !== 'admin') { ... }
```

### Depois (✅ Funciona):
```typescript
// Busca campo correto
.select('is_admin')
if (user?.is_admin !== true) { ... }
```

### Arquivos Corrigidos:
1. `src/lib/auth.ts` - Função isAdmin()
2. `src/app/admin/layout.tsx` - Proteção do layout
3. `src/app/api/auth/check-admin/route.ts` - Nova API
4. `src/app/api/admin/academy/courses/route.ts` - API de cursos
5. **+ 8 outras APIs do /admin** corrigidas automaticamente

---

## ✅ Checklist Final

- [ ] Migration 060 executada no Supabase
- [ ] Coluna `is_admin` aparece na tabela `users`
- [ ] Seu email tem `is_admin = true`
- [ ] Servidor reiniciado (Ctrl+C + npm run dev)
- [ ] Logout + Login novamente
- [ ] Acessar `/admin/academia/cursos` SEM erro 403
- [ ] Consegue criar curso normalmente

---

**Após executar a Migration 060, TUDO deve funcionar! 🎉**

Se ainda tiver problemas, me avise com o erro exato que aparecer.
