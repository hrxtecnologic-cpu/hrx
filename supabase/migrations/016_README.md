# Migration 016: Correção dos Cálculos Financeiros

## 🎯 Objetivo

Corrigir o problema onde os campos financeiros em `event_projects` sempre ficam zerados:
- `total_team_cost`
- `total_equipment_cost`
- `total_cost`
- `total_client_price`
- `total_profit`

## 🔧 O Que Esta Migration Faz

### 1. **Trigger `update_project_team_cost`**
- Dispara quando: INSERT/UPDATE/DELETE em `project_team`
- Ação: Soma todos os `total_cost` da equipe e atualiza `event_projects.total_team_cost`

### 2. **Trigger `update_project_equipment_cost`**
- Dispara quando:
  - INSERT/UPDATE/DELETE em `supplier_quotations`
  - UPDATE em `project_equipment` (quando `selected_quote_id` muda)
- Ação: Soma `hrx_price × quantity × duration_days` das cotações ACEITAS e atualiza `event_projects.total_equipment_cost`

### 3. **Trigger `update_project_totals`**
- Dispara quando: UPDATE em `event_projects` (quando subtotais mudam)
- Ação: Calcula valores finais:
  - `total_cost = total_team_cost + total_equipment_cost`
  - `total_client_price = total_cost × (1 + profit_margin/100)`
  - `total_profit = total_client_price - total_cost`

### 4. **Recálculo de Projetos Existentes**
- Atualiza todos os projetos que já existem no banco

## 📋 Como Executar

### Opção 1: Via Supabase Dashboard (SQL Editor)

1. Acesse https://supabase.com/dashboard/project/SEU_PROJETO_ID/sql
2. Copie o conteúdo de `016_fix_financial_calculations.sql`
3. Cole no SQL Editor
4. Clique em "Run"
5. Aguarde a mensagem: "Todos os triggers foram criados com sucesso!"

### Opção 2: Via Linha de Comando

```bash
# Se estiver usando Supabase CLI local
supabase db reset

# Ou executar migration específica
psql $DATABASE_URL < supabase/migrations/016_fix_financial_calculations.sql
```

## ✅ Como Testar

### 1. Executar Script de Teste

Edite o arquivo `016_test_calculations.sql` e substitua o `v_project_id` por um ID real de projeto:

```sql
v_project_id UUID := 'SEU-PROJETO-ID-AQUI';
```

Execute no SQL Editor do Supabase.

Você verá um output como:

```
==============================================
TESTE DE CÁLCULOS FINANCEIROS
==============================================
Projeto: 35ea9efb-5d49-4899-b444-98fd4b4a91df

1. EQUIPE:
   Total calculado manualmente: R$ 5000.00

2. EQUIPAMENTOS:
   Total calculado manualmente: R$ 3000.00

3. VALORES NO BANCO (event_projects):
   total_team_cost: R$ 5000.00
   total_equipment_cost: R$ 3000.00
   total_cost: R$ 8000.00
   total_client_price: R$ 10800.00
   total_profit: R$ 2800.00

4. VERIFICAÇÃO:
   ✅ total_team_cost CORRETO
   ✅ total_equipment_cost CORRETO
   ✅ total_cost CORRETO

==============================================
```

### 2. Testar via Frontend

1. Acesse http://localhost:3001/admin/projetos
2. Abra um projeto que tem equipe e equipamentos
3. Verifique se os valores aparecem corretamente
4. Adicione um novo membro à equipe
5. Verifique se o total foi atualizado automaticamente
6. Aceite uma cotação de equipamento
7. Verifique se o total foi atualizado automaticamente

### 3. Queries Úteis para Verificação

**Ver detalhes de um projeto:**
```sql
SELECT
  project_number,
  total_team_cost,
  total_equipment_cost,
  total_cost,
  profit_margin,
  total_client_price,
  total_profit,
  status
FROM event_projects
WHERE id = 'SEU-PROJETO-ID';
```

**Ver equipe de um projeto:**
```sql
SELECT
  COALESCE(p.full_name, pt.external_name) as nome,
  pt.role,
  pt.quantity,
  pt.duration_days,
  pt.daily_rate,
  pt.total_cost
FROM project_team pt
LEFT JOIN professionals p ON p.id = pt.professional_id
WHERE pt.project_id = 'SEU-PROJETO-ID';
```

**Ver equipamentos e cotações:**
```sql
SELECT
  pe.name,
  pe.quantity,
  pe.duration_days,
  sq.supplier_price,
  sq.hrx_price,
  sq.status,
  (sq.hrx_price * pe.quantity * pe.duration_days) as total
FROM project_equipment pe
LEFT JOIN supplier_quotations sq ON sq.id = pe.selected_quote_id
WHERE pe.project_id = 'SEU-PROJETO-ID';
```

## 🐛 Troubleshooting

### Problema: Valores ainda estão zerados

**Solução**: Forçar recálculo manual:

```sql
DO $$
DECLARE
  v_project RECORD;
BEGIN
  FOR v_project IN SELECT id FROM event_projects LOOP
    UPDATE event_projects
    SET updated_at = NOW()
    WHERE id = v_project.id;
  END LOOP;
END $$;
```

### Problema: Trigger não foi criado

**Verificar triggers existentes:**
```sql
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE 'trigger_update_project%';
```

Deveria retornar:
- trigger_update_project_team_cost
- trigger_update_project_equipment_cost_quotations
- trigger_update_project_equipment_cost_equipment
- trigger_update_project_totals

### Problema: Erro ao executar migration

Se receber erro de "relation does not exist", verifique se as tabelas existem:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('event_projects', 'project_team', 'project_equipment', 'supplier_quotations');
```

## 📊 Impacto Esperado

Após executar esta migration:

- ✅ Dashboard mostrará valores corretos
- ✅ Listagem de projetos mostrará totais corretos
- ✅ Propostas terão valores calculados automaticamente
- ✅ Relatórios financeiros funcionarão
- ✅ Ao adicionar/remover membro da equipe, total atualiza instantaneamente
- ✅ Ao aceitar/rejeitar cotação, total atualiza instantaneamente

## 🔄 Rollback

Se precisar reverter as alterações:

```sql
-- Remover triggers
DROP TRIGGER IF EXISTS trigger_update_project_team_cost ON project_team;
DROP TRIGGER IF EXISTS trigger_update_project_equipment_cost_quotations ON supplier_quotations;
DROP TRIGGER IF EXISTS trigger_update_project_equipment_cost_equipment ON project_equipment;
DROP TRIGGER IF EXISTS trigger_update_project_totals ON event_projects;

-- Remover funções
DROP FUNCTION IF EXISTS update_project_team_cost();
DROP FUNCTION IF EXISTS update_project_equipment_cost();
DROP FUNCTION IF EXISTS update_project_totals();

-- Zerar valores (opcional)
UPDATE event_projects
SET
  total_team_cost = 0,
  total_equipment_cost = 0,
  total_cost = 0,
  total_client_price = 0,
  total_profit = 0;
```

## 📝 Próximos Passos

Após confirmar que esta migration está funcionando:

1. ✅ Cálculos financeiros OK
2. ⏳ Implementar API de envio de proposta
3. ⏳ Criar interface para fornecedor responder cotação
4. ⏳ Verificar e executar migrations pendentes
5. ⏳ Migrar dados legados (contractor_requests → event_projects)
