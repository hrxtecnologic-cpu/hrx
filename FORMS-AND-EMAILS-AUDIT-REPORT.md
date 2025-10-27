# Relatório Completo: Auditoria de Formulários e Emails

**Data**: 27 de Outubro de 2025
**Status**: 🔄 EM PROGRESSO

---

## 📋 Sumário Executivo

Este relatório documenta a auditoria completa de:
1. **Todos os formulários** do sistema (cadastro e edição)
2. **Todos os templates de email** com links e botões de ação
3. **Rotas** existentes e faltantes no sistema
4. **Plano de implementação** para edição de formulários

---

## 🎯 Objetivo

Garantir que:
- ✅ **Todos os formulários** possam ser editados com dados pré-preenchidos
- ✅ **Todos os emails** tenham links corretos apontando para rotas válidas
- ✅ **Experiência consistente** entre profissionais, fornecedores e contratantes

---

## 📝 PARTE 1: FORMULÁRIOS DO SISTEMA

### 1.1 Profissionais ✅ **JÁ IMPLEMENTADO**

**Formulário**: `src/app/cadastro-profissional-wizard/page.tsx`

**Status**: ✅ **FUNCIONAL**
- Carrega dados existentes via `/api/professional/profile`
- Pré-preenche todos os campos (incluindo fotos de documentos e portfólio)
- Detecta modo de edição automaticamente
- Usa PATCH para atualizar, POST para criar
- Redireciona para dashboard após atualização

**Links no Dashboard**:
- ✅ `/professional/dashboard` → Botão "Editar Perfil" → `/cadastro-profissional-wizard`
- ✅ `/professional/dashboard` → Botão "Gerenciar Documentos" → `/cadastro-profissional-wizard`

---

### 1.2 Fornecedores (Equipment Suppliers) ❌ **NÃO IMPLEMENTADO**

**Formulário de Cadastro**: ⚠️ **NÃO ENCONTRADO**
- Não existe formulário público de cadastro de fornecedor
- Fornecedores parecem ser cadastrados via admin

**Dashboard**: `src/app/supplier/dashboard/page.tsx`
- ✅ Existe dashboard funcional
- ❌ **NÃO TEM** botão "Editar Perfil"
- ❌ **NÃO TEM** link para editar dados da empresa
- ❌ **NÃO TEM** funcionalidade de edição

**API Endpoints**:
- ✅ GET `/api/supplier/dashboard` - Busca dados do fornecedor
- ❌ **FALTA**: PATCH `/api/supplier/profile` - Atualizar dados

**Necessário Implementar**:
1. ✅ Criar API PATCH `/api/supplier/profile`
2. ✅ Criar formulário de edição `/supplier/perfil/page.tsx` ou reutilizar cadastro
3. ✅ Adicionar botão "Editar Perfil" no dashboard
4. ✅ Carregar dados existentes no formulário

---

### 1.3 Contratantes (Contractors/Clients) ❌ **PARCIALMENTE IMPLEMENTADO**

**Formulário de Cadastro**: `src/app/cadastrar-contratante/page.tsx`
- ✅ Formulário de cadastro existe e funciona
- ❌ **NÃO carrega dados existentes** para edição
- ❌ **NÃO detecta** modo de edição

**Dashboard**: `src/app/dashboard/contratante/page.tsx`
- ✅ Dashboard existe e mostra projetos
- ❌ **NÃO TEM** botão "Editar Perfil"
- ❌ **NÃO TEM** link para editar dados da empresa

**API Endpoints**:
- ✅ POST `/api/contractors` - Criar novo contratante
- ❌ **FALTA**: GET `/api/contractor/profile` - Buscar dados
- ❌ **FALTA**: PATCH `/api/contractor/profile` - Atualizar dados

**Necessário Implementar**:
1. ✅ Criar API GET `/api/contractor/profile`
2. ✅ Criar API PATCH `/api/contractor/profile`
3. ✅ Modificar `cadastrar-contratante/page.tsx`:
   - Adicionar useEffect para carregar dados existentes
   - Detectar modo edição vs cadastro
   - Usar PATCH quando editando
4. ✅ Adicionar botão "Editar Perfil" no dashboard

---

## 📧 PARTE 2: AUDITORIA DE EMAILS

### 2.1 Emails COM Botões/Links de Ação

#### ✅ **1. AdminNotificationEmail** - CORRIGIDO
**Enviado para**: Admin
**Quando**: Novo profissional se cadastra
**Botões**:
- ✅ "Analisar Cadastro" → `/admin/profissionais/[id]` (Rota existe)
- ✅ "Ver Todos os Cadastros" → `/admin/profissionais` (Rota existe)
**Status**: ✅ **URLs CORRETAS**

