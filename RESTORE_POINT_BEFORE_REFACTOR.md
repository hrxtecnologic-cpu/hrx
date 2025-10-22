# 🔴 RESTORE POINT - Antes da Refatoração para Event Projects

> **Data:** 2025-10-22
> **Motivo:** Backup antes de refatorar sistema de orçamentos para arquitetura unificada

---

## 📍 ÚLTIMO COMMIT SEGURO

```bash
Commit: 46cb28efbbe9192d62b29337ff05cf88db2ed65e
Author: Yuriandrews21 <yurilojavirtual@gmail.com>
Date:   Wed Oct 22 03:10:44 2025 -0300
Message: feat: Sistema completo de subcategorias, certificações e melhorias visuais
```

---

## ⚠️ COMO REVERTER SE DER ERRADO

### Opção 1: Reverter apenas arquivos específicos
```bash
cd "C:\Users\erick\HRX_OP\hrx"

# Reverter arquivos individuais
git checkout 46cb28ef -- supabase/migrations/
git checkout 46cb28ef -- src/types/
git checkout 46cb28ef -- src/app/api/admin/
git checkout 46cb28ef -- src/app/admin/

# Limpar arquivos não rastreados
git clean -fd
```

### Opção 2: Reverter todo o repositório (CUIDADO!)
```bash
cd "C:\Users\erick\HRX_OP\hrx"

# Criar branch de backup primeiro
git branch backup-refactor-$(date +%Y%m%d-%H%M%S)

# Reverter para commit seguro
git reset --hard 46cb28ef

# Se precisar recuperar mudanças
git checkout backup-refactor-TIMESTAMP
```

### Opção 3: Stash (guardar mudanças temporariamente)
```bash
# Guardar todas as mudanças atuais
git stash push -u -m "Refatoração event_projects em andamento"

# Listar stashes
git stash list

# Recuperar depois se necessário
git stash pop
```

---

## 📦 ARQUIVOS CRIADOS NESTA SESSÃO (Não Commitados)

**Novos arquivos que serão DELETADOS se reverter:**

### Backend/APIs:
- `supabase/migrations/010_create_quote_system.sql`
- `src/types/quote.ts`
- `src/app/api/admin/quotes/route.ts`
- `src/app/api/admin/quotes/[id]/route.ts`
- `src/app/api/admin/quotes/[id]/send/route.ts`

### Email Templates:
- `src/lib/resend/templates/QuoteRequestEmail.tsx`
- `src/lib/resend/templates/UrgentQuoteAdminEmail.tsx`
- `src/lib/resend/templates/QuoteAcceptedEmail.tsx`
- `src/lib/resend/templates/QuoteRejectedEmail.tsx`

### Frontend:
- `src/app/admin/orcamentos/page.tsx`
- `src/app/admin/orcamentos/[id]/page.tsx`
- `src/app/admin/orcamentos/novo/page.tsx`

