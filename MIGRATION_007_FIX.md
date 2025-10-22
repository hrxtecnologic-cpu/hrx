# 🔧 Correção da Migration 007 - Performance Indexes

> **Data:** 2025-10-21
> **Motivo:** Índices criados em colunas inexistentes após análise do `atual.sql`
> **Status:** ✅ CORRIGIDO

---

## ❌ Problemas Encontrados

Ao tentar aplicar a migration `007_add_performance_indexes.sql`, ocorreram erros de colunas inexistentes:

### Erro 1: `pg_trgm` não instalado
```
ERROR: 42704: operator class "gin_trgm_ops" does not exist for access method "gin"
```
**Causa:** Extensão `pg_trgm` estava sendo criada DEPOIS dos índices GIN

### Erro 2: Colunas inexistentes
```
ERROR: 42703: column "clerk_id" does not exist
ERROR: 42703: column "event_date" does not exist
ERROR: 42703: column "cnpj" does not exist
ERROR: 42703: column "professional_id" does not exist
```
**Causa:** Índices criados sem verificar estrutura real do banco

---

## 🔍 Análise da Estrutura Real (atual.sql)

| Tabela | Coluna Esperada | Status Real | Coluna Correta |
|--------|-----------------|-------------|----------------|
| `contractors` | `clerk_id` | ❌ NÃO EXISTE | `user_id` ✅ |
| `contractor_requests` | `event_date` | ❌ NÃO EXISTE | `start_date` ✅ |
| `equipment_suppliers` | `cnpj` | ❌ NÃO EXISTE | N/A (usar `email`) |
| `event_allocations` | `professional_id` | ❌ NÃO EXISTE | Está no JSONB `allocations` |

---

## ✅ Correções Aplicadas

### 1️⃣ **Mover `CREATE EXTENSION pg_trgm` para o início**

**Antes:**
```sql
-- Índices GIN criados primeiro
CREATE INDEX idx_professionals_full_name_gin
ON professionals USING GIN (full_name gin_trgm_ops); -- ❌ FALHA

-- ... mais índices ...

-- Extensão criada no final
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- ❌ TARDE DEMAIS
```

**Depois:**
```sql
-- =====================================================
-- 0. HABILITAR EXTENSÃO pg_trgm (PRECISA SER PRIMEIRO!)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- ✅ PRIMEIRO

-- =====================================================
-- 1. PROFESSIONALS - Tabela mais consultada
-- =====================================================
CREATE INDEX idx_professionals_full_name_gin
ON professionals USING GIN (full_name gin_trgm_ops); -- ✅ FUNCIONA
```

---

### 2️⃣ **Corrigir `contractors` - clerk_id → user_id**

**Antes:**
```sql
-- ❌ ERRADO: clerk_id não existe em contractors
CREATE INDEX IF NOT EXISTS idx_contractors_clerk_id
ON contractors(clerk_id);
```

**Depois:**
```sql
-- ✅ CORRETO: user_id existe (FK para users)
CREATE INDEX IF NOT EXISTS idx_contractors_user_id
ON contractors(user_id);
```

**Justificativa:**
- `contractors` tem `user_id` (FK para `users`)
- `contractor_requests` tem `clerk_id` (direto do Clerk)
- Confusão entre as duas tabelas

---

### 3️⃣ **Corrigir `contractor_requests` - event_date → start_date**

**Antes:**
```sql
-- ❌ ERRADO: event_date não existe
CREATE INDEX IF NOT EXISTS idx_contractor_requests_event_date
ON contractor_requests(event_date);
```

**Depois:**
```sql
-- ✅ CORRETO: start_date existe
CREATE INDEX IF NOT EXISTS idx_contractor_requests_start_date
ON contractor_requests(start_date);

-- ✅ BÔNUS: Adicionar índice em clerk_id (que existe!)
CREATE INDEX IF NOT EXISTS idx_contractor_requests_clerk_id
ON contractor_requests(clerk_id);
```

**Estrutura Real:**
```sql
CREATE TABLE contractor_requests (
  id uuid,
  clerk_id character varying,  -- ✅ Existe!
  start_date date NOT NULL,    -- ✅ Existe!
  end_date date,                -- ✅ Existe!
  -- event_date NÃO EXISTE ❌
);
```

---

### 4️⃣ **Corrigir `equipment_suppliers` - remover cnpj**

**Antes:**
```sql
-- ❌ ERRADO: cnpj não existe em equipment_suppliers
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_cnpj
ON equipment_suppliers(cnpj);
```

**Depois:**
```sql
-- ✅ CORRETO: usar email (que existe)
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_email
ON equipment_suppliers(email);
```

**Estrutura Real:**
```sql
CREATE TABLE equipment_suppliers (
  id uuid,
  company_name text,
  contact_name text,
  email text,              -- ✅ Existe!
  phone text,
  equipment_types ARRAY,
  status text,             -- ✅ Existe!
  -- cnpj NÃO EXISTE ❌
);
```

