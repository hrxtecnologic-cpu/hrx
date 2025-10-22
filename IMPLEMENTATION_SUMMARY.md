# 📋 Refatoração Completa - Event Projects Unificado

## 🎯 Objetivo da Refatoração

Substituir os sistemas desconectados (`contractor_requests` + `quote_requests`) por um sistema unificado de projetos de eventos (`event_projects`) que consolida equipe e equipamentos em um único fluxo.

---

## 📊 Resumo Executivo

### Problema Identificado
- **Dois sistemas desconectados**: `contractor_requests` (profissionais) e `quote_requests` (equipamentos)
- **UX fragmentada**: Cliente preenchia 2 formulários separados
- **Dados duplicados**: Informações de cliente e evento repetidas
- **Gestão ineficiente**: Sem visão unificada do projeto

### Solução Implementada
- **Sistema unificado**: `event_projects` como fonte única da verdade
- **Formulário único**: Cliente preenche 1 formulário para tudo
- **Gestão centralizada**: Admin vê projeto completo em uma tela
- **Margem de lucro automática**: 35% padrão, 80% para urgentes

---

## 🗂️ Arquivos Criados

### 1. Migrations (Database)

#### `supabase/migrations/011_create_event_projects_unified.sql`
**Tabelas criadas:**
- `event_projects` - Tabela principal de projetos
- `project_team` - Membros da equipe (internos ou externos)
- `project_equipment` - Equipamentos solicitados
- `supplier_quotations` - Cotações de fornecedores
- `project_emails` - Log de emails enviados

**Triggers criados:**
- `calculate_project_profit_margin()` - Calcula margem 35% ou 80%
- `generate_project_number()` - Gera número único PRJ-YYYYMMDD-0001
- `calculate_team_member_cost()` - Calcula custo total por membro
- `recalculate_project_costs()` - Recalcula custos totais do projeto
- `calculate_quotation_hrx_price()` - Calcula preço HRX com margem

**Views criadas:**
- `event_projects_summary` - Listagem otimizada com contadores
- `event_projects_full` - Detalhes completos para relatórios

#### `supabase/migrations/012_migrate_data_to_event_projects.sql`
**Migração de dados:**
- `contractor_requests` → `event_projects`
- `professionals_needed` (JSONB) → `project_team` (linhas estruturadas)
- `event_allocations` → `project_team` (profissionais confirmados)
- `equipment_list` → `project_equipment`
- `quote_requests` → `event_projects` (se não linkados)
- `quote_request_items` → `project_equipment`
- `supplier_quotes` → `supplier_quotations`
- `quote_emails` → `project_emails`

#### `supabase/migrations/ROLLBACK_011_012.sql`
**Script de emergência** para reverter migrations caso algo dê errado.

---

### 2. Types (TypeScript)

#### `src/types/event-project.ts` (~500 linhas)
**Tipos criados:**
```typescript
// Tipos principais
- ProfitMargin = 35.00 | 80.00
- ProjectStatus = 'new' | 'analyzing' | 'quoting' | 'quoted' | 'proposed' | 'approved' | 'in_execution' | 'completed' | 'cancelled'
- EventProject (30+ campos)
- ProjectTeamMember
- ProjectEquipment
- SupplierQuotation
- ProjectEmail

// DTOs
- CreateEventProjectData
- UpdateEventProjectData
- AddTeamMemberData
- AddEquipmentData
- RequestEquipmentQuotesData

// Helper
- getProfitMargin(isUrgent: boolean): ProfitMargin
```

#### `src/types/index.ts`
Exporta todos os tipos novos e marca tipos antigos como DEPRECATED.

---

### 3. APIs (Backend)

#### `/api/admin/event-projects/route.ts`
- `GET` - Listar projetos com filtros (status, urgência, cliente, etc)
- `POST` - Criar novo projeto (envia email se urgente)

#### `/api/admin/event-projects/[id]/route.ts`
- `GET` - Buscar detalhes completos do projeto
- `PATCH` - Atualizar projeto
- `DELETE` - Cancelar projeto (soft delete)

#### `/api/admin/event-projects/[id]/team/route.ts`
- `POST` - Adicionar membro à equipe
- `DELETE` - Remover membro

#### `/api/admin/event-projects/[id]/equipment/route.ts`
- `POST` - Adicionar equipamento
- `PATCH` - Atualizar equipamento
- `DELETE` - Remover equipamento