---

#### ✅ **2. AdminRequestNotificationEmail** - VERIFICADO
**Enviado para**: Admin
**Quando**: Nova solicitação de evento
**Links**:
- ✅ Email do cliente → `mailto:${email}`
- ✅ WhatsApp do cliente → `https://wa.me/...`
**Status**: ✅ **CORRETO** (links de contato, sem rotas internas)

---

#### ✅ **3. ContactConfirmationEmail** - VERIFICADO
**Enviado para**: Pessoa que enviou contato
**Quando**: Formulário de contato enviado
**Botões**:
- ⚠️ "Solicitar Equipe Agora" → `/solicitar-equipe`
- ⚠️ "Cadastrar como Profissional" → `/cadastrar-profissional`

**Verificar Rotas**:
```bash
/solicitar-equipe - Precisa verificar se existe
/cadastrar-profissional - Existe? Ou é /cadastro-profissional-wizard?
```

---

#### ⚠️ **4. FinalProposalEmail** - PRECISA VERIFICAR
**Enviado para**: Cliente
**Quando**: Proposta final de projeto enviada
**Botões**:
- ❓ "Aceitar Proposta" → `acceptUrl` (recebido via props)
- ❓ "Recusar Proposta" → `rejectUrl` (recebido via props)

**Ação Necessária**: Verificar onde este email é enviado e se as URLs estão corretas

---

#### ✅ **5. PendingDocumentsEmail** - VERIFICADO
**Enviado para**: Profissional
**Quando**: Documentos pendentes ou rejeitados
**Botões**:
- ✅ "Enviar Documentos Agora" → `profileUrl` (recebido via props)

**Status**: ✅ Assume que `profileUrl` é passado corretamente como `/cadastro-profissional-wizard`

---

#### ✅ **6. ProfessionalInvitationEmail** - VERIFICADO
**Enviado para**: Profissional
**Quando**: Convite para trabalhar em evento
**Botões**:
- ✅ "Confirmar Presença" → `confirmUrl` (gerado em `emails.tsx`)
- ✅ "Recusar Convite" → `rejectUrl` (gerado em `emails.tsx`)

**Rota verificada**: `/professional/confirm/[token]?action=confirm|reject`

---

#### ✅ **7. ProfessionalWelcomeEmail** - VERIFICADO
**Enviado para**: Profissional
**Quando**: Cadastro concluído
**Botões**:
- ✅ "Acessar Meu Dashboard" → `/professional/dashboard` (Rota existe)

**Status**: ✅ **CORRETO**

---

#### ⚠️ **8. QuoteRequestEmail** - PRECISA VERIFICAR
**Enviado para**: Fornecedor
**Quando**: Solicitação de orçamento
**Botões**:
- ❓ "Responder Orçamento" → `responseUrl` (recebido via props)

**Ação Necessária**: Verificar se `responseUrl` aponta para `/supplier/quotations/[id]/responder` ou similar

---

#### ⚠️ **9. QuoteResponseAdminEmail** - PRECISA VERIFICAR
**Enviado para**: Admin
**Quando**: Fornecedor responde orçamento
**Botões**:
- ❓ "Ver Orçamento Completo" → `quotationUrl` (recebido via props)

**Ação Necessária**: Verificar rota de visualização de orçamentos no admin

---

#### ⚠️ **10. UrgentQuoteAdminEmail** - TEMPORÁRIO
**Enviado para**: Admin
**Quando**: Orçamento urgente criado
**Botões**:
- ⚠️ "Acessar Painel Administrativo" → `/admin` (TEMPORÁRIO)

**Status**: ⚠️ **ROTA IDEAL NÃO EXISTE**
- Ideal: `/admin/orcamentos/[id]`
- Atual: `/admin` (dashboard principal)
- **TODO**: Criar rota de orçamentos

---

#### ⚠️ **11. IncompleteRegistrationReminderEmail** - PRECISA VERIFICAR
**Enviado para**: Profissional/Usuário
**Quando**: Cadastro incompleto após X dias
**Botões**:
- ❓ "Completar Cadastro" → `dashboardUrl` (recebido via props)

**Ação Necessária**: Verificar se `dashboardUrl` está correto

---

### 2.2 Emails SEM Botões (Apenas Informativos)

