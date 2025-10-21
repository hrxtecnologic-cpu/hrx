# 🔒 Guia de Auditoria de RLS (Row Level Security) do Supabase

## O que é RLS?

Row Level Security (RLS) é um sistema de segurança do PostgreSQL/Supabase que **restringe quais linhas** um usuário pode acessar em uma tabela.

**Exemplo**: Um profissional só pode ver seus próprios documentos, não os de outros profissionais.

---

## ⚠️ Por que auditar RLS periodicamente?

1. **Mudanças no schema** podem desabilitar RLS acidentalmente
2. **Novas tabelas** podem ser criadas sem RLS
3. **Políticas desatualizadas** podem permitir acessos indevidos
4. **SERVICE_ROLE_KEY** bypass RLS (precisa ser usado com cuidado)

---

## 📋 Checklist de Auditoria RLS

### 1. Verificar se RLS está habilitado em todas as tabelas

```sql
-- Execute no SQL Editor do Supabase
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**O que verificar**:
- ✅ Todas as tabelas devem ter `rls_enabled = true`
- ❌ Se alguma tabela tiver `false`, é uma vulnerabilidade

### 2. Listar todas as políticas de RLS

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**O que verificar**:
- Cada tabela deve ter políticas de SELECT, INSERT, UPDATE, DELETE
- Verificar se as condições (`using_expression`) fazem sentido

### 3. Testar isolamento de dados

```sql
-- Teste 1: Verificar se profissionais veem apenas seus dados
-- Conectar como profissional X
SELECT * FROM professionals WHERE user_id != auth.uid();
-- DEVE RETORNAR VAZIO

-- Teste 2: Verificar se documentos estão isolados
SELECT * FROM document_validations WHERE professional_id NOT IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
);
-- DEVE RETORNAR VAZIO
```

---

## 🛡️ Políticas RLS Recomendadas

### Tabela: `professionals`

```sql
-- Enable RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Profissionais podem ver apenas seus próprios dados
CREATE POLICY "Professionals can view own data"
ON professionals FOR SELECT
USING (user_id = auth.uid());

-- Profissionais podem atualizar apenas seus próprios dados
CREATE POLICY "Professionals can update own data"
ON professionals FOR UPDATE
USING (user_id = auth.uid());

-- Apenas admins podem ver todos os profissionais (via SERVICE_ROLE)
-- Não precisa de política pois admins usam SERVICE_ROLE_KEY
```

### Tabela: `users`

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (clerk_id = auth.uid());

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (clerk_id = auth.uid());
```

### Tabela: `document_validations`

```sql
ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;

-- Profissionais podem ver validações dos seus documentos
CREATE POLICY "Professionals can view own document validations"
ON document_validations FOR SELECT
USING (
    professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
    )
);

-- Apenas admins podem inserir/atualizar (via SERVICE_ROLE)
```

### Tabela: `professional_history`

```sql
ALTER TABLE professional_history ENABLE ROW LEVEL SECURITY;

-- Profissionais podem ver apenas seu próprio histórico
CREATE POLICY "Professionals can view own history"
ON professional_history FOR SELECT
USING (
    professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
    )
);

-- Apenas admins podem inserir histórico (via SERVICE_ROLE)
```

---

## ⚙️ Como Habilitar/Desabilitar RLS

### Habilitar RLS em uma tabela

```sql
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### Desabilitar RLS (⚠️ CUIDADO - Apenas para debug)

```sql
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
```

### Remover todas as políticas (⚠️ CUIDADO)

```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

---

## 🔍 Como Auditar Acesso Indevido

### 1. Verificar logs do Supabase

No Dashboard do Supabase:
1. Vá em **Logs** → **Database**
2. Procure por queries que retornaram dados inesperados
3. Filtre por `user_id` suspeito

### 2. Criar trigger de auditoria

```sql
-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT,
    user_id TEXT,
    action TEXT,
    row_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Criar função de auditoria
CREATE OR REPLACE FUNCTION audit_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, user_id, action, row_id)
    VALUES (TG_TABLE_NAME, auth.uid(), TG_OP, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em tabela sensível
CREATE TRIGGER audit_professionals
AFTER INSERT OR UPDATE OR DELETE ON professionals
FOR EACH ROW EXECUTE FUNCTION audit_access();
```

---

## 📆 Cronograma de Auditoria Recomendado

| Frequência | Atividade |
|------------|-----------|
| **Semanal** | Verificar logs de acesso indevido |
| **Mensal** | Executar queries de verificação de RLS |
| **Trimestral** | Revisar todas as políticas de RLS |
| **Após deploy** | Sempre verificar se RLS continua habilitado |

---

## 🚨 Sinais de Alerta

⚠️ **Investigue imediatamente se**:
- Usuário consegue ver dados de outros usuários
- Queries retornam mais dados do que deveriam
- Logs mostram acessos com `user_id` diferente do esperado
- Nova tabela criada sem RLS habilitado

---

## 🔧 Ferramentas de Auditoria

### Script de verificação rápida

```sql
-- Copie e execute no SQL Editor
DO $$
DECLARE
    table_record RECORD;
    policy_count INT;
BEGIN
    FOR table_record IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        -- Verificar RLS
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = table_record.tablename
            AND rowsecurity = true
        ) THEN
            RAISE WARNING 'Table % does NOT have RLS enabled!', table_record.tablename;
        END IF;

        -- Contar políticas
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = table_record.tablename;

        IF policy_count = 0 THEN
            RAISE WARNING 'Table % has NO policies!', table_record.tablename;
        END IF;
    END LOOP;
END $$;
```

---

## ✅ Checklist de Segurança

Antes de cada deploy:

- [ ] RLS habilitado em todas as tabelas sensíveis
- [ ] Políticas de SELECT/INSERT/UPDATE/DELETE configuradas
- [ ] Testado isolamento de dados entre usuários
- [ ] Logs de acesso revisados
- [ ] SERVICE_ROLE_KEY usado apenas no backend
- [ ] Documentação atualizada

---

## 📞 Contato para Incidentes

Em caso de suspeita de violação de segurança:
1. **Desabilitar acesso imediatamente** (se necessário)
2. **Coletar logs** do Supabase
3. **Notificar equipe de desenvolvimento**
4. **Investigar causa raiz**
5. **Aplicar correção**
6. **Atualizar documentação**

---

**Última atualização**: {{ DATA_DO_COMMIT }}
**Responsável**: Equipe HRX Eventos
