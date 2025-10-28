# 🧹 Plano de Limpeza de Migrations

**Data:** 28 de Outubro de 2025
**Status:** PLANEJAMENTO

---

## 📋 Migrations Duplicadas Identificadas

### Duplicatas para Consolidar:

| Número | Arquivos | Manter | Remover | Motivo |
|--------|----------|--------|---------|--------|
| 002 | `002_professionals_table.sql` (96 linhas)<br>`002_fix_existing_tables.sql` (236 linhas) | `002_fix_existing_tables.sql` | `002_professionals_table.sql` | Fix é mais completo |
| 003 | `003_add_portfolio_column.sql` (26 linhas)<br>`003_add_triggers_and_clerk_id.sql` (100 linhas) | `003_add_triggers_and_clerk_id.sql` | `003_add_portfolio_column.sql` | Triggers é mais importante |
| 011 | `011_create_event_projects_unified.sql` (498 linhas)<br>`011_fix_drop_constraint.sql` (16 linhas) | `011_create_event_projects_unified.sql` | `011_fix_drop_constraint.sql` | Unified é principal, fix é patch |
| 016 | `016_fix_financial_calculations.sql` (175 linhas)<br>`016_test_calculations.sql` (160 linhas) | `016_fix_financial_calculations.sql` | `016_test_calculations.sql` | Test é temporário |
| 020 | `020_add_service_radius.sql` (18 linhas)<br>`020_create_supplier_equipment.sql` (55 linhas)<br>`020_improve_professional_suggestions.sql` (348 linhas) | `020_improve_professional_suggestions.sql` | Outros 2 | Suggestions é mais completo |
| 022 | `022_create_reports_and_metrics.sql` (445 linhas)<br>`022_unified_professionals_query.sql` (170 linhas) | `022_create_reports_and_metrics.sql` | `022_unified_professionals_query.sql` | Reports é mais abrangente |
| 023 | `023_equipment_catalog.sql` (116 linhas)<br>`023_update_existing_notifications.sql` (84 linhas) | Ambos | Nenhum | **Propósitos diferentes!** |
| 027 | `027_add_clerk_id_to_suppliers.sql` (15 linhas)<br>`027_enable_realtime_delivery_tracking.sql` (17 linhas) | Ambos | Nenhum | **Propósitos diferentes!** |

---

## 🚨 IMPORTANTE - Verificações Necessárias

### Antes de Remover Qualquer Migration:

1. ✅ **Verificar se a migration foi executada em produção**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   WHERE version IN ('002', '003', '011', '016', '020', '022', '023', '027');
   ```

2. ✅ **Verificar se há dependências entre as migrations**
   - Ler cada arquivo
   - Verificar se uma migration referencia objetos criados pela outra

3. ✅ **Backup antes de qualquer remoção**
   ```bash
   cp -r supabase/migrations supabase/migrations_backup_$(date +%Y%m%d)
   ```

---

## 📝 Ações Recomendadas

### Opção 1: Renomear (SEGURO - RECOMENDADO)
Renomear as migrations "perdedoras" para `.bak` (não executam, mas ficam no histórico):

```bash
# Migrations para renomear como .bak
mv supabase/migrations/002_professionals_table.sql supabase/migrations/OBSOLETE_002_professionals_table.sql.bak
mv supabase/migrations/003_add_portfolio_column.sql supabase/migrations/OBSOLETE_003_add_portfolio_column.sql.bak
mv supabase/migrations/011_fix_drop_constraint.sql supabase/migrations/OBSOLETE_011_fix_drop_constraint.sql.bak
mv supabase/migrations/016_test_calculations.sql supabase/migrations/OBSOLETE_016_test_calculations.sql.bak
mv supabase/migrations/020_add_service_radius.sql supabase/migrations/OBSOLETE_020_add_service_radius.sql.bak
mv supabase/migrations/020_create_supplier_equipment.sql supabase/migrations/OBSOLETE_020_create_supplier_equipment.sql.bak
mv supabase/migrations/022_unified_professionals_query.sql supabase/migrations/OBSOLETE_022_unified_professionals_query.sql.bak
```

### Opção 2: Deletar (PERIGOSO - NÃO RECOMENDADO)
Somente se confirmado que não foram executadas em produção.

---

## ✅ Migrations que NÃO são duplicadas (Manter):

- `023_equipment_catalog.sql` vs `023_update_existing_notifications.sql` - **Propósitos diferentes**
- `027_add_clerk_id_to_suppliers.sql` vs `027_enable_realtime_delivery_tracking.sql` - **Propósitos diferentes**

---

## 🎯 Resultado Esperado

Após limpeza:
- **7 migrations** renomeadas para `.bak`
- **0 migrations** deletadas (segurança)
- **36 migrations ativas** (down de 43)
- Histórico preservado para auditoria
