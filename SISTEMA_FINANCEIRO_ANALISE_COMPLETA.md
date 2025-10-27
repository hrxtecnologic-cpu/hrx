# 💰 Análise Completa do Sistema Financeiro - HRX

## 📊 Visão Geral

O sistema financeiro da HRX calcula custos, preços ao cliente e lucros de projetos de eventos baseado em:
1. **Custos da Equipe** (profissionais alocados)
2. **Custos de Equipamentos** (cotações de fornecedores)
3. **Margem de Lucro** (35% padrão ou 80% para urgentes)

---

## 🏗️ Estrutura de Dados

### **Tabela Principal: `event_projects`**

#### **Campos Financeiros:**
```sql
profit_margin      NUMERIC   -- 35.00 ou 80.00 (fixo, baseado em is_urgent)
total_team_cost    NUMERIC   -- Soma de todos os custos da equipe
total_equipment_cost NUMERIC -- Soma de todos os custos de equipamentos
total_cost         NUMERIC   -- total_team_cost + total_equipment_cost
total_client_price NUMERIC   -- total_cost * (1 + profit_margin/100)
total_profit       NUMERIC   -- total_client_price - total_cost
```

#### **Restrição:**
```sql
CHECK (profit_margin = ANY (ARRAY[35.00, 80.00]))
```
- Margem só pode ser **35%** (padrão) ou **80%** (urgente)

---

## 📐 Fórmulas de Cálculo

### **1. Custo de Membro da Equipe**
**Tabela:** `project_team`
**Fórmula:**
```
total_cost = daily_rate * quantity * duration_days
```

**Exemplo:**
- Garçom: R$ 200/dia
- Quantidade: 3 garçons
- Duração: 2 dias
- **Total:** R$ 200 × 3 × 2 = **R$ 1.200**

**Arquivo:** `src/app/api/admin/event-projects/[id]/team/route.ts:99`

---

### **2. Custo de Equipamento**
**Tabela:** `project_equipment`
**Fórmula:**
```
total_cost = hrx_price * quantity * duration_days
```

**Onde:**
- `hrx_price` vem de `supplier_quotations.hrx_price` (cotação aceita)
- `hrx_price` é definido pelo **admin** (não é o `supplier_price`)

**Exemplo:**
- Fornecedor cotou: R$ 100/dia (supplier_price)
- HRX define: R$ 120/dia (hrx_price) ← **Usado no cálculo**
- Quantidade: 2 equipamentos
- Duração: 3 dias
- **Total:** R$ 120 × 2 × 3 = **R$ 720**

**Importante:** O sistema permite que o admin defina um preço HRX diferente do preço do fornecedor.

---

### **3. Totais do Projeto**
**Trigger:** `update_project_totals()` (Migration 016)
**Quando executa:** Sempre que `total_team_cost`, `total_equipment_cost` ou `profit_margin` mudam

**Fórmulas:**
```sql
total_cost = total_team_cost + total_equipment_cost

total_client_price = total_cost * (1 + profit_margin / 100)

total_profit = total_client_price - total_cost
```

**Exemplo (projeto padrão):**
- Equipe: R$ 1.200
- Equipamentos: R$ 720
- **Custo Total:** R$ 1.920
- Margem: 35%
- **Preço Cliente:** R$ 1.920 × 1,35 = **R$ 2.592**
- **Lucro:** R$ 2.592 - R$ 1.920 = **R$ 672**

**Exemplo (projeto urgente):**
- Equipe: R$ 1.200
- Equipamentos: R$ 720
- **Custo Total:** R$ 1.920
- Margem: 80%
- **Preço Cliente:** R$ 1.920 × 1,80 = **R$ 3.456**
- **Lucro:** R$ 3.456 - R$ 1.920 = **R$ 1.536** ← **Mais que dobra!**

---

## ⚙️ Sistema de Triggers Automáticos

### **Trigger 1: Atualizar `total_team_cost`**
**Nome:** `trigger_update_project_team_cost`
**Tabela:** `project_team`
**Eventos:** INSERT, UPDATE, DELETE