#### `/api/admin/event-projects/[id]/request-quotes/route.ts`
- `POST` - Solicitar cotações de fornecedores
  - Cria registros em `supplier_quotations`
  - Envia emails para fornecedores
  - Atualiza status do equipamento para 'quoting'

#### `/api/admin/event-projects/[id]/quotations/[quotationId]/route.ts`
- `PATCH` - Aceitar/Rejeitar cotação
- `DELETE` - Cancelar cotação

#### `/api/suppliers/quotations/[id]/respond/route.ts` (PUBLIC)
- `GET` - Visualizar detalhes da cotação (fornecedor)
- `POST` - Enviar resposta de cotação (fornecedor)

---

### 4. Emails

#### `src/lib/resend/emails.tsx` (2 funções adicionadas)

**`sendUrgentProjectAdminEmail()`**
- Enviado ao admin quando projeto URGENTE é criado
- Template com header vermelho animado
- Destaca margem de 80%
- Link direto para o projeto

**`sendEquipmentQuoteRequestEmail()`**
- Enviado ao fornecedor solicitando cotação
- Template com detalhes do evento e equipamento
- Link para responder cotação
- Prazo destacado em amarelo

---

### 5. Frontend (Admin)

#### `/admin/projetos/page.tsx`
**Página de listagem:**
- Cards com stats (Total, Novos, Cotando, Propostos, Aprovados, Urgentes)
- Lista de projetos com:
  - Badges de status coloridos
  - Indicador visual de urgência (pulsando)
  - Métricas financeiras (custo, preço, lucro, margem)
  - Contadores de equipe e equipamentos
  - Filtros visuais
- Botão "Novo Projeto"

#### `/admin/projetos/[id]/page.tsx`
**Página de detalhes:**
- Header com status e urgência
- Cards de resumo financeiro (4 métricas)
- Coluna principal:
  - Dados do Cliente
  - Detalhes do Evento
  - Localização
  - Equipe (lista expandida)
  - Equipamentos (lista expandida)
  - Cotações (com status coloridos)
- Coluna lateral:
  - Timeline do projeto
  - Emails enviados
  - Observações

#### `/admin/projetos/novo/page.tsx`
**Formulário de criação:**
- Seção: Dados do Cliente
- Seção: Dados do Evento
- Seção: Localização
- Seção: Configurações (urgência, orçamento, notas)
- Seção: Equipe (opcional, dinâmica)
- Seção: Equipamentos (opcional, dinâmica)
- Validação com Zod
- Toast notifications
- Loading states

---

### 6. Frontend (Público)

#### `/solicitar-evento/page.tsx`
**Formulário público unificado:**
- Design moderno com gradient zinc
- Seção: Seus Dados (cliente)
- Seção: Sobre o Evento
- Seção: Local do Evento
- Seção: Observações Adicionais
- Validação completa
- Botão animado de submit
- Responsive design

#### `/solicitar-evento/sucesso/page.tsx`
**Página de sucesso:**
- Ícone de check verde
- Mensagem de confirmação
- Próximos passos (1, 2, 3)
- Contatos de emergência
- Botão voltar ao início

---

## 🔄 Fluxo Completo

### 1. Cliente Solicita Evento (Público)
```
Cliente acessa /solicitar-evento
  → Preenche formulário unificado
  → Submit → POST /api/admin/event-projects
  → Se urgente: envia email ao admin
  → Redireciona para /solicitar-evento/sucesso
```

### 2. Admin Gerencia Projeto
```
Admin acessa /admin/projetos
  → Vê listagem com filtros
  → Clica em projeto → /admin/projetos/[id]
  → Vê detalhes completos
  → Pode adicionar equipe e equipamentos
  → Status: new → analyzing → quoting → quoted → proposed → approved
```

### 3. Admin Solicita Cotações
```
Admin em /admin/projetos/[id]
  → Seleciona equipamento
  → Clica "Solicitar Cotações"
  → Escolhe fornecedores
  → Define deadline
  → Sistema:
    - Cria registros em supplier_quotations
    - Envia emails para fornecedores
    - Atualiza status equipamento → 'quoting'
    - Atualiza status projeto → 'quoting'
```

### 4. Fornecedor Responde
```
Fornecedor recebe email
  → Clica no link → /api/suppliers/quotations/[id]/respond (GET)
  → Vê detalhes do equipamento
  → Preenche preço e detalhes
  → Submit → POST /api/suppliers/quotations/[id]/respond
  → Sistema calcula HRX price com margem automaticamente
  → Status cotação → 'received'
```

