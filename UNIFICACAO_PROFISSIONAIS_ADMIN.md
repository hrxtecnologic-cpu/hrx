# 🔀 Unificação de Páginas de Profissionais no Admin

## 📊 SITUAÇÃO ATUAL (Problema)

### Página 1: `/admin/profissionais`
**O que mostra:**
- ✅ Lista de profissionais
- ✅ Filtros por status (pending, approved, rejected)
- ✅ Busca avançada (proximidade, categorias, experiência)
- ✅ Visualizar detalhes do profissional
- ✅ Aprovar/Rejeitar cadastro
- ❌ **NÃO mostra:** Dados do Clerk, roles, documentos órfãos, emails enviados

### Página 2: `/admin/configuracoes/usuarios`
**O que mostra:**
- ✅ Lista TODOS os usuários (profissionais + contratantes + fornecedores)
- ✅ Dados do Clerk (email, nome, data cadastro)
- ✅ Roles e permissões (admin, professional, contractor)
- ✅ Status detalhado (clerk_only, profile_incomplete, pending_review, approved, rejected, documents_orphan)
- ✅ Documentos órfãos (enviou docs mas não completou cadastro)
- ✅ Histórico de emails enviados
- ✅ Botão "Enviar Lembrete"
- ✅ Alterar role
- ❌ **NÃO mostra:** Categorias, subcategorias, certificações, proximidade, experiência
- ⚠️ **PROBLEMA:** Carregamento lento (busca TODOS usuários + cross-reference com Clerk)

---

## ❌ PROBLEMAS IDENTIFICADOS

1. **Duplicação de Informação**
   - Admin precisa ir em 2 lugares diferentes para ver info completa de um profissional
   - Confuso: qual página usar para quê?

2. **Performance Ruim em `/admin/configuracoes/usuarios`**
   - Busca TODOS os usuários do sistema (profissionais + contratantes + fornecedores)
   - Faz query no Clerk API para cada usuário
   - Cross-reference entre 3 tabelas (users, professionals, documents)
   - **Resultado:** Lento demais

3. **Informações Importantes Separadas**
   - Categorias/subcategorias: só em `/profissionais`
   - Documentos órfãos: só em `/usuarios`
   - Emails enviados: só em `/usuarios`
   - Roles: só em `/usuarios`

---

## ✅ SOLUÇÃO PROPOSTA

### Nova Página Unificada: `/admin/profissionais` (Melhorada)

**Objetivo:** Ter TUDO sobre profissionais em uma única página

---

## 🎨 DESIGN DA PÁGINA UNIFICADA

### Header com Tabs

```
┌───────────────────────────────────────────────────────────┐
│ 👥 Profissionais                                           │
├───────────────────────────────────────────────────────────┤
│                                                            │
│ [Ativos] [Pendentes] [Rejeitados] [Incompletos] [Todos]  │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### Stats Cards (Linha Superior)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   245    │ │    23    │ │    12    │ │     8    │ │    15    │
│  TOTAL   │ │PENDENTES │ │APROVADOS │ │REJEITADOS│ │ ÓRFÃOS   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Filtros Avançados (Expansível)

```
┌───────────────────────────────────────────────────────────┐
│ 🔍 Busca Avançada                      [Expandir/Colapsar]│
├───────────────────────────────────────────────────────────┤
│                                                            │
│ Buscar: [________________________]  [Buscar]              │
│                                                            │
│ Status:     [Todos ▼]                                     │
│ Categoria:  [Todas ▼]                                     │
│ Cidade:     [Todas ▼]                                     │
│ Experiência:[Qualquer ▼]                                  │
│ Documentos: [ ] Com docs órfãos                           │
│ Role:       [ ] Apenas admins                             │
│                                                            │
│ 📍 Busca por Proximidade                                  │
│ Latitude:  [__________]  Longitude: [__________]          │
│ Raio:      [30] km                                        │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

