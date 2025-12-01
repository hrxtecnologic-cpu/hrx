-- ============================================================================
-- FIX FINAL: Garantir admin e publicar cursos
-- ============================================================================

-- PASSO 1: Marcar seus emails como admin (forçar update)
UPDATE public.users
SET is_admin = true
WHERE email IN ('hrxtecnologic@gmail.com', 'simulaioab@gmail.com');

-- PASSO 2: Publicar todos os cursos draft
UPDATE public.courses
SET status = 'published', published_at = NOW()
WHERE status = 'draft';

-- PASSO 3: Verificar resultado
SELECT
  'ADMINS' as tipo,
  email,
  is_admin,
  CASE WHEN is_admin = true THEN '✅' ELSE '❌' END as ok
FROM public.users
WHERE email IN ('hrxtecnologic@gmail.com', 'simulaioab@gmail.com')

UNION ALL

SELECT
  'CURSOS' as tipo,
  title as email,
  status::boolean as is_admin,
  CASE WHEN status = 'published' THEN '✅' ELSE '❌' END as ok
FROM public.courses
ORDER BY tipo, email;
