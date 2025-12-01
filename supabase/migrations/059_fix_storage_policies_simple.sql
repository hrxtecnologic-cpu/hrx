-- ============================================================================
-- Migration 059: Simplificar Storage Policies (FIX DEFINITIVO)
-- ============================================================================
-- Data: 2025-11-18
-- Objetivo: REMOVER todas policies antigas e criar novas SUPER SIMPLES
-- ============================================================================

-- PASSO 1: REMOVER TODAS AS POLICIES ANTIGAS DO BUCKET 'documents'
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- PASSO 2: CRIAR POLÍTICAS SUPER SIMPLES
-- ============================================================================

-- Policy 1: Qualquer pessoa pode LER arquivos do bucket documents
CREATE POLICY "documents_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy 2: Usuários autenticados podem CRIAR arquivos
CREATE POLICY "documents_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy 3: Usuários autenticados podem ATUALIZAR qualquer arquivo
CREATE POLICY "documents_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Policy 4: Usuários autenticados podem DELETAR qualquer arquivo
CREATE POLICY "documents_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  v_policies_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'documents_%';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION 059 - FIX STORAGE POLICIES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Policies antigas: REMOVIDAS';
  RAISE NOTICE 'Policies novas: % configuradas', v_policies_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Permissões configuradas:';
  RAISE NOTICE '  ✅ Leitura pública (qualquer pessoa)';
  RAISE NOTICE '  ✅ Upload autenticado';
  RAISE NOTICE '  ✅ Update autenticado';
  RAISE NOTICE '  ✅ Delete autenticado';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Storage 100%% liberado para usuários logados!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
