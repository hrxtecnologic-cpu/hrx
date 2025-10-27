# 📋 Sistema de Gestão Manual de Propostas - Design Completo

**Objetivo:** Área no admin para fechar propostas manualmente enquanto o sistema automatizado não está 100% pronto.

---

## 🎯 VISÃO GERAL

### O Que Precisa Fazer

1. ✅ **Buscar Profissionais** do banco já cadastrados
2. ✅ **Montar Proposta** com custos detalhados (equipe + equipamentos)
3. ✅ **Calcular Valores** automaticamente (custo HRX, margem, preço cliente)
4. ✅ **Gerar PDF da Proposta** para enviar ao cliente
5. ✅ **Aprovação do Cliente** (link ou token)
6. ✅ **Gerar Contrato** automaticamente após aprovação
7. ✅ **Assinatura Digital** com token/PIN ou DocuSign
8. ✅ **Acompanhar Status** (rascunho → enviada → aprovada → assinada → em andamento)

---

## 🗂️ ESTRUTURA DO SISTEMA

### Página Principal: `/admin/propostas-manuais`

**Menu Admin:**
```
Admin
├── Dashboard
├── Profissionais
├── Fornecedores
├── Projetos (automático)
├── 📋 Propostas Manuais ← NOVO
│   ├── Listagem
│   ├── Nova Proposta
│   └── Detalhes/Editar
└── Financeiro
```

---

## 📊 FLUXO COMPLETO

```
1. CRIAR PROPOSTA
   ├─> Admin clica "Nova Proposta"
   ├─> Preenche dados do cliente
   ├─> Busca profissionais no banco
   ├─> Adiciona itens (profissionais + equipamentos)
   ├─> Define valores, datas, margem
   └─> Salva como "rascunho"

2. GERAR PROPOSTA PDF
   ├─> Admin revisa tudo
   ├─> Clica "Gerar Proposta"
   ├─> Sistema calcula valores
   ├─> Gera PDF profissional
   └─> Status: "pronta_envio"

3. ENVIAR PARA CLIENTE
   ├─> Admin envia link por email/WhatsApp
   ├─> Cliente acessa via token único
   ├─> Cliente vê proposta formatada
   └─> Status: "enviada"

4. APROVAÇÃO DO CLIENTE
   ├─> Cliente revisa proposta
   ├─> Botão "Aprovar" ou "Solicitar Ajuste"
   ├─> Se aprovar: Sistema gera contrato
   └─> Status: "aprovada"

5. ASSINATURA DIGITAL
   ├─> Cliente recebe link do contrato
   ├─> Assina com PIN/Token ou DocuSign
   ├─> HRX assina também
   └─> Status: "assinada"

6. EXECUÇÃO
   ├─> Admin acessa profissionais alocados
   ├─> Acompanha status do evento
   └─> Status: "em_andamento" → "concluido"
```

---

## 🗄️ BANCO DE DADOS

### Nova Tabela: `manual_proposals`

```sql
CREATE TABLE manual_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dados do Cliente
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  client_company VARCHAR(255),
  client_cnpj VARCHAR(18),

  -- Dados do Evento
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue_name VARCHAR(255),
  venue_address TEXT,
  venue_city VARCHAR(100),
  venue_state VARCHAR(2),
  expected_attendance INTEGER,

  -- Valores Calculados
  total_team_cost DECIMAL(10,2) DEFAULT 0,      -- Soma custos profissionais
  total_equipment_cost DECIMAL(10,2) DEFAULT 0, -- Soma custos equipamentos
  total_cost DECIMAL(10,2) DEFAULT 0,           -- total_team + total_equipment
  profit_margin_percentage INTEGER DEFAULT 35,   -- 35% ou 80%
  client_price DECIMAL(10,2) NOT NULL,          -- Preço final para cliente
  profit_amount DECIMAL(10,2) DEFAULT 0,        -- client_price - total_cost

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  -- 'draft' | 'ready_to_send' | 'sent' | 'approved' | 'rejected' | 'signed' | 'in_progress' | 'completed' | 'cancelled'

  -- Controle
  token VARCHAR(64) UNIQUE,              -- Token único para cliente acessar
  pdf_url VARCHAR(500),                  -- URL do PDF da proposta
  contract_pdf_url VARCHAR(500),         -- URL do PDF do contrato
  client_approved_at TIMESTAMP,
  client_signature_data JSONB,           -- Dados da assinatura do cliente
  hrx_signature_data JSONB,              -- Dados da assinatura HRX
  signed_at TIMESTAMP,

  -- Notas
  internal_notes TEXT,                   -- Notas privadas do admin
  client_notes TEXT,                     -- Observações do cliente

  -- Auditoria
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_manual_proposals_status ON manual_proposals(status);
CREATE INDEX idx_manual_proposals_token ON manual_proposals(token);
CREATE INDEX idx_manual_proposals_client_email ON manual_proposals(client_email);
```

