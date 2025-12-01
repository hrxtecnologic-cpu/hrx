-- ============================================================================
-- FIX: Desabilitar RLS nas tabelas da Academia
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Desabilitar RLS em TODAS as tabelas da academia
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '🔴 RLS ATIVO'
    ELSE '✅ RLS DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('courses', 'course_lessons', 'course_enrollments');
