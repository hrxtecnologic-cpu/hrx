# ✅ CHECKLIST DE TESTES PÓS-AUDITORIA
**Data:** 24 de Outubro de 2025
**Objetivo:** Validar correções da migration 028

---

## 🔐 1. TESTES DE AUTENTICAÇÃO

### Teste 1.1: Cadastro de Fornecedor
- [ ] Acessar `/onboarding`
- [ ] Clicar em "Sou Fornecedor"
- [ ] Verificar que redireciona para `/solicitar-evento`
- [ ] Escolher "Fornecedor" na tela de seleção
- [ ] Preencher formulário completo
- [ ] Submeter formulário
- [ ] **Verificar:** Deve salvar com `clerk_id` no banco
- [ ] **Verificar:** Redireciona para `/solicitar-evento/sucesso-fornecedor`
- [ ] Clicar em "Acessar Meu Dashboard"
- [ ] **Verificar:** Dashboard carrega dados corretamente (não retorna 404)

**SQL para verificar:**
```sql
SELECT id, company_name, email, clerk_id, created_at
FROM equipment_suppliers
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:** `clerk_id` deve estar preenchido (não NULL)

---

### Teste 1.2: Cadastro de Contractor
- [ ] Fazer logout (se estiver logado)
- [ ] Tentar acessar `/api/contractors` via Postman/Insomnia
- [ ] **Verificar:** Deve retornar 401 "Autenticação necessária"
- [ ] Fazer login
- [ ] Acessar `/cadastrar-contratante`
- [ ] Preencher formulário
- [ ] Submeter
- [ ] **Verificar:** Deve salvar com `clerk_id` no banco
- [ ] **Verificar:** Não permite criar segundo contractor com mesmo clerk_id

**SQL para verificar:**
```sql
SELECT id, company_name, cnpj, clerk_id, created_at
FROM contractors
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:** `clerk_id` deve estar preenchido

---

### Teste 1.3: Cadastro de Profissional (Validar UNIQUE)
- [ ] Fazer login com conta nova
- [ ] Acessar `/onboarding` → "Sou Profissional"
- [ ] Preencher `/cadastro-profissional`
- [ ] Submeter
- [ ] **Verificar:** Salva com `clerk_id` no banco
- [ ] Tentar criar SEGUNDO profissional com MESMA conta (via API)
- [ ] **Verificar:** Deve FALHAR com erro de UNIQUE constraint

**SQL para verificar UNIQUE:**
```sql
SELECT clerk_id, COUNT(*)
FROM professionals
WHERE clerk_id IS NOT NULL
GROUP BY clerk_id
HAVING COUNT(*) > 1;
```

**Resultado esperado:** Nenhuma linha retornada (sem duplicatas)

---

## 📊 2. TESTES DE DADOS

### Teste 2.1: user_type em users
- [ ] Criar usuário tipo 'supplier'
- [ ] **Verificar:** `users.user_type = 'supplier'` salva sem erro

**SQL para testar:**
```sql
-- Verificar constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_user_type_check';

-- Deve retornar constraint com 'supplier' e 'admin'
```

**Resultado esperado:** Constraint aceita: `'professional'`, `'contractor'`, `'supplier'`, `'admin'`

---

### Teste 2.2: Notificações para Fornecedor
- [ ] Criar fornecedor
- [ ] Admin criar projeto e solicitar cotação
- [ ] **Verificar:** Notificação criada para fornecedor
- [ ] **Verificar:** `notifications.user_type = 'supplier'` salva sem erro

**SQL para verificar:**
```sql
SELECT id, user_type, professional_id, supplier_id, created_at
FROM notifications
WHERE user_type = 'supplier'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🎯 3. TESTES DE DASHBOARD

### Teste 3.1: Dashboard de Fornecedor
- [ ] Login como fornecedor
- [ ] Acessar `/supplier/dashboard`
- [ ] **Verificar:** Dashboard carrega corretamente
- [ ] **Verificar:** Mostra dados do fornecedor (nome, email, equipamentos)
- [ ] **Verificar:** Mostra cotações pendentes (se houver)

**Esperado:** Não retorna 404 "Fornecedor não encontrado"

---

### Teste 3.2: Dashboard de Profissional
- [ ] Login como profissional
- [ ] Acessar `/dashboard/profissional`
- [ ] **Verificar:** Dashboard carrega
- [ ] **Verificar:** Busca por `clerk_id` funciona corretamente

---

### Teste 3.3: Dashboard de Contratante
- [ ] Login como contractor
- [ ] Acessar `/dashboard/contratante`
- [ ] **Verificar:** Dashboard carrega
- [ ] **Verificar:** Mostra projetos do contratante

**Nota:** Verificar se busca por `clerk_id` ou `user_id`

---

## 🔍 4. TESTES DE ÍNDICES

### Teste 4.1: Verificar índices criados
**SQL:**
```sql
-- Verificar índices em contractors
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'contractors'
  AND indexname LIKE '%clerk_id%';

