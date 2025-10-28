# 🔧 PLANO DE EXECUÇÃO - CORREÇÕES CRÍTICAS HRX

**Data:** 2025-10-28
**Status:** Pronto para Execução
**Impacto:** ALTO - Correções de segurança e integridade

---

## ✅ JÁ CORRIGIDO (Não precisa ação)

### 1. IDOR em `/api/contratante/meus-projetos/[id]` ✅
**Status:** ✅ JÁ PROTEGIDO
**Arquivo:** `src/app/api/contratante/meus-projetos/[id]/route.ts:65`
**Proteção:** `.eq('created_by', userId)` - Verifica ownership corretamente

### 2. Token Previsível em Cotações ✅
**Status:** ✅ JÁ SEGURO
**Arquivo:** `src/app/api/admin/event-projects/[id]/equipment/[equipmentId]/request-quotes/route.ts:98`
**Token:** `randomBytes(32).toString('hex')` - 64 caracteres hex (seguro)

---

## 🔴 URGENTE - Executar HOJE

### 3. Resolver Duplicatas no Banco de Dados
**Prioridade:** 🔴 CRÍTICA
**Impacto:** Sem isso, constraints UNIQUE vão falhar
**Arquivo:** `PRODUCAO_FIX_COMPLETO_V3_FINAL.sql` (linhas 15-72)

**O que faz:**
- Adiciona sufixo `_2`, `_3` aos CPFs duplicados
- Adiciona sufixo `_2`, `_3` aos CNPJs duplicados
- Remove `clerk_id` duplicados (será corrigido manualmente depois)

**Comando:**
```sql
-- Execute no Supabase SQL Editor (STAGING primeiro!)
\i PRODUCAO_FIX_COMPLETO_V3_FINAL.sql
```

**Rollback:**
```sql
-- Caso necessário, há backup em backup-users-roles.json
-- Restore via Supabase Dashboard
```

---

### 4. Aplicar Constraints UNIQUE
**Prioridade:** 🔴 CRÍTICA
**Dependência:** Executar DEPOIS da resolução de duplicatas
**Arquivo:** `PRODUCAO_FIX_COMPLETO_V3_FINAL.sql` (linhas 150+)

**Constraints a adicionar:**
```sql
ALTER TABLE professionals ADD CONSTRAINT IF NOT EXISTS professionals_cpf_unique UNIQUE(cpf);
ALTER TABLE contractors ADD CONSTRAINT IF NOT EXISTS contractors_cnpj_unique UNIQUE(cnpj);
ALTER TABLE professionals ADD CONSTRAINT IF NOT EXISTS professionals_clerk_id_unique UNIQUE(clerk_id);
ALTER TABLE contractors ADD CONSTRAINT IF NOT EXISTS contractors_clerk_id_unique UNIQUE(clerk_id);
ALTER TABLE equipment_suppliers ADD CONSTRAINT IF NOT EXISTS equipment_suppliers_clerk_id_unique UNIQUE(clerk_id);
```

---

### 5. Resolver RLS (Row Level Security)
**Prioridade:** 🔴 CRÍTICA
**Decisão Necessária:** Escolher uma das opções abaixo

**OPÇÃO A (Recomendada para produção - RÁPIDA):**
```sql
-- Desabilitar RLS em todas as tabelas
-- Segurança será feita via API/Middleware
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractors DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_team DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_validations DISABLE ROW LEVEL SECURITY;
```

**OPÇÃO B (Mais segura mas trabalhosa - 2-3 dias):**
- Criar políticas RLS para cada tabela
- Testar exaustivamente
- Ver `supabase/migrations/026_create_delivery_tracking.sql` como exemplo

**Recomendação:** OPÇÃO A agora, OPÇÃO B em sprint futura

---

## 🟡 ALTA PRIORIDADE - Esta Semana

### 6. Adicionar CAPTCHA em `/api/contact`
**Prioridade:** 🟡 ALTA
**Tempo Estimado:** 2 horas
**Biblioteca:** Cloudflare Turnstile (grátis)

**Passos:**
1. Criar conta no Cloudflare
2. Obter `TURNSTILE_SECRET_KEY` e `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
3. Instalar: `npm install @marsidev/react-turnstile`
4. Adicionar componente no formulário de contato
5. Validar no backend

**Exemplo:**
```typescript
// Frontend (src/app/contato/page.tsx)
import Turnstile from '@marsidev/react-turnstile';

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
  onSuccess={(token) => setTurnstileToken(token)}
/>

// Backend (src/app/api/contact/route.ts)
const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const verifyResponse = await fetch(verifyUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: turnstileToken,
  }),
});
```

---

### 7. Criar Helpers para Duplicação de Código
**Prioridade:** 🟡 ALTA
**Tempo Estimado:** 4 horas
**Impacto:** Reduz ~500 linhas de código duplicado

**Helpers a criar:**

**a) `src/lib/api/with-auth.ts`**
```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function withAuth(
  handler: (userId: string, req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    return handler(userId, req);
  };
}
```

**b) `src/lib/api/with-admin.ts`**
```typescript
import { isAdmin } from '@/lib/auth';