✅ **12. ContactNotificationEmail** - Admin recebe notificação de contato
✅ **13. ContractorConfirmationEmail** - Confirmação de solicitação de evento
✅ **14. QuoteAcceptedEmail** - Orçamento aceito
✅ **15. QuoteRejectedEmail** - Orçamento rejeitado
✅ **16. SimpleWelcomeEmail** - Boas-vindas simples

---

## 🔍 PARTE 3: VERIFICAÇÃO DE ROTAS

### 3.1 Rotas que EXISTEM ✅

```
✅ /admin                           - Dashboard admin
✅ /admin/profissionais             - Lista de profissionais
✅ /admin/profissionais/[id]        - Detalhes do profissional
✅ /admin/projetos                  - Lista de projetos
✅ /admin/projetos/[id]             - Detalhes do projeto
✅ /admin/fornecedores              - Lista de fornecedores
✅ /professional/dashboard          - Dashboard do profissional
✅ /supplier/dashboard              - Dashboard do fornecedor
✅ /dashboard/contratante           - Dashboard do contratante
✅ /cadastro-profissional-wizard    - Cadastro/edição de profissional
✅ /cadastrar-contratante           - Cadastro de contratante
```

### 3.2 Rotas que NÃO EXISTEM ❌

```
❌ /admin/orcamentos               - Lista de orçamentos (admin)
❌ /admin/orcamentos/[id]          - Detalhes do orçamento
❌ /solicitar-equipe               - Precisa verificar
❌ /cadastrar-profissional         - Existe? Ou é /cadastro-profissional-wizard?
❌ /supplier/perfil                - Edição de perfil do fornecedor
❌ /contractor/perfil              - Edição de perfil do contratante
❌ /supplier/quotations/[id]/responder - Responder orçamento
```

---

## 📊 PARTE 4: RESUMO DO STATUS ATUAL

### Formulários

| Tipo | Cadastro | Edição | Dashboard Edit Button | API GET | API PATCH |
|------|----------|--------|----------------------|---------|-----------|
| **Profissional** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Fornecedor** | ⚠️ Admin | ❌ | ❌ | ✅ | ❌ |
| **Contratante** | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legenda**:
- ✅ = Implementado e funcional
- ❌ = Não implementado
- ⚠️ = Parcialmente implementado

### Emails

| Email | Status Links | Rotas Válidas | Ação Necessária |
|-------|--------------|---------------|-----------------|
| AdminNotificationEmail | ✅ | ✅ | Nenhuma |
| AdminRequestNotificationEmail | ✅ | ✅ | Nenhuma |
| ContactConfirmationEmail | ⚠️ | ❓ | Verificar rotas |
| FinalProposalEmail | ⚠️ | ❓ | Verificar origem |
| PendingDocumentsEmail | ✅ | ✅ | Nenhuma |
| ProfessionalInvitationEmail | ✅ | ✅ | Nenhuma |
| ProfessionalWelcomeEmail | ✅ | ✅ | Nenhuma |
| QuoteRequestEmail | ⚠️ | ❓ | Verificar URL |
| QuoteResponseAdminEmail | ⚠️ | ❓ | Verificar URL |
| UrgentQuoteAdminEmail | ⚠️ | ❌ | Criar rota orçamentos |
| IncompleteRegistrationReminderEmail | ⚠️ | ❓ | Verificar URL |

---

## 🚀 PARTE 5: PLANO DE IMPLEMENTAÇÃO

### Fase 1: Contratantes (PRIORITÁRIO) 🔴

#### 1.1 Criar APIs
```typescript
// src/app/api/contractor/profile/route.ts

export async function GET() {
  // Buscar dados do contratante logado
  const { userId } = await auth();
  const supabase = await createClient();

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  const { data: contractor } = await supabase
    .from('contractors')
    .select('*')
    .eq('user_id', userData.id)
    .single();

  return successResponse(contractor);
}

export async function PATCH(req: Request) {
  // Atualizar dados do contratante
  const body = await req.json();
  // ... lógica de atualização
}
```

#### 1.2 Modificar Formulário
```typescript
// src/app/cadastrar-contratante/page.tsx

// Adicionar states
const [loadingContractor, setLoadingContractor] = useState(false);
const [isUpdating, setIsUpdating] = useState(false);

// Adicionar useEffect para carregar dados
useEffect(() => {
  const loadContractorData = async () => {
    if (!user) return;

    const response = await fetch('/api/contractor/profile');
    if (response.ok) {
      const result = await response.json();
      const contractor = result.data;

      if (contractor) {
        setIsUpdating(true);
        setValue('companyName', contractor.company_name);
        setValue('cnpj', contractor.cnpj);
        // ... preencher todos os campos
      }
    }
  };

  loadContractorData();
}, [user]);

// Modificar onSubmit
const endpoint = isUpdating ? '/api/contractor/profile' : '/api/contractors';
const method = isUpdating ? 'PATCH' : 'POST';
```