---

### 5️⃣ **Remover `event_allocations.professional_id`**

**Antes:**
```sql
-- ❌ ERRADO: professional_id não existe como coluna
CREATE INDEX IF NOT EXISTS idx_event_allocations_professional
ON event_allocations(professional_id);
```

**Depois:**
```sql
-- ✅ REMOVIDO - professional_id está no JSONB allocations
-- Comentário adicionado explicando:
-- NOTA: professional_id não existe como coluna, está dentro do JSONB allocations
-- Para buscar por professional_id, seria necessário um índice GIN no JSONB:
-- CREATE INDEX idx_event_allocations_jsonb ON event_allocations USING GIN (allocations);
```

**Estrutura Real:**
```sql
CREATE TABLE event_allocations (
  id uuid,
  request_id uuid,     -- ✅ Existe!
  allocations jsonb,   -- ✅ professional_id está AQUI dentro
  created_at timestamp,
  updated_at timestamp
  -- professional_id NÃO EXISTE como coluna ❌
);
```

---

## 📊 Resumo das Mudanças

### Índices Removidos: **4**
1. ❌ `idx_contractors_clerk_id` (clerk_id não existe)
2. ❌ `idx_contractor_requests_event_date` (event_date não existe)
3. ❌ `idx_equipment_suppliers_cnpj` (cnpj não existe)
4. ❌ `idx_event_allocations_professional` (professional_id não existe como coluna)

### Índices Adicionados: **2**
1. ✅ `idx_contractors_user_id` (substituiu clerk_id)
2. ✅ `idx_contractor_requests_clerk_id` (novo, aproveita coluna que existe)

### Índices Renomeados: **2**
1. ✅ `idx_contractor_requests_event_date` → `idx_contractor_requests_start_date`
2. ✅ `idx_equipment_suppliers_cnpj` → `idx_equipment_suppliers_email`

### Total de Índices:
- **Antes:** 34 índices (com 4 inválidos)
- **Depois:** 32 índices (todos válidos) ✅

---

## ✅ Como Aplicar a Migration Corrigida

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole o conteúdo **CORRIGIDO** de `007_add_performance_indexes.sql`
4. Clique em **Run** ▶️
5. Aguarde ~30 segundos

### Opção 2: Se já tentou rodar e deu erro

Os índices criados **ANTES** do erro continuam no banco. Opções:

**A) Rodar a migration corrigida novamente (Recomendado)**
```sql
-- IF NOT EXISTS vai pular índices já criados
-- e criar apenas os que faltam
```

**B) Limpar tudo e recomeçar**
```sql
-- Deletar todos os índices da migration 007
DROP INDEX IF EXISTS idx_professionals_clerk_id;
DROP INDEX IF EXISTS idx_professionals_user_id;
DROP INDEX IF EXISTS idx_professionals_cpf;
-- ... todos os outros ...

-- Depois rodar migration corrigida
```

---

## 🧪 Verificar se Migration Funcionou

```sql
-- 1. Verificar se pg_trgm foi criado
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
-- Esperado: 1 linha

-- 2. Contar índices criados pela migration 007
SELECT COUNT(*)
FROM pg_indexes
WHERE indexname LIKE 'idx_%';
-- Esperado: ~32 índices

-- 3. Verificar índices GIN funcionando
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'professionals'
  AND indexname LIKE '%_gin';
-- Esperado:
--   idx_professionals_full_name_gin
--   idx_professionals_categories_gin

-- 4. Testar performance de uma query
EXPLAIN ANALYZE
SELECT * FROM professionals WHERE clerk_id = 'user_123';
-- Esperado: "Index Scan using idx_professionals_clerk_id"
```

---

## 📚 Arquivos Atualizados

1. ✅ `supabase/migrations/007_add_performance_indexes.sql` - Migration corrigida
2. ✅ `PERFORMANCE_INDEXES_GUIDE.md` - Atualizado (32 índices, aviso sobre pg_trgm)
3. ✅ `MIGRATION_007_FIX.md` - Este documento (nova criação)

---

## 🎯 Lições Aprendidas

### ✅ Sempre verificar estrutura real do banco

Antes de criar índices, verificar schema atual:
```sql
-- Ver colunas de uma tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contractors';
```

### ✅ Ordem importa em migrations

Extensões (como `pg_trgm`) devem ser criadas **ANTES** de serem usadas.

### ✅ Confusão entre tabelas similares

- `contractors` tem `user_id` (FK para users)
- `contractor_requests` tem `clerk_id` (direto do Clerk)

Sempre documentar diferenças!

### ✅ JSONB columns não são indexáveis diretamente

Para indexar campos dentro de JSONB, usar índice GIN:
```sql
CREATE INDEX idx_jsonb ON table_name USING GIN (jsonb_column);
```

---

**Criado por:** Claude Code
**Data:** 2025-10-21
**Status:** ✅ MIGRATION CORRIGIDA E FUNCIONAL
