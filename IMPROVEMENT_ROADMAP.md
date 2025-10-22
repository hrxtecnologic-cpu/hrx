# 🚀 Plano de Melhorias - HRX Platform

> **Status:** Em Progresso
> **Última Atualização:** 2025-10-21

Este documento organiza todas as melhorias identificadas na auditoria do código, priorizadas por impacto e esforço.

---

## 📊 Resumo Executivo

| Prioridade | Quantidade | Esforço Total | Status |
|-----------|------------|---------------|---------|
| 🔴 Crítico | 3 tarefas | 1-2 dias | 0% completo |
| 🟡 Alto | 4 tarefas | 3-4 dias | 0% completo |
| 🟢 Médio | 5 tarefas | 1-2 semanas | 0% completo |
| ⚪ Baixo | 4 tarefas | Backlog | 0% completo |

---

## 🔴 CRÍTICO - Fazer AGORA (1-2 dias)

### 1. Corrigir Campos Fantasma no Código

**Problema:** Campos usados no código que não existem no banco de dados

**Arquivos Afetados:**
- `src/app/api/professional/profile/route.ts` (linha 71, 110) - usa `gender`
- Migrations antigas - definem `bio`

**Ação:**
```typescript
// ❌ REMOVER de /api/professional/profile/route.ts
const { gender, ... } = body;

.update({
  gender,  // ❌ REMOVER - não existe no banco
  ...
})
```

**Estimativa:** 30 minutos

**✅ Feito:** [ ]

---

### 2. Padronizar Campos de Validade de Documentos

**Problema:** Inconsistência entre camelCase e snake_case

**Mudança:**
```typescript
// ANTES (inconsistente):
const [cnhValidity, setCnhValidity] = useState('');  // camelCase
formData.append('cnh_validity', cnhValidity);        // snake_case

// DEPOIS (consistente):
const [cnhValidity, setCnhValidity] = useState('');  // camelCase
formData.append('cnhValidity', cnhValidity);         // camelCase
```

**Criar helper:** `src/lib/mappers/professional.ts`
- `professionalFromDatabase()` - converte snake_case → camelCase
- `professionalToDatabase()` - converte camelCase → snake_case

**Arquivos a Modificar:**
- `src/app/cadastro-profissional/page.tsx`
- `src/app/api/professionals/route.ts`
- `src/app/api/professional/profile/route.ts`

**Estimativa:** 2 horas

**✅ Feito:** [ ]

---

### 3. Limpar Schemas Duplicados/Conflitantes

**Problema:** Múltiplas versões de migrations causando confusão

**Ação:**
```bash
# Renomear arquivos obsoletos
cd supabase/migrations
mv 001_create_all_tables.sql OBSOLETE_001_create_all_tables.sql.bak
mv FINAL_CREATE_ALL.sql OBSOLETE_FINAL_CREATE_ALL.sql.bak

# Criar documentação canônica
# Arquivo: DATABASE_SCHEMA.md
```

**Criar:** `DATABASE_SCHEMA.md` com schema oficial

**Estimativa:** 1 hora

**✅ Feito:** [ ]

---

## 🟡 ALTO - Próximas 2 Semanas (3-4 dias)

### 4. Criar Types TypeScript Compartilhados

**Criar arquivo:** `src/types/professional.ts`

**Conteúdo:**
- `interface Professional` - modelo completo
- `type ProfessionalStatus` - union types
- `type DocumentType` - tipos de documentos
- `interface DocumentValidation`
- `interface Availability`

**Benefício:** Type safety em todo o projeto

**Estimativa:** 3 horas

**✅ Feito:** [ ]

---

### 5. Eliminar Uso de 'any'

**Meta:** Zero `any` no projeto

**Arquivos Prioritários:**
1. `src/app/cadastro-profissional/page.tsx`
2. `src/app/api/professionals/route.ts`
3. `src/app/api/admin/professionals/[id]/documents/route.ts`

**Estratégia:**
```typescript
// ANTES:
const [data, setData] = useState<any>(null);

// DEPOIS:
import { Professional } from '@/types/professional';
const [data, setData] = useState<Professional | null>(null);
```

**Estimativa:** 4 horas

**✅ Feito:** [ ]

---

### 6. Padronizar Respostas da API

**Criar:** `src/lib/api-response.ts`

**Implementar:**
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

function successResponse<T>(data: T, message?: string): NextResponse
function errorResponse(error: string, status?: number): NextResponse
```

**Migrar TODAS as rotas para usar:**
- `/api/professionals`
- `/api/professional/profile`
- `/api/admin/**`

**Estimativa:** 6 horas

**✅ Feito:** [ ]

---

### 7. Substituir console.log por Logger

**Já existe:** `src/lib/logger.ts`

**Ação:** Substituir todos `console.log/error/warn` por:
```typescript
import { logger } from '@/lib/logger';

logger.info('Professional created', { professionalId });
logger.debug('Documents received', { count });
logger.error('Failed to create', error);
```

**Arquivos:**
- `src/app/api/professionals/route.ts`
- `src/app/api/admin/**/*.ts`
- Todos os route handlers

**Estimativa:** 4 horas

**✅ Feito:** [ ]

---

## 🟢 MÉDIO - Próximo Mês (1-2 semanas)

### 8. Refatorar Estrutura de Rotas da API

**Problema:** Rotas duplicadas e inconsistentes

**Mudança:**

```
ANTES:
/api/professionals (POST - criar + atualizar)
/api/professional/profile (GET/PATCH)