#### 1.3 Adicionar Botão no Dashboard
```typescript
// src/app/dashboard/contratante/page.tsx

<Link href="/cadastrar-contratante">
  <Button>
    <User className="h-4 w-4 mr-2" />
    Editar Perfil
  </Button>
</Link>
```

---

### Fase 2: Fornecedores 🟡

#### 2.1 Criar Formulário de Cadastro/Edição
```
src/app/supplier/perfil/page.tsx
```

#### 2.2 Criar API PATCH
```
src/app/api/supplier/profile/route.ts
```

#### 2.3 Adicionar Botão no Dashboard
```typescript
// src/app/supplier/dashboard/page.tsx

<Link href="/supplier/perfil">
  <Button>
    <User className="h-4 w-4 mr-2" />
    Editar Perfil
  </Button>
</Link>
```

---

### Fase 3: Verificar e Corrigir Emails 🟢

#### 3.1 Verificar Rotas
```bash
# Verificar se existem:
/solicitar-equipe
/cadastrar-profissional
/supplier/quotations/[id]/responder
```

#### 3.2 Corrigir ContactConfirmationEmail
```typescript
// Se rota não existir, criar ou corrigir link
<a href={`${HRX_CONTACT_INFO.siteUrl}/solicitar-evento`}>
```

#### 3.3 Criar Rota de Orçamentos (Opcional)
```
src/app/admin/orcamentos/page.tsx
src/app/admin/orcamentos/[id]/page.tsx
```

---

### Fase 4: Criar Rotas Faltantes 🔵

1. `/admin/orcamentos` - Gerenciamento de orçamentos
2. `/supplier/quotations/[id]/responder` - Responder orçamento
3. `/supplier/perfil` - Edição de perfil fornecedor
4. Verificar `/solicitar-equipe` vs `/solicitar-evento`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Contratantes
- [ ] Criar GET `/api/contractor/profile`
- [ ] Criar PATCH `/api/contractor/profile`
- [ ] Adicionar useEffect para carregar dados no formulário
- [ ] Adicionar lógica de detecção de modo (create vs update)
- [ ] Adicionar botão "Editar Perfil" no dashboard
- [ ] Testar fluxo completo de edição

### Fornecedores
- [ ] Criar formulário `/supplier/perfil/page.tsx`
- [ ] Criar PATCH `/api/supplier/profile`
- [ ] Adicionar botão "Editar Perfil" no dashboard
- [ ] Testar fluxo completo de edição

### Emails
- [ ] Verificar rota `/solicitar-equipe`
- [ ] Verificar rota `/cadastrar-profissional`
- [ ] Corrigir `ContactConfirmationEmail` se necessário
- [ ] Verificar `QuoteRequestEmail` - `responseUrl`
- [ ] Verificar `QuoteResponseAdminEmail` - `quotationUrl`
- [ ] Verificar `FinalProposalEmail` - origem e URLs
- [ ] Verificar `IncompleteRegistrationReminderEmail` - `dashboardUrl`
- [ ] (Opcional) Criar rotas de orçamentos para `UrgentQuoteAdminEmail`

---

## 📝 NOTAS IMPORTANTES

1. **Padrão de Implementação**: Seguir o mesmo padrão usado em profissionais:
   - useEffect para carregar dados
   - State `isUpdating` para detectar modo
   - PATCH para update, POST para create
   - Redirecionar para dashboard após update

2. **Validação**: Garantir que todos os campos são validados com Zod

3. **Segurança**: Verificar autenticação e autorização em todas as APIs

4. **UX**: Mostrar loading state enquanto carrega dados existentes

5. **Feedback**: Toast/Alert de sucesso após salvar

---

## 🎯 PRIORIDADES

**Alta Prioridade** 🔴:
1. Implementar edição de perfil para Contratantes
2. Verificar e corrigir links em `ContactConfirmationEmail`

**Média Prioridade** 🟡:
3. Implementar edição de perfil para Fornecedores
4. Verificar emails de orçamento (`QuoteRequestEmail`, `QuoteResponseAdminEmail`)

**Baixa Prioridade** 🟢:
5. Criar rotas de gerenciamento de orçamentos no admin
6. Criar rota de resposta de orçamento para fornecedores

---

**Relatório gerado automaticamente**
**Data**: 27/10/2025
**Versão**: 1.0
