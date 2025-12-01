-- ============================================================================
-- FIX COMPLETO: Desabilitar RLS em TODAS as tabelas da academia
-- ============================================================================

-- Desabilitar RLS em tabelas da academia
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS na tabela users também (para garantir)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verificar status do RLS
SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '🔴 RLS ATIVO'
    ELSE '✅ RLS DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('courses', 'course_lessons', 'course_enrollments', 'users')
ORDER BY tablename;

-- Ver cursos existentes
SELECT
  id,
  title,
  status,
  created_at
FROM public.courses
ORDER BY created_at DESC
LIMIT 5;