### Tabela: `manual_proposal_items`

```sql
CREATE TABLE manual_proposal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES manual_proposals(id) ON DELETE CASCADE,

  -- Tipo de Item
  item_type VARCHAR(50) NOT NULL, -- 'professional' | 'equipment'

  -- Referência (se existir no sistema)
  professional_id UUID REFERENCES professionals(id),
  supplier_id UUID REFERENCES equipment_suppliers(id),

  -- Dados do Item (caso não exista no sistema ainda)
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),

  -- Valores
  quantity INTEGER NOT NULL DEFAULT 1,
  duration_days INTEGER NOT NULL DEFAULT 1,
  daily_rate DECIMAL(10,2) NOT NULL,        -- Custo diário
  total_cost DECIMAL(10,2) NOT NULL,        -- quantity × duration_days × daily_rate

  -- Extras
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposal_items_proposal ON manual_proposal_items(proposal_id);
```

---

## 🎨 INTERFACE - Página "Nova Proposta"

### Layout: 5 Tabs/Steps

#### **STEP 1: Dados do Cliente**

```
┌─────────────────────────────────────────────────┐
│ 📋 Nova Proposta - Dados do Cliente             │
├─────────────────────────────────────────────────┤
│                                                  │
│ Nome Completo/Empresa *                          │
│ [_____________________________________]          │
│                                                  │
│ Email *                 Telefone *               │
│ [__________________]    [______________]         │
│                                                  │
│ ☐ Cliente é Pessoa Jurídica                     │
│                                                  │
│ Nome da Empresa         CNPJ                     │
│ [__________________]    [______________]         │
│                                                  │
│           [Próximo: Dados do Evento →]          │
└─────────────────────────────────────────────────┘
```

#### **STEP 2: Dados do Evento**

```
┌─────────────────────────────────────────────────┐
│ 📋 Nova Proposta - Dados do Evento              │
├─────────────────────────────────────────────────┤
│                                                  │
│ Nome do Evento *                                 │
│ [_____________________________________]          │
│                                                  │
│ Tipo de Evento *    Data do Evento *             │
│ [Casamento ▼]       [__/__/____]                │
│                                                  │
│ Horário Início      Horário Término              │
│ [18:00]             [02:00]                      │
│                                                  │
│ Público Esperado                                 │
│ [200] pessoas                                    │
│                                                  │
│ Local do Evento (opcional)                       │
│ Nome: [_____________________________]            │
│ Endereço: [_________________________]            │
│ Cidade: [__________] Estado: [RJ ▼]            │
│                                                  │
│    [← Voltar]    [Próximo: Equipe →]           │
└─────────────────────────────────────────────────┘
```

#### **STEP 3: Montar Equipe**

```
┌─────────────────────────────────────────────────┐
│ 📋 Nova Proposta - Equipe                        │
├─────────────────────────────────────────────────┤
│                                                  │
│ 🔍 Buscar Profissional no Sistema               │
│ [Buscar por nome ou categoria...] [Buscar]      │
│                                                  │
│ Ou adicionar manualmente:                        │
│ [+ Adicionar Profissional Manual]               │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ EQUIPE ADICIONADA (3 profissionais)             │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 📸 João Silva - Fotógrafo                │   │
│ │ Qtd: [1]  Diárias: [1]  R$/dia: [800,00]│   │
│ │ Total: R$ 800,00                 [Remover]│   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 🎵 Maria Santos - DJ                      │   │
│ │ Qtd: [1]  Diárias: [1]  R$/dia: [1.200,00]│  │
│ │ Total: R$ 1.200,00               [Remover]│   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 👮 Carlos - Segurança (Manual)            │   │
│ │ Qtd: [4]  Diárias: [1]  R$/dia: [150,00]│   │
│ │ Total: R$ 600,00                 [Remover]│   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ SUBTOTAL EQUIPE: R$ 2.600,00                   │
│                                                  │
│    [← Voltar]    [Próximo: Equipamentos →]     │
└─────────────────────────────────────────────────┘
```

