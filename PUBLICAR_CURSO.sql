-- ============================================================================
-- PUBLICAR CURSO - Mudar status de 'draft' para 'published'
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Ver todos os cursos draft
SELECT
  id,
  title,
  status,
  created_at
FROM public.courses
WHERE status = 'draft'
ORDER BY created_at DESC;

-- Publicar TODOS os cursos draft
UPDATE public.courses
SET
  status = 'published',
  published_at = NOW()
WHERE status = 'draft';

-- Verificar
SELECT
  title,
  status,
  published_at,
  CASE
    WHEN status = 'published' THEN '✅ PUBLICADO'
    ELSE '❌ Draft'
  END as situacao
FROM public.courses
ORDER BY created_at DESC
LIMIT 5;