### Arquivos Modificados:
- `src/lib/resend/emails.tsx` (adicionadas 4 funções)
- `COMPLETE_TASKLIST.md` (atualizado com tarefa #19)

---

## 🎯 O QUE VAMOS FAZER AGORA (Refatoração Opção A)

### 1. Nova Arquitetura: EVENT PROJECTS

**Criar entidade principal unificada:**
```
event_projects
├── Dados do Cliente (nome, email, phone)
├── Dados do Evento (data, local, tipo)
├── Status (cotação → proposta → aprovado → execução)
├── is_urgent (define margem 80% ou 35%)
├── Totalizadores (custo, preço, lucro)
└── Relacionamentos:
    ├── project_team (profissionais)
    └── project_equipment (equipamentos de fornecedores)
```

### 2. Migrations a Criar:

**011_create_event_projects.sql:**
- Criar tabela `event_projects`
- Criar tabela `project_team` (profissionais alocados)
- Criar tabela `project_equipment` (equipamentos solicitados)
- Criar tabela `supplier_quotations` (cotações de fornecedores)
- Migrar dados de `contractor_requests` → `event_projects`
- Triggers para calcular totais automaticamente
- Views otimizadas para listagens

### 3. Types TypeScript a Criar:

**src/types/event-project.ts:**
- `EventProject` - Entidade principal
- `ProjectTeamMember` - Profissional no projeto
- `ProjectEquipment` - Equipamento solicitado
- `SupplierQuotation` - Cotação de fornecedor
- Helpers de cálculo de margem e lucro

### 4. APIs a Criar/Refatorar:

**Novas APIs:**
- `POST /api/admin/event-projects` - Criar projeto
- `GET /api/admin/event-projects` - Listar projetos
- `GET /api/admin/event-projects/[id]` - Detalhes completos
- `PATCH /api/admin/event-projects/[id]` - Atualizar
- `POST /api/admin/event-projects/[id]/team/add` - Adicionar profissional
- `POST /api/admin/event-projects/[id]/equipment/request-quotes` - Solicitar cotações
- `GET /api/admin/event-projects/[id]/financials` - Cálculos financeiros

**Refatorar:**
- `contractor_requests` → Redirecionar para `event_projects`

### 5. Frontend a Criar:

**Nova estrutura:**
- `/admin/projetos` - Lista de todos os projetos
- `/admin/projetos/novo` - Criar projeto (form unificado)
- `/admin/projetos/[id]` - Visão completa do projeto:
  - Tab: Informações do Cliente/Evento
  - Tab: Equipe (profissionais)
  - Tab: Equipamentos (cotações)
  - Tab: Financeiro (custos, preços, margem)
  - Tab: Cronograma/Status

### 6. Formulário Público Unificado:

**Cliente preenche UMA VEZ:**
- Dados do evento (data, local, tipo)
- O que precisa:
  - [ ] Profissionais (quais, quantos)
  - [ ] Equipamentos (quais, quantos)
  - [ ] Serviços adicionais
- Urgência do projeto

---

## 🗑️ ARQUIVOS QUE SERÃO DELETADOS/DEPRECIADOS

### Deletar:
- `src/app/admin/orcamentos/*` (substituído por projetos)
- `src/app/api/admin/quotes/*` (substituído por event-projects)
- `src/types/quote.ts` (substituído por event-project.ts)
- `supabase/migrations/010_create_quote_system.sql` (não será executada)

### Depreciar (manter por compatibilidade):
- `contractor_requests` → Migrar dados para `event_projects`
- APIs antigas de requests → Redirecionar para novas

---

## ✅ CHECKLIST ANTES DE COMMITAR REFATORAÇÃO

Antes de fazer commit da refatoração, verificar:

- [ ] Migration 011 testada localmente
- [ ] Dados migrados de `contractor_requests` sem perda
- [ ] Todas as APIs novas funcionando
- [ ] Frontend novo carrega sem erros
- [ ] Cálculos de margem (35%/80%) corretos
- [ ] Emails funcionando (templates atualizados)
- [ ] Build passa sem erros (`npm run build`)
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Visual pattern mantido (zinc + vermelho)

---

## 🔍 COMO VERIFICAR SE DEU CERTO

### Teste Manual:
1. Admin cria novo projeto de evento
2. Adiciona profissionais da base
3. Solicita cotações de equipamentos para fornecedores
4. Fornecedores recebem email
5. Admin vê cotações recebidas
6. Admin monta proposta completa
7. Cálculo de lucro total aparece correto (35% ou 80%)
8. Cliente pode visualizar proposta

### Teste de Dados:
```sql
-- Verificar migração
SELECT COUNT(*) FROM contractor_requests; -- Antigo
SELECT COUNT(*) FROM event_projects; -- Novo (deve ter mesmo número)

-- Verificar integridade
SELECT * FROM event_projects WHERE id NOT IN (
  SELECT DISTINCT project_id FROM project_team
  UNION
  SELECT DISTINCT project_id FROM project_equipment
);
-- Deve retornar vazio ou apenas projetos draft
```

---

## 📞 PONTOS DE DECISÃO DURANTE REFATORAÇÃO

Se encontrar esses cenários, PARAR e decidir:

### 1. Dados Existentes em Produção?
- **SIM** → Criar migration de dados mais cuidadosa
- **NÃO** → Pode recriar tabelas do zero

### 2. Usuários Já Usando o Sistema?
- **SIM** → Manter compatibilidade com rotas antigas
- **NÃO** → Pode quebrar tudo e refazer

### 3. Tempo Disponível?
- **< 1 semana** → Considerar Opção B (integração gradual)
- **> 1 semana** → Seguir com Opção A (refatoração completa)

### 4. Dúvidas de Negócio?
- Parar e perguntar antes de codificar errado!

---

## 🚨 SE DER MUITO ERRADO

### Emergency Rollback:
```bash
# 1. Voltar para commit seguro
cd "C:\Users\erick\HRX_OP\hrx"
git reset --hard 46cb28ef

# 2. Forçar push (CUIDADO - só se não tiver outras pessoas usando)
git push --force

# 3. Limpar arquivos não rastreados
git clean -fd

# 4. Reinstalar dependências
npm install

# 5. Testar build
npm run build
```

### Recovery Checklist:
- [ ] Código voltou para commit 46cb28ef
- [ ] Build passa (`npm run build`)
- [ ] Servidor sobe (`npm run dev`)
- [ ] Admin consegue fazer login
- [ ] Páginas principais carregam
- [ ] Banco de dados não foi corrompido

---

## 📝 NOTAS IMPORTANTES

1. **SEMPRE** testar migration em banco local antes de produção
2. **SEMPRE** fazer backup do banco antes de migration em produção
3. **SEMPRE** testar rollback da migration antes de aplicar
4. **NUNCA** commitar código que não compila
5. **NUNCA** fazer push --force se outras pessoas estão trabalhando no repo

---

## 🎯 EXPECTATIVA DE SUCESSO

**Tempo estimado:** 1-2 semanas
**Complexidade:** Alta
**Risco:** Médio (temos restore point)
**Benefício:** Arquitetura sólida, escalável, sem dívida técnica

**Vale a pena?** ✅ SIM - É o core business da HRX!

---

**Data de Criação:** 2025-10-22
**Próxima Revisão:** Ao terminar refatoração
**Deletar Este Arquivo:** Após confirmar que refatoração deu certo (1 semana de uso sem problemas)
