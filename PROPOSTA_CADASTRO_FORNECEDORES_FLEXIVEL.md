# 📦 PROPOSTA: Cadastro de Fornecedores Flexível e Intuitivo

**Data:** 27 de Outubro de 2025
**Status:** 📝 PROPOSTA

---

## 🎯 OBJETIVO

Criar um sistema **COMPLETO, FLEXÍVEL E INTUITIVO** para cadastrar fornecedores parceiros com **ESPECIFICAÇÕES DETALHADAS** de cada serviço/equipamento.

---

## ❌ PROBLEMA ATUAL

### Estrutura Atual no Banco de Dados:
```sql
equipment_types: TEXT[] -- Array simples de strings
pricing: JSONB -- Livre mas sem estrutura
```

### Problemas Identificados:

1. **Muito Vago:**
   - "Sistema de Som Completo" → Para 500 ou 5000 pessoas? 🤷
   - Não tem como especificar capacidade, potência, marca

2. **Sem Detalhamento:**
   - Preço único por item (não diferencia tamanhos/capacidades)
   - Sem informações técnicas
   - Sem fotos/portfólio

3. **Não Tem Categorias/Subcategorias:**
   - Diferente de profissionais (que tem)
   - Dificulta organização e busca

4. **Formulário Limitado:**
   - Checkbox simples de tipos
   - Não permite adicionar detalhes
   - Não é intuitivo

---

## ✅ SOLUÇÃO PROPOSTA

### 1. Nova Estrutura de Dados

#### Migration: Adicionar campos JSONB flexíveis

```sql
-- Adicionar à tabela equipment_suppliers
ALTER TABLE equipment_suppliers
ADD COLUMN equipment_catalog JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN equipment_suppliers.equipment_catalog IS
'Catálogo detalhado de equipamentos/serviços do fornecedor. Estrutura flexível com especificações completas.';
```

#### Estrutura do Catálogo (JSONB):

```typescript
interface EquipmentCatalogItem {
  // Identificação
  id: string; // UUID único do item
  category: string; // "som_audio", "iluminacao", etc
  subcategory: string; // "sistema_som_completo", "line_array", etc

  // Detalhamento LIVRE
  name: string; // "Sistema de Som Completo - 500 pessoas"
  description: string; // Descrição detalhada

  // Especificações Técnicas (LIVRE)
  specifications: {
    [key: string]: string | number;
    // Exemplos:
    // capacidade_pessoas: 500
    // potencia_rms: "10.000W"
    // marca: "JBL"
    // modelo: "VRX932LA"
    // quantidade_caixas: 4
    // quantidade_subs: 2
    // alcance_metros: 50
  };

  // Pricing Detalhado
  pricing: {
    daily?: number;          // Diária
    three_days?: number;     // 3 dias
    weekly?: number;         // Semanal
    monthly?: number;        // Mensal
    custom_periods?: {       // Períodos customizados
      period: string;        // "Final de semana", "Feriado", etc
      price: number;
    }[];
  };

  // Extras/Adicionais
  extras?: {
    name: string;            // "Técnico de som", "Transporte", etc
    price: number;
    unit: string;            // "por dia", "por hora", "fixo"
  }[];

  // Mídia
  photos?: string[];         // URLs de fotos
  videos?: string[];         // URLs de vídeos
  documents?: string[];      // PDFs técnicos, catálogos

  // Disponibilidade
  availability: {
    status: 'available' | 'unavailable' | 'limited';
    quantity: number;        // Quantidade disponível
    min_rental_days?: number; // Mínimo de dias de locação
    notes?: string;
  };

  // Metadata
  created_at: string;
  updated_at: string;
  is_featured: boolean;      // Destaque no catálogo
  is_active: boolean;        // Ativo/Inativo
}
```

---

### 2. Interface do Formulário