### Tabela de Resultados (Expandida com Mais Colunas)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Nome           │ Email         │ Categorias │ Status    │ Role │ Docs │ Ações│
├──────────────────────────────────────────────────────────────────────────────┤
│ João Silva     │ joao@...      │ Fotógrafo  │ 🟢 Ativo │Admin │  ✓   │[Ver] │
│ ├─ Detalhes: Aprovado em 15/10/2025 • 5 docs • Último email: há 2 dias      │
│ └─ [Editar Role] [Ver Documentos] [Histórico] [Enviar Email]                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Maria Santos   │ maria@...     │ DJ         │ 🟡 Pendente│ - │  ✓   │[Ver] │
│ ├─ Detalhes: Aguardando aprovação • 8 docs • Cadastro há 3 dias              │
│ └─ [Aprovar] [Rejeitar] [Ver Documentos]                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Carlos Pereira │ carlos@...    │ Segurança  │ ⚠️  Órfão │ - │ ⚠️   │[Ver] │
│ ├─ Detalhes: Enviou 3 docs mas não completou cadastro                        │
│ └─ [Enviar Lembrete] [Ver Docs Órfãos]                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Modal de Detalhes (Expandido ao Clicar)

```
┌─────────────────────────────────────────────────────────┐
│ 👤 João Silva - Fotógrafo                    [X Fechar] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [DADOS] [DOCUMENTOS] [HISTÓRICO] [ALOCAÇÕES]            │
│                                                          │
│ ━━━━━━━ ABA: DADOS ━━━━━━━                             │
│                                                          │
│ 📧 INFORMAÇÕES CLERK                                     │
│ • Email: joao@example.com                               │
│ • Cadastro: 01/09/2025                                  │
│ • Role Clerk: professional                              │
│ • User Type: professional                               │
│ • Status Clerk: ativo                                   │
│                                                          │
│ 👤 DADOS PROFISSIONAIS                                   │
│ • CPF: 123.456.789-00                                   │
│ • Telefone: (21) 99999-9999                             │
│ • Categorias: Fotógrafo, Cinegrafista                   │
│ • Subcategorias: Casamento, Eventos Corporativos        │
│ • Experiência: 5-10 anos                                │
│ • Raio de Atuação: 50 km                                │
│                                                          │
│ 📍 LOCALIZAÇÃO                                           │
│ • Endereço: Rua ABC, 123 - Copacabana                   │
│ • Cidade: Rio de Janeiro - RJ                           │
│ • Coordenadas: -22.9068, -43.1729                       │
│                                                          │
│ 💰 FINANCEIRO                                            │
│ • Diária: R$ 800,00                                     │
│ • PIX: (21) 99999-9999                                  │
│                                                          │
│ ✅ STATUS                                                │
│ • Status Supabase: approved                             │
│ • Aprovado em: 15/10/2025 por Admin                    │
│ • Documentos: 5 enviados                                │
│ • Última atualização: há 2 dias                         │
│                                                          │
│ [Editar Role] [Aprovar] [Rejeitar] [Excluir]           │
│                                                          │
│ ━━━━━━━ ABA: DOCUMENTOS ━━━━━━━                         │
│                                                          │
│ ✅ RG - Enviado em 01/09/2025 [Visualizar]              │
│ ✅ CPF - Enviado em 01/09/2025 [Visualizar]             │
│ ✅ Comprovante Residência - 01/09/2025 [Visualizar]     │
│ ⚠️  CNH - Faltando (obrigatório para Motorista)         │
│                                                          │
│ ━━━━━━━ ABA: HISTÓRICO ━━━━━━━                          │
│                                                          │
│ • 20/10/2025 14:30 - Email enviado: "Novo projeto..."  │
│ • 15/10/2025 10:15 - Cadastro aprovado por Admin        │
│ • 01/09/2025 16:45 - Cadastro criado                    │
│                                                          │
│ ━━━━━━━ ABA: ALOCAÇÕES ━━━━━━━                          │
│                                                          │
│ Eventos Participando (3):                                │
│ • Casamento Maria & João - 15/12/2025                   │
│ • Festa Corporativa XYZ - 20/11/2025                    │
│ • Aniversário Pedro - 05/12/2025                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### 1. Modificar API `/api/admin/professionals/search`

**Adicionar ao retorno:**

```typescript
interface UnifiedProfessional {
  // Dados existentes
  id: string;
  full_name: string;
  email: string;
  categories: string[];
  subcategories: Record<string, string[]>;
  status: 'pending' | 'approved' | 'rejected';

