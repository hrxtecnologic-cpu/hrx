# 📚 HRX Platform - API Documentation

> **Versão:** 1.0.0
> **Última Atualização:** 2025-10-21
> **Base URL:** `https://seu-dominio.com/api`

---

## 📋 Índice

- [Autenticação](#-autenticação)
- [Rate Limiting](#-rate-limiting)
- [Códigos de Erro](#-códigos-de-erro)
- [Endpoints](#-endpoints)
  - [👤 Profissionais](#-profissionais)
  - [👔 Admin - Profissionais](#-admin---profissionais)
  - [🏢 Contratantes](#-contratantes)
  - [📋 Solicitações](#-solicitações)
  - [⚙️ Admin - Categorias & Tipos de Evento](#️-admin---categorias--tipos-de-evento)
  - [🛠️ Admin - Fornecedores](#️-admin---fornecedores)
  - [👥 Admin - Usuários](#-admin---usuários)
  - [📧 Contato & Email](#-contato--email)
  - [🔗 Webhooks](#-webhooks)
  - [🐛 Debug](#-debug)

---

## 🔐 Autenticação

Todas as rotas (exceto públicas) requerem autenticação via **Clerk**.

### Headers Obrigatórios

```http
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

### Tipos de Usuário

| Tipo | `user_type` | Permissões |
|------|-------------|------------|
| **Profissional** | `professional` | Acesso a rotas `/api/professionals/*` |
| **Contratante** | `contractor` | Acesso a rotas `/api/contractors/*` e `/api/requests/*` |
| **Admin** | - | Acesso total (via `role: 'admin'` ou `ADMIN_EMAILS`) |

### Como se Tornar Admin

**Opção 1:** Adicionar email no `.env.local`
```env
ADMIN_EMAILS=admin@hrx.com,manager@hrx.com
```

**Opção 2:** Atualizar role no banco
```sql
UPDATE users SET role = 'admin' WHERE clerk_id = 'user_xxx';
```

---

## ⏱️ Rate Limiting

Proteção contra abuso de API usando Redis (via Upstash).

### Limites por Rota

| Rota | Limite | Janela | Descrição |
|------|--------|--------|-----------|
| `POST /api/professionals` | 3 req | 1 hora | Criação de cadastro |
| `POST /api/contractors` | 5 req | 1 hora | Criação de contratante |
| `POST /api/requests` | 10 req | 1 hora | Criação de solicitação |
| `POST /api/contact` | 5 req | 15 min | Formulário de contato |
| `POST /api/send` | 10 req | 1 hora | Envio de emails |
| Outras rotas | 100 req | 15 min | Rate limit geral |

### Response quando exceder limite

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in X seconds.",
  "retryAfter": 3600
}
```

**Status Code:** `429 Too Many Requests`

**Headers:**
```http
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698765432
```

---

## ❌ Códigos de Erro

### Status Codes Padrão

| Code | Significado | Quando Ocorre |
|------|-------------|---------------|
| `200` | OK | Operação bem-sucedida (GET, PATCH, DELETE) |
| `201` | Created | Recurso criado com sucesso (POST) |
| `400` | Bad Request | Dados inválidos, validação falhou |
| `401` | Unauthorized | Não autenticado (token missing/inválido) |
| `403` | Forbidden | Sem permissão (não é admin, tipo errado) |
| `404` | Not Found | Recurso não encontrado |
| `409` | Conflict | Duplicação (CPF, email, etc) |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Erro no servidor |

### Formato de Erro Padrão

```json
{
  "error": "Mensagem de erro curta",
  "details": "Detalhes adicionais (apenas em development)",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-21T14:30:00Z"
}
```

### Erros de Validação (Zod)

```json
{
  "error": "Validation failed",
  "details": {
    "fullName": ["Nome completo é obrigatório"],
    "cpf": ["CPF inválido"],
    "email": ["Email inválido"]
  }
}
```

---

## 🚀 Endpoints

---

## 👤 Profissionais

### 1. Criar Profissional

Cria um novo cadastro de profissional.

```http
POST /api/professionals
```

**Autenticação:** ✅ Obrigatória (`user_type: professional`)
**Rate Limit:** 3 req/hora

**Request Body:**
```json
{
  "fullName": "João Silva",
  "cpf": "123.456.789-00",
  "birthDate": "1990-01-15",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "cep": "01310-100",
  "street": "Av. Paulista",
  "number": "1000",
  "complement": "Apto 101",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "categories": ["Motorista", "Segurança"],
  "hasExperience": true,
  "experienceDescription": "5 anos como motorista de eventos",
  "yearsOfExperience": "5-10",
  "availability": {
    "weekdays": true,
    "weekends": true,
    "holidays": false,
    "night": true,
    "travel": true
  },
  "documents": {
    "rg_front": "https://storage.url/rg_front.jpg",
    "rg_back": "https://storage.url/rg_back.jpg",
    "cpf": "https://storage.url/cpf.jpg",
    "proof_of_address": "https://storage.url/comprovante.pdf",
    "cnh_photo": "https://storage.url/cnh.jpg"
  },
  "cnh_number": "12345678900",
  "cnh_validity": "2026-12-31",
  "portfolio": [
    "https://storage.url/foto1.jpg",
    "https://storage.url/foto2.jpg"
  ],
  "bankName": "Banco do Brasil",
  "accountType": "Corrente",
  "agency": "1234",
  "accountNumber": "56789-0",
  "pixKey": "joao@example.com",
  "acceptsNotifications": true,
  "acceptsTerms": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Cadastro realizado com sucesso! Aguarde aprovação.",
  "data": {
    "id": "uuid",
    "status": "pending",
    "createdAt": "2025-10-21T14:30:00Z"
  }
}
```

**Erros Comuns:**

- `400` - Documentos obrigatórios faltando
  ```json
  {
    "error": "Documentos inválidos ou incompletos: CNH (Frente): Documento obrigatório não enviado",
    "validation": {
      "missingRequired": ["cnh_photo"],
      "missingValidity": ["cnh_validity"]
    }
  }
  ```

- `409` - CPF ou email duplicado
  ```json
  {
    "error": "Já existe um cadastro com este CPF"
  }
  ```

---

### 2. Buscar Meu Perfil

Retorna dados do profissional logado.

```http
GET /api/professionals/me
```

**Autenticação:** ✅ Obrigatória (`user_type: professional`)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "clerk_id": "user_xxx",
  "full_name": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "status": "approved",
  "categories": ["Motorista", "Segurança"],
  "documents": {
    "rg_front": "https://...",
    "rg_back": "https://..."
  },
  "created_at": "2025-10-20T10:00:00Z",
  "approved_at": "2025-10-21T14:30:00Z"
}
```

**Erros:**
- `404` - Profissional não encontrado (ainda não cadastrado)

---

### 3. Atualizar Meu Perfil

Atualiza dados do profissional logado.

```http
PATCH /api/professionals/me
```

**Autenticação:** ✅ Obrigatória (`user_type: professional`)

**Request Body:** (campos parciais)
```json
{
  "phone": "(11) 91234-5678",
  "experienceDescription": "Atualização da experiência",
  "availability": {
    "weekdays": true,
    "weekends": false
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso"
}
```

---

### 4. Buscar Validações de Documentos

Retorna status de validação de todos os documentos do profissional.

```http
GET /api/professionals/me/documents
```

**Autenticação:** ✅ Obrigatória (`user_type: professional`)

**Response:** `200 OK`
```json
{
  "validations": {
    "rg_front": {
      "status": "approved",
      "reviewed_at": "2025-10-21T14:00:00Z",
      "version": 1
    },
    "cnh_photo": {
      "status": "rejected",
      "rejection_reason": "Foto desfocada, envie novamente",
      "reviewed_at": "2025-10-21T14:05:00Z",
      "version": 2
    },
    "cpf": {
      "status": "pending",
      "version": 1
    }
  }
}
```

---

## 👔 Admin - Profissionais

### 5. Listar Todos os Profissionais

Lista todos os profissionais cadastrados (admin).

```http
GET /api/admin/professionals?status=pending&page=1&limit=20
```

**Autenticação:** ✅ Admin
**Query Parameters:**

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `status` | string | - | Filtrar por status: `pending`, `approved`, `rejected` |
| `page` | number | 1 | Página atual |
| `limit` | number | 20 | Itens por página |

**Response:** `200 OK`
```json
{
  "professionals": [
    {
      "id": "uuid",
      "full_name": "João Silva",
      "cpf": "123.456.789-00",
      "email": "joao@example.com",
      "status": "pending",
      "categories": ["Motorista"],
      "created_at": "2025-10-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

### 6. Busca Avançada de Profissionais

Busca profissionais com filtros avançados.

```http
POST /api/admin/professionals/search
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "query": "João Silva",
  "status": ["approved", "pending"],
  "categories": ["Motorista", "Segurança"],
  "city": "São Paulo",
  "state": "SP",
  "hasExperience": true,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "radius": 50,
  "page": 1,
  "limit": 20,
  "sortBy": "name",
  "sortOrder": "asc"
}
```

**Response:** `200 OK`
```json
{
  "professionals": [
    {
      "id": "uuid",
      "full_name": "João Silva",
      "cpf": "123.456.789-00",
      "email": "joao@example.com",
      "phone": "(11) 98765-4321",
      "city": "São Paulo",
      "state": "SP",
      "status": "approved",
      "categories": ["Motorista"],
      "distance_km": 12.5
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasMore": true
}
```

---

### 7. Buscar Profissional por ID

```http
GET /api/admin/professionals/:id
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "clerk_id": "user_xxx",
  "full_name": "João Silva",
  "cpf": "123.456.789-00",
  "birth_date": "1990-01-15",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "address": {
    "cep": "01310-100",
    "street": "Av. Paulista",
    "number": "1000",
    "city": "São Paulo",
    "state": "SP"
  },
  "categories": ["Motorista"],
  "status": "pending",
  "documents": {
    "rg_front": "https://..."
  },
  "created_at": "2025-10-21T10:00:00Z"
}
```

---

### 8. Atualizar Profissional

```http
PATCH /api/admin/professionals/:id
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "status": "approved",
  "internal_notes": "Documentos verificados"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profissional atualizado"
}
```

---

### 9. Aprovar Profissional

```http
POST /api/admin/professionals/:id/approve
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profissional aprovado com sucesso"
}
```

---

### 10. Rejeitar Profissional

```http
POST /api/admin/professionals/:id/reject
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "rejection_reason": "Documentos com problemas"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profissional rejeitado"
}
```

---

### 11. Buscar Documentos do Profissional

```http
GET /api/admin/professionals/:id/documents
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "validations": {
    "rg_front": {
      "id": "uuid",
      "status": "approved",
      "document_type": "rg_front",
      "document_url": "https://...",
      "reviewed_by": "admin_uuid",
      "reviewed_at": "2025-10-21T14:00:00Z",
      "version": 1
    }
  },
  "allVersions": [
    {
      "id": "uuid",
      "document_type": "rg_front",
      "status": "approved",
      "version": 1
    }
  ]
}
```

---

### 12. Validar Documento

```http
PATCH /api/admin/professionals/:id/documents
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "document_type": "cnh_photo",
  "status": "approved"
}
```

ou

```json
{
  "document_type": "rg_front",
  "status": "rejected",
  "rejection_reason": "Foto desfocada"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Documento validado com sucesso"
}
```

---

### 13. Buscar Histórico do Profissional

```http
GET /api/admin/professionals/:id/history
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "history": [
    {
      "id": "uuid",
      "action_type": "status_change",
      "description": "Status alterado de pending para approved",
      "action_by": {
        "id": "admin_uuid",
        "full_name": "Admin User"
      },
      "created_at": "2025-10-21T14:30:00Z"
    },
    {
      "id": "uuid",
      "action_type": "document_approved",
      "field_changed": "rg_front",
      "description": "Documento RG (Frente) aprovado",
      "created_at": "2025-10-21T14:00:00Z"
    }
  ]
}
```

---

### 14. Deletar Profissional

```http
DELETE /api/admin/professionals/:id
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profissional deletado"
}
```

---

## 🏢 Contratantes

### 15. Criar Contratante

```http
POST /api/contractors
```

**Autenticação:** ✅ Obrigatória (`user_type: contractor`)
**Rate Limit:** 5 req/hora

**Request Body:**
```json
{
  "companyName": "Empresa XYZ Ltda",
  "cnpj": "12.345.678/0001-90",
  "responsibleName": "Maria Santos",
  "responsibleRole": "Gerente de Eventos",
  "email": "maria@empresa.com",
  "phone": "(11) 3456-7890",
  "companyAddress": "Rua Exemplo, 100 - São Paulo - SP",
  "website": "https://empresa.com"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Contratante cadastrado com sucesso",
  "data": {
    "id": "uuid",
    "status": "active"
  }
}
```

---

## 📋 Solicitações

### 16. Criar Solicitação de Evento

```http
POST /api/requests
```

**Autenticação:** ✅ Obrigatória
**Rate Limit:** 10 req/hora

**Request Body:**
```json
{
  "eventName": "Festa Corporativa 2025",
  "eventType": "Festa Corporativa",
  "eventDescription": "Evento de fim de ano com 500 pessoas",
  "startDate": "2025-12-15",
  "endDate": "2025-12-15",
  "startTime": "18:00",
  "endTime": "23:00",
  "expectedAttendance": 500,
  "venueName": "Espaço Eventos SP",
  "venueAddress": "Av. Exemplo, 500",
  "venueCity": "São Paulo",
  "venueState": "SP",
  "professionalsNeeded": {
    "Segurança": 10,
    "Motorista": 5,
    "Garçom": 20
  },
  "needsEquipment": true,
  "equipmentList": ["Som", "Iluminação", "Palco"],
  "budgetRange": "R$ 50.000 - R$ 100.000",
  "urgency": "normal",
  "additionalNotes": "Preferência por profissionais com experiência"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Solicitação criada com sucesso",
  "data": {
    "id": "uuid",
    "request_number": "REQ-2025-0001",
    "status": "new"
  }
}
```

---

### 17. Buscar Solicitação por ID

```http
GET /api/requests/:id
```

**Autenticação:** ✅ Obrigatória

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "request_number": "REQ-2025-0001",
  "event_name": "Festa Corporativa 2025",
  "event_type": "Festa Corporativa",
  "start_date": "2025-12-15",
  "status": "new",
  "professionals_needed": {
    "Segurança": 10,
    "Motorista": 5
  },
  "created_at": "2025-10-21T14:30:00Z"
}
```

---

## ⚙️ Admin - Categorias & Tipos de Evento

### 18. Listar Categorias

```http
GET /api/admin/categories
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Motorista",
      "description": "Motoristas profissionais",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 19. Criar Categoria

```http
POST /api/admin/categories
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "name": "DJ",
  "description": "DJs e operadores de som"
}
```

**Response:** `201 Created`

---

### 20. Atualizar Categoria

```http
PATCH /api/admin/categories/:id
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "description": "Descrição atualizada"
}
```

**Response:** `200 OK`

---

### 21. Deletar Categoria

```http
DELETE /api/admin/categories/:id
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`

---

### 22-25. Tipos de Evento

Mesma estrutura das categorias:
- `GET /api/admin/event-types` - Listar
- `POST /api/admin/event-types` - Criar
- `PATCH /api/admin/event-types/:id` - Atualizar
- `DELETE /api/admin/event-types/:id` - Deletar

---

## 🛠️ Admin - Fornecedores

### 26. Listar Fornecedores

```http
GET /api/admin/suppliers
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "suppliers": [
    {
      "id": "uuid",
      "company_name": "Som & Luz Eventos",
      "contact_name": "Pedro Silva",
      "email": "contato@someluzeventos.com",
      "phone": "(11) 3456-7890",
      "equipment_types": ["Som", "Iluminação", "Palco"],
      "status": "active"
    }
  ]
}
```

---

### 27. Criar Fornecedor

```http
POST /api/admin/suppliers
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "companyName": "Som & Luz Eventos",
  "contactName": "Pedro Silva",
  "email": "contato@someluzeventos.com",
  "phone": "(11) 3456-7890",
  "equipmentTypes": ["Som", "Iluminação"],
  "notes": "Fornecedor confiável, trabalha há 10 anos",
  "proposedBudget": 50000
}
```

**Response:** `201 Created`

---

### 28. Atualizar Fornecedor

```http
PATCH /api/admin/suppliers/:id
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`

---

### 29. Deletar Fornecedor

```http
DELETE /api/admin/suppliers/:id
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`

---

## 👥 Admin - Usuários

### 30. Listar Usuários

```http
GET /api/admin/users
```

**Autenticação:** ✅ Admin

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "clerk_id": "user_xxx",
      "email": "joao@example.com",
      "full_name": "João Silva",
      "user_type": "professional",
      "role": "user",
      "status": "active",
      "created_at": "2025-10-20T10:00:00Z"
    }
  ]
}
```

---

### 31. Atualizar Role do Usuário

```http
PATCH /api/admin/users/:userId/role
```

**Autenticação:** ✅ Admin

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Role atualizada para admin"
}
```

---

## 📧 Contato & Email

### 32. Formulário de Contato

```http
POST /api/contact
```

**Autenticação:** ❌ Não requer
**Rate Limit:** 5 req/15min

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "message": "Gostaria de mais informações sobre o serviço"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso"
}
```

---

### 33. Enviar Email (Admin)

```http
POST /api/send
```

**Autenticação:** ✅ Admin
**Rate Limit:** 10 req/hora

**Request Body:**
```json
{
  "to": "joao@example.com",
  "subject": "Bem-vindo à HRX",
  "template": "welcome",
  "data": {
    "name": "João Silva"
  }
}
```

**Response:** `200 OK`

---

## 🔗 Webhooks

### 34. Webhook do Clerk

```http
POST /api/webhooks/clerk
```

**Autenticação:** ❌ Não requer (usa Svix signature)

**Headers:**
```http
svix-id: msg_xxx
svix-timestamp: 1698765432
svix-signature: v1,signature_here
```

**Eventos Suportados:**
- `user.created` - Criar usuário no Supabase
- `user.updated` - Atualizar dados do usuário
- `user.deleted` - Marcar usuário como deletado

---

## 🐛 Debug

### 35. Verificar Admin

```http
GET /api/debug/check-admin
```

**Autenticação:** ✅ Obrigatória

**Response:** `200 OK`
```json
{
  "authenticated": true,
  "userId": "user_xxx",
  "email": "admin@hrx.com",
  "isAdmin": true,
  "checks": {
    "inAdminEmails": true,
    "adminEmailsList": ["admin@hrx.com"],
    "supabaseRole": "admin",
    "supabaseUserType": null
  }
}
```

---

### 36. Verificar Usuário

```http
GET /api/debug/check-user
```

**Autenticação:** ✅ Obrigatória

**Response:** `200 OK`
```json
{
  "authenticated": true,
  "clerkId": "user_xxx",
  "email": "joao@example.com",
  "userType": "professional",
  "metadata": {
    "userType": "professional"
  }
}
```

---

## 📊 Formatos de Dados Comuns

### Professional (Schema Completo)

```typescript
{
  id: string;                    // UUID
  clerk_id: string;              // Clerk user ID
  user_id: string;               // Supabase user ID (FK)
  full_name: string;
  cpf: string;                   // Formato: XXX.XXX.XXX-XX
  birth_date: string;            // ISO date: YYYY-MM-DD
  email: string;
  phone: string;                 // Formato: (XX) XXXXX-XXXX

  // Endereço
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;                 // UF: SP, RJ, etc

  // Geolocalização (opcional)
  latitude?: number;
  longitude?: number;

  // Profissional
  categories: string[];          // Array de categorias
  has_experience: boolean;
  experience_description?: string;
  years_of_experience?: string;  // "0-2", "3-5", "5-10", "10+"

  // Disponibilidade
  availability: {
    weekdays: boolean;
    weekends: boolean;
    holidays: boolean;
    night: boolean;
    travel: boolean;
  };

  // Documentos
  documents: {
    rg_front?: string;          // URL
    rg_back?: string;
    cpf?: string;
    proof_of_address?: string;
    cnh_photo?: string;
    cnh_back?: string;
    cnv_photo?: string;
    nr10_certificate?: string;
    nr35_certificate?: string;
    drt_photo?: string;
    profile_photo?: string;
  };

  // Validades de documentos
  cnh_number?: string;
  cnh_validity?: string;         // ISO date
  cnv_validity?: string;
  nr10_validity?: string;
  nr35_validity?: string;
  drt_validity?: string;

  // Portfólio
  portfolio?: string[];          // Array de URLs

  // Dados bancários
  bank_name?: string;
  account_type?: string;         // "Corrente" | "Poupança"
  agency?: string;
  account_number?: string;
  pix_key?: string;

  // Status
  status: string;                // "pending" | "approved" | "rejected"
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;          // UUID do admin

  // Preferências
  accepts_notifications: boolean;

  // Admin
  internal_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
2. **Sempre** validar entrada do usuário com Zod
3. **Sempre** verificar autenticação antes de operações sensíveis
4. **Nunca** logar dados sensíveis (CPF, senhas, tokens)
5. **Sempre** usar HTTPS em produção
6. **Sempre** validar webhooks com signatures (Svix)

### Headers de Segurança

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 📝 Changelog

### v1.0.0 (2025-10-21)

- ✅ Documentação inicial completa
- ✅ 40+ endpoints documentados
- ✅ Rate limiting implementado
- ✅ Sistema de validação de documentos
- ✅ Busca avançada de profissionais
- ✅ Geocoding e busca por proximidade

---

## 📞 Suporte

- **Email:** suporte@hrx.com
- **Docs:** https://docs.hrx.com
- **GitHub Issues:** https://github.com/hrx/platform/issues

---

**Última Atualização:** 2025-10-21
**Versão:** 1.0.0
**Mantido por:** Equipe HRX