**O que faz:**
Sempre que um membro é adicionado/modificado/removido, recalcula:
```sql
total_team_cost = SUM(total_cost) de todos os membros
```

**Arquivo:** `supabase/migrations/016_fix_financial_calculations.sql:11-33`

---

### **Trigger 2: Atualizar `total_equipment_cost`**
**Nome:** `trigger_update_project_equipment_cost_quotations`
**Tabela:** `supplier_quotations`
**Eventos:** INSERT, UPDATE, DELETE

**O que faz:**
Quando uma cotação muda de status para `accepted`:
```sql
total_equipment_cost = SUM(
  hrx_price * pe.quantity * pe.duration_days
)
WHERE sq.status = 'accepted'
```

**Importante:** Apenas cotações **aceitas** entram no cálculo!

**Arquivo:** `supabase/migrations/016_fix_financial_calculations.sql:39-75`

---

### **Trigger 3: Atualizar totais finais**
**Nome:** `trigger_update_project_totals`
**Tabela:** `event_projects`
**Eventos:** UPDATE (de `total_team_cost`, `total_equipment_cost` ou `profit_margin`)

**O que faz:**
Recalcula automaticamente `total_cost`, `total_client_price` e `total_profit`.

**Arquivo:** `supabase/migrations/016_fix_financial_calculations.sql:91-116`

---

## 🔄 Fluxo de Atualização

### **Cenário: Adicionar garçom ao projeto**

1. **POST** `/api/admin/event-projects/[id]/team`
   ```json
   {
     "role": "Garçom",
     "category": "Garçom",
     "quantity": 3,
     "duration_days": 2,
     "daily_rate": 200
   }
   ```

2. **API calcula:**
   ```typescript
   total_cost = 200 * 3 * 2 = 1200
   ```

3. **INSERT na tabela `project_team`:**
   ```sql
   INSERT INTO project_team (project_id, total_cost, ...)
   VALUES ('abc-123', 1200, ...);
   ```

4. **Trigger 1 dispara:**
   ```sql
   UPDATE event_projects
   SET total_team_cost = (
     SELECT SUM(total_cost) FROM project_team WHERE project_id = 'abc-123'
   )
   WHERE id = 'abc-123';
   ```

5. **Trigger 3 dispara (porque `total_team_cost` mudou):**
   ```sql
   NEW.total_cost = NEW.total_team_cost + NEW.total_equipment_cost;
   NEW.total_client_price = NEW.total_cost * (1 + NEW.profit_margin / 100);
   NEW.total_profit = NEW.total_client_price - NEW.total_cost;
   ```

6. **Resultado final:**
   ```json
   {
     "total_team_cost": 1200,
     "total_equipment_cost": 0,
     "total_cost": 1200,
     "total_client_price": 1620, // 1200 * 1.35
     "total_profit": 420
   }
   ```

---

## 🚨 Inconsistências Identificadas

### **❌ INCONSISTÊNCIA 1: `hrx_price` vs `supplier_price`**

**Problema:**
- Fornecedor define `supplier_price` na cotação
- Admin pode definir `hrx_price` **diferente** do `supplier_price`
- Cálculo usa `hrx_price` (linha 56 da migration 016)

**Exemplo:**
```json
// Cotação do fornecedor
{
  "supplier_price": 100,  // Preço que o fornecedor quer
  "hrx_price": 120        // Preço que HRX decide usar
}

// Cálculo:
total_equipment_cost = 120 * quantity * duration_days
```

**Impacto:**
- ✅ **Vantagem:** HRX pode adicionar margem extra em equipamentos
- ⚠️ **Risco:** Se admin errar o `hrx_price`, cálculo fica incorreto
- ⚠️ **Confusão:** Dois preços podem confundir o sistema

**Recomendação:**
- Verificar se `hrx_price` é sempre definido corretamente
- Considerar calcular `hrx_price` automaticamente (ex: `supplier_price * 1.1`)

