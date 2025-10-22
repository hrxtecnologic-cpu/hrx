# Sistema de Emails - HRX via Resend

**Data:** 2025-10-22
**Status:** Documentação Completa

---

## 📧 Resumo do Sistema

A HRX utiliza **Resend** para envio de emails transacionais com templates React personalizados.

**Configuração:**
- **Servidor SMTP:** Resend
- **Arquivo principal:** `src/lib/resend/emails.tsx`
- **Templates:** `src/lib/resend/templates/`
- **Email remetente:** `FROM_EMAIL` (configurado em `.env`)
- **Email admin:** `ADMIN_EMAIL` (configurado em `.env`)

---

## 📨 Emails Enviados para PROFISSIONAIS

### 1. **Email de Boas-Vindas** ✅
- **Função:** `sendProfessionalWelcomeEmail()`
- **Quando:** Após cadastro inicial do profissional
- **Template:** `SimpleWelcomeEmail.tsx`
- **Destinatário:** Profissional recém-cadastrado
- **Assunto:** `Bem-vindo à HRX, {nome}! 🎉`
- **Conteúdo:**
  - Mensagem de boas-vindas
  - Próximos passos
  - Informação sobre análise de cadastro

---

### 2. **Email de Aprovação** ✅
- **Função:** `sendProfessionalApprovalEmail()`
- **Quando:** Quando admin aprova o cadastro do profissional
- **Template:** Inline (HTML dentro da função)
- **Destinatário:** Profissional aprovado
- **Assunto:** `✅ Seu cadastro foi aprovado! - HRX`
- **Conteúdo:**
  - Confirmação de aprovação
  - Categorias aprovadas
  - Link para login
  - Próximos passos (aguardar oportunidades)
  - Botão call-to-action

---

### 3. **Email de Rejeição** ⚠️
- **Função:** `sendProfessionalRejectionEmail()`
- **Quando:** Quando admin rejeita o cadastro
- **Template:** Inline (HTML)
- **Destinatário:** Profissional rejeitado
- **Assunto:** `⚠️ Informações sobre seu cadastro - HRX`
- **Conteúdo:**
  - Motivo da rejeição
  - Instruções para correção
  - Link para editar perfil
  - Contato suporte

---

### 4. **Email de Alocação em Evento** 📅
- **Função:** `sendProfessionalAllocationEmail()`
- **Quando:** Profissional é alocado para um evento
- **Template:** Inline (HTML)
- **Destinatário:** Profissional alocado
- **Assunto:** `🎉 Você foi escalado para {nome_evento}!`
- **Conteúdo:**
  - Nome do evento
  - Data e horário
  - Local (endereço completo)
  - Função/categoria
  - Informações de contato do contratante
  - Instruções especiais

**Dados incluídos:**
```typescript
{
  professionalName: string;
  professionalEmail: string;
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventAddress: string;
  role: string;
  contractorName: string;
  contractorPhone: string;
  specialInstructions?: string;
}
```

---

### 5. **Email de Equipe Completa** ✅
- **Função:** `sendTeamCompleteEmail()`
- **Quando:** Todos profissionais de um evento foram alocados
- **Template:** Inline (HTML)
- **Destinatário:** TODOS os profissionais do evento
- **Assunto:** `✅ Equipe completa para {nome_evento}`
- **Conteúdo:**
  - Confirmação de equipe completa
  - Lista completa da equipe (nomes e funções)
  - Detalhes do evento
  - Informações de contato

**Dados incluídos:**
```typescript
{
  eventName: string;
  eventDate: string;
  professionals: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  teamList: string; // HTML formatado
}
```

---

## 🏢 Emails Enviados para CONTRATANTES (Empresas)

### 6. **Email de Confirmação de Solicitação** ✅
- **Função:** `sendContractorConfirmationEmail()`
- **Quando:** Empresa envia uma solicitação de evento
- **Template:** `ContractorConfirmationEmail.tsx`
- **Destinatário:** Empresa contratante
- **Assunto:** `Recebemos sua solicitação - {nome_evento}`
- **Conteúdo:**
  - Número da solicitação
  - Resumo do evento
  - Profissionais solicitados
  - Equipamentos solicitados
  - Prazo de resposta estimado
  - Próximos passos

**Dados incluídos:**
```typescript
{
  contractorName: string;
  contractorEmail: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  requestNumber: string;
  professionalsNeeded: Record<string, number>;
  needsEquipment: boolean;
  equipmentList?: string[];
}
```

---

## 👨‍💼 Emails Enviados para ADMIN (HRX)

### 7. **Notificação de Novo Cadastro Profissional** 🆕
- **Função:** `sendAdminNotificationEmail()`
- **Quando:** Novo profissional se cadastra
- **Template:** `AdminNotificationEmail.tsx`
- **Destinatário:** Admin da HRX
- **Assunto:** `🆕 Novo Cadastro: {nome} - {cidade}/{estado}`
- **Conteúdo:**
  - Nome completo
  - CPF
  - Email e telefone
  - Categorias selecionadas
  - Experiência
  - Localização
  - Documentos enviados
  - Link direto para aprovar/rejeitar

**Dados incluídos:**
```typescript
{
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  professionalCPF: string;
  categories: string[];
  hasExperience: boolean;
  yearsOfExperience?: string;
  city: string;
  state: string;
  documentsUploaded: string[];
  professionalId: string;
}
```

---

### 8. **Notificação de Nova Solicitação de Evento** 📋
- **Função:** `sendAdminRequestNotificationEmail()`
- **Quando:** Empresa cria solicitação de evento
- **Template:** `AdminRequestNotificationEmail.tsx`
- **Destinatário:** Admin da HRX
- **Assunto:** `🎉 Nova Solicitação: {nome_evento} - {cidade}/{estado}`
- **Conteúdo:**
  - Número da solicitação
  - Dados do contratante (empresa)
  - Detalhes do evento
  - Profissionais necessários (por categoria)
  - Equipamentos necessários
  - Orçamento estimado
  - Urgência
  - Link para gerenciar solicitação

