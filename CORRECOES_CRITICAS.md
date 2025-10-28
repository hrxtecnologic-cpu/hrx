# 🔥 CORREÇÕES CRÍTICAS - HRX EVENTOS

**Data:** 2025-10-28
**Status:** IMPLEMENTAÇÃO EM ANDAMENTO
**Prioridade:** CRÍTICA

---

## ✅ JÁ IMPLEMENTADO

### 1. Proteção da Rota `/supplier` ✅
**Arquivo:** `src/middleware.ts:36`
**Mudança:**
```typescript
const isDashboardRoute = createRouteMatcher([
  '/dashboard/profissional(.*)',
  '/dashboard/contratante(.*)',
  '/supplier(.*)', // ← ADICIONADO
]);
```
**Status:** ✅ CONCLUÍDO

### 2. Hook de Auto-Save Criado ✅
**Arquivo:** `src/hooks/useFormAutoSave.ts` (NOVO)
**Recursos:**
- Debounce de 2 segundos
- Toast de confirmação
- Save antes de fechar página
- Verifica idade do rascunho
- Carrega/limpa rascunho

**Status:** ✅ CONCLUÍDO

### 3. Componente de Banner de Rascunho ✅
**Arquivo:** `src/components/FormDraftManager.tsx` (NOVO)
**Recursos:**
- Banner bonito para restaurar rascunho
- Mostra idade do rascunho
- Botão para descartar

**Status:** ✅ CONCLUÍDO

---

## 🚧 PRÓXIMAS IMPLEMENTAÇÕES NECESSÁRIAS

### 4. Integrar Auto-Save no Wizard de Fornecedor

**Arquivo:** `src/app/solicitar-evento-wizard/page.tsx`

**ADICIONAR no início do componente (após imports):**
```typescript
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { FormDraftManager } from '@/components/FormDraftManager';
```

**ADICIONAR dentro do componente `SolicitarEventoWizardPage` (após o `form` ser criado):**
```typescript
// Auto-save para supplier
const supplierAutoSave = useFormAutoSave({
  storageKey: mode === 'edit' ? 'wizard-supplier-edit' : 'wizard-supplier-new',
  data: supplierFormData, // ou o estado que armazena os dados
  debounceMs: 2000,
  showToast: true,
  enabled: wizardType === 'supplier', // só salva quando é fornecedor
});

// Auto-save para client
const clientAutoSave = useFormAutoSave({
  storageKey: mode === 'edit' ? 'wizard-client-edit' : 'wizard-client-new',
  data: clientFormData, // ou o estado que armazena os dados
  debounceMs: 2000,
  showToast: true,
  enabled: wizardType === 'client', // só salva quando é cliente
});
```

**ENVOLVER o formulário com FormDraftManager:**
```typescript
return (
  <FormDraftManager
    storageKey={wizardType === 'supplier' ? 'wizard-supplier-new' : 'wizard-client-new'}
    onLoadDraft={(draft) => {
      // Restaurar dados do formulário
      if (wizardType === 'supplier') {
        form.reset(draft); // se usando react-hook-form
        // ou setSupplierFormData(draft); se usando useState
      } else {
        form.reset(draft);
      }
    }}
  >
    {/* conteúdo do formulário atual */}
  </FormDraftManager>
);
```

**LIMPAR rascunho após submit bem-sucedido:**
```typescript
const onSubmit = async (data) => {
  try {
    await api.post('/api/public/event-requests', data);

    // Limpar rascunho após sucesso
    if (wizardType === 'supplier') {
      supplierAutoSave.clearDraft();
    } else {
      clientAutoSave.clearDraft();
    }

    router.push('/sucesso');
  } catch (error) {
    // Não limpa rascunho se der erro
  }
};
```

---

### 5. Adicionar LocationPicker no Cadastro de Fornecedor

**Arquivo:** `src/app/solicitar-evento-wizard/page.tsx`

**PROBLEMA:** Fornecedores não têm mapa para selecionar localização (lat/lng ficam NULL)

**SOLUÇÃO:** Adicionar novo step ou adicionar no Step 0 (Empresa)

**OPÇÃO A - Adicionar no Step 0 (Empresa):**

Localizar a seção de Step 0 e adicionar ANTES dos botões de navegação:

```typescript
{currentStep === 0 && wizardType === 'supplier' && (
  <>
    {/* Campos existentes: company_name, legal_name, cnpj, contact_name, email, phone */}

    {/* ADICIONAR AQUI: */}
    <div className="space-y-4 pt-6 border-t border-zinc-800">
      <h3 className="text-lg font-semibold text-white">
        📍 Localização da Empresa
      </h3>
      <p className="text-sm text-zinc-400">
        Selecione a localização para que clientes próximos encontrem você
      </p>

      <LocationPicker
        value={{
          address: form.watch('address') || '',
          city: form.watch('city') || '',
          state: form.watch('state') || '',
          zipCode: form.watch('zipCode') || '',
          latitude: form.watch('latitude') || 0,
          longitude: form.watch('longitude') || 0,
        }}
        onChange={(location) => {
          form.setValue('address', location.address);
          form.setValue('city', location.city);
          form.setValue('state', location.state);
          form.setValue('zipCode', location.zipCode || '');
          form.setValue('latitude', location.latitude);
          form.setValue('longitude', location.longitude);
        }}
      />
    </div>
  </>
)}
```