---

### **❌ INCONSISTÊNCIA 2: Margem fixa (35% ou 80%)**

**Problema:**
```sql
CHECK (profit_margin = ANY (ARRAY[35.00, 80.00]))
```

- Sistema **NÃO permite** margens personalizadas
- Admin não pode definir 40%, 50%, etc.

**Impacto:**
- ⚠️ **Inflexibilidade:** Eventos grandes podem precisar de margem diferente
- ⚠️ **Limitação:** Se cliente negociar desconto, não dá para ajustar margem

**Exemplo do problema:**
```
Cliente: "Aceito pagar R$ 2.500" (margem seria ~30%)
Sistema: ❌ Não aceita 30%, só 35% ou 80%
```

**Recomendação:**
- Remover CHECK constraint
- Permitir qualquer valor entre 0 e 100
- Manter 35% como **padrão** sugerido

---

### **⚠️ INCONSISTÊNCIA 3: Equipamentos sem cotação aceita**

**Problema:**
```sql
WHERE sq.status = 'accepted'
```

- Se equipamento não tem cotação aceita, `total_equipment_cost` **não conta** esse item
- Projeto pode parecer mais barato do que é

**Exemplo:**
```
Projeto tem:
- 2 equipamentos com cotação aceita (R$ 500)
- 1 equipamento SEM cotação (R$ 300)

total_equipment_cost = R$ 500 (ignora o 3º equipamento!)
```

**Impacto:**
- ✅ **Correto:** Só conta equipamentos com preço confirmado
- ⚠️ **Risco:** Admin pode esquecer de aceitar cotação e projeto fica sub-precificado

**Recomendação:**
- Adicionar alerta visual se projeto tem equipamentos sem cotação
- Considerar usar `total_cost` do `project_equipment` mesmo sem cotação (pessimista)

---

### **⚠️ INCONSISTÊNCIA 4: Recálculo manual**

**Problema:**
Função `recalculateProjectCosts()` existe em:
- `src/lib/recalculate-project-costs.ts`

Mas os triggers já fazem isso automaticamente!

**Impacto:**
- ⚠️ **Duplicação:** Dois sistemas fazendo a mesma coisa
- ⚠️ **Confusão:** Desenvolvedor pode chamar função manual achando que triggers não funcionam

**Recomendação:**
- Remover função manual OU
- Usar apenas em casos de emergência (recalcular projetos antigos)

---

### **✅ INCONSISTÊNCIA 5: Contadores (CORRIGIDO)**

**Problema ANTERIOR:**
- Cards mostravam quantidade de membros/equipamentos **alocados**
- Deveria mostrar quantidade **solicitada** pelo cliente

**Solução APLICADA:**
```typescript
// Agora soma `quantity` de professionals_needed e equipment_needed
team_count = professionalsNeeded.reduce((sum, prof) => sum + (prof.quantity || 0), 0);
equipment_count = equipmentNeeded.reduce((sum, equip) => sum + (equip.quantity || 0), 0);
```

**Arquivo:** `src/app/api/admin/event-projects/route.ts:99-126`

---

## 📈 Fluxo Financeiro Completo

### **Fase 1: Criação do Projeto**
```
Cliente solicita evento → POST /api/public/event-requests
↓
Projeto criado com:
- profit_margin = 80 (se urgente) ou 35 (padrão)
- total_* = 0 (ainda não tem equipe/equipamentos)
```

### **Fase 2: Montagem da Equipe**
```
Admin adiciona profissionais → POST /api/admin/event-projects/[id]/team
↓
Para cada profissional:
  total_cost = daily_rate * quantity * duration_days
↓
Trigger atualiza total_team_cost automaticamente
↓
Trigger recalcula total_cost, total_client_price, total_profit
```