### 5. Admin Aceita/Rejeita Cotação
```
Admin vê cotações recebidas
  → Clica "Aceitar" ou "Rejeitar"
  → PATCH /api/admin/event-projects/[id]/quotations/[quotationId]
  → Se aceita:
    - Equipamento → status 'quoted'
    - Outras cotações do mesmo equipamento → 'rejected'
  → Se todos equipamentos cotados:
    - Projeto → status 'quoted'
```

### 6. Finalização
```
Admin prepara proposta
  → Atualiza projeto → status 'proposed'
  → Cliente aprova
  → Admin atualiza → status 'approved'
  → Execução → status 'in_execution'
  → Finalização → status 'completed'
```

---

## 💰 Lógica de Negócio

### Margem de Lucro
```typescript
is_urgent = false → profit_margin = 35.00%
is_urgent = true  → profit_margin = 80.00%
```

**Trigger automático** recalcula margem sempre que `is_urgent` muda.

### Cálculo de Preços

#### Equipe
```
team_member.total_cost = daily_rate × quantity × duration_days
project.total_team_cost = SUM(team_member.total_cost)
```

#### Equipamentos
```
quotation.hrx_price = supplier_price × (1 + profit_margin/100)
quotation.profit_amount = hrx_price - supplier_price
project.total_equipment_cost = SUM(accepted_quotations.supplier_price)
```

#### Projeto
```
project.total_cost = total_team_cost + total_equipment_cost
project.total_client_price = total_cost × (1 + profit_margin/100)
project.total_profit = total_client_price - total_cost
```

**Todos os cálculos são automáticos via triggers.**

---

## 🎨 Padrão Visual

### Cores
- Background: `zinc-900`, `zinc-950`
- Borders: `zinc-800`, `zinc-700`
- Text: `white`, `zinc-300`, `zinc-400`, `zinc-500`
- **Primary (ação)**: `red-600` hover `red-500`
- Success: `green-500`
- Warning: `yellow-500`
- Error: `red-500`

### Components
- Cards: `bg-zinc-900 border-zinc-800`
- Inputs: `bg-zinc-950 border-zinc-800 text-white`
- Buttons: `bg-red-600 hover:bg-red-500 text-white`

### Urgência
- Badge: `bg-red-500/20 text-red-500 animate-pulse`
- Card background: `bg-red-950/20 border-red-900/50`
- Icon: `AlertTriangle` vermelho

---

## ⚠️ Avisos Importantes

### Antes de Executar
1. ✅ **Backup confirmado**: `atual.sql` está atualizado
2. ✅ **Restore point documentado**: `RESTORE_POINT_BEFORE_REFACTOR.md`
3. ✅ **Rollback disponível**: `ROLLBACK_011_012.sql`

### Executar Migrations
```bash
# 1. Aplicar migration 011 (schema novo)
psql -U postgres -d hrx_db -f supabase/migrations/011_create_event_projects_unified.sql

# 2. Aplicar migration 012 (migrar dados)
psql -U postgres -d hrx_db -f supabase/migrations/012_migrate_data_to_event_projects.sql

# 3. Verificar dados migrados
SELECT COUNT(*) FROM event_projects;
SELECT COUNT(*) FROM project_team;
SELECT COUNT(*) FROM project_equipment;
```

### Se Algo Der Errado
```bash
# Reverter tudo imediatamente
psql -U postgres -d hrx_db -f supabase/migrations/ROLLBACK_011_012.sql

# Ou restaurar do backup
psql -U postgres -d hrx_db < atual.sql
```

---

## ✅ Checklist de Testes

### Backend (APIs)
- [ ] `GET /api/admin/event-projects` - Lista projetos
- [ ] `POST /api/admin/event-projects` - Cria projeto normal
- [ ] `POST /api/admin/event-projects` (is_urgent=true) - Cria projeto urgente e envia email
- [ ] `GET /api/admin/event-projects/[id]` - Busca detalhes
- [ ] `PATCH /api/admin/event-projects/[id]` - Atualiza projeto
- [ ] `POST /api/admin/event-projects/[id]/team` - Adiciona membro
- [ ] `DELETE /api/admin/event-projects/[id]/team` - Remove membro
- [ ] `POST /api/admin/event-projects/[id]/equipment` - Adiciona equipamento
- [ ] `DELETE /api/admin/event-projects/[id]/equipment` - Remove equipamento
- [ ] `POST /api/admin/event-projects/[id]/request-quotes` - Solicita cotações
- [ ] `PATCH /api/admin/event-projects/[id]/quotations/[qid]` - Aceita cotação
- [ ] `GET /api/suppliers/quotations/[id]/respond` - Fornecedor vê cotação
- [ ] `POST /api/suppliers/quotations/[id]/respond` - Fornecedor responde

