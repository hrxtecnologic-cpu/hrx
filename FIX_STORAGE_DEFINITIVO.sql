-- ============================================================================
-- FIX STORAGE DEFINITIVO - DESABILITAR RLS COMPLETAMENTE
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: DESABILITAR RLS NO BUCKET 'documents'
-- ============================================================================
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS AS POLICIES ANTIGAS
-- ============================================================================
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- PASSO 3: HABILITAR RLS E CRIAR POLICIES SUPER PERMISSIVAS
-- ============================================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Qualquer pessoa pode ler
CREATE POLICY "allow_all_select"
ON storage.objects FOR SELECT
USING (true);

-- Policy 2: Qualquer pessoa autenticada pode inserir
CREATE POLICY "allow_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Qualquer pessoa autenticada pode atualizar
CREATE POLICY "allow_authenticated_update"
ON storage.objects FOR UPDATE
USING (auth.role() = 'authenticated');

-- Policy 4: Qualquer pessoa autenticada pode deletar
CREATE POLICY "allow_authenticated_delete"
ON storage.objects FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policies_count INTEGER;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE oid = 'storage.objects'::regclass;

  -- Contar policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ FIX STORAGE DEFINITIVO';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'RLS habilitado: %', v_rls_enabled;
  RAISE NOTICE 'Policies ativas: %', v_policies_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies criadas:';
  RAISE NOTICE '  ✅ allow_all_select (leitura pública)';
  RAISE NOTICE '  ✅ allow_authenticated_insert (upload)';
  RAISE NOTICE '  ✅ allow_authenticated_update (atualizar)';
  RAISE NOTICE '  ✅ allow_authenticated_delete (deletar)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Storage liberado para upload!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