#### **STEP 4: Equipamentos (Opcional)**

```
┌─────────────────────────────────────────────────┐
│ 📋 Nova Proposta - Equipamentos                 │
├─────────────────────────────────────────────────┤
│                                                  │
│ 🔍 Buscar Fornecedor/Equipamento                │
│ [Buscar por tipo...] [Buscar]                   │
│                                                  │
│ Ou adicionar manualmente:                        │
│ [+ Adicionar Equipamento Manual]                │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ EQUIPAMENTOS ADICIONADOS (2 itens)              │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 🔊 Sistema de Som 5kW                     │   │
│ │ Qtd: [1]  Diárias: [1]  R$/dia: [800,00]│   │
│ │ Total: R$ 800,00                 [Remover]│   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 💡 Iluminação Básica                      │   │
│ │ Qtd: [1]  Diárias: [1]  R$/dia: [400,00]│   │
│ │ Total: R$ 400,00                 [Remover]│   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ SUBTOTAL EQUIPAMENTOS: R$ 1.200,00             │
│                                                  │
│    [← Voltar]    [Próximo: Valores →]          │
└─────────────────────────────────────────────────┘
```

#### **STEP 5: Valores e Revisão**

```
┌─────────────────────────────────────────────────┐
│ 📋 Nova Proposta - Valores Finais               │
├─────────────────────────────────────────────────┤
│                                                  │
│ RESUMO DOS CUSTOS                                │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 💰 CUSTO TOTAL HRX                        │   │
│ │                                            │   │
│ │ Equipe:         R$ 2.600,00               │   │
│ │ Equipamentos:   R$ 1.200,00               │   │
│ │ ───────────────────────────                │   │
│ │ TOTAL:          R$ 3.800,00               │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ MARGEM DE LUCRO                                  │
│ ○ Normal (35%)    ● Urgente (80%)               │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 💵 PREÇO PARA O CLIENTE                   │   │
│ │                                            │   │
│ │ Custo Base:     R$ 3.800,00               │   │
│ │ Margem (80%):   R$ 3.040,00               │   │
│ │ ═══════════════════════════                │   │
│ │ VALOR FINAL:    R$ 6.840,00               │   │
│ │                                            │   │
│ │ Lucro: R$ 3.040,00                        │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Observações Internas (não visível ao cliente)   │
│ [_____________________________________]          │
│ [_____________________________________]          │
│                                                  │
│    [← Voltar]    [Salvar Rascunho]             │
│                  [Gerar Proposta →]             │
└─────────────────────────────────────────────────┘
```

---

## 📄 LISTAGEM DE PROPOSTAS

### Interface: `/admin/propostas-manuais`

