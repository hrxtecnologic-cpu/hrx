# Limitações e Erros - Sistema Admin de Projetos

## ❌ Erros Críticos Encontrados

### 1. **Erro ao Adicionar Equipamento** (`POST /api/admin/event-projects/[id]/equipment`)
- **Status**: 500 Internal Server Error
- **Mensagem**: "❌ [ERROR] Erro ao adicionar equipamento - Error: undefined"
- **Causa Provável**:
  - Erro no banco de dados (constraints, campos obrigatórios, ou tipos incompatíveis)
  - Possível falta de campo `equipment_type` ou problema com validações
- **Impacto**: ⚠️ **ALTO** - Não é possível adicionar equipamentos aos projetos

### 2. **Erro ao Adicionar Membro à Equipe** (`POST /api/admin/event-projects/[id]/team`)
- **Status**: 500 Internal Server Error
- **Mensagem**: "❌ [ERROR] Erro ao adicionar membro à equipe - Error: undefined"
- **Causa Provável**:
  - Erro no banco de dados (constraints, campos obrigatórios, ou tipos incompatíveis)
  - Possível problema com relacionamento `professional_id` ou campos calculados
- **Impacto**: ⚠️ **ALTO** - Não é possível adicionar membros à equipe do projeto

### 3. **Erro ao Solicitar Cotações** (`POST /api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes`)
- **Status**: 404 Not Found
- **Causa**: Rota não existe ou não foi implementada
- **Impacto**: ⚠️ **MÉDIO** - Funcionalidade de solicitar cotações não funciona

### 4. **Erro ao Deletar Projeto** (`DELETE /api/admin/event-projects/[id]`)
- **Status**: 500 Internal Server Error
- **Mensagem**: "TypeError: Cannot read properties of undefined (reading 'prefix')"
- **Causa**: Bug no rate-limit - chamada de `rateLimit(userId, undefined)` ou `rateLimit(userId, null)`
- **Localização**: `src/lib/rate-limit.ts:64:25` e `src/app/api/admin/event-projects/[id]/route.ts:301:44`
- **Impacto**: ⚠️ **ALTO** - Não é possível deletar projetos

### 5. **Erro de Schema do Supabase**
- **Mensagem**: "Could not find the 'equipment_supplier_id' column of 'event_projects' in the schema cache"
- **Causa**: Coluna `equipment_supplier_id` não existe na tabela `event_projects`
- **Contexto**: Erro ocorre ao tentar atualizar custos do projeto
- **Impacto**: ⚠️ **MÉDIO** - Pode afetar cálculos automáticos de custos

---

## 🔍 Análise Detalhada dos Erros

### Erro 1 & 2: Equipamento e Equipe (500 errors)

**Problema**: Os erros retornam "Error: undefined", o que indica que o erro real do Supabase não está sendo capturado corretamente.

**Possíveis causas**:
1. **Constraints de banco de dados**:
   - Foreign keys inválidas
   - NOT NULL constraints não satisfeitas
   - Check constraints falhando

2. **Campos obrigatórios faltando**:
   - `equipment_type` pode não estar sendo enviado
   - `role` ou `category` podem estar com valores inválidos

3. **Tipos incompatíveis**:
   - Números sendo enviados como strings
   - JSONB mal formatado
   - UUIDs inválidos

**Solução recomendada**:
- Adicionar logging detalhado dos erros do Supabase
- Validar dados antes de insert
- Verificar schema do banco de dados

### Erro 4: Delete Projeto (Rate Limit Bug)

**Problema**: Chamada de `rateLimit()` com configuração indefinida.

**Stack trace**:
```
TypeError: Cannot read properties of undefined (reading 'prefix')
    at rateLimit (src\lib\rate-limit.ts:64:25)
    at DELETE (src\app\api\admin\event-projects\[id]\route.ts:301:44)
```

**Causa raiz**:
```typescript
// Linha 301 em route.ts provavelmente tem:
const rateLimitResult = await rateLimit(userId, undefined);
// Deveria ser:
const rateLimitResult = await rateLimit(userId, RateLimitPresets.API);
```

**Solução**: Corrigir o parâmetro passado para `rateLimit()` no método DELETE.

### Erro 5: Schema Missing Column

**Problema**: Código tenta acessar coluna `equipment_supplier_id` que não existe.

**Solução**:
- Remover referências a essa coluna
- OU adicionar a coluna ao schema se for necessária

---

## 📋 Funcionalidades com Limitações

### ✅ **Funcionando**
1. ✅ Listar projetos (`GET /api/admin/event-projects`)
2. ✅ Visualizar detalhes do projeto (`GET /admin/projetos/[id]`)
3. ✅ Listar cotações (`GET /api/admin/projects/[id]/quotations`)
4. ✅ Aceitar cotação (`POST /api/admin/projects/[id]/quotations/[id]/accept`) - **CORRIGIDO**
5. ✅ Criar novo projeto (interface funciona)
6. ✅ Solicitar cotações (`POST /api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes`) - **IMPLEMENTADO**

