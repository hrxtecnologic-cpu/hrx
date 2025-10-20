-- Script para corrigir RLS policies do HRX
-- Execute no SQL Editor do Supabase

-- ===================================
-- 1. POLICIES PARA TABELA PROFESSIONALS
-- ===================================

-- Permitir que usuários autenticados criem seu próprio cadastro profissional
CREATE POLICY "Users can create their own professional profile"
ON public.professionals
FOR INSERT
TO authenticated
WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- Permitir que usuários vejam apenas seu próprio cadastro
CREATE POLICY "Users can view their own professional profile"
ON public.professionals
FOR SELECT
TO authenticated
USING (clerk_id = auth.jwt() ->> 'sub');

-- Permitir que usuários atualizem apenas seu próprio cadastro
CREATE POLICY "Users can update their own professional profile"
ON public.professionals
FOR UPDATE
TO authenticated
USING (clerk_id = auth.jwt() ->> 'sub')
WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- ===================================
-- 2. STORAGE POLICIES PARA professional-documents
-- ===================================

-- Criar bucket se não existir (execute separadamente se necessário)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('professional-documents', 'professional-documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- Permitir upload de documentos (INSERT)
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-documents'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- Permitir ver/baixar documentos (SELECT)
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- Permitir atualizar/substituir documentos (UPDATE)
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- Permitir deletar documentos (DELETE)
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
);

-- ===================================
-- 3. VERIFICAR SE RLS ESTÁ ATIVADO
-- ===================================

-- Ativar RLS na tabela professionals (se ainda não estiver)
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- ===================================
-- OBSERVAÇÕES
-- ===================================

-- 1. Este script assume que você está usando Clerk Auth e que o clerk_id
--    está disponível em auth.jwt() ->> 'sub'
--
-- 2. Se estiver usando Supabase Auth nativo, substitua:
--    auth.jwt() ->> 'sub' por auth.uid()
--
-- 3. Para verificar as policies criadas, execute:
--    SELECT * FROM pg_policies WHERE tablename = 'professionals';
--    SELECT * FROM storage.policies WHERE bucket_id = 'professional-documents';
--
-- 4. Para remover policies antigas (se necessário):
--    DROP POLICY IF EXISTS "nome_da_policy" ON professionals;
--    DROP POLICY IF EXISTS "nome_da_policy" ON storage.objects;
