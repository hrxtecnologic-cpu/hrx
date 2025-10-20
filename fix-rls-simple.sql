-- Script simplificado para RLS (após migração de upload para API)
-- Execute no SQL Editor do Supabase

-- ===================================
-- REMOVER POLICIES ANTIGAS (se existirem)
-- ===================================

DROP POLICY IF EXISTS "Users can create their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can view their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can update their own professional profile" ON public.professionals;

-- ===================================
-- DESABILITAR RLS EM PROFESSIONALS
-- ===================================
-- Como a API usa SERVICE_ROLE_KEY, não precisamos de RLS
-- Apenas a API pode inserir/atualizar dados

ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;

-- ===================================
-- STORAGE: Tornar bucket público
-- ===================================
-- Como upload agora é via API com SERVICE_ROLE,
-- apenas precisamos que os arquivos sejam acessíveis publicamente

-- Atualizar bucket para público (se ainda não for)
UPDATE storage.buckets
SET public = true
WHERE id = 'professional-documents';

-- Remover todas as policies de storage (não são mais necessárias)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- ===================================
-- OBSERVAÇÕES
-- ===================================
-- 1. RLS foi DESABILITADO porque a API usa SERVICE_ROLE_KEY
-- 2. Toda validação e segurança acontece na API Route
-- 3. Apenas usuários autenticados via Clerk podem fazer upload
-- 4. Storage bucket está público apenas para leitura de URLs