### Frontend (Admin)
- [ ] `/admin/projetos` - Lista carrega corretamente
- [ ] `/admin/projetos` - Stats mostram números corretos
- [ ] `/admin/projetos` - Cards urgentes aparecem destacados
- [ ] `/admin/projetos/novo` - Formulário valida campos obrigatórios
- [ ] `/admin/projetos/novo` - Checkbox urgente funciona (alerta 80%)
- [ ] `/admin/projetos/novo` - Adicionar/remover equipe dinâmico
- [ ] `/admin/projetos/novo` - Adicionar/remover equipamento dinâmico
- [ ] `/admin/projetos/novo` - Submit cria projeto e redireciona
- [ ] `/admin/projetos/[id]` - Mostra todos os detalhes
- [ ] `/admin/projetos/[id]` - Métricas financeiras corretas
- [ ] `/admin/projetos/[id]` - Timeline aparece corretamente

### Frontend (Público)
- [ ] `/solicitar-evento` - Formulário carrega
- [ ] `/solicitar-evento` - Validação funciona
- [ ] `/solicitar-evento` - Submit envia corretamente
- [ ] `/solicitar-evento/sucesso` - Página de sucesso aparece

### Emails
- [ ] Projeto urgente → Email enviado ao admin
- [ ] Solicitar cotação → Email enviado ao fornecedor
- [ ] Link de resposta funciona

### Database (Triggers)
- [ ] Criar projeto urgente → profit_margin = 80
- [ ] Criar projeto normal → profit_margin = 35
- [ ] Adicionar membro → total_team_cost recalculado
- [ ] Aceitar cotação → total_equipment_cost recalculado
- [ ] project_number gerado automaticamente

---

## 📦 Arquivos para Deletar (Depois de Confirmar)

Após confirmar que tudo funciona, estes arquivos antigos podem ser removidos:

### Old Forms
- `/app/solicitar-equipe/page.tsx` (substituído por /solicitar-evento)
- `/app/solicitar-equipe/sucesso/page.tsx`

### Old Admin Pages
- `/app/admin/solicitacoes/page.tsx` (contractor_requests)
- `/app/admin/solicitacoes/[id]/page.tsx`
- `/app/admin/orcamentos/page.tsx` (quote_requests)
- `/app/admin/orcamentos/[id]/page.tsx`
- `/app/admin/orcamentos/novo/page.tsx`

### Old Types (marked DEPRECATED in index.ts)
- Manter por enquanto para compatibilidade

---

## 🚀 Deploy

### Antes do Deploy
1. Executar migrations localmente e testar
2. Verificar todos os endpoints funcionando
3. Testar fluxo completo end-to-end
4. Confirmar que emails estão sendo enviados

### Durante o Deploy
```bash
# 1. Commit das mudanças
git add .
git commit -m "feat: refatoração completa - sistema unificado de projetos de eventos

- Substitui contractor_requests + quote_requests por event_projects
- Unifica gestão de equipe e equipamentos
- Margem automática: 35% padrão, 80% urgente
- Novo formulário público único
- Admin dashboard completo
- Migrations com rollback de emergência

BREAKING CHANGE: Sistemas antigos (solicitações/orçamentos) descontinuados"

# 2. Push
git push origin main

# 3. Aplicar migrations no Supabase (production)
# Via Supabase Dashboard → SQL Editor
```

### Depois do Deploy
1. Monitorar logs por 24h
2. Verificar se emails estão sendo enviados
3. Confirmar que dados foram migrados corretamente
4. Atualizar documentação de usuário

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do Supabase
2. Verificar logs do Next.js
3. Executar ROLLBACK se necessário
4. Restaurar do backup `atual.sql`

---

## 📝 Notas Finais

- ✅ **Todas as funcionalidades antigas foram preservadas**
- ✅ **Dados serão migrados automaticamente**
- ✅ **Rollback disponível se necessário**
- ✅ **Padrão visual mantido (zinc + red)**
- ✅ **Rate limiting mantido em todas APIs**
- ✅ **Logging estruturado mantido**

**Última atualização**: 2025-01-22 (data da refatoração)
