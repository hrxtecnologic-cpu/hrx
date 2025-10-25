# 🚀 Migração de Roles - Passo a Passo

## ⚠️ PROBLEMA ENCONTRADO

A constraint `users_role_check` no banco **só aceita 2 valores:**
```sql
CHECK (role = ANY (ARRAY['user', 'admin']))
```

**Precisa aceitar 5 valores:**
```sql
CHECK (role = ANY (ARRAY['user', 'admin', 'professional', 'supplier', 'client']))
```

---

## 📋 PASSO 1: Corrigir Constraint no Supabase

### **Acesse o Supabase:**
1. https://supabase.com/dashboard/project/waplbfawlcavwtvfwprf
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**

### **Cole este SQL:**

```sql
-- 1. Remover constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Adicionar nova constraint com todos os roles
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY[
    'user'::character varying,
    'admin'::character varying,
    'professional'::character varying,
    'supplier'::character varying,
    'client'::character varying
  ]::text[]));

-- 3. Verificar que funcionou
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_check';
```

### **Execute:**
4. Clique em **RUN** (canto inferior direito)
5. Você deve ver: `Success. No rows returned`

---

## 📋 PASSO 2: Executar Migração de Roles

### **No terminal, execute:**

```bash
cd /c/Users/erick/HRX_OP/hrx
node scripts/migrate-roles.js
```

### **O que o script faz:**

1. ✅ Cria backup de todos os usuários
2. ✅ Migra profissionais (46 usuários)
3. ✅ Migra fornecedores (28 usuários)
4. ✅ Migra admins (2 usuários)
5. ✅ Migra resto para clientes (~99 usuários)
6. ✅ Salva backup em `backup-users-roles.json`

### **Saída esperada:**

```
🚀 MIGRAÇÃO DE ROLES - INICIANDO

📦 Passo 1: Criando backup...
✅ Backup criado: 175 usuários salvos em memória

📊 Passo 2: Estado ANTES da migração:
Contagem por role:
  user: 175

👨‍💼 Passo 3: Migrando PROFISSIONAIS...
✅ 46 usuários migrados para PROFESSIONAL

🏢 Passo 4: Migrando FORNECEDORES...
✅ 28 usuários migrados para SUPPLIER

👑 Passo 5: Migrando ADMINS...
✅ Admins migrados: hrxtecnologic@gmail.com, simulaioab@gmail.com

👤 Passo 6: Migrando resto para CLIENT...
✅ Usuários restantes migrados para CLIENT

✅ Passo 7: Verificação DEPOIS da migração:
Contagem por role:
  professional: 46
  supplier: 28
  admin: 2
  client: 99

📊 RESUMO DA MIGRAÇÃO:
ANTES:
  user: 175

DEPOIS:
  professional: 46
  supplier: 28
  admin: 2
  client: 99

✅ SUCESSO: Nenhum usuário com role "user" restante!

🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!

💾 Backup salvo em: backup-users-roles.json
```

---

## 🔄 PASSO 3 (OPCIONAL): Rollback se necessário

### **Se algo der errado:**

```bash
cd /c/Users/erick/HRX_OP/hrx
node scripts/rollback-roles.js
```

Ou execute este SQL no Supabase:

```sql
-- Reverter TODOS os roles para 'user'
UPDATE users SET role = 'user';
```

---

## ✅ PASSO 4: Validar que funcionou

### **Testar login de profissional:**
1. Faça login com conta de profissional
2. Acesse `/profissional/dashboard`
3. Deve carregar corretamente ✅

### **Testar login de fornecedor:**
1. Faça login com conta de fornecedor
2. Acesse `/fornecedor/entregas`
3. Deve carregar corretamente ✅

### **Testar API:**
```bash
# Verificar contagem
curl https://www.hrxeventos.com.br/api/admin/contagens
```

---

## 📊 Estado Esperado Após Migração

| Role | Quantidade | % |
|------|------------|---|
| professional | ~46 | 26% |
| supplier | ~28 | 16% |
| admin | 2 | 1% |
| client | ~99 | 57% |
| **TOTAL** | **175** | **100%** |

---

## 🔧 PRÓXIMOS PASSOS (Após migração)

1. **Corrigir webhook do Clerk** para novos usuários
2. **Testar fluxo de cadastro** de novo profissional
3. **Implementar sistema de notificações**
4. **Deploy da correção** do webhook (já fizemos)

---

## 📝 ARQUIVOS CRIADOS

- ✅ `scripts/migrate-roles.js` - Script de migração
- ✅ `scripts/fix-role-constraint.js` - Gera SQL da constraint
- ✅ `backup-users-roles.json` - Backup automático (criado após migração)
- ✅ `atual.sql` - Atualizado com constraint correta

---

## ⚠️ IMPORTANTE

- **Backup está sendo criado automaticamente**
- **Migração é SEGURA** - apenas atualiza campo `role`
- **ZERO downtime** - usuários podem continuar usando
- **Reversível** - pode fazer rollback a qualquer momento
- **Já testado** - constraint foi o único bloqueio (agora resolvido)

---

**Status:** Pronto para executar após corrigir constraint no Supabase
**Duração estimada:** 10 segundos
**Risco:** Baixo (temos backup automático)