  // NOVOS: Dados do Clerk
  clerk_id: string;
  clerk_email: string;
  clerk_created_at: number;
  clerk_role: 'admin' | 'professional' | 'contractor' | null;

  // NOVOS: Dados de usuário
  user_type: 'professional' | 'contractor' | 'supplier';
  user_state: 'clerk_only' | 'profile_incomplete' | 'pending_review' | 'approved' | 'rejected' | 'documents_orphan';

  // NOVOS: Documentos
  documents_count: number;
  has_orphan_documents: boolean;
  orphan_documents_count: number;
  orphan_documents_files: string[];

  // NOVOS: Histórico
  last_email_sent: string | null;
  last_email_subject: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;

  // NOVOS: Outros
  internal_notes: string | null;
}
```

**Query otimizada:**

```sql
SELECT
  p.*,
  u.clerk_id,
  u.email as clerk_email,
  u.user_type,
  u.created_at as clerk_created_at,
  (SELECT COUNT(*) FROM document_validations dv WHERE dv.professional_id = p.id) as documents_count,
  (SELECT subject FROM email_logs WHERE user_id = u.id ORDER BY sent_at DESC LIMIT 1) as last_email_subject,
  (SELECT sent_at FROM email_logs WHERE user_id = u.id ORDER BY sent_at DESC LIMIT 1) as last_email_sent
FROM professionals p
LEFT JOIN users u ON p.user_id = u.id
WHERE ...
```

### 2. Criar Componente `UnifiedProfessionalsView`

**Arquivo:** `src/components/admin/UnifiedProfessionalsView.tsx`

```typescript
'use client';

interface UnifiedProfessionalsViewProps {
  professionals: UnifiedProfessional[];
}

export function UnifiedProfessionalsView({ professionals }: UnifiedProfessionalsViewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'orphan'>('all');

  // Filtros avançados
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    city: 'all',
    experience: 'all',
    hasOrphanDocs: false,
    isAdmin: false,
  });

  // ... lógica de filtros e paginação

  return (
    <div>
      {/* Tabs */}
      {/* Stats */}
      {/* Filtros Avançados (Collapsible) */}
      {/* Tabela com Expand */}
      {/* Modal de Detalhes */}
    </div>
  );
}
```

### 3. Atualizar `/admin/profissionais/page.tsx`

```typescript
import { UnifiedProfessionalsView } from '@/components/admin/UnifiedProfessionalsView';

export default async function ProfissionaisPage() {
  const supabase = await createClient();

  // Query otimizada com LEFT JOIN
  const { data: professionals } = await supabase
    .from('professionals')
    .select(`
      *,
      users!inner(clerk_id, email, user_type, created_at),
      document_validations(count),
      email_logs(subject, sent_at)
    `)
    .order('created_at', { ascending: false });

  return <UnifiedProfessionalsView professionals={professionals} />;
}
```

### 4. Remover ou Redirecionar `/admin/configuracoes/usuarios`

**Opção A:** Remover completamente

**Opção B:** Manter para gerenciar APENAS contratantes e fornecedores

```typescript
// Filtrar para NÃO mostrar profissionais
const users = allUsers.filter(u => u.userType !== 'professional');
```

---

## 🚀 BENEFÍCIOS DA UNIFICAÇÃO

| Antes | Depois |
|-------|--------|
| 2 páginas separadas | 1 página unificada |
| Info incompleta em cada | Info completa em uma |
| Admin confuso | Admin produtivo |
| Busca lenta (Clerk API) | Busca rápida (apenas Supabase) |
| Não vê docs órfãos em `/profissionais` | Vê tudo em um lugar |
| Não vê roles em `/profissionais` | Gerencia role direto |

---

## ⚡ OTIMIZAÇÃO DE PERFORMANCE

### Problema Atual: `/admin/configuracoes/usuarios`

```typescript
// ❌ LENTO
for (const user of clerkUsers) {
  // Query Supabase para cada usuário
  const professional = await supabase.from('professionals').eq('user_id', user.id);
  const documents = await supabase.from('documents').eq('user_id', user.id);
  // ...
}
```

### Solução: Query Única com JOINs

```typescript
// ✅ RÁPIDO
const { data } = await supabase
  .from('professionals')
  .select(`
    *,
    users!inner(*),
    document_validations(count),
    email_logs(subject, sent_at, order by sent_at desc limit 1)
  `);