**Dados incluídos:**
```typescript
{
  requestNumber: string;
  contractorName: string;
  contractorEmail: string;
  contractorPhone: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventEndDate?: string;
  eventLocation: string;
  eventCity: string;
  eventState: string;
  expectedAttendance?: number;
  professionalsNeeded: Record<string, number>;
  needsEquipment: boolean;
  equipmentList?: string[];
  budgetRange?: string;
  urgency: string;
  additionalNotes?: string;
}
```

---

### 9. **Notificação de Contato via Site** 📩
- **Função:** `sendContactNotificationEmail()`
- **Quando:** Visitante envia mensagem via formulário de contato
- **Template:** `ContactNotificationEmail.tsx`
- **Destinatário:** Admin da HRX
- **Assunto:** `📩 Novo contato: {nome}`
- **Conteúdo:**
  - Nome do visitante
  - Email
  - Telefone (se fornecido)
  - Assunto
  - Mensagem completa

---

## 🔔 Emails para VISITANTES (Site)

### 10. **Confirmação de Contato** ✅
- **Função:** `sendContactConfirmationEmail()`
- **Quando:** Visitante envia mensagem via formulário
- **Template:** `ContactConfirmationEmail.tsx`
- **Destinatário:** Visitante que entrou em contato
- **Assunto:** `Recebemos sua mensagem - HRX`
- **Conteúdo:**
  - Agradecimento
  - Confirmação de recebimento
  - Prazo de resposta (24-48h)
  - Contatos alternativos

---

## 🚀 Emails para FORNECEDORES

### 11. **Solicitação de Orçamento** 💰
- **Função:** `sendSupplierQuoteRequest()`
- **Quando:** Admin solicita orçamento de equipamento
- **Template:** Inline (HTML)
- **Destinatário:** Fornecedor de equipamentos
- **Assunto:** `Solicitação de Orçamento - {nome_evento}`
- **Conteúdo:**
  - Nome do evento
  - Data do evento
  - Equipamentos solicitados
  - Quantidade e duração
  - Prazo para resposta
  - Informações de contato

**Dados incluídos:**
```typescript
{
  supplierName: string;
  supplierEmail: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  equipmentRequested: Array<{
    type: string;
    quantity: number;
    duration: string;
  }>;
  deadline: string;
  contactPhone: string;
}
```

---

## 📧 Funções Compostas (Enviam Múltiplos Emails)

### `sendProfessionalRegistrationEmails()`
**Dispara 2 emails simultaneamente:**
1. Boas-vindas para o profissional
2. Notificação para admin

### `sendRequestEmails()`
**Dispara 2 emails simultaneamente:**
1. Confirmação para o contratante
2. Notificação para admin

### `sendContactEmails()`
**Dispara 2 emails simultaneamente:**
1. Confirmação para o visitante
2. Notificação para admin

---

## 📊 Estatísticas

| Tipo de Usuário | Nº de Emails | Emails |
|-----------------|--------------|---------|
| **Profissionais** | 5 | Boas-vindas, Aprovação, Rejeição, Alocação, Equipe Completa |
| **Contratantes** | 1 | Confirmação de Solicitação |
| **Admin (HRX)** | 3 | Novo Cadastro, Nova Solicitação, Contato |
| **Visitantes** | 1 | Confirmação de Contato |
| **Fornecedores** | 1 | Solicitação de Orçamento |
| **TOTAL** | **11 tipos** | diferentes de emails |

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente (.env)
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxx
FROM_EMAIL=noreply@hrx.com.br
ADMIN_EMAIL=admin@hrx.com.br
```

### Dependências
```json
{
  "resend": "^latest",
  "@react-email/components": "^latest"
}
```

---

## 🎨 Templates Disponíveis

| Template | Arquivo | Uso |
|----------|---------|-----|
| SimpleWelcomeEmail | `SimpleWelcomeEmail.tsx` | Boas-vindas profissionais |
| AdminNotificationEmail | `AdminNotificationEmail.tsx` | Notificar admin de cadastro |
| AdminRequestNotificationEmail | `AdminRequestNotificationEmail.tsx` | Notificar admin de solicitação |
| ContractorConfirmationEmail | `ContractorConfirmationEmail.tsx` | Confirmar solicitação para empresa |
| ContactConfirmationEmail | `ContactConfirmationEmail.tsx` | Confirmar contato para visitante |
| ContactNotificationEmail | `ContactNotificationEmail.tsx` | Notificar admin de contato |
| PendingDocumentsEmail | `PendingDocumentsEmail.tsx` | Lembrar documentos pendentes (não usado) |

---

## ✅ Próximas Melhorias Sugeridas

1. **Email de Lembrete de Documentos Pendentes** (template existe mas não está sendo usado)
2. **Email de Evento Cancelado** (para profissionais alocados)
3. **Email de Mudança de Horário** (para profissionais alocados)
4. **Email de Avaliação Pós-Evento** (feedback)
5. **Email de Orçamento Aprovado** (para fornecedores)
6. **Newsletter** (para profissionais ativos)
7. **Email de Renovação de Documentos** (alertar vencimento de CNH, etc)

---

## 📝 Observações Importantes

- **Todos os emails são enviados de forma assíncrona**
- **Logs são registrados no console para cada email enviado**
- **Erros são capturados e retornados, mas não interrompem o fluxo**
- **Templates usam React Email para renderização HTML responsivo**
- **Sistema de retry não está implementado** (sugestão para futuro)