```
┌───────────────────────────────────────────────────────────────┐
│ 📋 Propostas Manuais                    [+ Nova Proposta]     │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│ Filtros:                                                       │
│ [Status: Todos ▼] [Cliente: _____] [Data: ___] [Buscar]      │
│                                                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🟡 RASCUNHO                                             │   │
│ │ Casamento - João & Maria                                │   │
│ │ Cliente: João Silva                                     │   │
│ │ Data: 15/12/2025 | Valor: R$ 8.500,00                  │   │
│ │ Criado: há 2 horas                                      │   │
│ │ [Editar] [Gerar Proposta] [Excluir]                    │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🔵 ENVIADA                                              │   │
│ │ Festa Corporativa - Empresa XYZ                         │   │
│ │ Cliente: Maria Santos                                   │   │
│ │ Data: 20/11/2025 | Valor: R$ 15.300,00                 │   │
│ │ Enviada: há 3 dias | Aguardando aprovação              │   │
│ │ [Ver Detalhes] [Reenviar] [Baixar PDF]                 │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🟢 APROVADA                                             │   │
│ │ Aniversário - Pedro 50 anos                             │   │
│ │ Cliente: Pedro Oliveira                                 │   │
│ │ Data: 05/12/2025 | Valor: R$ 6.800,00                  │   │
│ │ Aprovada: há 1 dia | Aguardando assinatura             │   │
│ │ [Ver Contrato] [Enviar para Assinatura]                │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ [1] [2] [3] ... [10]  Mostrando 10 de 47 propostas           │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔐 ASSINATURA DIGITAL - Opções

### Opção 1: Sistema Próprio com Token/PIN (Mais Simples)

**Fluxo:**
1. Cliente recebe link: `https://hrx.com/contrato/abc123def456`
2. Solicita PIN de 6 dígitos enviado por SMS/Email
3. Cliente digita PIN, marca "Li e aceito", clica "Assinar"
4. Sistema registra: IP, data/hora, user-agent, PIN confirmado
5. Gera PDF com carimbo digital: "Assinado digitalmente em 27/10/2025 às 14:30"

**Implementação:**
```typescript
// src/app/contrato/[token]/page.tsx
// Cliente vê contrato e assina com PIN
```

### Opção 2: DocuSign Integration (Profissional)

**Fluxo:**
1. Admin clica "Enviar para DocuSign"
2. Sistema cria envelope no DocuSign
3. DocuSign envia email pro cliente
4. Cliente assina direto na plataforma DocuSign
5. Webhook notifica HRX quando assinado

**Custo:** ~$10/mês por usuário

### Opção 3: ClickSign (Nacional)

**Fluxo:** Similar ao DocuSign, mas brasileiro
**Custo:** R$ 29/mês por usuário

### ⭐ RECOMENDAÇÃO

**Para começar:** Opção 1 (sistema próprio com PIN)
- ✅ Grátis
- ✅ Rápido de implementar
- ✅ 100% customizável
- ⚠️ Menos "profissional" que DocuSign

**Longo prazo:** Migrar para DocuSign ou ClickSign quando crescer.

---

## 💾 APIs NECESSÁRIAS

### 1. Criar Proposta
```typescript
POST /api/admin/manual-proposals
Body: { client_name, event_name, items[], profit_margin, ... }
Response: { id, token }
```

### 2. Buscar Profissionais
```typescript
GET /api/admin/professionals/search?q=fotógrafo&limit=10
Response: [ { id, name, categories, daily_rate } ]
```

### 3. Gerar PDF da Proposta
```typescript
POST /api/admin/manual-proposals/[id]/generate-pdf
Response: { pdf_url }
```

### 4. Enviar Proposta para Cliente
```typescript
POST /api/admin/manual-proposals/[id]/send
Body: { send_via: 'email' | 'whatsapp' }
Response: { sent: true, token }
```

### 5. Cliente Aprova Proposta
```typescript
POST /api/proposal/approve
Body: { token, client_notes }
Response: { approved: true, contract_url }
```

### 6. Assinar Contrato (Cliente)
```typescript
POST /api/contract/sign
Body: { token, pin, signature_data }
Response: { signed: true, pdf_url }
```

---

## 📱 PÁGINA PÚBLICA DO CLIENTE

### URL: `/proposta/[token]`

**Cliente acessa e vê:**

```
┌─────────────────────────────────────────────────┐
│ 🎉 HRX Eventos - Proposta                        │
├─────────────────────────────────────────────────┤
│                                                  │
│ Olá, João Silva!                                 │
│                                                  │
│ Segue proposta para seu evento:                  │
│ "Casamento João & Maria"                         │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ 📅 Data: 15/12/2025                              │
│ 📍 Local: Centro de Convenções                   │
│ 👥 Público: 200 pessoas                          │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ EQUIPE PROFISSIONAL                              │
│                                                  │
│ • Fotógrafo (1x) - R$ 800,00                    │
│ • DJ (1x) - R$ 1.200,00                         │
│ • Segurança (4x) - R$ 600,00                    │
│                                                  │
│ EQUIPAMENTOS                                     │
│                                                  │
│ • Sistema de Som - R$ 800,00                    │
│ • Iluminação - R$ 400,00                        │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ VALOR TOTAL: R$ 6.840,00                        │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ [Baixar PDF Completo]                            │
│                                                  │
│ [✓ Aprovar Proposta]  [✗ Solicitar Ajuste]     │
│                                                  │
│ Observações (opcional):                          │
│ [_____________________________________]          │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 📊 DASHBOARD/MÉTRICAS

### Adicionar Cards no Dashboard Admin

```
┌─────────────────────────────────────────────────┐
│ 📊 Propostas Manuais - Resumo                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│ │   12    │ │    8    │ │    5    │ │   3    ││
│ │Rascunhos│ │Enviadas │ │Aprovadas│ │Assinadas││
│ └─────────┘ └─────────┘ └─────────┘ └────────┘│
│                                                  │
│ Valor Total em Propostas Ativas: R$ 125.300,00  │
│ Lucro Estimado: R$ 43.855,00                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURAÇÕES

### Adicionar em `/admin/financeiro/configuracoes`

```
┌─────────────────────────────────────────────────┐
│ ⚙️ Configurações de Propostas                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ Margem de Lucro Padrão                           │
│ ○ Normal: [35]%                                  │
│ ○ Urgente: [80]%                                 │
│                                                  │
│ Validade da Proposta                             │
│ [7] dias                                         │
│                                                  │
│ Método de Assinatura                             │
│ ● Sistema Próprio (PIN)                          │
│ ○ DocuSign                                       │
│ ○ ClickSign                                      │
│                                                  │
│ Texto do Contrato                                │
│ [Editor de texto rico...]                        │
│                                                  │
│ [Salvar Configurações]                           │
└─────────────────────────────────────────────────┘
```

---

## 🚀 RESUMO - O QUE IMPLEMENTAR

### Prioridade 1 (Essencial)
1. ✅ Página de listagem `/admin/propostas-manuais`
2. ✅ Formulário de nova proposta (5 steps)
3. ✅ Busca de profissionais já cadastrados
4. ✅ Cálculo automático de valores
5. ✅ Geração de PDF da proposta
6. ✅ Página pública `/proposta/[token]` para cliente

### Prioridade 2 (Importante)
7. ✅ Aprovação do cliente
8. ✅ Geração de contrato
9. ✅ Assinatura digital com PIN
10. ✅ Acompanhamento de status

### Prioridade 3 (Nice to Have)
11. ⏳ Integração DocuSign/ClickSign
12. ⏳ Notificações automáticas (email/SMS)
13. ⏳ Histórico de alterações
14. ⏳ Templates de proposta

---

## 💡 DIFERENCIAIS DESTE SISTEMA

1. ✅ **Usa profissionais já cadastrados** - não precisa redigitar
2. ✅ **Cálculo automático** - margem, impostos, totais
3. ✅ **Aprovação simplificada** - cliente vê e aprova online
4. ✅ **Contrato automatizado** - gera após aprovação
5. ✅ **Assinatura digital** - sem papel, tudo online
6. ✅ **Rastreável** - histórico completo de cada proposta
7. ✅ **Financeiro integrado** - valores já contabilizados

---

## ⏱️ ESTIMATIVA DE TEMPO

| Tarefa | Tempo |
|--------|-------|
| Banco de dados (migrations) | 1h |
| Página de listagem | 2h |
| Formulário nova proposta | 4h |
| Busca de profissionais | 2h |
| Cálculos e valores | 2h |
| Geração PDF proposta | 3h |
| Página pública cliente | 2h |
| Aprovação cliente | 2h |
| Geração contrato | 2h |
| Assinatura com PIN | 3h |
| Testes e ajustes | 3h |
| **TOTAL** | **26 horas** |

**Dividido em 3 devs: ~9 horas cada**
**Dividido em 2 devs: ~13 horas cada**
**Solo: 26 horas (~3-4 dias)**

---

## 🎯 PRÓXIMO PASSO

Quer que eu comece a implementar? Posso fazer na seguinte ordem:

1. **Migrations** (banco de dados)
2. **Página de listagem** (ver propostas existentes)
3. **Formulário de nova proposta** (criar manualmente)
4. **Busca de profissionais** (usar os já cadastrados)

Ou prefere ajustar algo no design antes? 🚀