-- Verificar índices em equipment_suppliers
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'equipment_suppliers'
  AND indexname LIKE '%clerk_id%';

-- Verificar índice UNIQUE em professionals
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'professionals'
  AND indexname LIKE '%clerk_id%';
```

**Resultado esperado:**
- `idx_contractors_clerk_id` ✅
- `idx_equipment_suppliers_clerk_id` ✅
- `professionals_clerk_id_unique` ✅

---

### Teste 4.2: Verificar índices em FKs
**SQL:**
```sql
-- event_projects.equipment_supplier_id
SELECT indexname FROM pg_indexes
WHERE tablename = 'event_projects'
  AND indexname = 'idx_event_projects_equipment_supplier_id';

-- project_team.professional_id
SELECT indexname FROM pg_indexes
WHERE tablename = 'project_team'
  AND indexname = 'idx_project_team_professional_id';

-- notifications.professional_id
SELECT indexname FROM pg_indexes
WHERE tablename = 'notifications'
  AND indexname = 'idx_notifications_professional_id';

-- notifications.supplier_id
SELECT indexname FROM pg_indexes
WHERE tablename = 'notifications'
  AND indexname = 'idx_notifications_supplier_id';
```

**Resultado esperado:** Todos os índices existem

---

## 📋 5. TESTES DE VALIDAÇÃO JSONB

### Teste 5.1: professionals_needed deve ser array
**SQL:**
```sql
-- Tentar inserir objeto (deve FALHAR)
INSERT INTO event_projects (
  event_name,
  event_type,
  client_name,
  client_email,
  professionals_needed
) VALUES (
  'Teste',
  'show',
  'Cliente Teste',
  'teste@email.com',
  '{"invalid": "object"}'::jsonb  -- ❌ Deve falhar
);

-- Tentar inserir array (deve FUNCIONAR)
INSERT INTO event_projects (
  event_name,
  event_type,
  client_name,
  client_email,
  professionals_needed
) VALUES (
  'Teste',
  'show',
  'Cliente Teste',
  'teste@email.com',
  '[{"category": "seguranca", "quantity": 2}]'::jsonb  -- ✅ Deve funcionar
);
```

---

## 🚨 6. TESTES DE SEGURANÇA

### Teste 6.1: API contractors protegida
- [ ] Fazer logout
- [ ] Tentar POST `/api/contractors` sem autenticação
- [ ] **Verificar:** Retorna 401 Unauthorized

**Curl para testar:**
```bash
curl -X POST http://localhost:3000/api/contractors \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Teste",
    "cnpj": "12345678901234",
    "responsibleName": "Teste",
    "email": "teste@email.com",
    "phone": "11999999999"
  }'
```

**Resultado esperado:** `{ "error": "Autenticação necessária" }`

---

### Teste 6.2: Middleware bloqueia contractors
- [ ] Verificar que `/api/contractors` NÃO está nas rotas públicas
- [ ] Verificar que precisa de auth para acessar

---

## ✅ RESUMO DE VALIDAÇÃO

Após executar todos os testes, marcar:

- [ ] Todos os clerk_ids estão sendo salvos
- [ ] UNIQUE constraint funciona (sem duplicatas)
- [ ] user_type aceita 'supplier' e 'admin'
- [ ] Dashboards funcionam corretamente
- [ ] Índices foram criados
- [ ] Validação JSONB funciona
- [ ] APIs estão protegidas

---

## 📝 REGISTRO DE PROBLEMAS

Se algum teste FALHAR, registrar aqui:

### Problema 1: [Descrição]
- **Teste:** [Número do teste]
- **Esperado:** [O que deveria acontecer]
- **Obtido:** [O que aconteceu]
- **Solução:** [Como corrigir]

---

**Status:** ⏳ Aguardando execução dos testes
