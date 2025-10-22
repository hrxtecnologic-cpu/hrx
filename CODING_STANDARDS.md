# 📘 Padrões de Código - HRX Platform

> **Versão:** 1.0.0
> **Última Atualização:** 2025-10-21
> **Mantenedores:** Equipe HRX Dev

Este documento define os padrões obrigatórios de código para o projeto HRX.

---

## 📋 Índice

1. [Nomenclatura](#nomenclatura)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [TypeScript](#typescript)
4. [API Routes](#api-routes)
5. [Banco de Dados](#banco-de-dados)
6. [Validação](#validação)
7. [Logs e Debug](#logs-e-debug)
8. [Segurança](#segurança)

---

## 1. Nomenclatura

### 1.1 Campos do Banco de Dados

**✅ SEMPRE usar `snake_case` no banco de dados:**

```sql
CREATE TABLE professionals (
  full_name VARCHAR(255),      -- ✅ Correto
  birth_date DATE,             -- ✅ Correto
  cnh_validity DATE,           -- ✅ Correto

  fullName VARCHAR(255),       -- ❌ ERRADO
  birthDate DATE,              -- ❌ ERRADO
  cnhValidity DATE             -- ❌ ERRADO
);
```

### 1.2 Campos no Frontend/Backend

**✅ SEMPRE usar `camelCase` no código TypeScript/JavaScript:**

```typescript
// ✅ Correto
interface Professional {
  fullName: string;
  birthDate: string;
  cnhValidity?: string;
}

// ❌ ERRADO
interface Professional {
  full_name: string;
  birth_date: string;
  cnh_validity?: string;
}
```

### 1.3 Mapeamento de Campos

**Mapa Oficial de Campos:**

| Banco de Dados (snake_case) | Código (camelCase) | Tipo |
|-----------------------------|--------------------|------|
| `full_name` | `fullName` | `string` |
| `birth_date` | `birthDate` | `string` (ISO date) |
| `has_experience` | `hasExperience` | `boolean` |
| `experience_description` | `experienceDescription` | `string` |
| `years_of_experience` | `yearsOfExperience` | `string` |
| `cnh_number` | `cnhNumber` | `string` |
| `cnh_validity` | `cnhValidity` | `string` (ISO date) |
| `cnv_validity` | `cnvValidity` | `string` (ISO date) |
| `nr10_validity` | `nr10Validity` | `string` (ISO date) |
| `nr35_validity` | `nr35Validity` | `string` (ISO date) |
| `drt_validity` | `drtValidity` | `string` (ISO date) |
| `bank_name` | `bankName` | `string` |
| `account_type` | `accountType` | `string` |
| `account_number` | `accountNumber` | `string` |
| `pix_key` | `pixKey` | `string` |
| `accepts_notifications` | `acceptsNotifications` | `boolean` |

**Helper de Conversão:**

```typescript
// src/lib/mappers/professional.ts

/**
 * Converte dados do banco (snake_case) para frontend (camelCase)
 */
export function professionalFromDatabase(dbData: any) {
  return {
    id: dbData.id,
    userId: dbData.user_id,
    clerkId: dbData.clerk_id,
    fullName: dbData.full_name,
    cpf: dbData.cpf,
    birthDate: dbData.birth_date,
    email: dbData.email,
    phone: dbData.phone,

    // Endereço
    cep: dbData.cep,
    street: dbData.street,
    number: dbData.number,
    complement: dbData.complement,
    neighborhood: dbData.neighborhood,
    city: dbData.city,
    state: dbData.state,

    // Experiência
    categories: dbData.categories,
    hasExperience: dbData.has_experience,
    experienceDescription: dbData.experience_description,
    yearsOfExperience: dbData.years_of_experience,

    // Disponibilidade
    availability: dbData.availability,

    // Documentos específicos
    cnhNumber: dbData.cnh_number,
    cnhValidity: dbData.cnh_validity,
    cnvValidity: dbData.cnv_validity,
    nr10Validity: dbData.nr10_validity,
    nr35Validity: dbData.nr35_validity,
    drtValidity: dbData.drt_validity,

    // Dados bancários
    bankName: dbData.bank_name,
    accountType: dbData.account_type,
    agency: dbData.agency,
    accountNumber: dbData.account_number,
    pixKey: dbData.pix_key,

    // Documentos e portfolio
    documents: dbData.documents,
    portfolio: dbData.portfolio,

    // Controle
    status: dbData.status,
    acceptsNotifications: dbData.accepts_notifications,

    // Timestamps
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
    approvedAt: dbData.approved_at,
    approvedBy: dbData.approved_by,
  };
}

/**
 * Converte dados do frontend (camelCase) para banco (snake_case)
 */
export function professionalToDatabase(frontendData: any) {
  return {
    full_name: frontendData.fullName,
    cpf: frontendData.cpf,
    birth_date: frontendData.birthDate,
    email: frontendData.email,
    phone: frontendData.phone,

    // Endereço
    cep: frontendData.cep,
    street: frontendData.street,
    number: frontendData.number,
    complement: frontendData.complement,
    neighborhood: frontendData.neighborhood,
    city: frontendData.city,
    state: frontendData.state,

    // Experiência
    categories: frontendData.categories,
    has_experience: frontendData.hasExperience,
    experience_description: frontendData.experienceDescription,
    years_of_experience: frontendData.yearsOfExperience,

    // Disponibilidade
    availability: frontendData.availability,

    // Documentos específicos
    cnh_number: frontendData.cnhNumber,
    cnh_validity: frontendData.cnhValidity,
    cnv_validity: frontendData.cnvValidity,
    nr10_validity: frontendData.nr10Validity,
    nr35_validity: frontendData.nr35Validity,
    drt_validity: frontendData.drtValidity,

    // Dados bancários
    bank_name: frontendData.bankName,
    account_type: frontendData.accountType,
    agency: frontendData.agency,
    account_number: frontendData.accountNumber,
    pix_key: frontendData.pixKey,

    // Documentos e portfolio
    documents: frontendData.documents,
    portfolio: frontendData.portfolio,

    // Controle
    accepts_notifications: frontendData.acceptsNotifications,
  };
}
```

### 1.4 Variáveis e Funções

```typescript
// ✅ Correto - camelCase
const userProfile = {...};
function fetchUserData() {...}

// ❌ ERRADO - snake_case
const user_profile = {...};
function fetch_user_data() {...}

// ✅ Correto - PascalCase para componentes React
export function UserProfile() {...}
export const ProfileCard = () => {...};

// ✅ Correto - UPPER_CASE para constantes
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_BASE_URL = 'https://api.example.com';
```

---

## 2. Estrutura de Arquivos

### 2.1 Organização de API Routes

```
src/app/api/
├── professionals/              # Recursos públicos
│   ├── route.ts               # POST - criar profissional
│   └── [id]/
│       └── route.ts           # GET/PATCH/DELETE específico
│
├── professional/              # Recursos do próprio usuário
│   ├── profile/
│   │   └── route.ts          # GET/PATCH - próprio perfil
│   └── document-validations/
│       └── route.ts          # GET - próprias validações
│
└── admin/                     # Recursos administrativos
    ├── professionals/
    │   ├── route.ts          # GET - listar todos
    │   └── [id]/
    │       ├── route.ts      # GET/PATCH/DELETE admin
    │       ├── approve/
    │       │   └── route.ts  # POST - aprovar
    │       ├── reject/
    │       │   └── route.ts  # POST - rejeitar
    │       └── documents/
    │           └── route.ts  # GET/PATCH - validar docs
    └── ...
```

### 2.2 Estrutura de Componentes

```
src/components/
├── ui/                        # Componentes básicos reutilizáveis
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
│
├── forms/                     # Componentes de formulário
│   ├── ProfessionalForm.tsx
│   └── DocumentUpload.tsx
│
├── admin/                     # Componentes específicos do admin
│   ├── ProfessionalCard.tsx
│   └── DocumentValidator.tsx
│
└── shared/                    # Componentes compartilhados
    ├── Header.tsx
    └── Footer.tsx
```

---

## 3. TypeScript

### 3.1 Type Safety - NUNCA use `any`

```typescript
// ❌ ERRADO
const [data, setData] = useState<any>(null);
function handleData(item: any) {...}

// ✅ Correto
interface ProfessionalData {
  id: string;
  fullName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
}

const [data, setData] = useState<ProfessionalData | null>(null);
function handleData(item: ProfessionalData) {...}
```

### 3.2 Tipos Compartilhados

**Criar arquivo:** `src/types/professional.ts`

```typescript
export interface Professional {
  id: string;
  userId: string;
  clerkId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;

  // Endereço
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  // Experiência
  categories: string[];
  hasExperience: boolean;
  experienceDescription?: string;
  yearsOfExperience?: string;

  // Disponibilidade
  availability: Availability;

  // Documentos
  documents?: Record<DocumentType, string>;
  portfolio?: string[];

  // Documentos específicos
  cnhNumber?: string;
  cnhValidity?: string;
  cnvValidity?: string;
  nr10Validity?: string;
  nr35Validity?: string;
  drtValidity?: string;

  // Dados bancários
  bankName?: string;
  accountType?: string;
  agency?: string;
  accountNumber?: string;
  pixKey?: string;

  // Controle
  status: ProfessionalStatus;
  acceptsNotifications: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type ProfessionalStatus = 'pending' | 'approved' | 'rejected';

export type DocumentType =
  | 'rg_front'
  | 'rg_back'
  | 'cpf'
  | 'proof_of_address'
  | 'cnh_photo'
  | 'nr10'
  | 'nr35'
  | 'drt'
  | 'cnv';

export interface Availability {
  weekdays: boolean;
  weekends: boolean;
  holidays: boolean;
  night: boolean;
  travel: boolean;
}

export interface DocumentValidation {
  id: string;
  professionalId: string;
  documentType: DocumentType;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. API Routes

### 4.1 Padrão de Resposta

**TODAS as APIs devem retornar no mesmo formato:**

```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// src/lib/api-response.ts
import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}
```

**Uso:**

```typescript
// ✅ Correto
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const data = await fetchData();
    return successResponse(data, 'Dados carregados com sucesso');
  } catch (error) {
    return errorResponse('Erro ao carregar dados', 500);
  }
}

// ❌ ERRADO - Inconsistente
return NextResponse.json({ professional: data });
return NextResponse.json([...data]);
return NextResponse.json({ success: true, data });
```

### 4.2 Tratamento de Erros

```typescript
export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('Não autenticado', 401);
    }

    // Validar input
    const body = await req.json();
    const validatedData = schema.parse(body);

    // Lógica de negócio
    const result = await createProfessional(validatedData);

    return successResponse(result, 'Profissional criado com sucesso', 201);

  } catch (error) {
    console.error('Erro no POST /api/professionals:', error);

    // Erros de validação Zod
    if (error instanceof ZodError) {
      return errorResponse('Dados inválidos', 400);
    }

    // Erros do Supabase
    if (error.code === '23505') {
      return errorResponse('Registro duplicado', 409);
    }

    return errorResponse('Erro interno do servidor', 500);
  }
}
```

---

## 5. Banco de Dados

### 5.1 Migrations

**Regras:**

1. **NUNCA editar migrations já aplicadas**
2. Criar novas migrations para mudanças
3. Usar nomes descritivos com timestamp

```bash
# ✅ Correto
001_users_table.sql
002_professionals_table.sql
003_add_portfolio_column.sql

