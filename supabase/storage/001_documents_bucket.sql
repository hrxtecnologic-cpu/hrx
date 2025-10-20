-- =====================================================
-- SUPABASE STORAGE: Bucket para Documentos
-- =====================================================
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Criar bucket para documentos profissionais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-documents',
  'professional-documents',
  false, -- Privado, só acessível com autenticação
  10485760, -- 10MB limit por arquivo
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
);

-- 2. Políticas de acesso ao bucket
-- Permitir que usuários façam upload de seus próprios documentos
CREATE POLICY "Usuários podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents' AND
  -- O path deve começar com o clerk_id do usuário
  (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- Permitir que usuários vejam seus próprios documentos
CREATE POLICY "Usuários podem ver seus documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- Permitir que usuários atualizem seus próprios documentos
CREATE POLICY "Usuários podem atualizar seus documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-documents' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- Permitir que usuários deletem seus próprios documentos
CREATE POLICY "Usuários podem deletar seus documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-documents' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- 3. Adicionar colunas de documentos na tabela professionals
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN professionals.documents IS 'Armazena URLs e metadados dos documentos:
{
  "rg_front": {"url": "...", "uploaded_at": "..."},
  "rg_back": {"url": "...", "uploaded_at": "..."},
  "cpf": {"url": "...", "uploaded_at": "..."},
  "proof_of_address": {"url": "...", "uploaded_at": "..."},
  "nr10": {"url": "...", "uploaded_at": "..."},
  "nr35": {"url": "...", "uploaded_at": "..."},
  "drt": {"url": "...", "uploaded_at": "..."},
  "cnv": {"url": "...", "uploaded_at": "..."},
  "portfolio": [{"url": "...", "uploaded_at": "..."}, ...]
}';

-- =====================================================
-- ESTRUTURA DE PASTAS NO STORAGE
-- =====================================================
-- professional-documents/
--   └── {clerk_id}/
--       ├── rg_front.pdf
--       ├── rg_back.pdf
--       ├── cpf.pdf
--       ├── proof_of_address.pdf
--       ├── nr10.pdf
--       ├── nr35.pdf
--       ├── drt.pdf
--       ├── cnv.pdf
--       └── portfolio/
--           ├── photo1.jpg
--           ├── photo2.jpg
--           └── ...
-- =====================================================
