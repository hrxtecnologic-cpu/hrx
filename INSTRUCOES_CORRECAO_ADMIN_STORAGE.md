# 🔧 Instruções: Corrigir Permissões de Admin e Storage

## 📋 Problemas Identificados

1. ❌ **Storage RLS bloqueando uploads** - "new row violates row-level security policy"
2. ❌ **Permissões de admin não funcionando** - Mesmo sendo admin, não consegue criar curso

## ✅ Soluções Implementadas

### 1. Proteção do Layout Admin
- ✅ Layout `/admin` agora verifica permissões antes de renderizar
- ✅ Criada API endpoint `/api/auth/check-admin` para verificação
- ✅ Redireciona não-autorizados para home

### 2. Storage Policies Simplificadas
- ✅ Removidas todas policies antigas com conflitos
- ✅ Criadas 4 policies super simples usando `TO authenticated`
- ✅ Upload liberado para qualquer usuário logado

### 3. Role Admin Garantida
- ✅ Migration para garantir `role = 'admin'` no Supabase
- ✅ Emails configurados: hrxtecnologic@gmail.com, simulaioab@gmail.com

---

## 🚀 PASSOS PARA EXECUTAR

### PASSO 1: Executar Migrations no Supabase

Acesse: **https://waplbfawlcavwtvfwprf.supabase.co**

#### 1.1 - Fix Storage Policies (MAIS IMPORTANTE)

1. Vá em **SQL Editor** → **New Query**
2. Abra o arquivo: `supabase/migrations/059_fix_storage_policies_simple.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** (Ctrl+Enter)

**Resultado esperado:**
```
✅ MIGRATION 059 - FIX STORAGE POLICIES
Policies antigas: REMOVIDAS
Policies novas: 4 configuradas
🎯 Storage 100% liberado para usuários logados!
```

#### 1.2 - Garantir Role Admin

1. Ainda no **SQL Editor**, crie **New Query**
2. Abra o arquivo: `supabase/migrations/060_ensure_admin_role.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** (Ctrl+Enter)

**Resultado esperado:**
```
Coluna is_admin criada com sucesso (ou "já existe")
✅ MIGRATION 060 - ADD is_admin COLUMN
Admins encontrados: 1 ou 2
Emails admin: {hrxtecnologic@gmail.com, simulaioab@gmail.com}
👑 Campo is_admin criado e configurado!
```

---

### PASSO 2: Verificar Configurações

#### 2.1 - Verificar ADMIN_EMAILS no .env.local

✅ **JÁ CONFIGURADO:**
```bash
ADMIN_EMAILS=hrxtecnologic@gmail.com,simulaioab@gmail.com
```

Se não estiver, adicione essa linha ao arquivo `.env.local`

#### 2.2 - Verificar Storage Bucket

1. No Supabase Dashboard, vá em **Storage**
2. Verifique se existe o bucket **documents**
3. Se não existir, execute também: `supabase/migrations/058_create_course_covers_storage.sql`

---

### PASSO 3: Testar Correções

#### 3.1 - Testar Permissões de Admin

1. Faça logout da aplicação
2. Faça login com: `hrxtecnologic@gmail.com`
3. Acesse: `http://localhost:3000/admin`
4. ✅ **Deve entrar normalmente** (antes estava bloqueado ou dando erro)

#### 3.2 - Testar Upload de Imagem

1. Acesse: `http://localhost:3000/admin/academia/cursos/novo`
2. Arraste uma imagem para a seção "Imagem de Capa"
3. ✅ **Upload deve funcionar SEM erros**
4. ✅ **NÃO deve aparecer:** "new row violates row-level security policy"

#### 3.3 - Testar Criação de Curso

1. Preencha todos os campos do formulário
2. Clique em **Salvar Curso**
3. ✅ **Curso deve ser criado com sucesso**

---

## 🔍 Troubleshooting

### Erro: "new row violates row-level security policy"

**Solução:** Execute a migration `059_fix_storage_policies_simple.sql`

### Erro: "Não autorizado" ao acessar /admin

**Soluções:**

1. Verifique se seu email está em `ADMIN_EMAILS` no `.env.local`
2. Execute a migration `060_ensure_admin_role.sql`
3. Reinicie o servidor Next.js: `Ctrl+C` e depois `npm run dev`

### Erro: "Bucket not found"

**Solução:** Execute a migration `058_create_course_covers_storage.sql`

---

## 📦 Arquivos Modificados/Criados

### Migrations (executar no Supabase)
- ✅ `supabase/migrations/058_create_course_covers_storage.sql`
- ✅ `supabase/migrations/059_fix_storage_policies_simple.sql` ⭐ **PRINCIPAL**
- ✅ `supabase/migrations/060_ensure_admin_role.sql` ⭐ **PRINCIPAL**

### Código (já aplicado)
- ✅ `src/app/admin/layout.tsx` - Proteção de admin
- ✅ `src/app/api/auth/check-admin/route.ts` - Verificação de permissões

---

## ✅ Checklist Final

- [ ] Migration 059 executada (Storage Policies)
- [ ] Migration 060 executada (Role Admin)
- [ ] Logout + Login novamente
- [ ] Acessar `/admin` com sucesso
- [ ] Upload de imagem funcionando
- [ ] Criar curso funcionando

---

## 🎯 Resumo Técnico

### O que estava errado:

1. **Storage RLS mal configurado:**
   - Usava `auth.role() = 'authenticated'` ❌
   - Deveria usar `TO authenticated` ✅

2. **Layout admin sem proteção:**
   - Qualquer pessoa podia acessar `/admin` ❌
   - Agora verifica permissões via API ✅

3. **Role admin não garantida:**
   - Email em `ADMIN_EMAILS` mas sem `role = 'admin'` no DB ❌
   - Migration garante sincronização ✅

### O que foi corrigido:

1. ✅ Policies de Storage super simples e funcionais
2. ✅ Verificação de admin no layout
3. ✅ API endpoint para checar permissões
4. ✅ Role admin garantida no banco de dados

---

**Após executar tudo, o erro de Storage e permissões deve estar 100% corrigido! 🎉**
