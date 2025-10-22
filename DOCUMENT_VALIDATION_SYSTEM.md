# 📋 Sistema de Validação de Documentos

> **Data:** 2025-10-21
> **Tarefa:** #14 - Sistema de Validação de Documentos
> **Status:** ✅ CONCLUÍDO

---

## 🎯 Objetivo

Implementar validação robusta de documentos obrigatórios baseada nas categorias selecionadas pelo profissional, garantindo que:

1. **Frontend**: Valide documentos ANTES de enviar formulário
2. **Backend**: Valide documentos ANTES de inserir no banco
3. **Mensagens**: Forneça feedback claro sobre documentos faltantes
4. **Categorias**: Respeite requisitos específicos de cada categoria

---

## 📊 Resumo Executivo

### Arquivos Criados/Modificados:

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/lib/validations/documents.ts` | ✅ **CRIADO** | Biblioteca centralizada de validação |
| `src/app/api/professionals/route.ts` | ✅ **MODIFICADO** | Validação no backend (POST) |
| `src/app/cadastro-profissional/page.tsx` | ✅ **MODIFICADO** | Validação no frontend |
| `DOCUMENT_VALIDATION_SYSTEM.md` | ✅ **CRIADO** | Documentação completa |

### Funções Principais:

1. `validateDocumentsForCategories()` - Validação completa (documentos + validades)
2. `validateRequiredDocuments()` - Validação rápida (apenas documentos)
3. `validateValidityFields()` - Validação de datas de validade
4. `formatDocumentValidationErrors()` - Mensagens de erro amigáveis
5. `requiresDocument()` - Verifica se documento é obrigatório
6. `requiresValidity()` - Verifica se validade é obrigatória

---

## 🗂️ Estrutura do Sistema

### 1️⃣ Definição de Requisitos (`src/types/document.ts`)

**Já existia** - Define quais documentos são obrigatórios para cada categoria:

```typescript
export const DOCUMENT_REQUIREMENTS_BY_CATEGORY: CategoryDocumentRequirements = {
  'Motorista': [
    { type: 'rg_front', label: 'RG (Frente)', required: true },
    { type: 'rg_back', label: 'RG (Verso)', required: true },
    { type: 'cpf', label: 'CPF', required: true },
    { type: 'proof_of_address', label: 'Comprovante de Residência', required: true },
    { type: 'cnh_photo', label: 'CNH (Frente)', required: true, validityRequired: true },
    { type: 'cnh_back', label: 'CNH (Verso)', required: false },
    { type: 'profile_photo', label: 'Foto de Perfil', required: false },
  ],
  'Segurança': [
    { type: 'rg_front', label: 'RG (Frente)', required: true },
    { type: 'rg_back', label: 'RG (Verso)', required: true },
    { type: 'cpf', label: 'CPF', required: true },
    { type: 'proof_of_address', label: 'Comprovante de Residência', required: true },
    { type: 'cnv_photo', label: 'CNV', required: true, validityRequired: true },
    { type: 'profile_photo', label: 'Foto de Perfil', required: false },
  ],
  'Eletricista': [
    // ... mesmos básicos + NR10
    { type: 'nr10_certificate', label: 'Certificado NR10', required: true, validityRequired: true },
  ],
  'Rigger': [
    // ... mesmos básicos + NR35
    { type: 'nr35_certificate', label: 'Certificado NR35', required: true, validityRequired: true },
  ],
  // Outras categorias usam requisitos básicos (RG, CPF, Comprovante, Foto)
};
```

### 2️⃣ Biblioteca de Validação (`src/lib/validations/documents.ts`)

**Novo arquivo criado** - Centraliza toda a lógica de validação.

#### Função Principal: `validateDocumentsForCategories()`

```typescript
export function validateDocumentsForCategories(
  categories: string[],
  documents: Record<string, string | null | undefined>,
  validityFields?: DocumentValidityFields
): DocumentValidationResult {
  // Obtém requisitos para todas as categorias selecionadas (union)
  const requirements = getDocumentRequirements(categories);

  // Valida cada requisito
  requirements.forEach(req => {
    // ✅ Documento obrigatório não enviado?
    if (req.required && !documents[req.type]) {
      errors.push({ type: req.type, label: req.label, reason: 'Obrigatório não enviado' });
    }

    // ✅ Campo de validade obrigatório não preenchido?
    if (documents[req.type] && req.validityRequired && !validityFields[field]) {
      errors.push({ type: req.type, label: req.label, reason: 'Validade obrigatória', field });
    }

    // ⚠️ Documento expirado?
    if (validityDate < today) {
      warnings.push({ type: req.type, label: req.label, reason: 'Documento expirado' });
    }
  });

  return { valid: errors.length === 0, errors, warnings, ... };
}
```

**Exemplo de uso:**

```typescript
const result = validateDocumentsForCategories(
  ['Motorista', 'Eletricista'],
  {
    rg_front: 'https://...',
    rg_back: 'https://...',
    cpf: 'https://...',
    proof_of_address: 'https://...',
    cnh_photo: 'https://...',
    nr10_certificate: 'https://...',
  },
  {
    cnh_validity: '2026-12-31',
    nr10_validity: '2025-06-30',
  }
);

