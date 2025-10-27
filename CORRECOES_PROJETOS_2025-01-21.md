# 🔧 Correções de Projetos - 2025-01-21

## 📋 Problemas Reportados

### 1. **Contadores de Equipe e Equipamentos não funcionando**
**Sintoma:** No card de projetos (`/admin/projetos`), os contadores de "Equipe" e "Equipamentos" sempre mostravam "0 membros" e "0 itens", mesmo quando havia dados.

**Causa Raiz:**
- A API GET `/api/admin/event-projects` fazia `SELECT *` na tabela `event_projects`
- Os campos `team_count` e `equipment_count` **NÃO EXISTEM** na tabela
- O frontend esperava esses campos calculados

**Correção Aplicada:**
- ✅ Modificado query do Supabase para incluir contadores:
```typescript
// ANTES:
.from('event_projects')
.select('*')

// DEPOIS:
.from('event_projects')
.select(`
  *,
  team_count:project_team(count),
  equipment_count:project_equipment(count)
`)
```

- ✅ Adicionado processamento para transformar formato Supabase:
```typescript
const projectsWithCounts = (data || []).map((project: any) => ({
  ...project,
  team_count: Array.isArray(project.team_count) && project.team_count.length > 0
    ? project.team_count[0].count
    : 0,
  equipment_count: Array.isArray(project.equipment_count) && project.equipment_count.length > 0
    ? project.equipment_count[0].count
    : 0,
}));
```

**Arquivo Modificado:** `src/app/api/admin/event-projects/route.ts` (linhas 57-112)

---

### 2. **Card "Demanda do Cliente" não aparecendo em alguns projetos**
**Sintoma:** Ao visualizar detalhes de um projeto (`/admin/projetos/[id]`), o card "Demanda do Cliente" aparecia vazio com a mensagem "Nenhuma demanda de equipamento registrada", mesmo quando o cliente havia solicitado equipamentos.

**Causa Raiz:**
- O wizard de solicitação (`/solicitar-evento-wizard`) enviava campo chamado `equipment` (array)
- A API `/api/public/event-requests` esperava `equipment_types` (legado)
- Resultado: campo `equipment_needed` no banco ficava vazio (`[]`)
- Frontend: card "Demanda do Cliente" verifica `equipmentNeeded.length > 0` (linha 392 de `ProjectEquipmentSection.tsx`)

**Correção Aplicada:**
- ✅ Adicionado suporte para ambos os campos na API:
```typescript
// Desestruturação aceita ambos:
const {
  professionals,
  equipment,              // ← Novo campo do wizard
  equipment_types,        // ← Campo legado
  // ...
} = body;

// Salvar no banco com fallback:
equipment_needed: equipment || equipment_types || [],
```

- ✅ Corrigido também nos emails enviados:
```typescript
equipmentCount: (equipment || equipment_types)?.length || 0,
equipmentTypes: equipment || equipment_types || [],
```

**Arquivo Modificado:** `src/app/api/public/event-requests/route.ts` (linhas 159, 247, 274, 294)

---

## 🧪 Como Testar

### **Teste 1: Contadores**
1. Acesse `/admin/projetos`
2. Encontre um projeto que tenha equipe ou equipamentos adicionados
3. **Esperado:** Contadores devem mostrar números corretos (ex: "3 membros", "5 itens")
4. **Antes:** Mostrava "0 membros" e "0 itens"

### **Teste 2: Demanda do Cliente (novos projetos)**
1. Acesse `/solicitar-evento-wizard?type=client` (deslogado ou logado)
2. Preencha o formulário completo incluindo:
   - Dados do cliente
   - Dados do evento
   - **Adicione pelo menos 1 profissional**
   - **Adicione pelo menos 1 equipamento**
3. Envie o formulário
4. No admin, acesse o projeto criado → aba "Equipamentos"
5. **Esperado:** Card "Demanda do Cliente" deve mostrar os equipamentos solicitados
6. **Antes:** Card aparecia vazio

### **Teste 3: Projetos Antigos**
- Projetos criados antes dessa correção **ainda terão** `equipment_needed` vazio
- Isso é esperado - apenas novos projetos terão a demanda salva
- Para corrigir projetos antigos, seria necessário uma migration manual

---

## 📊 Impacto

### **Positivo:**
- ✅ Contadores agora funcionam corretamente
- ✅ Demanda do cliente é salva e exibida
- ✅ Compatibilidade mantida com código legado (`equipment_types`)
- ✅ Nenhuma breaking change

### **Limitações:**
- ⚠️ Projetos criados manualmente via admin (`POST /api/admin/event-projects`) **NÃO salvam** `equipment_needed` nem `professionals_needed`
- ⚠️ Modal de criar projeto admin é básico (apenas dados gerais, sem seleção de equipe/equipamentos)
- ⚠️ Projetos antigos terão demanda vazia (não há migration para preencher)

---

## 🔍 Arquivos Modificados

1. **`src/app/api/admin/event-projects/route.ts`**
   - Adicionado contadores na query GET
   - Processamento de dados para transformar formato Supabase

2. **`src/app/api/public/event-requests/route.ts`**
   - Adicionado suporte para campo `equipment` do wizard
   - Mantido fallback para `equipment_types` (legado)
   - Corrigido emails para usar campo correto

---

## 💡 Recomendações Futuras

### **Curto Prazo:**
1. Testar as correções em projetos novos
2. Verificar se emails estão sendo enviados corretamente

### **Médio Prazo:**
1. **Modal de criar projeto admin:** Adicionar campos para inserir demanda de profissionais e equipamentos
2. **Migration opcional:** Script SQL para popular `professionals_needed` e `equipment_needed` em projetos antigos baseado nas tabelas relacionadas

### **Longo Prazo:**
1. Considerar depreciar completamente `equipment_types` (legado)
2. Adicionar validação no schema do banco para garantir que `equipment_needed` nunca seja null

---

## 🚀 Status

- ✅ **Contadores:** CORRIGIDO
- ✅ **Demanda do Cliente:** CORRIGIDO
- ⏳ **Testes:** PENDENTE
- ⏳ **Auditoria completa:** PENDENTE

---

**Data:** 2025-01-21
**Responsável:** Claude Code Assistant
**Arquivos Modificados:** 2
**Linhas Alteradas:** ~40
**Breaking Changes:** Nenhuma
