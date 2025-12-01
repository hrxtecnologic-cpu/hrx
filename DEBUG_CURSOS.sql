-- ============================================================================
-- DEBUG: Verificar estado dos cursos
-- ============================================================================

-- Ver TODOS os cursos (independente do status)
SELECT
  id,
  title,
  slug,
  status,
  published_at,
  created_at,
  CASE
    WHEN status = 'published' THEN '✅ Publicado'
    WHEN status = 'draft' THEN '📝 Rascunho'
    ELSE '❓ Outro: ' || status
  END as situacao
FROM public.courses
ORDER BY created_at DESC;

-- Contar por status
SELECT
  status,
  COUNT(*) as total
FROM public.courses
GROUP BY status;
