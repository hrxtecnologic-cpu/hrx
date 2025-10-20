# 📋 ORDEM DE EXECUÇÃO - MIGRATIONS SUPABASE

Execute os scripts SQL **nesta ordem exata** no Supabase Dashboard → SQL Editor.

---

## ⚠️ IMPORTANTE

- Execute **uma migration por vez**
- Aguarde a confirmação de sucesso antes de executar a próxima
- Verifique se não há erros antes de continuar
- **NÃO** pule nenhuma migration

---

## 🔢 ORDEM DE EXECUÇÃO

### **1️⃣ PRIMEIRA - Tabela Users**

**Arquivo:** `migrations/001_users_table.sql`

**O que faz:**
- Cria a tabela `users` (usuários)
- Cria índices para performance
- Configura trigger de `updated_at`
- **OBRIGATÓRIA** - Outras tabelas dependem desta

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo de `migrations/001_users_table.sql`
5. Cole no editor
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. ✅ Verifique se apareceu: **Success. No rows returned**

**Verificação:**
```sql
-- Execute isso para verificar se a tabela foi criada
SELECT * FROM users LIMIT 5;
```

---

### **2️⃣ SEGUNDA - Tabela Professionals**

**Arquivo:** `migrations/002_professionals_table.sql`

**O que faz:**
- Cria a tabela `professionals` (profissionais)
- Cria relacionamento com `users` (FK: user_id)
- Cria índices para busca rápida
- Configura campos JSONB para arrays
- Trigger de `updated_at`

**Dependências:**
- ✅ Requer que `001_users_table.sql` tenha sido executada

**Como executar:**
1. Copie todo o conteúdo de `migrations/002_professionals_table.sql`
2. Cole no SQL Editor
3. Clique em **Run**
4. ✅ Verifique sucesso

**Verificação:**
```sql
-- Verifica se a tabela foi criada
SELECT * FROM professionals LIMIT 5;

-- Verifica se o relacionamento com users existe
SELECT
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'professionals';
```

---

### **3️⃣ TERCEIRA - Storage Bucket (Documentos)**

**Arquivo:** `storage/001_documents_bucket.sql`

**O que faz:**
- Cria bucket `professional-documents` para armazenar arquivos
- Configura políticas RLS para segurança
- Define limites de tamanho (10MB)
- Define tipos de arquivo permitidos

**Como executar:**
1. Copie todo o conteúdo de `storage/001_documents_bucket.sql`
2. Cole no SQL Editor
3. Clique em **Run**
4. ✅ Verifique sucesso

**Verificação:**
```sql
-- Verifica se o bucket foi criado
SELECT * FROM storage.buckets WHERE name = 'professional-documents';

-- Verifica políticas de acesso
SELECT * FROM storage.policies WHERE bucket_id = 'professional-documents';
```

**Ou via Dashboard:**
- Vá em **Storage** → Deve aparecer o bucket `professional-documents`

---

### **4️⃣ QUARTA - Coluna Portfolio**

**Arquivo:** `migrations/003_add_portfolio_column.sql`

**O que faz:**
- Adiciona coluna `portfolio` (JSONB) na tabela `professionals`
- Permite armazenar array de URLs de fotos do portfólio

**Dependências:**
- ✅ Requer `002_professionals_table.sql`

**Como executar:**
1. Copie todo o conteúdo de `migrations/003_add_portfolio_column.sql`
2. Cole no SQL Editor
3. Clique em **Run**
4. ✅ Verifique sucesso

**Verificação:**
```sql
-- Verifica se a coluna foi adicionada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'professionals' AND column_name = 'portfolio';
```

---

### **5️⃣ QUINTA - Tabelas Contractors e Requests**

**Arquivo:** `migrations/004_contractors_and_requests_tables.sql`

**O que faz:**
- Cria tabela `contractors` (contratantes/empresas)
- Cria tabela `requests` (solicitações de equipe)
- Cria tabela `email_logs` (log de emails enviados)
- Cria função para gerar número de solicitação automático (HRX-2025-0001)
- Configura triggers e índices
- Relacionamento com `users`

**Dependências:**
- ✅ Requer `001_users_table.sql`

**Como executar:**
1. Copie todo o conteúdo de `migrations/004_contractors_and_requests_tables.sql`
2. Cole no SQL Editor
3. Clique em **Run**
4. ✅ Verifique sucesso

**Verificação:**
```sql
-- Verifica se as 3 tabelas foram criadas
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('contractors', 'requests', 'email_logs');

-- Testa função de geração de número
SELECT generate_request_number();
```

---

## ✅ CHECKLIST FINAL

Após executar todas as migrations, verifique:

```sql
-- 1. Verifica se todas as tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'professionals', 'contractors', 'requests', 'email_logs')
ORDER BY table_name;

-- Deve retornar 5 linhas:
-- contractors
-- email_logs
-- professionals
-- requests
-- users
```

```sql
-- 2. Verifica se o bucket de storage existe
SELECT name, public, file_size_limit
FROM storage.buckets
WHERE name = 'professional-documents';

-- Deve retornar 1 linha com file_size_limit = 10485760 (10MB)
```

```sql
-- 3. Verifica triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table;

-- Deve retornar triggers de updated_at para cada tabela
```

---

## 🎯 RESUMO DA ORDEM

1. ✅ `migrations/001_users_table.sql` → Tabela users
2. ✅ `migrations/002_professionals_table.sql` → Tabela professionals
3. ✅ `storage/001_documents_bucket.sql` → Bucket de documentos
4. ✅ `migrations/003_add_portfolio_column.sql` → Coluna portfolio
5. ✅ `migrations/004_contractors_and_requests_tables.sql` → Contractors, Requests, Email Logs

---

## ❌ ERROS COMUNS

### Erro: "relation users does not exist"
**Solução:** Você pulou a migration 001. Execute-a primeiro.

### Erro: "bucket already exists"
**Solução:** O bucket já foi criado. Pode pular esta migration.

### Erro: "column already exists"
**Solução:** A migration já foi executada. Pode pular.

### Erro: "permission denied"
**Solução:** Certifique-se de estar usando o SQL Editor do Supabase Dashboard com as credenciais corretas.

---

## 🔄 ROLLBACK (Desfazer)

Se precisar desfazer todas as migrations:

```sql
-- ⚠️ CUIDADO: Isso apaga TODOS os dados!

-- 1. Apaga tabelas
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Apaga funções
DROP FUNCTION IF EXISTS generate_request_number CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- 3. Apaga bucket (via Dashboard: Storage → professional-documents → Delete)
```

---

## 📞 PROBLEMAS?

Se encontrar erros:
1. Copie a mensagem de erro completa
2. Verifique qual migration causou o erro
3. Certifique-se de que executou na ordem correta
4. Verifique se não há migrations duplicadas

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0
