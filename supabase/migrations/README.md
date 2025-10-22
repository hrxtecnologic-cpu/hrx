# Database Migrations - HRX Platform

> **Última Atualização:** 2025-10-21

## 📋 Ordem Correta de Execução

Execute as migrations na seguinte ordem:

### 1. Base Tables

```sql
001_users_table.sql                      -- Tabela de usuários
002_professionals_table.sql              -- Tabela de profissionais (USAR ESTE)
003_add_portfolio_column.sql             -- Adiciona coluna portfolio
004_contractors_and_requests_tables.sql  -- Tabelas de contratantes e solicitações
005_create_equipment_suppliers.sql       -- Tabela de fornecedores
```

### 2. Enhancements

```sql
003_add_triggers_and_clerk_id.sql        -- Triggers e clerk_id
create_admin_tables.sql                  -- Tabelas administrativas
```

### 3. Features

```sql
006_add_geolocation_to_professionals.sql -- Geolocalização para busca avançada
```

### Arquivos a Ignorar

```
002_fix_existing_tables.sql           -- Obsoleto (apenas correções)
OBSOLETE_001_create_all_tables.sql.bak
OBSOLETE_FINAL_CREATE_ALL.sql.bak
```

---

## 🔄 Aplicar Migrations

### Opção A: Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Selecione projeto HRX
3. Vá em **SQL Editor**
4. Copie e execute cada arquivo **na ordem acima**

### Opção B: Supabase CLI

```bash
cd hrx
supabase db push
```

---

## ⚠️ Importante

- **SEMPRE** execute na ordem listada acima
- **NÃO** execute arquivos .bak
- `002_professionals_table.sql` é a versão correta (não `002_fix_existing_tables.sql`)
- Após aplicar migration 006, execute script de geocoding para popular lat/lng

---

## 📊 Status das Migrations

| # | Migration | Status | Descrição |
|---|-----------|--------|-----------|
| 001 | users_table | ✅ Required | Tabela base de usuários |
| 002 | professionals_table | ✅ Required | Tabela de profissionais |
| 003 | add_portfolio_column | ✅ Required | Adiciona campo portfolio |
| 004 | contractors_and_requests | ✅ Required | Sistema de solicitações |
| 005 | equipment_suppliers | ✅ Required | Fornecedores |
| 006 | geolocation | ⚠️ Pending | **NOVO** - Busca geográfica |
| - | triggers_and_clerk_id | ✅ Required | Triggers automáticos |
| - | admin_tables | ✅ Required | Tabelas admin |

---

## 🐛 Troubleshooting

### Erro: "relation already exists"

**Causa:** Migration já foi aplicada

**Solução:** Pule para próxima migration

### Erro: "column already exists"

**Causa:** Coluna já foi adicionada em migration anterior

**Solução:** Remova a linha que adiciona a coluna ou pule a migration

### Erro: "could not find the 'bio' column"

**Causa:** Código tenta usar campo que não existe

**Solução:** Arquivos obsoletos foram renomeados. Use apenas migrations listadas acima.

---

## 📝 Histórico de Limpeza

**2025-10-21:**
- Renomeado `001_create_all_tables.sql` → `OBSOLETE_001_create_all_tables.sql.bak`
- Renomeado `FINAL_CREATE_ALL.sql` → `OBSOLETE_FINAL_CREATE_ALL.sql.bak`
- Criado este README para documentar ordem correta
- Adicionado migration 006 (geolocalização)

---

**Para mais informações sobre o schema, consulte `DATABASE_SCHEMA.md` na raiz do projeto.**