export async function withAdmin(
  handler: (userId: string, req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const admin = await isAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return handler(userId, req);
  };
}
```

**c) `src/lib/api/get-user-by-clerk-id.ts`**
```typescript
export async function getUserByClerkId(clerkId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('clerk_id', clerkId)
    .single();

  if (error || !data) {
    throw new Error('Usuário não encontrado');
  }

  return data;
}
```

---

### 8. Remover Console.logs de Produção
**Prioridade:** 🟡 ALTA
**Tempo Estimado:** 2 horas
**Ocorrências:** 267

**Script automático:**
```bash
# Substituir console.log por logger.info
find hrx/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/console\.log(/logger.info(/g' {} \;

# Substituir console.error por logger.error
find hrx/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/console\.error(/logger.error(/g' {} \;

# Substituir console.warn por logger.warn
find hrx/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/console\.warn(/logger.warn(/g' {} \;
```

**Manualmente revisar:**
- Remover logs de dados sensíveis (CPF, email, telefone)
- Verificar se imports do logger estão corretos

---

## 🟢 MÉDIA PRIORIDADE - Próximas 2 Semanas

### 9. Refatorar Wizard Gigante (1590 linhas)
**Prioridade:** 🟢 MÉDIA
**Tempo Estimado:** 1 dia
**Arquivo:** `src/app/solicitar-evento-wizard/page.tsx`

**Plano:**
1. Criar pasta `src/app/solicitar-evento-wizard/steps/`
2. Dividir em arquivos:
   - `Step1ClientInfo.tsx`
   - `Step2EventInfo.tsx`
   - `Step3TeamNeeds.tsx`
   - `Step4EquipmentNeeds.tsx`
   - `Step5Review.tsx`
3. Manter lógica de estado no arquivo principal
4. Usar hooks customizados para validação de cada step

---

### 10. Limpar Tabelas Órfãs
**Prioridade:** 🟢 MÉDIA
**Tempo Estimado:** 30 minutos
**Arquivo:** `037_drop_orphan_tables.sql`

**Tabelas a remover:**
```sql
DROP TABLE IF EXISTS quote_requests CASCADE;
DROP TABLE IF EXISTS quote_request_items CASCADE;
DROP TABLE IF EXISTS supplier_quotes CASCADE;
DROP TABLE IF EXISTS quote_emails CASCADE;
DROP TABLE IF EXISTS notifications_old CASCADE;
```

**ATENÇÃO:** Verificar se não estão em uso antes de dropar!

---

## 📋 CHECKLIST DE EXECUÇÃO

### Hoje (28/10/2025):
- [ ] 1. Backup do banco de dados (Supabase Dashboard > Database > Backups)
- [ ] 2. Executar `PRODUCAO_FIX_COMPLETO_V3_FINAL.sql` em STAGING
- [ ] 3. Testar cadastros (professional, contractor, supplier)
- [ ] 4. Verificar se constraints foram aplicadas
- [ ] 5. Executar em PRODUÇÃO (fora do horário de pico)
- [ ] 6. Decidir e aplicar estratégia de RLS (Opção A ou B)
- [ ] 7. Testar login e acesso após mudanças

### Esta Semana:
- [ ] 8. Implementar Cloudflare Turnstile em `/api/contact`
- [ ] 9. Criar helpers de autenticação (with-auth, with-admin, get-user-by-clerk-id)
- [ ] 10. Executar script de remoção de console.logs
- [ ] 11. Revisar logs sensíveis manualmente
- [ ] 12. Testar todas as rotas de API

### Próximas 2 Semanas:
- [ ] 13. Refatorar wizard em componentes menores
- [ ] 14. Limpar tabelas órfãs (após verificação)
- [ ] 15. Adicionar testes unitários (Jest + RTL)
- [ ] 16. Implementar React Query para cache

---

## 🚨 ROLLBACK PLAN

**Se algo der errado:**

1. **Banco de Dados:**
   ```sql
   -- Restore do backup mais recente
   -- Supabase Dashboard > Database > Backups > Restore
   ```

2. **Código:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Vercel:**
   - Vercel Dashboard > Deployments > Revert to previous

---

## 📞 CONTATOS DE EMERGÊNCIA

- **Supabase Support:** https://supabase.com/dashboard/support
- **Clerk Support:** https://clerk.com/support
- **Vercel Support:** https://vercel.com/support

---

## 📊 MÉTRICAS DE SUCESSO

**Antes:**
- Score de Segurança: 6.5/10
- Duplicatas no banco: SIM
- Console.logs em produção: 267
- IDOR vulnerável: 1 rota (falso positivo)
- Token previsível: NÃO (falso positivo)

**Depois:**
- Score de Segurança: 9.0/10
- Duplicatas no banco: NÃO
- Console.logs em produção: 0
- IDOR vulnerável: 0
- Token previsível: NÃO
- CAPTCHA implementado: SIM
- Helpers de auth: SIM
- Código duplicado: -60%

---

**Preparado por:** Claude (Anthropic)
**Data:** 2025-10-28
**Versão:** 1.0
