# ✅ Resumo das Correções - Admin e Storage

## 🎯 Problemas Resolvidos

### 1. ❌ **Storage RLS bloqueando uploads**
**Erro:** `new row violates row-level security policy`

**Causa:** Policies mal configuradas usando `auth.role()` e `auth.uid() IS NOT NULL`

**Solução:** Migration `059_fix_storage_policies_simple.sql`
- Removidas TODAS as policies antigas
- Criadas 4 policies simples usando `TO authenticated`
- Upload liberado para qualquer usuário logado

---

### 2. ❌ **Permissões de admin não funcionando**
**Erro:** Mesmo sendo admin, não conseguia criar curso

**Causa:**
- Layout `/admin` sem verificação de permissões
- Tabela `users` não tinha campo `role` ou `is_admin`
- Função `isAdmin()` buscava campo inexistente

**Solução:**
- ✅ Criado campo `is_admin` na tabela `users` (migration 060)
- ✅ Atualizada função `isAdmin()` para usar `is_admin`
- ✅ Layout admin protegido com verificação via API
- ✅ Nova API endpoint `/api/auth/check-admin`

---

## 📦 Arquivos Modificados

### Migrations (executar no Supabase SQL Editor)

1. **`058_create_course_covers_storage.sql`** *(opcional, criar bucket)*
   - Cria bucket `documents` se não existir
   - Configura estrutura de pastas

2. **`059_fix_storage_policies_simple.sql`** ⭐ **OBRIGATÓRIO**
   - Remove policies antigas com conflitos
   - Cria 4 policies funcionais
   - **RESOLVE O ERRO DE UPLOAD**

3. **`060_ensure_admin_role.sql`** ⭐ **OBRIGATÓRIO**
   - Adiciona coluna `is_admin` na tabela `users`
   - Marca seus emails como admin
   - **RESOLVE O ERRO DE PERMISSÕES**

### Código (já aplicado no projeto)

1. **`src/lib/auth.ts`**
   - Atualizado para usar `is_admin` em vez de `role`

2. **`src/app/admin/layout.tsx`**
   - Adicionada verificação de permissões
   - Redirecionamento para não-autorizados
   - Loading state durante verificação

3. **`src/app/api/auth/check-admin/route.ts`** *(novo)*
   - API endpoint para verificar se é admin

---

## 🚀 Como Executar

### PASSO 1: Executar Migrations no Supabase

1. Acesse: **https://waplbfawlcavwtvfwprf.supabase.co**
2. Vá em **SQL Editor** → **New Query**

#### Migration 059 (Storage Policies)
3. Copie TODO o conteúdo de: `supabase/migrations/059_fix_storage_policies_simple.sql`
4. Cole no SQL Editor e clique **Run**

**Resultado esperado:**
```
✅ MIGRATION 059 - FIX STORAGE POLICIES
Policies antigas: REMOVIDAS
Policies novas: 4 configuradas
🎯 Storage 100% liberado para usuários logados!
```

#### Migration 060 (Admin Role)
5. Crie **New Query**
6. Copie TODO o conteúdo de: `supabase/migrations/060_ensure_admin_role.sql`
7. Cole no SQL Editor e clique **Run**

**Resultado esperado:**
```
Coluna is_admin criada com sucesso
✅ MIGRATION 060 - ADD is_admin COLUMN
Admins encontrados: 1 (ou 2)
Emails admin: {hrxtecnologic@gmail.com, ...}
👑 Campo is_admin criado e configurado!
```

---

### PASSO 2: Reiniciar Servidor

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

---

### PASSO 3: Testar

#### 3.1 - Teste de Permissões Admin
1. Faça logout e login novamente com `hrxtecnologic@gmail.com`
2. Acesse: `http://localhost:3000/admin`
3. ✅ Deve entrar normalmente (sem erros)

#### 3.2 - Teste de Upload de Imagem
1. Acesse: `http://localhost:3000/admin/academia/cursos/novo`
2. Arraste uma imagem para "Imagem de Capa"
3. ✅ Upload deve funcionar sem erros
4. ✅ **NÃO** deve aparecer: "new row violates row-level security policy"

#### 3.3 - Teste de Criação de Curso
1. Preencha todos os campos do formulário
2. Clique em **Salvar Curso**
3. ✅ Curso deve ser criado com sucesso

---

## 🔍 Verificação Técnica

### Como funciona a autenticação de admin agora:

```typescript
// 1. Verifica ADMIN_EMAILS (.env.local)
ADMIN_EMAILS=hrxtecnologic@gmail.com,simulaioab@gmail.com

// 2. OU verifica is_admin no Supabase
SELECT is_admin FROM users WHERE clerk_id = 'user_xxx'

// 3. Layout admin chama API /api/auth/check-admin
// 4. Se não for admin, redireciona para home
```

### Como funciona o Storage agora:

```sql
-- Leitura pública (qualquer pessoa)
CREATE POLICY "documents_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Upload autenticado (qualquer usuário logado)
CREATE POLICY "documents_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

---

## ✅ Checklist de Verificação

- [ ] Migration 059 executada com sucesso
- [ ] Migration 060 executada com sucesso
- [ ] Servidor reiniciado (npm run dev)
- [ ] Logout + Login novamente
- [ ] Acessar `/admin` sem erros
- [ ] Upload de imagem funcionando
- [ ] Criar curso sem erros

---

## 🎉 Resultado Final

Após executar as migrations:

✅ **Storage 100% funcional** - Upload de imagens sem erros de RLS
✅ **Admin 100% protegido** - Apenas emails autorizados acessam
✅ **Verificação dupla** - ADMIN_EMAILS + is_admin no banco
✅ **Layout seguro** - Redirecionamento automático de não-autorizados

**Tudo pronto para usar a Academia HRX! 🎓**