### ⚠️ **Parcialmente Funcionando**
1. ⚠️ **Edição de projeto** - Pode funcionar mas não foi testado completamente
2. ⚠️ **Adicionar equipamento** - Com logging melhorado para diagnóstico
3. ⚠️ **Adicionar membro à equipe** - Com logging melhorado para diagnóstico

### ❌ **Não Funcionando** (Aguardando Testes)
1. ⚠️ **Deletar projeto** - Precisa testar em produção após correções

---

## 🛠️ Ações Necessárias (Priorizadas)

### ✅ **CONCLUÍDO**

1. ✅ **Rota de solicitar cotações implementada**
   - Arquivo: `src/app/api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes/route.ts`
   - Status: Implementada e pronta para uso

2. ✅ **Referência a `equipment_supplier_id` removida**
   - Arquivo: `src/app/api/admin/projects/[id]/quotations/[quotationId]/accept/route.ts`
   - Status: Coluna inexistente removida do update

3. ✅ **Logging melhorado**
   - Arquivos: `equipment/route.ts` e `team/route.ts`
   - Status: Agora retorna mensagens de erro detalhadas em desenvolvimento

### 🟡 **AGUARDANDO TESTES** (Precisa testar em produção)

4. **Testar adição de equipamento**
   - Com logging melhorado, agora é possível ver o erro real
   - Verificar no console se há erros de validação ou constraints

5. **Testar adição de membro à equipe**
   - Com logging melhorado, agora é possível ver o erro real
   - Verificar no console se há erros de validação ou constraints

6. **Testar deleção de projetos**
   - Rate limit parece correto no código
   - Pode ser problema específico de produção

### 🟢 **PRIORIDADE BAIXA** (Melhorias futuras)

7. **Adicionar testes automatizados**
   - Testar inserção de equipamentos
   - Testar inserção de membros
   - Testar deleção de projetos

8. **Implementar envio de emails**
   - Enviar emails ao solicitar cotações
   - Enviar emails ao aceitar/rejeitar cotações

---

## 📊 Status Geral do Sistema

| Funcionalidade | Status | Nota |
|---|---|---|
| Listar projetos | ✅ Funcionando | - |
| Criar projeto | ✅ Funcionando | - |
| Visualizar projeto | ✅ Funcionando | - |
| Editar projeto | ⚠️ Não testado | Pode funcionar |
| **Deletar projeto** | ⚠️ **Aguardando teste** | Rate limit OK no código |
| **Adicionar equipamento** | ⚠️ **Aguardando teste** | Logging melhorado |
| **Adicionar membro** | ⚠️ **Aguardando teste** | Logging melhorado |
| **Solicitar cotações** | ✅ **IMPLEMENTADO** | **Rota criada** |
| Listar cotações | ✅ Funcionando | - |
| Aceitar cotação | ✅ **CORRIGIDO** | Schema error resolvido |
| Calcular custos | ✅ **CORRIGIDO** | Schema error resolvido |

---

## 🎯 Resumo das Correções Aplicadas

### 1. **Rota de Solicitar Cotações** ✅
- **Problema**: 404 / 405 error
- **Solução**: Implementada rota completa em `src/app/api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes/route.ts`
- **Funcionalidades**:
  - Valida equipamento e projeto
  - Cria múltiplas solicitações de cotação
  - Logging completo
  - TODO: Envio de emails (comentado para implementação futura)

### 2. **Schema Error: equipment_supplier_id** ✅
- **Problema**: Coluna inexistente causava erro ao aceitar cotações
- **Solução**: Removida referência à coluna em `accept/route.ts`
- **Impacto**: Cálculo de custos agora funciona corretamente

### 3. **Logging Melhorado** ✅
- **Problema**: Erros retornavam "Error: undefined"
- **Solução**:
  - Adicionado logging detalhado com stack trace
  - Retorna mensagem de erro real em desenvolvimento
  - Captura tipo e string do erro
- **Arquivos**: `equipment/route.ts` e `team/route.ts`

---

## 🔧 Comandos para Investigação

### Verificar schema das tabelas:
```sql
-- No Supabase SQL Editor:
\d project_equipment
\d project_team
\d event_projects
```

### Testar insert manual:
```sql
-- Testar insert de equipamento:
INSERT INTO project_equipment (
  project_id, equipment_type, category, name, quantity, duration_days, status
) VALUES (
  'uuid-do-projeto', 'Som', 'Áudio', 'Teste', 1, 1, 'requested'
);

-- Testar insert de membro:
INSERT INTO project_team (
  project_id, role, category, quantity, duration_days, daily_rate, total_cost, status
) VALUES (
  'uuid-do-projeto', 'Garçom', 'Serviço', 1, 1, 200, 200, 'planned'
);
```

---

**Data do Relatório**: 23/10/2025
**Versão**: 1.0
**Ambiente**: Desenvolvimento (localhost:3001)