# ❌ ERRADO
create_all.sql
fix.sql
new_changes.sql
```

### 5.2 Nomenclatura de Tabelas

```sql
-- ✅ Correto - plural, snake_case
CREATE TABLE professionals (...);
CREATE TABLE event_types (...);
CREATE TABLE document_validations (...);

-- ❌ ERRADO
CREATE TABLE Professional (...);
CREATE TABLE eventTypes (...);
CREATE TABLE documentValidation (...);
```

### 5.3 Constraints e Indexes

```sql
-- ✅ Sempre nomear constraints
ALTER TABLE professionals
  ADD CONSTRAINT professionals_cpf_key UNIQUE (cpf),
  ADD CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- ✅ Criar índices em campos frequentemente consultados
CREATE INDEX idx_professionals_status ON professionals(status);
CREATE INDEX idx_professionals_clerk_id ON professionals(clerk_id);
```

---

## 6. Validação

### 6.1 Usar Zod para Validação

```typescript
import { z } from 'zod';

// ✅ Correto
const professionalSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 18;
  }, 'Deve ter no mínimo 18 anos'),
});

// Inferir tipos do schema
export type ProfessionalFormData = z.infer<typeof professionalSchema>;
```

### 6.2 Validação de Documentos por Categoria

```typescript
// src/lib/validations/documents.ts
export const documentRequirements: Record<string, {
  required: DocumentType[];
  fields?: string[];
}> = {
  'Motorista': {
    required: ['rg_front', 'rg_back', 'cpf', 'proof_of_address', 'cnh_photo'],
    fields: ['cnhNumber', 'cnhValidity'],
  },
  'Segurança': {
    required: ['rg_front', 'rg_back', 'cpf', 'proof_of_address', 'cnv'],
    fields: ['cnvValidity'],
  },
  'Eletricista': {
    required: ['rg_front', 'rg_back', 'cpf', 'proof_of_address', 'nr10'],
    fields: ['nr10Validity'],
  },
  // ... outras categorias
};

