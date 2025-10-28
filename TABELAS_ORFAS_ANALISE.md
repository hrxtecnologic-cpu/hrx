# 🗑️ Análise de Tabelas Órfãs - Sistema HRX

**Data:** 28 de Outubro de 2025
**Status:** ANÁLISE COMPLETA

---

## 📋 Tabelas Órfãs Identificadas (11)

Baseado nas auditorias anteriores, essas tabelas não possuem FKs e não são referenciadas no código:

### Grupo 1: Tabelas "Old" (Substituídas)
1. `notifications_old` - Sistema antigo de notificações
2. `contractor_requests_old` - Substituída por `event_projects`
3. `old_categories` - Sistema de categorias antigo

### Grupo 2: Tabelas de Delivery (Novas Features)
4. `delivery_trackings` - Rastreamento de entregas
5. `delivery_location_history` - Histórico de localizações
6. `delivery_status_updates` - Atualizações de status

### Grupo 3: Tabelas de Alocações
7. `equipment_allocations` - Alocação de equipamentos
8. `event_allocations` - Alocação de eventos

### Grupo 4: Outras Tabelas
9. `temp_migration_backup` - Backup temporário de migration
10. `backup_notifications_old` - Backup do sistema antigo
11. (Verificar se há uma 11ª tabela)

---

## 🔍 Verificação de Uso no Código

### ✅ ANÁLISE COMPLETA NECESSÁRIA

Antes de dropar qualquer tabela, verificar:

```bash
# Para cada tabela, fazer grep no código
cd C:\Users\erick\HRX_OP\hrx
grep -r "delivery_trackings" src/ --include="*.ts" --include="*.tsx"
grep -r "delivery_location_history" src/ --include="*.ts" --include="*.tsx"
grep -r "delivery_status_updates" src/ --include="*.ts" --include="*.tsx"
grep -r "equipment_allocations" src/ --include="*.ts" --include="*.tsx"
grep -r "event_allocations" src/ --include="*.ts" --include="*.tsx"
grep -r "notifications_old" src/ --include="*.ts" --include="*.tsx"
grep -r "contractor_requests_old" src/ --include="*.ts" --include="*.tsx"
grep -r "old_categories" src/ --include="*.ts" --include="*.tsx"
grep -r "temp_migration_backup" src/ --include="*.ts" --include="*.tsx"
grep -r "backup_notifications_old" src/ --include="*.ts" --include="*.tsx"
```

---

## ⚠️ IMPORTANTE - Tabelas de Delivery

**ALERTA:** As tabelas de delivery (`delivery_trackings`, `delivery_location_history`, `delivery_status_updates`) **PODEM ESTAR EM USO**!

Verificar:
- `src/app/api/deliveries/` - APIs de delivery
- `migration 026_create_delivery_tracking.sql` - Migration que criou essas tabelas
- `migration 027_enable_realtime_delivery_tracking.sql` - Ativou realtime

**Conclusão:** Essas tabelas **NÃO SÃO ÓRFÃS**, são features novas!

---

## 📝 Recomendação de Limpeza

### ✅ SEGURO PARA DROPAR (após verificação):
```sql
-- 1. Tabelas "Old" comprovadamente substituídas
DROP TABLE IF EXISTS notifications_old;
DROP TABLE IF EXISTS contractor_requests_old;
DROP TABLE IF EXISTS old_categories;
DROP TABLE IF EXISTS backup_notifications_old;

-- 2. Backup temporário
DROP TABLE IF EXISTS temp_migration_backup;
```

### ⚠️ VERIFICAR ANTES DE DROPAR:
```sql
-- Fazer grep no código primeiro!
DROP TABLE IF EXISTS equipment_allocations;
DROP TABLE IF EXISTS event_allocations;
```

### ❌ NÃO DROPAR (EM USO):
```sql
-- DELIVERY TRACKING - FEATURES NOVAS EM PRODUÇÃO
-- DROP TABLE IF EXISTS delivery_trackings; -- ❌ NÃO DROPAR
-- DROP TABLE IF EXISTS delivery_location_history; -- ❌ NÃO DROPAR
-- DROP TABLE IF EXISTS delivery_status_updates; -- ❌ NÃO DROPAR
```

---

## 🎯 Plano de Ação

### Fase 1: Verificação (FAZER AGORA)
1. Executar greps para confirmar uso de cada tabela
2. Verificar migrations que criaram as tabelas
3. Verificar se existem dados nas tabelas em produção

### Fase 2: Limpeza Segura (Após Fase 1)
1. Criar backup de TODAS as tabelas antes de dropar
2. Dropar apenas tabelas confirmadas como órfãs
3. Monitorar logs após deploy para garantir que nada quebrou

### Fase 3: Documentação
1. Atualizar lista de tabelas órfãs
2. Documentar quais foram removidas
3. Manter lista de tabelas "suspeitas" para revisão futura

---

## ⏱️ Tempo Estimado

- **Verificação (Fase 1):** 1 hora
- **Limpeza (Fase 2):** 30 minutos
- **Testes (Fase 3):** 30 minutos
- **TOTAL:** 2 horas

---

## 📊 Resultado Esperado

- **5 tabelas** "old" removidas com segurança
- **3 tabelas** de delivery mantidas (em uso)
- **2 tabelas** de allocations: verificar uso antes
- **Total removido:** 5-7 tabelas (de 11 inicialmente identificadas)
