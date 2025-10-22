# 📚 Guia Completo do Administrador - HRX Platform

> **Versão:** 1.0
> **Última Atualização:** 22/10/2025
> **Público-Alvo:** Equipe administrativa da HRX

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Acesso ao Admin](#acesso-ao-admin)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestão de Profissionais](#gestão-de-profissionais)
5. [Gestão de Fornecedores](#gestão-de-fornecedores)
6. [Gestão de Documentos](#gestão-de-documentos)
7. [Sistema de Projetos](#sistema-de-projetos)
8. [Sistema de Orçamentos](#sistema-de-orçamentos)
9. [Solicitações de Clientes](#solicitações-de-clientes)
10. [Fluxos de Trabalho](#fluxos-de-trabalho)
11. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## 🎯 Visão Geral

### O que é o Painel Admin?

O Painel Administrativo da HRX é o coração do sistema. Através dele você:

✅ **Gerencia profissionais** - Aprova, rejeita e edita cadastros
✅ **Gerencia fornecedores** - Cadastra e organiza fornecedores de equipamentos
✅ **Valida documentos** - Analisa e aprova documentos enviados
✅ **Cria projetos** - Monta equipes e solicita equipamentos
✅ **Envia orçamentos** - Solicita cotações e calcula margens de lucro
✅ **Acompanha solicitações** - Gerencia pedidos de clientes

### Modelo de Negócio HRX

**A HRX é uma intermediadora/facilitadora:**
- Conecta clientes com profissionais qualificados
- Conecta clientes com fornecedores de equipamentos
- Adiciona margem de lucro sobre custos:
  - **35%** para eventos normais
  - **80%** para eventos urgentes

---

## 🔐 Acesso ao Admin

### Como Acessar

1. **URL:** `https://hrxeventos.com.br/admin`
2. **Login:** Use sua conta Clerk com permissões de admin
3. **Verificação:** Apenas contas com `role: admin` têm acesso

### Primeiro Acesso

Ao fazer login pela primeira vez:
1. Você verá o **Dashboard** com estatísticas
2. No menu lateral esquerdo, todos os módulos estarão disponíveis
3. Explore cada seção para se familiarizar

---

## 📊 Dashboard Principal

### Localização
**Rota:** `/admin`

### O que você vê

**Contadores Principais:**
- 👥 **Total de Profissionais** - Cadastrados no sistema
- 📄 **Documentos Pendentes** - Aguardando validação (badge vermelho)
- 📋 **Solicitações Ativas** - Pedidos de clientes em andamento
- 🏢 **Fornecedores Ativos** - Fornecedores disponíveis

**Cards de Estatísticas:**
- Profissionais por status (Pendente, Aprovado, Rejeitado)
- Documentos por status
- Solicitações por status
- Gráficos de crescimento

### Ações Rápidas

- 🔍 Buscar profissional
- ➕ Adicionar fornecedor
- 📝 Ver documentos pendentes
- 📊 Ver relatórios

---

## 👥 Gestão de Profissionais

### Localização
**Rota:** `/admin/profissionais`

---

### 1️⃣ Lista de Profissionais

**O que você vê:**
- Cards com informações de cada profissional
- Foto de perfil
- Nome completo
- Categorias (badges coloridos)
- Status (Pendente, Aprovado, Rejeitado, Inativo)
- Cidade e Estado

**Filtros Disponíveis:**
- 🔍 Busca por nome, CPF, email, telefone
- 📊 Filtro por status
- 🏷️ Filtro por categoria
- 📍 Filtro por cidade/estado

**Ações na Lista:**
- 👁️ **Ver Detalhes** - Ver perfil completo
- ✅ **Aprovar** - Aprovar cadastro (se pendente)
- ❌ **Rejeitar** - Rejeitar com motivo
- ✏️ **Editar** - Editar informações

---

### 2️⃣ Detalhes do Profissional

**Clique em "Ver Detalhes" para acessar.**

**Informações Exibidas:**

📋 **Dados Pessoais:**
- Nome completo
- CPF (parcialmente oculto: XXX.XXX.XXX-12)
- Data de nascimento
- Email e telefone

📍 **Endereço:**
- CEP, Rua, Número, Complemento
- Bairro, Cidade, Estado

💼 **Experiência:**
- Categorias selecionadas
- Anos de experiência
- Descrição da experiência
- Portfólio (se houver)

📅 **Disponibilidade:**
- Dias úteis / Fins de semana
- Feriados / Noite / Viagens

📄 **Documentos:**
- RG (frente e verso)
- CPF
- Comprovante de residência
- Foto de perfil
- Certificados específicos (CNV, CNH, NR10, NR35, DRT)

💰 **Dados Bancários:**
- Banco, Agência, Conta
- Tipo de conta
- Chave PIX

---

### 3️⃣ Aprovar Profissional

**Quando:** Profissional com status "Pendente"

**Passo a passo:**

1. **Acesse os detalhes** do profissional
2. **Revise TODAS as informações:**
   - Dados pessoais corretos?
   - Endereço completo?
   - Experiência adequada?
   - Documentos legíveis e válidos?
   - Certificados válidos (se necessário)?
3. **Clique em "Aprovar Cadastro"**
4. **Confirme** a aprovação
5. Sistema automaticamente:
   - ✅ Muda status para "Aprovado"
   - 📧 Envia email de aprovação ao profissional
   - 📝 Registra data e responsável pela aprovação

**⚠️ Importante:**
- Profissionais aprovados aparecem nas buscas do sistema
- Podem ser alocados em projetos
- Recebem notificações de oportunidades

---

### 4️⃣ Rejeitar Profissional

**Quando:** Cadastro incompleto, documentos inválidos, informações incorretas

**Passo a passo:**

1. **Acesse os detalhes** do profissional
2. **Identifique o problema:**
   - Documentos ilegíveis?
   - Dados incorretos?
   - Certificados vencidos?
   - Informações incompletas?
3. **Clique em "Rejeitar Cadastro"**
4. **Escreva o motivo detalhado:**
   ```
   Exemplo:
   "CNV vencida. Por favor, envie CNV válida e dentro do prazo de validade."
   ```
5. **Confirme** a rejeição
6. Sistema automaticamente:
   - ❌ Muda status para "Rejeitado"
   - 📧 Envia email com motivo ao profissional
   - 🔄 Permite que profissional reenvie documentos

**⚠️ Importante:**
- Seja específico no motivo
- Profissional pode corrigir e reenviar
- Após correção, status volta para "Pendente"

---

### 5️⃣ Editar Profissional

**Quando:** Corrigir informações, atualizar dados

**Passo a passo:**

1. **Clique em "Editar"** no card do profissional
2. **Modifique** os campos necessários
3. **Observações:**
   - CPF não pode ser alterado (campo único)
   - Documentos devem ser enviados pelo profissional
   - Alterações sensíveis são registradas
4. **Salve** as alterações

---

### 6️⃣ Busca Avançada

**Funcionalidades:**

🔍 **Busca Textual:**
- Nome, CPF, email, telefone, endereço

📊 **Filtros:**
- Status (múltipla seleção)
- Categorias (múltipla seleção)
- Experiência (sim/não)
- Cidade/Estado

📍 **Busca por Proximidade:**
- Digite coordenadas (latitude/longitude)
- Defina raio em km
- Sistema retorna profissionais próximos
- Ordenados por distância

---

## 🏢 Gestão de Fornecedores

### Localização
**Rota:** `/admin/fornecedores`

---

### 1️⃣ Lista de Fornecedores

**O que você vê:**
- Nome da empresa
- Contato (nome, email, telefone)
- Status (Ativo/Inativo)
- Tipos de equipamento (badges)
- Preços (diária, 3 dias, semanal)
- Observações sobre descontos

**Ações:**
- ✏️ Editar fornecedor
- 🗑️ Deletar fornecedor
- 🔍 Buscar fornecedores

---

### 2️⃣ Cadastrar Novo Fornecedor

**Passo a passo:**

1. **Clique em "Novo Fornecedor"**

2. **Preencha os dados básicos:**
   - Nome da empresa *
   - Nome do contato *
   - Email *
   - Telefone *

3. **Defina preços (opcional):**
   - Diária (ex: R$ 500,00)
   - 3 dias (ex: R$ 1.200,00)
   - Semanal (ex: R$ 2.000,00)
   - Observações sobre descontos

4. **Selecione tipos de equipamento:** ⭐ **IMPORTANTE**

   O sistema tem **13 categorias** com **100+ tipos**:

   **Som e Áudio** (14 tipos)
   - Sistema de Som Completo, Line Array, Caixas de Som
   - Microfones (fio, sem fio, lapela)
   - Mesas de Som, Amplificadores, etc.

   **Iluminação** (17 tipos)
   - Moving Heads, LED PAR, Refletores
   - Strobo, Laser RGB, Máquinas de Fumaça, etc.

   **Audiovisual** (14 tipos)
   - Telão LED, Painéis LED (P3, P5, P10)
   - Projetores, Câmeras, Streaming, etc.

   **Estruturas** (16 tipos)
   - Palcos, Tendas, Box Truss
   - Grades, Arquibancadas, etc.

   **Mobiliário** (14 tipos)
   - Mesas (redondas, retangulares, bistrô)
   - Cadeiras, Sofás, Puffs, etc.

   **Decoração e Cenografia** (15 tipos)
   - Flores, Plantas, Painéis Decorativos
   - Backdrop, Balões, Cenografia, etc.

   **Energia e Infraestrutura** (13 tipos)
   - Geradores (20, 40, 60, 100+ KVA)
   - Ar Condicionado, Nobreak, etc.

   **Sanitários e Higiene** (7 tipos)
   - Banheiros Químicos (VIP, Standard, PNE)
   - Trailer de Banheiros, Pias, etc.

   **Catering e Gastronomia** (10 tipos)
   - Buffet, Coquetel, Coffee Break
   - Food Truck, Chopeira, etc.

   **Segurança e Controle** (7 tipos)
   - Equipe de Segurança, Câmeras
   - Detector de Metal, Controle de Acesso, etc.

   **Tecnologia e Interatividade** (10 tipos)
   - Wi-Fi, Credenciamento Eletrônico
   - Totens Interativos, Sistema de Votação, etc.

   **Transporte e Logística** (6 tipos)
   - Ônibus/Van, Caminhão, Empilhadeira, etc.

   **Outros Serviços** (7 tipos)
   - Limpeza, Mão de Obra, Seguros, Alvarás, etc.

   **Como selecionar:**
   - Clique na categoria para expandir
   - Marque os checkboxes dos equipamentos fornecidos
   - Contador mostra quantos selecionados
   - Você pode selecionar de múltiplas categorias

5. **Adicione observações** (opcional)
   - Horários de atendimento
   - Área de cobertura
   - Informações especiais

6. **Defina status:**
   - ✅ Ativo - Aparece em buscas
   - ⚫ Inativo - Não aparece em buscas

7. **Clique em "Cadastrar Fornecedor"**

---

### 3️⃣ Editar Fornecedor

**Quando:** Atualizar preços, adicionar equipamentos, mudar contato

**Passo a passo:**
1. Clique em ✏️ no card do fornecedor
2. Modifique os campos necessários
3. Salve as alterações

**⚠️ Importante:**
- Fornecedores inativos não aparecem em cotações
- Mantenha informações de contato atualizadas

---

### 4️⃣ Buscar Fornecedores

**Filtros disponíveis:**
- 🔍 Nome da empresa ou contato
- 📊 Status (Ativo/Inativo)
- 🏷️ Tipos de equipamento

---

## 📄 Gestão de Documentos

### Localização
**Rota:** `/admin/documentos`

**Badge vermelha:** Mostra quantidade de documentos pendentes

---

### 1️⃣ Lista de Documentos

**O que você vê:**
- Nome do profissional
- Tipo de documento
- Status (Pendente, Aprovado, Rejeitado)
- Data de envio
- Preview do documento

**Filtros:**
- 📊 Por status
- 📋 Por tipo de documento
- 🔍 Por profissional

---

### 2️⃣ Validar Documento

**Passo a passo:**

1. **Clique no documento** para abrir
2. **Visualize em tela cheia**
3. **Verifique:**
   - ✅ Documento legível?
   - ✅ Dados correspondem ao cadastro?
   - ✅ Validade OK (se aplicável)?
   - ✅ Sem rasuras ou adulterações?

4. **Se OK:**
   - Clique em "✅ Aprovar"
   - Sistema marca como aprovado
   - Profissional recebe notificação

5. **Se Não OK:**
   - Clique em "❌ Rejeitar"
   - Escreva o motivo:
     ```
     Exemplo:
     "CNH vencida. Enviar CNH com validade até 2026 ou superior."
     ```
   - Sistema notifica profissional
   - Profissional pode reenviar

**Documentos por Categoria:**

**Todos os profissionais:**
- RG (frente e verso)
- CPF
- Comprovante de residência
- Foto de perfil

**Segurança:**
- CNV (Carteira Nacional de Vigilante) - **OBRIGATÓRIA**

**Motoristas:**
- CNH - **OBRIGATÓRIA**
  - Verificar categoria (A, B, C, D, E)
  - Verificar validade

**Eletricistas:**
- NR10 (Curso de Segurança em Instalações Elétricas)

**Trabalho em Altura:**
- NR35 (Curso de Trabalho em Altura)

**Produção Artística:**
- DRT (Registro Profissional)

---

## 🎯 Sistema de Projetos

### Localização
**Rota:** `/admin/projetos`

**O sistema de projetos é o CORE da HRX. Aqui você:**
- Cria projetos de eventos
- Monta equipes de profissionais
- Solicita equipamentos
- Envia cotações para fornecedores
- Calcula custos e lucros

---

### 1️⃣ Lista de Projetos

**O que você vê:**

- 🏷️ Número do projeto (ex: PRJ-2025-001)
- 📅 Nome do evento
- 👤 Cliente
- 📅 Data do evento
- 📍 Local (cidade/estado)
- 🚨 Badge "URGENTE" (se aplicável)
- 📊 Status do projeto
- 💰 Valores (custo, preço cliente, lucro)

**Status dos Projetos:**
- 🆕 **Novo** - Recém criado
- 🔍 **Analisando** - Em análise pela equipe
- 💰 **Cotando** - Solicitando cotações
- ✅ **Cotado** - Cotações recebidas
- 📝 **Proposta Enviada** - Cliente recebeu proposta
- ✅ **Aprovado** - Cliente aprovou
- 🏗️ **Em Execução** - Evento em andamento
- ✅ **Concluído** - Evento finalizado
- ❌ **Cancelado** - Projeto cancelado

**Filtros:**
- 📊 Por status
- 🚨 Apenas urgentes
- 📅 Por data
- 📍 Por cidade/estado

---

### 2️⃣ Criar Novo Projeto

**Clique em "Novo Projeto"**

**Passo a passo:**

**ETAPA 1 - Dados do Cliente**
```
Nome do Cliente: João Silva
Email: joao@empresa.com
Telefone: (11) 98765-4321
Empresa (opcional): Empresa XYZ Ltda
CNPJ (opcional): 12.345.678/0001-90
```

**ETAPA 2 - Detalhes do Evento**
```
Nome do Evento: Festa de Confraternização
Tipo: Corporativo / Social / Cultural / Esportivo / Outro
Data: 15/12/2025
Horário Início: 19:00
Horário Fim: 23:00
Público Esperado: 200 pessoas
Descrição: Evento de fim de ano da empresa...
```

**ETAPA 3 - Localização**
```
Nome do Local: Espaço Premium Eventos
Endereço: Rua das Flores, 123
Cidade: São Paulo
Estado: SP
CEP: 01234-567
```

**ETAPA 4 - Configurações Importantes**

⚠️ **Marcar como URGENTE?**
```
[ ] Evento urgente (menos de 7 dias)
```
- Se marcado: Margem de lucro = **80%**
- Se não marcado: Margem de lucro = **35%**

💰 **Orçamento do Cliente** (opcional)
```
Faixa de orçamento:
( ) Até R$ 10.000
( ) R$ 10.000 - R$ 25.000
( ) R$ 25.000 - R$ 50.000
( ) Acima de R$ 50.000
```

📝 **Observações**
```
Observações do Cliente:
(Ex: "Cliente quer buffet vegetariano")

Notas Internas:
(Ex: "Cliente preferencial - dar desconto extra")
```

**ETAPA 5 - Criar**
- Clique em "Criar Projeto"
- Sistema gera número único (PRJ-2025-XXX)
- Redireciona para detalhes do projeto

---

### 3️⃣ Ver Detalhes do Projeto

**Ao abrir um projeto, você vê:**

**📊 Cards de Resumo Financeiro:**
```
┌─────────────────────────────────────────────┐
│ CUSTO TOTAL: R$ 15.000,00                   │
│   Equipe: R$ 8.000,00                       │
│   Equipamentos: R$ 7.000,00                 │
├─────────────────────────────────────────────┤
│ PREÇO CLIENTE: R$ 20.250,00                 │
├─────────────────────────────────────────────┤
│ LUCRO: R$ 5.250,00                          │
├─────────────────────────────────────────────┤
│ MARGEM: 35%                                 │
│ (ou 80% se urgente)                         │
└─────────────────────────────────────────────┘
```

**📋 Dados do Cliente:**
- Nome, email, telefone
- Empresa e CNPJ (se houver)

**📅 Detalhes do Evento:**
- Nome, tipo, data, horário
- Público esperado
- Descrição

**📍 Localização:**
- Nome do local
- Endereço completo

**👥 Equipe do Projeto:**
- Lista de membros
- Função, categoria, quantidade
- Dias de trabalho
- Diária e custo total
- Status de alocação
- Botão: **[+ Adicionar Membro]**

**📦 Equipamentos:**
- Lista de equipamentos
- Categoria, nome, quantidade
- Dias de locação
- Status (solicitado, cotado, confirmado)
- Fornecedor selecionado (se houver)
- Botão: **[+ Adicionar Equipamento]**
- Botão por item: **[Solicitar Cotações]**

**💰 Cotações Recebidas:**
- Lista de cotações de fornecedores
- Preço fornecedor vs preço HRX
- Margem de lucro aplicada
- Status (pendente, recebida, aceita, rejeitada)
- Ações: Aceitar / Rejeitar

**📧 Emails Enviados:**
- Log de todos emails do projeto
- Tipo, destinatário, status
- Data de envio

**📝 Observações:**
- Observações do cliente
- Notas internas da equipe

**⏱️ Timeline:**
- Histórico de ações do projeto
- Data de criação
- Cotações recebidas
- Proposta enviada
- Aprovação
- Conclusão

---

### 4️⃣ Adicionar Membro à Equipe

**Clique em "[+ Adicionar Membro]" na seção de Equipe**

**Tela do Modal:**

**PASSO 1 - Selecionar Categoria e Função**
```
Categoria: [Segurança ▼]
Função Específica: [Vigilante ▼]
```

🔍 **BUSCA AUTOMÁTICA:**
- Ao selecionar categoria, sistema busca automaticamente profissionais próximos ao local do evento
- Mostra lista de profissionais cadastrados, aprovados e da região
- Exibe: Nome, cidade, telefone, email

**PASSO 2 - Selecionar Profissional (Opcional)**
```
Profissionais Cadastrados Próximos (5):
[ ] João Silva - São Paulo, SP - (11) 98765-4321
[ ] Maria Santos - São Paulo, SP - (11) 99876-5432
...
```

OU

```
Nome do Profissional (Manual):
[ Digite o nome se já souber quem será ]
```

**PASSO 3 - Definir Quantidade e Valores**
```
Quantidade: [1]
Dias de Trabalho: [2]
Diária (R$): [300,00]

Custo Estimado: R$ 600,00
(1 pessoa × 2 dias × R$ 300,00)
```

**PASSO 4 - Observações** (opcional)
```
Observações:
[Ex: "Preferência por profissional com experiência em eventos corporativos"]
```

**PASSO 5 - Adicionar**
- Clique em "Adicionar à Equipe"
- Membro aparece na lista
- Custo é somado ao total do projeto
- Status inicial: "Planejado"

---

### 5️⃣ Adicionar Equipamento

**Clique em "[+ Adicionar Equipamento]" na seção de Equipamentos**

**PASSO 1 - Selecionar Categoria e Tipo**

Sistema mostra **13 categorias em accordion**:

```
▼ Som e Áudio (14 tipos)
  □ Sistema de Som Completo
  □ Line Array
  □ Caixas de Som
  □ Subwoofers
  ...

▼ Iluminação (17 tipos)
  □ Moving Heads
  □ LED PAR
  □ Strobo
  ...

▼ Audiovisual (14 tipos)
  □ Telão LED
  □ Painel LED P3
  □ Projetor 10.000 Lumens
  ...

[+ 10 categorias adicionais...]
```

- Clique na categoria para expandir
- Selecione o tipo desejado
- Fica destacado em vermelho

🔍 **BUSCA AUTOMÁTICA:**
- Ao selecionar tipo, sistema busca fornecedores próximos
- Mostra fornecedores que fornecem aquele equipamento
- Exibe: Nome empresa, cidade, contato, preços

**PASSO 2 - Selecionar Fornecedor (Opcional)**
```
Fornecedores Cadastrados Próximos (3):
[ ] Som & Luz Eventos - São Paulo, SP
    Diária: R$ 500,00 | Semanal: R$ 2.000,00
    ✓ Mesmo município - sem frete adicional

[ ] Audiovisual Pro - Guarulhos, SP
    Diária: R$ 450,00 | Semanal: R$ 1.800,00
    ⚠ Frete a combinar conforme distância
...
```

**PASSO 3 - Descrição e Especificações**
```
Descrição/Especificações:
[Ex: "Caixa de 2000W, entrada XLR, bivolt"]
```

**PASSO 4 - Quantidade e Período**
```
Quantidade: [2]
Dias de Locação: [3]
```

**PASSO 5 - Observações** (opcional)
```
Observações:
[Ex: "Necessário técnico para instalação"]
```

**PASSO 6 - Adicionar**
- Clique em "Adicionar Equipamento"
- Equipamento aparece na lista
- Status inicial: "Solicitado"
- Custo ainda não calculado (depende de cotação)

---

### 6️⃣ Solicitar Cotações

**Para cada equipamento, você pode solicitar cotações de fornecedores**

**PASSO 1 - Clicar em [Solicitar Cotações]**
- Botão aparece ao lado de cada equipamento

**PASSO 2 - Sistema abre modal com fornecedores**
```
Fornecedores Disponíveis para: "Caixa de Som" (8)

🔍 Buscar: [________________]

☑ Som & Luz Eventos
  Contato: João Silva
  Email: contato@someluzeventos.com
  Telefone: (11) 98765-4321
  Diária: R$ 500,00

☑ Audiovisual Pro
  Contato: Maria Santos
  Email: contato@audiovisualpro.com
  Telefone: (11) 99876-5432
  Diária: R$ 450,00

[ ] Studio Sound
  ...

✓ 2 fornecedor(es) será(ão) contatado(s) por email
```

**PASSO 3 - Selecionar Fornecedores**
- Marque os checkboxes dos fornecedores
- Pode selecionar múltiplos
- Recomendado: 3-5 fornecedores para comparar

**PASSO 4 - Enviar**
- Clique em "Solicitar Cotações"
- Sistema automaticamente:
  - 📧 Envia email para cada fornecedor
  - 📝 Cria registro de cotação (status: pendente)
  - ⏰ Define prazo (padrão: 48h)
  - 🔔 Admin recebe notificação quando fornecedor responde

---

### 7️⃣ Gerenciar Cotações Recebidas

**Quando fornecedor responde, você vê na seção "Cotações":**

```
┌──────────────────────────────────────────────┐
│ Som & Luz Eventos                            │
│ Equipamento: Caixa de Som                    │
│                                              │
│ Preço Fornecedor: R$ 500,00                  │
│ Preço HRX: R$ 675,00 (35% lucro)            │
│ Lucro: R$ 175,00                             │
│                                              │
│ Status: Recebida ⏱️                          │
│                                              │
│ [✅ Aceitar]  [❌ Rejeitar]                  │
└──────────────────────────────────────────────┘
```

**Para Aceitar:**
1. Clique em "✅ Aceitar"
2. Sistema:
   - Marca cotação como aceita
   - Vincula fornecedor ao equipamento
   - Adiciona custo ao projeto
   - Envia email de confirmação ao fornecedor
   - Atualiza status do equipamento para "Cotado"

**Para Rejeitar:**
1. Clique em "❌ Rejeitar"
2. Sistema:
   - Marca cotação como rejeitada
   - Envia email ao fornecedor (opcional)
   - Remove da lista de cotações ativas

---

### 8️⃣ Enviar Proposta ao Cliente

**Quando tiver:**
- ✅ Equipe completa
- ✅ Equipamentos cotados
- ✅ Custos calculados

**Você pode:**
1. Revisar valores finais
2. Ajustar margem se necessário
3. Gerar proposta PDF (futuro)
4. Enviar por email ao cliente

**Sistema calcula automaticamente:**
```
CUSTO TOTAL: R$ 15.000,00
  + Equipe: R$ 8.000,00
  + Equipamentos: R$ 7.000,00

MARGEM: 35% (ou 80% se urgente)

PREÇO CLIENTE: R$ 20.250,00
LUCRO HRX: R$ 5.250,00
```

---

## 💰 Sistema de Orçamentos

### Localização
**Rota:** `/admin/orcamentos` (em desenvolvimento)

**Diferença entre Projetos e Orçamentos:**
- **Projetos:** Eventos confirmados, em execução
- **Orçamentos:** Solicitações de clientes, ainda não confirmados

---

## 📋 Solicitações de Clientes

### Localização
**Rota:** `/admin/solicitacoes`

**O que são:**
- Pedidos de contratação enviados por clientes
- Podem ser convertidos em projetos
- Status: Novo, Analisando, Aprovado, Concluído, Cancelado

**Fluxo:**
1. Cliente preenche formulário público
2. Solicitação aparece aqui
3. Admin analisa e cria projeto
4. Projeto segue fluxo normal

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Aprovação de Profissional

```
1. Profissional se cadastra no site
   ↓
2. Admin recebe notificação (badge vermelha)
   ↓
3. Admin acessa /admin/profissionais
   ↓
4. Clica em "Ver Detalhes"
   ↓
5. Revisa todas as informações
   ↓
6. Valida documentos em /admin/documentos
   ↓
7. Se OK: Clica em "Aprovar"
   ↓
8. Profissional recebe email de aprovação
   ↓
9. Profissional aparece em buscas
```

---

### Fluxo 2: Criar Projeto de Evento

```
1. Cliente solicita evento (formulário ou contato)
   ↓
2. Admin acessa /admin/projetos
   ↓
3. Clica em "Novo Projeto"
   ↓
4. Preenche dados do cliente e evento
   ↓
5. Define se é urgente (80%) ou normal (35%)
   ↓
6. Cria projeto
   ↓
7. Adiciona membros da equipe:
   - Seleciona categoria/função
   - Sistema busca profissionais próximos
   - Seleciona ou digita nome
   - Define quantidade, dias, diária
   ↓
8. Adiciona equipamentos:
   - Seleciona categoria/tipo
   - Sistema busca fornecedores próximos
   - Define quantidade, dias, especificações
   ↓
9. Solicita cotações:
   - Para cada equipamento
   - Seleciona múltiplos fornecedores
   - Sistema envia emails
   ↓
10. Aguarda respostas (24-48h)
   ↓
11. Analisa cotações recebidas
   ↓
12. Aceita melhores propostas
   ↓
13. Sistema calcula automaticamente:
    - Custo total
    - Preço cliente (com margem)
    - Lucro HRX
   ↓
14. Envia proposta ao cliente
   ↓
15. Cliente aprova
   ↓
16. Status → "Em Execução"
```

---

### Fluxo 3: Validação de Documentos

```
1. Profissional envia documento
   ↓
2. Badge vermelha aparece em /admin/documentos
   ↓
3. Admin acessa documentos pendentes
   ↓
4. Clica no documento para visualizar
   ↓
5. Verifica:
   - Legibilidade ✓
   - Validade ✓
   - Dados corretos ✓
   ↓
6. Se OK:
   → Aprova
   → Profissional notificado
   ↓
7. Se Não OK:
   → Rejeita com motivo
   → Profissional notificado
   → Profissional pode reenviar
```

---

### Fluxo 4: Solicitação de Cotação

```
1. Admin cria equipamento no projeto
   ↓
2. Clica em "Solicitar Cotações"
   ↓
3. Sistema mostra fornecedores disponíveis
   ↓
4. Admin seleciona 3-5 fornecedores
   ↓
5. Sistema envia emails automaticamente:
   📧 Detalhes do equipamento
   📧 Quantidade e período
   📧 Prazo para resposta (48h)
   📧 Link para responder
   ↓
6. Fornecedores recebem e respondem
   ↓
7. Cotações aparecem no projeto
   ↓
8. Admin analisa e aceita melhor proposta
   ↓
9. Sistema:
   ✓ Vincula fornecedor ao equipamento
   ✓ Adiciona custo ao projeto
   ✓ Calcula preço cliente com margem
   ✓ Notifica fornecedor
```

---

## 💡 Dicas e Boas Práticas

### Gestão de Profissionais

✅ **DO:**
- Valide TODOS os documentos antes de aprovar
- Seja específico ao rejeitar (profissional vai corrigir)
- Mantenha notas internas sobre profissionais
- Responda rapidamente (prazo: 24-48h)

❌ **DON'T:**
- Aprovar sem verificar documentos
- Rejeitar sem motivo claro
- Demorar mais de 3 dias para analisar

---

### Gestão de Fornecedores

✅ **DO:**
- Cadastre TODOS os tipos de equipamento que fornecem
- Mantenha preços atualizados
- Teste o contato antes de solicitar cotação
- Cadastre múltiplos fornecedores por categoria

❌ **DON'T:**
- Deixar fornecedor com apenas 1-2 tipos de equipamento
- Esquecer de atualizar status (ativo/inativo)
- Cadastrar fornecedor sem testar contato

---

### Criação de Projetos

✅ **DO:**
- Marque como urgente APENAS se realmente for (menos de 7 dias)
- Adicione equipe E equipamentos antes de enviar cotações
- Solicite cotações de 3-5 fornecedores para comparar
- Revise valores finais antes de enviar proposta
- Mantenha notas internas sobre decisões

❌ **DON'T:**
- Marcar tudo como urgente (80% de margem deve ser exceção)
- Enviar cotação sem revisar especificações
- Aceitar primeira cotação sem comparar
- Esquecer de adicionar custos de equipe

---

### Análise de Cotações

✅ **DO:**
- Compare preço + qualidade + prazo
- Verifique histórico do fornecedor
- Considere proximidade (frete)
- Negocie se necessário

❌ **DON'T:**
- Aceitar apenas pela menor preço
- Ignorar prazo de entrega
- Esquecer de calcular frete
- Deixar cotações expiradas sem resposta

---

### Comunicação com Clientes

✅ **DO:**
- Seja transparente sobre prazos
- Explique detalhamento de custos
- Mantenha cliente atualizado
- Registre todas comunicações

❌ **DON'T:**
- Prometer prazos impossíveis
- Esconder custos adicionais
- Demorar para responder
- Perder registro de conversas

---

## 🆘 Problemas Comuns e Soluções

### "Não consigo aprovar profissional"

**Possíveis causas:**
1. Documentos ainda pendentes
2. Informações incompletas
3. Erro de permissão

**Solução:**
1. Verifique se TODOS documentos obrigatórios foram validados
2. Confirme que dados essenciais estão preenchidos
3. Verifique se sua conta tem permissão de admin

---

### "Profissionais próximos não aparecem"

**Possíveis causas:**
1. Profissionais sem geolocalização
2. Raio de busca muito pequeno
3. Nenhum profissional aprovado na categoria

**Solução:**
1. Verifique se profissionais têm CEP cadastrado
2. Amplie raio de busca
3. Busque em cidades próximas
4. Cadastre profissional manualmente (nome)

---

### "Fornecedor não recebeu email de cotação"

**Possíveis causas:**
1. Email incorreto
2. Caiu em spam
3. Servidor de email bloqueado

**Solução:**
1. Verifique email do fornecedor
2. Peça para checar spam
3. Reenvie a cotação
4. Contate fornecedor por telefone/WhatsApp

---

### "Cálculo de margem está errado"

**Verificar:**
1. Projeto marcado como urgente? (80% vs 35%)
2. Todos custos adicionados?
3. Cotações aceitas corretamente?

**Solução:**
1. Revise flag de urgência
2. Verifique soma de custos de equipe + equipamentos
3. Recarregue a página

---

## 📞 Suporte

**Problemas técnicos:**
- 📧 Email: suporte@hrxeventos.com.br
- 💬 WhatsApp: (11) XXXXX-XXXX

**Dúvidas sobre processos:**
- Consulte este guia
- Entre em contato com supervisor

---

## 📝 Changelog do Guia

**v1.0 - 22/10/2025**
- Versão inicial
- Todos os módulos documentados
- Fluxos de trabalho completos

---

**Última Atualização:** 22/10/2025
**Próxima Revisão:** A cada nova feature adicionada
