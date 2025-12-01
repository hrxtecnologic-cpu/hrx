# Instruções: Configurar Storage para Course Covers

## ⚠️ ERRO ATUAL: Row-Level Security Policy

O erro "new row violates row-level security policy" ocorre porque as políticas de RLS do Storage estão bloqueando uploads.

## ✅ SOLUÇÃO: Executar Migration Simplificada

### PASSO 1: Executar Migration no SQL Editor

1. Acesse o Supabase Dashboard: https://waplbfawlcavwtvfwprf.supabase.co
2. Vá em **SQL Editor** (no menu lateral)
3. Clique em **New Query**
4. Cole o conteúdo do arquivo: **`supabase/migrations/059_fix_storage_policies_simple.sql`**
5. Clique em **Run** (ou pressione Ctrl+Enter)

**O que esta migration faz:**
- ✅ Remove TODAS as policies antigas que estavam causando conflito
- ✅ Cria 4 policies super simples usando `TO authenticated`
- ✅ Libera upload para qualquer usuário logado
- ✅ Mantém leitura pública (qualquer pessoa pode ver)

## ✅ PASSO 2: Verificar Storage

1. Vá em **Storage** (no menu lateral)
2. Você deve ver o bucket **documents** listado
3. Clique no bucket **documents**
4. Verifique se consegue fazer upload de uma imagem teste

## 📁 Estrutura de Pastas Criada

O sistema criará automaticamente estas pastas no upload:

- `documents/course-covers/` - Capas de cursos (usado pelo ImageUploader)
- `documents/lesson-videos/` - Vídeos de aulas (futuro)
- `documents/lesson-attachments/` - Anexos de aulas (futuro)

## 🔐 Políticas de Acesso Configuradas

1. **Public read** - Qualquer pessoa pode ver os arquivos
2. **Authenticated upload** - Apenas usuários logados podem fazer upload
3. **Authenticated update** - Usuários podem atualizar próprios arquivos
4. **Authenticated delete** - Usuários podem deletar próprios arquivos

## ✅ Verificação de Sucesso

Após executar a migration, você deve ver a mensagem:

```
✅ MIGRATION 058 - STORAGE COURSE COVERS
Bucket "documents": OK ou CRIADO
Policies: 4 configuradas
📦 Storage pronto para upload de course covers!
```

## 🧪 Testar Upload

1. Acesse: http://localhost:3000/admin/academia/cursos/novo
2. Na seção "Imagem de Capa", arraste uma imagem
3. Verifique se o upload funciona sem erros
4. Confira no Storage do Supabase se o arquivo foi criado em `documents/course-covers/`

---

## ⚠️ IMPORTANTE

Se você receber erro "Bucket not found", significa que a migration ainda não foi executada.
Execute o PASSO 1 acima para criar o bucket e as policies.