**ADICIONAR campos no schema do fornecedor:**
```typescript
const supplierRequestSchema = z.object({
  // ... campos existentes
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
```

**ADICIONAR campos no payload da API:**
```typescript
const payload = {
  // ... campos existentes
  address: data.address,
  city: data.city,
  state: data.state,
  zip_code: data.zipCode,
  latitude: data.latitude,
  longitude: data.longitude,
};
```

**ATUALIZAR API:** `src/app/api/public/event-requests/route.ts`

Adicionar no insert do equipment_suppliers (linha ~120):
```typescript
const { data: supplier, error: supplierError } = await supabase
  .from('equipment_suppliers')
  .insert([
    {
      // ... campos existentes
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zip_code || null,
      latitude: latitude || null,
      longitude: longitude || null,
    },
  ])
```

---

### 6. Corrigir Redirect do Dashboard do Fornecedor

**Arquivo:** `src/app/supplier/dashboard/page.tsx`

**PROBLEMA ATUAL (linha ~36):**
```typescript
if (!supplier) {
  return NextResponse.json({ error: '...' }, { status: 404 }); // ❌ ERRADO
}
```

**CORREÇÃO:**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function SupplierDashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplier() {
      if (!isLoaded || !user) return;

      try {
        const res = await fetch('/api/supplier/dashboard');
        const data = await res.json();

        if (res.status === 404) {
          // Fornecedor não existe, redirecionar para cadastro
          router.push('/solicitar-evento-wizard?type=supplier');
          return;
        }

        if (!res.ok) {
          throw new Error(data.error);
        }

        setSupplier(data.supplier);
      } catch (error) {
        console.error('Erro ao carregar fornecedor:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSupplier();
  }, [isLoaded, user, router]);

  if (loading) {
    return <LoadingSpinner />; // ou skeleton
  }

  if (!supplier) {
    return null; // já redirecionou
  }

  return (
    // ... dashboard UI
  );
}
```

---

### 7. Corrigir Botão "Editar Perfil"

**Arquivo:** `src/app/supplier/dashboard/page.tsx` (linha ~147)

**MUDAR DE:**
```typescript
<Link href="/solicitar-evento-wizard?type=supplier&edit=true">
```

**PARA:**
```typescript
<Link href={`/solicitar-evento-wizard?type=supplier&edit=true&id=${supplier.id}`}>
```

**OU MELHOR:** Criar rota dedicada `/supplier/perfil`:

```typescript
<Link href="/supplier/perfil">
  <Button variant="outline">Editar Perfil</Button>
</Link>
```

E criar arquivo: `src/app/supplier/perfil/page.tsx` com form simplificado.

---

### 8. Adicionar Migration para Campos de Localização

**Arquivo:** `supabase/migrations/037_add_location_to_suppliers.sql` (NOVO)

```sql
-- Migration: Adicionar campos de localização em equipment_suppliers
-- Data: 2025-10-28
-- Descrição: Adiciona address, city, state, zip_code se não existirem

ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS state VARCHAR(2);

ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- Latitude e longitude já existem da migration 015
-- Mas verificar se existem:
-- latitude DECIMAL(10, 8)
-- longitude DECIMAL(11, 8)

COMMENT ON COLUMN equipment_suppliers.address IS 'Endereço completo da empresa';
COMMENT ON COLUMN equipment_suppliers.city IS 'Cidade da empresa';
COMMENT ON COLUMN equipment_suppliers.state IS 'Estado (UF) da empresa';
COMMENT ON COLUMN equipment_suppliers.zip_code IS 'CEP da empresa';
```

**EXECUTAR NO SUPABASE SQL EDITOR**

---

### 9. Remover console.log de Produção

**CRÍTICO:** 67+ ocorrências em 18 arquivos

**SOLUÇÃO AUTOMÁTICA:**

Criar arquivo `src/lib/logger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level: LogLevel;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${ctx} ${message}`;
  }

  debug(message: string, data?: any, context?: string) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context), data || '');
    }
  }

  info(message: string, data?: any, context?: string) {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context), data || '');
    }
  }

  warn(message: string, data?: any, context?: string) {
    console.warn(this.formatMessage('warn', message, context), data || '');
  }

  error(message: string, error?: any, context?: string) {
    console.error(this.formatMessage('error', message, context), error || '');
    // TODO: Enviar para Sentry em produção
  }
}

export const logger = new Logger();
```

