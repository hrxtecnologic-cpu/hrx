-- ============================================================================
-- Migration 058: Storage para Course Covers
-- ============================================================================
-- Data: 2025-11-18
-- Objetivo: Configurar storage bucket para capas de cursos
-- ============================================================================

-- Verificar se bucket 'documents' existe, senão criar
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE ACESSO (RLS)
-- ============================================================================

-- Policy: Permitir leitura pública de documentos
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Policy: Permitir upload autenticado
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Policy: Permitir update de qualquer arquivo autenticado
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Policy: Permitir delete de qualquer arquivo autenticado
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  v_bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) INTO v_bucket_exists;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION 058 - STORAGE COURSE COVERS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Bucket "documents": %', CASE WHEN v_bucket_exists THEN 'OK' ELSE 'CRIADO' END;
  RAISE NOTICE 'Policies: 4 configuradas';
  RAISE NOTICE '';
  RAISE NOTICE 'Estrutura de pastas sugerida:';
  RAISE NOTICE '  • documents/course-covers/ - Capas de cursos';
  RAISE NOTICE '  • documents/lesson-videos/ - Vídeos de aulas';
  RAISE NOTICE '  • documents/lesson-attachments/ - Anexos';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Storage pronto para upload de course covers!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