#### 2.1. Wizard de Cadastro de Item

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Adicionar Item ao Catálogo                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ PASSO 1: Categoria                                          │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Selecione a categoria:                               │   │
│ │ [Som e Áudio ▼]                                      │   │
│ │                                                       │   │
│ │ Subcategoria:                                        │   │
│ │ [Sistema de Som Completo ▼]                          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ PASSO 2: Informações Básicas                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Nome do Item: *                                      │   │
│ │ [Sistema de Som 500 pessoas - Line Array]           │   │
│ │                                                       │   │
│ │ Descrição Detalhada:                                │   │
│ │ ┌────────────────────────────────────────────────┐  │   │
│ │ │ Sistema profissional com:                       │  │   │
│ │ │ - 4x JBL VRX932LA (line array)                  │  │   │
│ │ │ - 2x JBL VRX918SP (subwoofer)                   │  │   │
│ │ │ - Mesa digital X32                              │  │   │
│ │ │ - Processador DBX DriveRack                     │  │   │
│ │ │ - Microfones sem fio Shure                      │  │   │
│ │ │                                                   │  │   │
│ │ │ Ideal para eventos de até 500 pessoas.          │  │   │
│ │ └────────────────────────────────────────────────┘  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ PASSO 3: Especificações Técnicas                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ + Adicionar Especificação                            │   │
│ │                                                       │   │
│ │ ┌─────────────────┬────────────────┬──────┐          │   │
│ │ │ Campo           │ Valor          │ Ação │          │   │
│ │ ├─────────────────┼────────────────┼──────┤          │   │
│ │ │ Capacidade      │ 500 pessoas    │ [X]  │          │   │
│ │ │ Potência RMS    │ 10.000W        │ [X]  │          │   │
│ │ │ Marca           │ JBL            │ [X]  │          │   │
│ │ │ Alcance         │ 50 metros      │ [X]  │          │   │
│ │ │ Qtd. Caixas     │ 4              │ [X]  │          │   │
│ │ │ Qtd. Subwoofers │ 2              │ [X]  │          │   │
│ │ └─────────────────┴────────────────┴──────┘          │   │
│ │                                                       │   │
│ │ [+ Nova Especificação]                               │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ PASSO 4: Preços                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Diária:        [R$ 2.500,00]                         │   │
│ │ 3 Dias:        [R$ 6.500,00]    (salvo: R$ 1.000)   │   │
│ │ Semanal:       [R$ 12.000,00]   (salvo: R$ 5.500)   │   │
│ │ Mensal:        [R$ 35.000,00]   (salvo: R$ 40.000)  │   │
│ │                                                       │   │
│ │ Períodos Customizados:                               │   │
│ │ ┌─────────────────┬────────────┬──────┐             │   │
│ │ │ Período         │ Preço      │ Ação │             │   │
│ │ ├─────────────────┼────────────┼──────┤             │   │
│ │ │ Final de Semana │ R$ 5.000   │ [X]  │             │   │
│ │ │ Feriado         │ R$ 3.500   │ [X]  │             │   │
│ │ └─────────────────┴────────────┴──────┘             │   │
│ │ [+ Novo Período]                                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ PASSO 5: Extras/Adicionais                                  │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ┌─────────────────┬────────────┬─────────┬──────┐   │   │
│ │ │ Item            │ Preço      │ Unidade │ Ação │   │   │
│ │ ├─────────────────┼────────────┼─────────┼──────┤   │   │
│ │ │ Técnico de Som  │ R$ 800     │ /dia    │ [X]  │   │   │
│ │ │ Transporte      │ R$ 500     │ fixo    │ [X]  │   │   │
│ │ │ Montagem        │ R$ 400     │ fixo    │ [X]  │   │   │
│ │ │ Operador Extra  │ R$ 120     │ /hora   │ [X]  │   │   │
│ │ └─────────────────┴────────────┴─────────┴──────┘   │   │
│ │ [+ Novo Extra]                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ PASSO 6: Fotos e Vídeos                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Fotos: [Upload] ou [URL]                             │   │
│ │ ┌─────┐ ┌─────┐ ┌─────┐                             │   │
│ │ │ IMG │ │ IMG │ │ IMG │ [+ Adicionar]               │   │
│ │ └─────┘ └─────┘ └─────┘                             │   │
│ │                                                       │   │
│ │ Vídeos: (YouTube, Vimeo, etc)                        │   │
│ │ [https://youtube.com/watch?v=...]                    │   │
│ │ [+ Adicionar Vídeo]                                  │   │
│ │                                                       │   │
│ │ Documentos Técnicos: (PDFs, catálogos)               │   │
│ │ [catalogo_jbl.pdf]  [X]                              │   │
│ │ [+ Upload PDF]                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ PASSO 7: Disponibilidade                                    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Status:          [Disponível ▼]                      │   │
│ │ Quantidade:      [2 unidades]                        │   │
│ │ Mínimo de dias:  [1 dia]                             │   │
│ │                                                       │   │
│ │ Observações:                                         │   │
│ │ [Requer agendamento com 7 dias de antecedência]     │   │
│ │                                                       │   │
│ │ [ ] Item em destaque (aparece primeiro)             │   │
│ │ [✓] Item ativo                                       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│                 [Cancelar]  [Salvar Item]                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Visualização do Catálogo

#### 3.1. Lista de Itens do Fornecedor

```
┌─────────────────────────────────────────────────────────────┐
│ Som e Áudio (3 itens)                          [+ Novo Item]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🎵 Sistema de Som 500 pessoas - Line Array          │   │
│ │ ────────────────────────────────────────────────────│   │
│ │ • Capacidade: 500 pessoas                           │   │
│ │ • Potência: 10.000W RMS                             │   │
│ │ • Marca: JBL                                        │   │
│ │                                                      │   │
│ │ 💰 Diária: R$ 2.500 | Semanal: R$ 12.000           │   │
│ │                                                      │   │
│ │ 📦 Disponível (2 unidades)                          │   │
│ │                                                      │   │
│ │ [Editar] [Duplicar] [Desativar] [Excluir]          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🎵 Sistema de Som 2000 pessoas - Grande Porte       │   │
│ │ ────────────────────────────────────────────────────│   │
│ │ • Capacidade: 2000 pessoas                          │   │
│ │ • Potência: 40.000W RMS                             │   │
│ │ • Marca: L-Acoustics                                │   │
│ │                                                      │   │
│ │ 💰 Diária: R$ 8.500 | Semanal: R$ 45.000           │   │
│ │                                                      │   │
│ │ ⚠️  Limitado (1 unidade)                            │   │
│ │                                                      │   │
│ │ [Editar] [Duplicar] [Desativar] [Excluir]          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 BENEFÍCIOS

### 1. **Flexibilidade Total**
- ✅ Especificações customizadas por item
- ✅ Não fica preso a campos fixos
- ✅ Admin define o que é relevante

### 2. **Detalhamento Completo**
- ✅ Capacidade clara (500 vs 5000 pessoas)
- ✅ Especificações técnicas
- ✅ Fotos e vídeos
- ✅ Catálogos PDF

### 3. **Pricing Inteligente**
- ✅ Múltiplos períodos (dia, semana, mês)
- ✅ Períodos customizados (final de semana, feriado)
- ✅ Extras/adicionais (técnico, transporte)

### 4. **Organização**
- ✅ Catálogo por categoria
- ✅ Fácil de buscar e filtrar
- ✅ Duplicar itens similares

### 5. **UX Premium**
- ✅ Intuitivo para cadastrar
- ✅ Visual claro
- ✅ Fácil de editar

---

## 📋 IMPLEMENTAÇÃO

### Fase 1: Backend (3 horas)
- [ ] Migration: adicionar `equipment_catalog` JSONB
- [ ] API: CRUD de itens do catálogo
  - `POST /api/admin/suppliers/[id]/catalog` - Criar item
  - `GET /api/admin/suppliers/[id]/catalog` - Listar itens
  - `PATCH /api/admin/suppliers/[id]/catalog/[itemId]` - Editar item
  - `DELETE /api/admin/suppliers/[id]/catalog/[itemId]` - Deletar item
- [ ] Validação Zod para estrutura do catálogo

### Fase 2: Frontend - Formulário (5 horas)
- [ ] Componente `EquipmentCatalogForm` (wizard 7 passos)
- [ ] Input dinâmico de especificações (key-value pairs)
- [ ] Upload de fotos/vídeos/documentos
- [ ] Pricing com períodos customizados
- [ ] Extras/adicionais dinâmicos

### Fase 3: Frontend - Visualização (3 horas)
- [ ] Componente `EquipmentCatalogList`
- [ ] Card de item com todos os detalhes
- [ ] Filtro por categoria
- [ ] Busca por nome/especificações
- [ ] Ações: Editar, Duplicar, Desativar, Excluir

### Fase 4: Integração (2 horas)
- [ ] Integrar na página de fornecedores
- [ ] Modal de detalhes do item
- [ ] Preview para cliente (futura página pública)

**TOTAL: ~13 horas**

---

## 🚀 RESULTADO FINAL

### Antes:
```
"Sistema de Som Completo" → ??? (sem detalhes)
Preço: R$ 2.500/dia (único)
```

### Depois:
```
"Sistema de Som 500 pessoas - Line Array"
• Capacidade: 500 pessoas
• Potência: 10.000W RMS
• Marca: JBL VRX932LA
• Alcance: 50m
• 4x Caixas + 2x Subs
• Mesa X32 + Processador DBX
• [3 fotos] [1 vídeo] [PDF técnico]

Preços:
• Diária: R$ 2.500
• 3 dias: R$ 6.500 (economize R$ 1.000)
• Semanal: R$ 12.000
• Final de semana: R$ 5.000

Extras:
• Técnico: R$ 800/dia
• Transporte: R$ 500 (fixo)
• Montagem: R$ 400 (fixo)

Disponível: 2 unidades
```

---

## ❓ PRÓXIMOS PASSOS

**Quer que eu implemente isso?**

Posso começar por:
1. Migration + API (backend)
2. Formulário wizard (frontend)
3. Visualização do catálogo

**Ou prefere ajustar algo no design antes?** 🚀