**SUBSTITUIR EM TODOS OS ARQUIVOS:**

❌ Antes:
```typescript
console.log('Usuário criado:', user);
```

✅ Depois:
```typescript
import { logger } from '@/lib/logger';
logger.debug('Usuário criado', { user }, 'auth');
```

**AUTOMATIZAR COM SCRIPT:**

Criar `scripts/replace-console-log.js`:

```javascript
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const hasConsolelog = content.includes('console.log');

  if (hasConsolelog) {
    // Adicionar import se não tiver
    if (!content.includes("from '@/lib/logger'")) {
      content = "import { logger } from '@/lib/logger';\n" + content;
    }

    // Substituir console.log
    content = content.replace(
      /console\.log\((.*?)\);/g,
      "logger.debug($1);"
    );

    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
  }
});
```

Rodar: `node scripts/replace-console-log.js`

---

### 10. Habilitar RLS no Supabase (CRÍTICO 🔒)

**ARQUIVO:** `supabase/migrations/038_enable_rls_with_policies.sql` (NOVO)

```sql
-- Migration: Habilitar RLS e criar políticas de segurança
-- Data: 2025-10-28
-- Descrição: CRÍTICO - Protege dados de usuários

-- ========== HABILITAR RLS ==========

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_projects ENABLE ROW LEVEL SECURITY;

-- ========== POLÍTICAS PARA USERS ==========

-- Usuário pode ver apenas seus próprios dados
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (clerk_id = auth.jwt()->>'sub');

-- Usuário pode atualizar apenas seus próprios dados
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (clerk_id = auth.jwt()->>'sub');

-- ========== POLÍTICAS PARA PROFESSIONALS ==========

-- Profissional pode ver apenas seu próprio perfil
CREATE POLICY "professionals_select_own" ON professionals
  FOR SELECT
  USING (clerk_id = auth.jwt()->>'sub');

-- Profissional pode atualizar apenas seu próprio perfil
CREATE POLICY "professionals_update_own" ON professionals
  FOR UPDATE
  USING (clerk_id = auth.jwt()->>'sub');

-- Admin pode ver todos
CREATE POLICY "professionals_select_admin" ON professionals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt()->>'sub'
      AND users.is_admin = true
    )
  );

-- ========== POLÍTICAS PARA SUPPLIERS ==========

-- Fornecedor pode ver apenas seu próprio perfil
CREATE POLICY "suppliers_select_own" ON equipment_suppliers
  FOR SELECT
  USING (clerk_id = auth.jwt()->>'sub');

-- Fornecedor pode atualizar apenas seu próprio perfil
CREATE POLICY "suppliers_update_own" ON equipment_suppliers
  FOR UPDATE
  USING (clerk_id = auth.jwt()->>'sub');

-- Admin pode ver todos
CREATE POLICY "suppliers_select_admin" ON equipment_suppliers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt()->>'sub'
      AND users.is_admin = true
    )
  );

-- ========== POLÍTICAS PARA EVENT_PROJECTS ==========

-- Criador pode ver seus próprios projetos
CREATE POLICY "projects_select_own" ON event_projects
  FOR SELECT
  USING (created_by = auth.jwt()->>'sub');

-- Admin pode ver todos
CREATE POLICY "projects_select_admin" ON event_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt()->>'sub'
      AND users.is_admin = true
    )
  );

-- Service role pode fazer tudo (para APIs internas)
-- (já tem acesso via service_role key)
```

**⚠️ ATENÇÃO:** Após aplicar esta migration, TESTAR TUDO!

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

- [x] 1. Proteger rota /supplier no middleware
- [x] 2. Criar hook useFormAutoSave
- [x] 3. Criar componente FormDraftManager
- [ ] 4. Integrar auto-save no wizard (fornecedor e cliente)
- [ ] 5. Adicionar LocationPicker no cadastro de fornecedor
- [ ] 6. Corrigir redirect do dashboard
- [ ] 7. Corrigir botão "Editar Perfil"
- [ ] 8. Aplicar migration 037 (location fields)
- [ ] 9. Substituir console.log por logger
- [ ] 10. Aplicar migration 038 (RLS)

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

1. **HOJE (CRÍTICO):**
   - Aplicar migrations 036, 037, 038 no Supabase
   - Integrar auto-save no wizard (item 4)
   - Adicionar LocationPicker no fornecedor (item 5)

2. **ESTA SEMANA:**
   - Corrigir redirect e botão editar (itens 6, 7)
   - Substituir console.log (item 9)

3. **PRÓXIMA SEMANA:**
   - Testar RLS extensivamente
   - Adicionar testes E2E
   - Monitoramento com Sentry

---

## 📞 DÚVIDAS?

Se precisar de ajuda para implementar qualquer item, pergunte!