DEPOIS:
/api/professionals (POST - criar apenas)
/api/professional/profile (GET/PATCH - próprio perfil)
/api/admin/professionals/[id] (GET/PATCH/DELETE - admin)
```

**Estimativa:** 1 dia

**✅ Feito:** [ ]

---

### 9. Sistema Robusto de Validação de Documentos

**Criar:** `src/lib/validations/documents.ts`

**Implementar:**
```typescript
const documentRequirements = {
  'Motorista': {
    required: ['rg_front', 'rg_back', 'cpf', 'proof_of_address', 'cnh_photo'],
    fields: ['cnhNumber', 'cnhValidity']
  },
  // ... outras categorias
};

function validateDocumentsForCategories(
  categories: string[],
  documents: Record<string, string>
): ValidationResult
```

**Usar em:**
- Formulário de cadastro
- API de criação
- API de atualização

**Estimativa:** 1 dia

**✅ Feito:** [ ]

---

### 10. Implementar Testes Automatizados

**Criar:**
- `__tests__/api/professionals.test.ts`
- `__tests__/lib/mappers.test.ts`
- `__tests__/lib/validators.test.ts`

**Framework:** Jest + Testing Library

**Cobertura Mínima:** 60%

**Estimativa:** 3 dias

**✅ Feito:** [ ]

---

### 11. Implementar TODOs Pendentes

**TODOs Encontrados:**

1. `src/app/api/admin/event-types/[id]/route.ts:78`
   - Verificar se tipo de evento está em uso antes de deletar

2. `src/lib/logger.ts:132`
   - Integrar com Sentry

3. `src/lib/logger.ts:153`
   - Enviar alerta de segurança via Slack

4. `src/app/api/admin/requests/[id]/status/route.ts:58`
   - Enviar notificação ao cliente quando status mudar

**Estimativa:** 2 dias

**✅ Feito:** [ ]

---

### 12. Documentação de APIs

**Criar:** `API_DOCUMENTATION.md`

**Incluir:**
- Todos os endpoints
- Parâmetros
- Exemplos de request/response
- Códigos de erro
- Rate limits

**Estimativa:** 2 dias

**✅ Feito:** [ ]

---

## ⚪ BAIXO - Backlog

### 13. Otimização de Queries (Evitar N+1)

**Usar `.select()` com joins:**
```typescript
.select(`
  *,
  user:users!user_id(id, email, full_name),
  approved_by_user:users!approved_by(id, email, full_name)
`)
```

**Estimativa:** 1 dia

**✅ Feito:** [ ]

---

### 14. Migration Consolidada (Squash)

**Objetivo:** Consolidar todas as migrations em uma

**Benefício:** Setup mais rápido para novos ambientes

**Estimativa:** 1 dia

**✅ Feito:** [ ]

---

### 15. Geração Automática de Types do Supabase

**Comando:**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

**Benefício:** Types sempre sincronizados com banco

**Estimativa:** 2 horas

**✅ Feito:** [ ]

---

### 16. CI/CD com GitHub Actions

**Implementar:**
- Testes automáticos em PRs
- Lint + Type check
- Deploy automático em produção

**Estimativa:** 1 dia

**✅ Feito:** [ ]

---

## 📈 Progresso Geral

```
🔴 Crítico:  ░░░░░░░░░░ 0/3 (0%)
🟡 Alto:     ░░░░░░░░░░ 0/4 (0%)
🟢 Médio:    ░░░░░░░░░░ 0/5 (0%)
⚪ Baixo:    ░░░░░░░░░░ 0/4 (0%)

TOTAL:       ░░░░░░░░░░ 0/16 (0%)
```

---

## 🎯 Sprint Sugerido (Próximos 7 dias)

### Semana 1 - Quick Wins

| Dia | Tarefa | Tempo | Status |
|-----|--------|-------|---------|
| 1 | #1 - Remover campos fantasma | 0.5h | ⬜ |
| 1 | #2 - Padronizar campos de validade | 2h | ⬜ |
| 1 | #3 - Limpar schemas duplicados | 1h | ⬜ |
| 1 | #4 - Criar types compartilhados | 3h | ⬜ |
| 2-3 | #5 - Eliminar 'any' | 4h | ⬜ |
| 3-4 | #6 - Padronizar API responses | 6h | ⬜ |
| 5 | #7 - Migrar para logger | 4h | ⬜ |

**Total:** 20.5 horas (~3 dias úteis)

---

## 📝 Como Usar Este Documento

1. **Antes de começar uma tarefa:**
   - Marque `✅ Feito: [x]`
   - Crie uma branch: `git checkout -b improvement/task-number`

2. **Durante desenvolvimento:**
   - Siga o `CODING_STANDARDS.md`
   - Faça commits pequenos e frequentes
   - Teste localmente

3. **Ao finalizar:**
   - Atualizar progresso neste arquivo
   - Fazer PR com checklist do `CODING_STANDARDS.md`
   - Atualizar documentação se necessário

4. **Review:**
   - Outro dev revisa o PR
   - Verificar se segue padrões
   - Merge e deploy

---

## 📞 Dúvidas?

Se tiver dúvidas sobre alguma melhoria:
1. Consulte `CODING_STANDARDS.md`
2. Consulte relatório de auditoria
3. Pergunte no Slack/Discord do time

---

**Próxima revisão:** Semanal, toda segunda-feira
**Owner:** Equipe Dev HRX