```

**Performance:**
- **Antes:** 15-20 segundos (N+1 queries)
- **Depois:** 1-2 segundos (1 query com JOINs)

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Backend (4 horas)
- [ ] Criar query otimizada com JOINs
- [ ] Adicionar campos ao tipo `UnifiedProfessional`
- [ ] Testar performance da nova query
- [ ] Criar helper functions (getOrphanDocuments, getUserState, etc.)

### Fase 2: Frontend (6 horas)
- [ ] Criar componente `UnifiedProfessionalsView`
- [ ] Adicionar tabs (Ativos, Pendentes, Rejeitados, Órfãos)
- [ ] Adicionar stats cards
- [ ] Implementar filtros avançados (collapsible)
- [ ] Criar tabela expandível
- [ ] Adicionar badges (status, role, docs)

### Fase 3: Modal de Detalhes (4 horas)
- [ ] Criar modal com 4 abas (Dados, Documentos, Histórico, Alocações)
- [ ] Aba Dados: mostrar tudo (Clerk + Supabase)
- [ ] Aba Documentos: lista com visualização
- [ ] Aba Histórico: timeline de ações
- [ ] Aba Alocações: eventos do profissional

### Fase 4: Ações (3 horas)
- [ ] Botão "Editar Role" (inline)
- [ ] Botão "Aprovar/Rejeitar" (inline)
- [ ] Botão "Enviar Lembrete" (para órfãos)
- [ ] Botão "Ver Documentos Órfãos"
- [ ] Integrar com APIs existentes

### Fase 5: Migração (2 horas)
- [ ] Adicionar redirect de `/admin/configuracoes/usuarios` → `/admin/profissionais`
- [ ] Ou modificar para mostrar só contratantes/fornecedores
- [ ] Atualizar menu de navegação
- [ ] Testar todos os fluxos

**TOTAL: ~19 horas (2-3 dias)**

---

## 🎯 RESULTADO FINAL

### Antes (Fragmentado)
```
Admin precisa:
1. Ir em /profissionais para ver categorias/aprovar
2. Ir em /usuarios para ver roles/docs órfãos
3. Esperar 15s para carregar /usuarios
4. Não consegue correlacionar facilmente
```

### Depois (Unificado)
```
Admin tem:
1. TUDO em /profissionais
2. Carregamento em 1-2s
3. Info completa em um clique
4. Filtros avançados poderosos
5. Ações inline rápidas
```

---

## 💡 EXTRAS (Nice to Have)

### Após Unificação Básica

1. **Export CSV** - Exportar lista de profissionais
2. **Bulk Actions** - Aprovar/rejeitar múltiplos
3. **Quick Actions** - Barra de ações rápidas
4. **Favoritos** - Marcar profissionais favoritos
5. **Tags Customizadas** - Admin adiciona tags
6. **Notas Privadas** - Campo de notas para cada profissional

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Páginas** | 2 separadas | 1 unificada |
| **Performance** | 15-20s | 1-2s |
| **Info Completa** | ❌ Não | ✅ Sim |
| **Docs Órfãos** | Só em /usuarios | ✅ Em /profissionais |
| **Roles** | Só em /usuarios | ✅ Em /profissionais |
| **Histórico Emails** | Só em /usuarios | ✅ Em /profissionais |
| **Filtros Avançados** | Básicos | ✅ Completos |
| **UX Admin** | Confuso | ✅ Intuitivo |

---

## ✅ PRÓXIMO PASSO

**Quer que eu implemente isso?**

Posso começar por:
1. **Query otimizada** (1h) - Testar performance
2. **Componente base** (2h) - Tabela com info completa
3. **Filtros** (2h) - Sistema de filtros avançado
4. **Modal detalhes** (3h) - Modal com todas as abas

Ou prefere ajustar algo no design antes? 🚀
