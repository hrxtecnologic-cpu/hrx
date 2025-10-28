# 🧪 GUIA DE TESTE: Sistema de Assinatura Digital

## 📋 PRÉ-REQUISITOS

### 1. Executar Migration SQL
```sql
-- Copie o conteúdo de migrations/004_contracts_and_signatures.sql
-- Cole no Supabase SQL Editor e execute
```

### 2. Adicionar JWT_SECRET no .env.local
```bash
JWT_SECRET=sua-chave-secreta-super-segura-aqui
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Rodar o Servidor
```bash
npm run dev
```

---

## 🎯 CENÁRIO DE TESTE COMPLETO

### **ETAPA 1: Criar um Projeto de Teste**

1. Acesse: http://localhost:3000/admin/projetos
2. Clique em **"+ Novo Projeto"**
3. Preencha os dados:
   - Nome do Cliente: `Teste Cliente`
   - Email: **SEU EMAIL REAL** (você vai receber os emails)
   - Telefone: `(11) 99999-9999`
   - Nome do Evento: `Evento Teste Assinatura Digital`
   - Tipo: `Corporativo`
   - Data: Qualquer data futura
   - Local: Qualquer endereço

4. Salve o projeto

---

### **ETAPA 2: Adicionar Equipe e Equipamentos**

1. Entre nos detalhes do projeto criado
2. Na aba **"Equipe"**:
   - Adicione pelo menos 1 profissional
   - Defina diária (ex: R$ 500,00)
   - Defina duração (ex: 1 dia)

3. Na aba **"Equipamentos"**:
   - Adicione pelo menos 1 equipamento
   - Defina diária (ex: R$ 1.000,00)
   - Defina duração (ex: 1 dia)

---

### **ETAPA 3: Enviar Proposta**

1. Clique no botão **"Enviar Proposta"**
2. Verifique seu email → Você receberá a **proposta** com botões:
   - ✅ Aceitar Proposta
   - ❌ Rejeitar Proposta

---

### **ETAPA 4: Aceitar a Proposta**

1. Abra o email da proposta
2. Clique em **"Aceitar Proposta"**
3. Você verá a página de sucesso
4. **AGUARDE 5-10 SEGUNDOS** (o sistema está gerando o contrato automaticamente)

---

### **ETAPA 5: Receber Email do Contrato**

1. Verifique seu email novamente
2. Você deve receber um email com assunto:
   ```
   Contrato para Assinatura - Evento Teste Assinatura Digital
   ```

3. O email contém:
   - ✅ Detalhes do contrato
   - ✅ Valor total
   - ✅ Botão: **"✍️ Assinar Contrato Digitalmente"**
   - ✅ Aviso de expiração (7 dias)

---

### **ETAPA 6: Assinar o Contrato**

1. Clique no botão **"Assinar Contrato"** no email
2. Você será redirecionado para a página de assinatura
3. Preencha seu nome completo
4. Clique em **"Assinar Contrato Digitalmente"**
5. Aguarde alguns segundos
6. Você verá a mensagem de sucesso: **"✅ Contrato Assinado com Sucesso!"**

---

## ✅ VERIFICAÇÕES NO ADMIN

### 1. Verificar Status do Projeto
```
1. Vá em /admin/projetos
2. O projeto deve estar com status: "Em Execução" 🟢
```

### 2. Verificar Tabela de Contratos no Supabase
```sql
-- Execute no SQL Editor do Supabase
SELECT
  contract_number,
  status,
  signed_by_name,
  signed_at,
  signature_hash,
  total_value
FROM contracts
ORDER BY created_at DESC
LIMIT 5;
```

Você deve ver:
- ✅ `status = 'signed'`
- ✅ `signed_by_name` com seu nome
- ✅ `signed_at` com timestamp
- ✅ `signature_hash` com hash SHA-256

### 3. Verificar Log de Auditoria
```sql
-- Execute no SQL Editor do Supabase
SELECT
  c.contract_number,
  cal.action,
  cal.performed_by,
  cal.ip_address,
  cal.created_at
FROM contract_audit_log cal
JOIN contracts c ON c.id = cal.contract_id
ORDER BY cal.created_at DESC
LIMIT 10;
```

Você deve ver o histórico:
1. ✅ `generated` - Contrato gerado
2. ✅ `sent` - Enviado para assinatura
3. ✅ `signed` - Assinado digitalmente

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Erro: "Tabela contracts não existe"
**Solução:** Execute a migration SQL no Supabase SQL Editor

### Erro: "Token inválido ou expirado"
**Solução:** Verifique se `JWT_SECRET` está no `.env.local`

### Email não chegou
**Solução:**
1. Verifique se `RESEND_API_KEY` está configurado
2. Verifique se o email do cliente está correto
3. Olhe nos logs do terminal

### Página de assinatura não carrega
**Solução:**
1. Verifique se o servidor está rodando
2. Verifique se o token na URL está completo
3. Olhe o console do navegador (F12)

---

## 📊 DADOS DE TESTE RÁPIDO

Se quiser testar rapidamente, use estes dados:

```
Cliente: João da Silva
Email: seu-email@example.com
Telefone: (11) 98765-4321
Evento: Festa Corporativa 2025
Tipo: Corporativo
Data: 2025-12-15
Local: Av Paulista 1000, São Paulo, SP

Equipe:
- 2x Técnico de Som (R$ 500/dia, 1 dia) = R$ 1.000
- 1x DJ (R$ 2.000/dia, 1 dia) = R$ 2.000

Equipamentos:
- 1x Sistema de Som (R$ 1.500/dia, 1 dia) = R$ 1.500
- 10x Moving Head (R$ 100/dia, 1 dia) = R$ 1.000

TOTAL: R$ 5.500
```

---

## ✅ CHECKLIST DE SUCESSO

- [ ] Migration executada no Supabase
- [ ] JWT_SECRET configurado
- [ ] Servidor rodando
- [ ] Projeto criado
- [ ] Equipe adicionada
- [ ] Equipamentos adicionados
- [ ] Proposta enviada
- [ ] Email de proposta recebido
- [ ] Proposta aceita
- [ ] Email de contrato recebido (aguardar 5-10s)
- [ ] Contrato assinado
- [ ] Projeto status = "in_execution"
- [ ] Hash SHA-256 gerado
- [ ] Log de auditoria completo

---

## 🎉 PRÓXIMO PASSO

Depois de testar e confirmar que funciona, vamos implementar:
- **Sistema de OS com IA (GPT-4)** que será disparado automaticamente após a assinatura!

---

**Dúvidas?** Teste e me avise se encontrar algum erro! 🚀
