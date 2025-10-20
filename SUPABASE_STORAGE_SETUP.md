# Configuração do Supabase Storage

Este guia explica como configurar o Supabase Storage para upload de documentos profissionais.

## 1. Executar Migrações SQL

Execute os seguintes arquivos SQL no **SQL Editor** do Supabase Dashboard:

### 1.1. Criar bucket de documentos

```sql
-- Arquivo: supabase/storage/001_documents_bucket.sql
```

Execute todo o conteúdo deste arquivo. Ele irá:
- Criar o bucket `professional-documents`
- Configurar políticas RLS para segurança
- Adicionar coluna `documents` na tabela `professionals`

### 1.2. Adicionar coluna de portfólio

```sql
-- Arquivo: supabase/migrations/003_add_portfolio_column.sql
```

Execute para adicionar a coluna `portfolio` que armazena as URLs das fotos.

## 2. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Anon/Public key
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Service role key (só server-side)
```

### Onde encontrar as chaves:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Verificar Configuração do Bucket

Após executar a migração, verifique:

1. Acesse **Storage** no Supabase Dashboard
2. Você deve ver o bucket `professional-documents`
3. Clique nele e verifique:
   - **Public**: Deve estar **OFF** (privado)
   - **File size limit**: 10MB
   - **Allowed MIME types**: PDF e imagens

## 4. Testar Políticas RLS

As políticas criadas garantem que:

- ✅ Usuários autenticados podem fazer upload de documentos
- ✅ Cada usuário só pode acessar seus próprios documentos
- ✅ O path deve começar com o `clerk_id` do usuário
- ❌ Usuários não podem ver documentos de outros

### Estrutura de pastas no Storage:

```
professional-documents/
  └── {clerk_id}/
      ├── rg_front.pdf
      ├── rg_back.jpg
      ├── cpf.pdf
      ├── proof_of_address.pdf
      ├── nr10.pdf
      ├── nr35.pdf
      ├── drt.pdf
      ├── cnv.pdf
      └── portfolio/
          ├── photo_1234567890_0.jpg
          ├── photo_1234567890_1.jpg
          └── photo_1234567890_2.jpg
```

## 5. Tipos de Documentos Suportados

### Documentos Obrigatórios:
- **RG (Frente)** - `rg_front`
- **RG (Verso)** - `rg_back`
- **CPF** - `cpf`
- **Comprovante de Residência** - `proof_of_address`

### Certificações (Opcionais):
- **NR-10** (Segurança em Eletricidade) - `nr10`
- **NR-35** (Trabalho em Altura) - `nr35`
- **DRT** (Registro Profissional de Técnico) - `drt`
- **CNV** (Carteira Nacional de Vigilante) - `cnv`

### Portfólio:
- Até **10 fotos** de trabalhos anteriores
- Formato: JPG, PNG, WEBP
- Tamanho máximo: 10MB por foto

## 6. Formato dos Dados no Banco

### Coluna `documents` (JSONB):

```json
{
  "rg_front": "https://...supabase.co/storage/v1/object/public/professional-documents/user_123/rg_front.pdf",
  "rg_back": "https://...supabase.co/storage/v1/object/public/professional-documents/user_123/rg_back.jpg",
  "cpf": "https://...",
  "proof_of_address": "https://...",
  "nr10": "https://...",
  "nr35": "https://...",
  "drt": "https://...",
  "cnv": "https://..."
}
```

### Coluna `portfolio` (JSONB):

```json
[
  "https://...supabase.co/storage/v1/object/public/professional-documents/user_123/portfolio/photo1.jpg",
  "https://...supabase.co/storage/v1/object/public/professional-documents/user_123/portfolio/photo2.jpg",
  "https://...supabase.co/storage/v1/object/public/professional-documents/user_123/portfolio/photo3.jpg"
]
```

## 7. Fluxo de Upload

1. **Frontend**: Usuário seleciona arquivo no componente `DocumentUpload`
2. **Upload**: Arquivo é enviado para Supabase Storage via `uploadDocument()`
3. **Validação**:
   - Tamanho máximo: 10MB
   - Tipos permitidos: PDF, JPG, PNG, WEBP
   - RLS verifica se o path começa com o `clerk_id` do usuário
4. **Storage**: Arquivo salvo em `professional-documents/{clerk_id}/{tipo}.ext`
5. **URL**: URL pública é gerada e retornada
6. **State**: URL é armazenada no state `uploadedDocuments`
7. **Submit**: URLs são enviadas junto com form data para `/api/professionals`
8. **Database**: URLs são salvas na coluna `documents` (JSONB)

## 8. Segurança

### Row Level Security (RLS):

As políticas RLS garantem que:

```sql
-- Usuário só pode fazer upload no próprio diretório
(storage.foldername(name))[1] = auth.jwt() ->> 'sub'
```

Isso significa que:
- ✅ `user_abc` pode fazer upload em `professional-documents/user_abc/doc.pdf`
- ❌ `user_abc` NÃO pode fazer upload em `professional-documents/user_xyz/doc.pdf`

### Validações Client-Side:

- Tamanho máximo de arquivo (10MB)
- Tipos de arquivo permitidos
- Formatação de nomes de arquivo

### Validações Server-Side:

- RLS do Supabase
- MIME types no bucket
- File size limit no bucket

## 9. Troubleshooting

### Erro: "new row violates row-level security policy"

**Causa**: RLS está impedindo o upload

**Solução**: Verifique se o usuário está autenticado e se o path começa com o `clerk_id`

### Erro: "File size exceeds limit"

**Causa**: Arquivo maior que 10MB

**Solução**: Reduza o tamanho do arquivo ou aumente o limite no bucket

### Erro: "MIME type not allowed"

**Causa**: Tipo de arquivo não está na lista permitida

**Solução**: Use apenas PDF, JPG, PNG ou WEBP

### Documentos não aparecem após upload

**Causa**: URL não foi salva no banco

**Solução**: Verifique os logs da API e se a coluna `documents` existe na tabela

## 10. Próximos Passos

- [ ] Implementar preview de documentos no backoffice
- [ ] Adicionar validação de documentos por administrador
- [ ] Implementar notificações de status (aprovado/rejeitado)
- [ ] Criar sistema de versionamento de documentos
- [ ] Implementar compressão de imagens antes do upload

---

**Documentação criada em**: 2025-10-19
**Última atualização**: 2025-10-19