export function validateDocumentsForCategories(
  categories: string[],
  documents: Record<string, string>
): { valid: boolean; missing: string[] } {
  const allRequired = new Set<DocumentType>();

  categories.forEach(category => {
    const requirements = documentRequirements[category];
    if (requirements) {
      requirements.required.forEach(doc => allRequired.add(doc));
    }
  });

  const missing = Array.from(allRequired).filter(doc => !documents[doc]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
```

---

## 7. Logs e Debug

### 7.1 SEMPRE usar o logger, NUNCA console.log

```typescript
import { logger } from '@/lib/logger';

// ✅ Correto
logger.info('Professional created', { professionalId, email });
logger.debug('Processing documents', { documentCount: docs.length });
logger.error('Failed to save professional', error);
logger.security('Unauthorized access attempt', { userId, ip });

// ❌ ERRADO
console.log('Professional created:', professionalId);
console.log('📦 Documents:', documents);
```

### 7.2 Níveis de Log

```typescript
logger.debug()    // Apenas em desenvolvimento
logger.info()     // Informações gerais
logger.warn()     // Avisos que não impedem execução
logger.error()    // Erros que causam falha
logger.security() // Eventos de segurança
```

---

## 8. Segurança

### 8.1 Rate Limiting

**SEMPRE aplicar rate limiting em endpoints sensíveis:**

```typescript
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse('Não autenticado', 401);
  }

  // ✅ Aplicar rate limit
  const rateLimitResult = await rateLimit(userId, RateLimitPresets.REGISTRATION);
  if (!rateLimitResult.success) {
    return errorResponse('Muitas requisições. Tente novamente mais tarde.', 429);
  }

  // ... resto do código
}
```

### 8.2 Validação de Permissões

```typescript
// ✅ Sempre verificar permissões
const { userId } = await auth();
const { isAdmin } = await checkIsAdmin(userId);

if (!isAdmin) {
  return errorResponse('Acesso negado', 403);
}
```

### 8.3 Sanitização de Dados

```typescript
// ✅ NUNCA confiar em input do usuário
const body = await req.json();

// Validar com Zod
const validatedData = schema.parse(body);

// Remover campos não permitidos
const { acceptsTerms, ...dataToSave } = validatedData;
```

---

## 🎯 Checklist de Code Review

Antes de fazer commit, verifique:

- [ ] Nomenclatura segue padrão (camelCase no código, snake_case no banco)
- [ ] Sem uso de `any` no TypeScript
- [ ] Responses da API seguem padrão `ApiResponse<T>`
- [ ] Validação com Zod implementada
- [ ] Rate limiting em endpoints sensíveis
- [ ] Logs usando `logger`, não `console.log`
- [ ] Tratamento de erros adequado
- [ ] Tipos TypeScript definidos
- [ ] Sem código comentado ou dead code
- [ ] Migrations não conflitam com existentes

---

## 📚 Referências

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Zod Documentation](https://zod.dev/)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/best-practices)

---

**Mantenha este documento atualizado!** Qualquer mudança de padrão deve ser documentada aqui.