### **Fase 3: Cotação de Equipamentos**
```
Admin solicita cotações → POST /api/admin/event-projects/[id]/quotations
↓
Fornecedores respondem → PATCH /api/quotations/[id]/respond
↓
Admin aceita cotação → POST /api/admin/event-projects/[id]/quotations/[quotationId]/accept
↓
Trigger atualiza total_equipment_cost automaticamente
↓
Trigger recalcula total_cost, total_client_price, total_profit
```

### **Fase 4: Envio de Proposta**
```
Admin revisa valores finais
↓
Admin envia proposta → POST /api/admin/event-projects/[id]/send-proposal
↓
Cliente recebe email com:
- Total de profissionais
- Total de equipamentos
- Preço final (total_client_price)
```

---

## 🔍 Verificação de Integridade

### **Query para verificar projetos com problemas:**

```sql
-- Projetos com total_cost zerado mas tem equipe
SELECT
  id,
  project_number,
  total_team_cost,
  total_equipment_cost,
  total_cost,
  (SELECT COUNT(*) FROM project_team WHERE project_id = event_projects.id) as team_count,
  (SELECT COUNT(*) FROM project_equipment WHERE project_id = event_projects.id) as equipment_count
FROM event_projects
WHERE (total_team_cost = 0 AND
       (SELECT COUNT(*) FROM project_team WHERE project_id = event_projects.id) > 0)
   OR (total_equipment_cost = 0 AND
       (SELECT COUNT(*) FROM project_equipment WHERE project_id = event_projects.id) > 0);
```

### **Query para verificar cotações não aceitas:**

```sql
-- Equipamentos sem cotação aceita
SELECT
  ep.id as project_id,
  ep.project_number,
  pe.name as equipment_name,
  pe.quantity,
  pe.duration_days,
  COUNT(sq.id) as total_quotations,
  COUNT(CASE WHEN sq.status = 'accepted' THEN 1 END) as accepted_quotations
FROM project_equipment pe
JOIN event_projects ep ON ep.id = pe.project_id
LEFT JOIN supplier_quotations sq ON sq.equipment_id = pe.id
GROUP BY ep.id, ep.project_number, pe.name, pe.quantity, pe.duration_days
HAVING COUNT(CASE WHEN sq.status = 'accepted' THEN 1 END) = 0;
```

---

## 🎯 Recomendações

### **Curto Prazo (Urgente):**
1. ✅ **Corrigir contadores** - FEITO
2. ⚠️ **Adicionar alertas:**
   - Equipamentos sem cotação aceita
   - Margem de lucro abaixo do esperado
   - `hrx_price` zerado ou muito diferente de `supplier_price`

### **Médio Prazo:**
3. 🔧 **Remover CHECK constraint** da margem de lucro
4. 🔧 **Padronizar cálculo de `hrx_price`:**
   - Sugerir: `hrx_price = supplier_price * 1.1` (10% margem extra)
   - Permitir edição manual se necessário

### **Longo Prazo:**
5. 📊 **Adicionar relatório financeiro:**
   - Total de custos vs receitas
   - Margem média dos projetos
   - Equipamentos mais caros/lucrativos
6. 🔄 **Considerar desconto ao cliente:**
   - Campo `discount_percentage`
   - Ajusta `total_client_price` após cálculo base

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `atual.sql` | Schema completo (linhas com tabelas financeiras) |
| `supabase/migrations/016_fix_financial_calculations.sql` | Triggers de cálculo automático |
| `src/lib/recalculate-project-costs.ts` | Função manual de recálculo |
| `src/app/api/admin/event-projects/[id]/team/route.ts` | Adicionar profissional (calcula `total_cost`) |
| `src/app/api/admin/event-projects/[id]/equipment/route.ts` | Adicionar equipamento |
| `src/app/api/admin/event-projects/[id]/quotations/[quotationId]/accept/route.ts` | Aceitar cotação |
| `src/app/admin/projetos/[id]/page.tsx` | Visualização dos valores financeiros |

---

**Data de Análise:** 2025-01-21
**Status:** ✅ COMPLETO
**Pendente:** Implementar recomendações de curto prazo