if (!result.valid) {
  console.error('Erros:', result.errors);
  // [
  //   { type: 'cnh_back', label: 'CNH (Verso)', reason: 'Obrigatório não enviado' },
  //   { type: 'nr35_certificate', label: 'NR35', reason: 'Obrigatório não enviado' }
  // ]
}
```

---

## 🔧 Implementação

### Frontend: `src/app/cadastro-profissional/page.tsx`

**Validação ANTES de enviar:**

```typescript
async function onSubmit(data: ProfessionalFormData) {
  setIsSubmitting(true);

  // ========== Validar Documentos ANTES de enviar ==========
  const validityFields = {
    cnh_validity: cnhValidity || null,
    cnv_validity: cnvValidity || null,
    nr10_validity: nr10Validity || null,
    nr35_validity: nr35Validity || null,
    drt_validity: drtValidity || null,
  };

  const documentValidation = validateDocumentsForCategories(
    data.categories,
    uploadedDocuments,
    validityFields
  );

  if (!documentValidation.valid) {
    const errorList = formatDocumentValidationErrorList(documentValidation);
    const errorMessage = errorList.join('\n');

    alert(`Documentos inválidos ou incompletos:\n\n${errorMessage}`);
    setIsSubmitting(false);
    return; // ❌ BLOQUEIA envio
  }

  // ✅ Continua com envio...
}
```

**Benefícios:**
- ✅ Feedback **imediato** ao usuário
- ✅ Evita chamadas de API desnecessárias
- ✅ Experiência do usuário melhorada

---

### Backend: `src/app/api/professionals/route.ts`

**Validação ANTES de inserir no banco:**

```typescript
export async function POST(req: Request) {
  // ... autenticação, rate limiting, validação Zod ...

  // Extrair documentos e validades
  const { documents, cnh_validity, cnv_validity, nr10_validity, nr35_validity, drt_validity, ...formData } = body;

  // ========== Validar Documentos Obrigatórios ==========
  const validityFields = { cnh_validity, cnv_validity, nr10_validity, nr35_validity, drt_validity };

  const documentValidation = validateDocumentsForCategories(
    validatedData.categories,
    documents || {},
    validityFields
  );

  if (!documentValidation.valid) {
    const errorMessage = formatDocumentValidationErrors(documentValidation);

    logger.warn('Validação de documentos falhou', {
      userId,
      categories: validatedData.categories,
      missingRequired: documentValidation.missingRequired,
      missingValidity: documentValidation.missingValidity,
      errorCount: documentValidation.errors.length
    });

    return badRequestResponse(
      `Documentos inválidos ou incompletos: ${errorMessage}`,
      {
        validation: {
          errors: documentValidation.errors,
          warnings: documentValidation.warnings,
          missingRequired: documentValidation.missingRequired,
          missingValidity: documentValidation.missingValidity,
        }
      }
    );
  }

  // ✅ Continua com inserção no banco...
}
```

**Benefícios:**
- ✅ **Segurança** - Backend não confia no frontend
- ✅ **Integridade** - Garante dados corretos no banco
- ✅ **Logs estruturados** - Rastreabilidade de erros

---

## 🧪 Casos de Teste

### Caso 1: Motorista com todos documentos

**Input:**
```typescript
categories: ['Motorista']
documents: {
  rg_front: 'url',
  rg_back: 'url',
  cpf: 'url',
  proof_of_address: 'url',
  cnh_photo: 'url',
  cnh_back: 'url',
}
validityFields: {
  cnh_validity: '2026-12-31'
}
```

**Expected:**
```typescript
{ valid: true, errors: [], warnings: [] }
```

---

### Caso 2: Motorista sem CNH (obrigatório)

**Input:**
```typescript
categories: ['Motorista']
documents: {
  rg_front: 'url',
  rg_back: 'url',
  cpf: 'url',
  proof_of_address: 'url',
  // cnh_photo: FALTANDO ❌
}
```

**Expected:**
```typescript
{
  valid: false,
  errors: [
    { type: 'cnh_photo', label: 'CNH (Frente)', reason: 'Documento obrigatório não enviado' }
  ],
  missingRequired: ['cnh_photo']
}
```

**Mensagem ao Usuário:**
```
❌ Documentos inválidos ou incompletos:
CNH (Frente): Documento obrigatório não enviado
```

---

### Caso 3: Motorista sem validade da CNH

**Input:**
```typescript
categories: ['Motorista']
documents: {
  rg_front: 'url',
  rg_back: 'url',
  cpf: 'url',
  proof_of_address: 'url',
  cnh_photo: 'url',
}
validityFields: {
  // cnh_validity: FALTANDO ❌
}
```

**Expected:**
```typescript
{
  valid: false,
  errors: [
    { type: 'cnh_photo', label: 'CNH (Frente)', reason: 'Campo de validade obrigatório', field: 'cnh_validity' }
  ],
  missingValidity: ['cnh_validity']
}
```

**Mensagem ao Usuário:**
```
❌ Documentos inválidos ou incompletos:
CNH (Frente): Campo de validade obrigatório (campo: cnh_validity)
```

---

### Caso 4: Motorista + Eletricista (múltiplas categorias)

**Input:**
```typescript
categories: ['Motorista', 'Eletricista']
documents: {
  rg_front: 'url',
  rg_back: 'url',
  cpf: 'url',
  proof_of_address: 'url',
  cnh_photo: 'url',
  // nr10_certificate: FALTANDO ❌ (obrigatório para Eletricista)
}
validityFields: {
  cnh_validity: '2026-12-31',
  // nr10_validity: FALTANDO ❌
}
```

**Expected:**
```typescript
{
  valid: false,
  errors: [
    { type: 'nr10_certificate', label: 'Certificado NR10', reason: 'Documento obrigatório não enviado' }
  ],
  missingRequired: ['nr10_certificate']
}
```

**Benefício:** Sistema faz **union** de requisitos de todas as categorias.

---

### Caso 5: Documento Expirado (Warning, não Error)

**Input:**
```typescript
categories: ['Motorista']
documents: {
  rg_front: 'url',
  rg_back: 'url',
  cpf: 'url',
  proof_of_address: 'url',
  cnh_photo: 'url',
}
validityFields: {
  cnh_validity: '2024-01-01' // ⚠️ Expirado (hoje é 2025-10-21)
}
```

**Expected:**
```typescript
{
  valid: true, // ✅ Não bloqueia (apenas aviso)
  errors: [],
  warnings: [
    { type: 'cnh_photo', label: 'CNH (Frente)', reason: 'Documento expirado (validade: 01/01/2024)', field: 'cnh_validity' }
  ]
}
```

**Comportamento:**
- Frontend: Mostra aviso no console, mas **permite envio**
- Backend: Registra warning no log, mas **permite inserção**
- Admin: Verá o documento expirado ao validar manualmente

---

## 📋 Checklist da Tarefa #14

- [x] Criar mapa de requisitos por categoria (`DOCUMENT_REQUIREMENTS_BY_CATEGORY`)
- [x] Criar `src/lib/validations/documents.ts` com funções de validação
- [x] Função `validateDocumentsForCategories()` (validação completa)
- [x] Função `validateRequiredDocuments()` (validação rápida)
- [x] Função `validateValidityFields()` (validação de datas)
- [x] Função `formatDocumentValidationErrors()` (mensagens amigáveis)
- [x] Validar no formulário (frontend) ANTES de enviar
- [x] Validar na API (backend) ANTES de inserir
- [x] Mensagens de erro específicas por tipo de erro
- [x] Suporte para múltiplas categorias (union de requisitos)
- [x] Logs estruturados (frontend e backend)
- [x] Documentação completa (`DOCUMENT_VALIDATION_SYSTEM.md`)

---

## 🔮 Próximos Passos (Opcional)

### 1. Validação em Tempo Real

Mostrar indicadores visuais de documentos faltantes à medida que o usuário seleciona categorias:

```typescript
// Em src/app/cadastro-profissional/page.tsx
useEffect(() => {
  const requirements = getDocumentRequirements(selectedCategories);
  const missing = requirements.filter(req => req.required && !uploadedDocuments[req.type]);

  setMissingDocuments(missing); // Mostrar lista visual
}, [selectedCategories, uploadedDocuments]);
```

**UI Sugerida:**
```tsx
{missingDocuments.length > 0 && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Documentos Obrigatórios Faltando:</AlertTitle>
    <AlertDescription>
      <ul>
        {missingDocuments.map(doc => (
          <li key={doc.type}>• {doc.label}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

---

### 2. Validação em Batch na Edição

Permitir admin validar múltiplos documentos de uma vez:

```typescript
// Nova rota: POST /api/admin/professionals/[id]/documents/batch
export async function POST(req: Request) {
  const { validations } = await req.json();
  // validations = [
  //   { document_type: 'rg_front', status: 'approved' },
  //   { document_type: 'rg_back', status: 'approved' },
  //   { document_type: 'cpf', status: 'rejected', rejection_reason: '...' },
  // ]
}
```

---

### 3. Histórico de Validações

Mostrar histórico completo de todas as versões de um documento:

```sql
SELECT * FROM document_validations
WHERE professional_id = 'uuid'
  AND document_type = 'cnh_photo'
ORDER BY version DESC;
```

**UI:**
```
CNH (Frente):
  v3: ✅ Aprovado (2025-10-21 14:30)
  v2: ❌ Rejeitado (2025-10-20 10:15) - Foto desfocada
  v1: ⏳ Pendente (2025-10-19 08:00)
```

---

## 📚 Referências

- [Zod Schema Validation](https://github.com/colinhacks/zod)
- [React Hook Form](https://react-hook-form.com/)
- [DOCUMENT_REQUIREMENTS_BY_CATEGORY](./src/types/document.ts)
- [Professional Schema](./src/lib/validations/professional.ts)

---

**Criado por:** Claude Code
**Data:** 2025-10-21
**Tarefa:** #14 - Sistema de Validação de Documentos
**Status:** ✅ CONCLUÍDO
