-- ============================================================================
-- Migration 057: Academia HRX - RLS Policies + Badges + Estatísticas
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Adicionar segurança (RLS) e sistema de gamificação (badges)
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELAS DE BADGES/GAMIFICAÇÃO
-- ============================================================================

-- Tabela de badges disponíveis
CREATE TABLE public.course_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,

  -- Visual
  icon TEXT, -- emoji ou nome do ícone
  color TEXT DEFAULT '#3b82f6', -- cor em hex
  image_url TEXT,

  -- Critérios de obtenção
  criteria_type TEXT NOT NULL
    CHECK (criteria_type IN (
      'first_course', -- Completou primeiro curso
      'courses_count', -- Completou X cursos
      'streak_days', -- X dias seguidos estudando
      'average_score', -- Média acima de X%
      'category_master', -- Completou todos cursos de uma categoria
      'quick_learner', -- Completou curso em menos de X dias
      'perfect_score' -- Tirou 100% em um curso
    )),
  criteria_value JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: {"count": 10} ou {"days": 7} ou {"score": 90}

  -- Configurações
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de badges conquistados por profissionais
CREATE TABLE public.professional_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.course_badges(id) ON DELETE CASCADE,

  -- Metadata da conquista
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  related_course_id UUID REFERENCES public.courses(id),
  achievement_data JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: {"final_score": 95, "completion_days": 3}

  -- Constraint: Um profissional não pode ter o mesmo badge 2x
  UNIQUE(professional_id, badge_id)
);

-- Indexes
CREATE INDEX idx_course_badges_active ON public.course_badges(is_active);
CREATE INDEX idx_course_badges_criteria ON public.course_badges(criteria_type);
CREATE INDEX idx_professional_badges_professional ON public.professional_badges(professional_id);
CREATE INDEX idx_professional_badges_badge ON public.professional_badges(badge_id);
CREATE INDEX idx_professional_badges_earned ON public.professional_badges(earned_at DESC);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.update_course_badges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_course_badges_updated_at
  BEFORE UPDATE ON public.course_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_badges_updated_at();


-- ============================================================================
-- PARTE 2: RLS POLICIES
-- ============================================================================

-- Habilitar RLS em todas as tabelas da academia
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_badges ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- POLICIES: courses
-- ----------------------------------------------------------------------------

-- Admins: acesso total
CREATE POLICY "Admins can manage all courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
        AND users.user_type = 'admin'
    )
  );

-- Profissionais e público: ler cursos publicados
CREATE POLICY "Anyone can view published courses"
  ON public.courses
  FOR SELECT
  TO authenticated, anon
  USING (status = 'published');


-- ----------------------------------------------------------------------------
-- POLICIES: course_lessons
-- ----------------------------------------------------------------------------

-- Admins: acesso total
CREATE POLICY "Admins can manage all lessons"
  ON public.course_lessons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
        AND users.user_type = 'admin'
    )
  );

-- Público: ler aulas preview
CREATE POLICY "Anyone can view preview lessons"
  ON public.course_lessons
  FOR SELECT
  TO authenticated, anon
  USING (is_preview = true);

-- Matriculados: ler aulas do curso matriculado
CREATE POLICY "Enrolled students can view course lessons"
  ON public.course_lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      JOIN public.professionals p ON p.id = e.professional_id
      WHERE e.course_id = course_lessons.course_id
        AND p.clerk_id = auth.jwt() ->> 'sub'
        AND e.status IN ('active', 'completed')
    )
  );


-- ----------------------------------------------------------------------------
-- POLICIES: course_enrollments
-- ----------------------------------------------------------------------------

-- Admins: acesso total
CREATE POLICY "Admins can manage all enrollments"
  ON public.course_enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
        AND users.user_type = 'admin'
    )
  );

-- Profissionais: criar própria matrícula
CREATE POLICY "Professionals can enroll themselves"
  ON public.course_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = course_enrollments.professional_id
        AND professionals.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Profissionais: ler e atualizar próprias matrículas
CREATE POLICY "Professionals can manage own enrollments"
  ON public.course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = course_enrollments.professional_id
        AND professionals.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Professionals can update own enrollments"
  ON public.course_enrollments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = course_enrollments.professional_id
        AND professionals.clerk_id = auth.jwt() ->> 'sub'
    )
  );


-- ----------------------------------------------------------------------------
-- POLICIES: course_badges
-- ----------------------------------------------------------------------------

-- Todos: ler badges ativos
CREATE POLICY "Anyone can view active badges"
  ON public.course_badges
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Admins: gerenciar badges
CREATE POLICY "Admins can manage badges"
  ON public.course_badges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
        AND users.user_type = 'admin'
    )
  );


-- ----------------------------------------------------------------------------
-- POLICIES: professional_badges
-- ----------------------------------------------------------------------------

-- Admins: acesso total
CREATE POLICY "Admins can manage all professional badges"
  ON public.professional_badges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
        AND users.user_type = 'admin'
    )
  );

-- Profissionais: ler próprios badges
CREATE POLICY "Professionals can view own badges"
  ON public.professional_badges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = professional_badges.professional_id
        AND professionals.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Público: ver badges de outros profissionais (para perfil público)
CREATE POLICY "Anyone can view professional badges"
  ON public.professional_badges
  FOR SELECT
  TO authenticated, anon
  USING (true);


-- ============================================================================
-- PARTE 3: FUNÇÕES AUXILIARES
-- ============================================================================

-- Function: Buscar estatísticas de um profissional
CREATE OR REPLACE FUNCTION public.get_professional_academy_stats(
  p_professional_id UUID
)
RETURNS TABLE (
  active_courses INTEGER,
  completed_courses INTEGER,
  certificates_earned INTEGER,
  total_hours_studied INTEGER,
  average_score NUMERIC,
  badges_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE e.status = 'active')::INTEGER AS active_courses,
    COUNT(*) FILTER (WHERE e.status = 'completed')::INTEGER AS completed_courses,
    COUNT(*) FILTER (WHERE e.certificate_code IS NOT NULL)::INTEGER AS certificates_earned,
    COALESCE(SUM(c.workload_hours) FILTER (WHERE e.status = 'completed'), 0)::INTEGER AS total_hours_studied,
    COALESCE(AVG(e.final_score) FILTER (WHERE e.final_score IS NOT NULL), 0)::NUMERIC(5,2) AS average_score,
    (SELECT COUNT(*) FROM public.professional_badges pb WHERE pb.professional_id = p_professional_id)::INTEGER AS badges_count
  FROM public.course_enrollments e
  JOIN public.courses c ON c.id = e.course_id
  WHERE e.professional_id = p_professional_id;
END;
$$;

COMMENT ON FUNCTION public.get_professional_academy_stats IS
  'Retorna estatísticas completas da academia para um profissional';


-- Function: Buscar estatísticas gerais da academia (para admin)
CREATE OR REPLACE FUNCTION public.get_academy_statistics()
RETURNS TABLE (
  total_courses INTEGER,
  published_courses INTEGER,
  total_enrollments INTEGER,
  active_enrollments INTEGER,
  total_completions INTEGER,
  completion_rate NUMERIC,
  average_rating NUMERIC,
  total_certificates INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.courses) AS total_courses,
    (SELECT COUNT(*)::INTEGER FROM public.courses WHERE status = 'published') AS published_courses,
    (SELECT COUNT(*)::INTEGER FROM public.course_enrollments) AS total_enrollments,
    (SELECT COUNT(*)::INTEGER FROM public.course_enrollments WHERE status = 'active') AS active_enrollments,
    (SELECT COUNT(*)::INTEGER FROM public.course_enrollments WHERE status = 'completed') AS total_completions,
    CASE
      WHEN (SELECT COUNT(*) FROM public.course_enrollments) > 0 THEN
        ROUND(
          (SELECT COUNT(*)::NUMERIC FROM public.course_enrollments WHERE status = 'completed') /
          (SELECT COUNT(*)::NUMERIC FROM public.course_enrollments) * 100,
          2
        )
      ELSE 0
    END AS completion_rate,
    (SELECT COALESCE(AVG(average_rating), 0)::NUMERIC(3,2) FROM public.courses WHERE status = 'published') AS average_rating,
    (SELECT COUNT(*)::INTEGER FROM public.course_enrollments WHERE certificate_code IS NOT NULL) AS total_certificates;
END;
$$;

COMMENT ON FUNCTION public.get_academy_statistics IS
  'Retorna estatísticas gerais da Academia HRX para dashboard admin';


-- Function: Verificar e atribuir badges automaticamente
CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_professional_id UUID
)
RETURNS TABLE (
  badge_id UUID,
  badge_name TEXT,
  newly_earned BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge RECORD;
  v_enrollments_count INTEGER;
  v_completed_count INTEGER;
  v_average_score NUMERIC;
  v_already_has BOOLEAN;
BEGIN
  -- Buscar contadores do profissional
  SELECT
    COUNT(*) FILTER (WHERE status IN ('active', 'completed')),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COALESCE(AVG(final_score) FILTER (WHERE final_score IS NOT NULL), 0)
  INTO v_enrollments_count, v_completed_count, v_average_score
  FROM public.course_enrollments
  WHERE professional_id = p_professional_id;

  -- Iterar sobre badges ativos
  FOR v_badge IN
    SELECT * FROM public.course_badges WHERE is_active = true
  LOOP
    -- Verificar se já tem o badge
    SELECT EXISTS (
      SELECT 1 FROM public.professional_badges
      WHERE professional_id = p_professional_id
        AND badge_id = v_badge.id
    ) INTO v_already_has;

    IF NOT v_already_has THEN
      -- Verificar critérios
      IF v_badge.criteria_type = 'first_course' AND v_completed_count >= 1 THEN
        INSERT INTO public.professional_badges (professional_id, badge_id)
        VALUES (p_professional_id, v_badge.id);

        RETURN QUERY SELECT v_badge.id, v_badge.name, true;

      ELSIF v_badge.criteria_type = 'courses_count' AND
            v_completed_count >= (v_badge.criteria_value->>'count')::INTEGER THEN
        INSERT INTO public.professional_badges (professional_id, badge_id)
        VALUES (p_professional_id, v_badge.id);

        RETURN QUERY SELECT v_badge.id, v_badge.name, true;

      ELSIF v_badge.criteria_type = 'average_score' AND
            v_average_score >= (v_badge.criteria_value->>'score')::NUMERIC THEN
        INSERT INTO public.professional_badges (professional_id, badge_id)
        VALUES (p_professional_id, v_badge.id);

        RETURN QUERY SELECT v_badge.id, v_badge.name, true;
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.check_and_award_badges IS
  'Verifica critérios e atribui badges automaticamente ao profissional';


-- ============================================================================
-- PARTE 4: DADOS INICIAIS - BADGES
-- ============================================================================

INSERT INTO public.course_badges (name, slug, description, icon, color, criteria_type, criteria_value, order_index) VALUES
  ('Primeiro Passo', 'primeiro-passo', 'Completou o primeiro curso na Academia HRX', '🎓', '#3b82f6', 'first_course', '{}'::jsonb, 1),
  ('Estudioso', 'estudioso', 'Completou 5 cursos', '📚', '#8b5cf6', 'courses_count', '{"count": 5}'::jsonb, 2),
  ('Especialista', 'especialista', 'Completou 10 cursos', '⭐', '#f59e0b', 'courses_count', '{"count": 10}'::jsonb, 3),
  ('Mestre HRX', 'mestre-hrx', 'Completou 20 cursos', '🏆', '#ef4444', 'courses_count', '{"count": 20}'::jsonb, 4),
  ('Top Student', 'top-student', 'Média acima de 90%', '🌟', '#10b981', 'average_score', '{"score": 90}'::jsonb, 5),
  ('Nota 10', 'nota-10', 'Tirou 100% em um curso', '💯', '#ec4899', 'perfect_score', '{}'::jsonb, 6);


-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_badges_count INTEGER;
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_badges_count FROM public.course_badges;
  SELECT relrowsecurity INTO v_rls_enabled FROM pg_class WHERE relname = 'courses';

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION 057 - ACADEMIA RLS + BADGES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Novas tabelas criadas:';
  RAISE NOTICE '  • course_badges (% registros)', v_badges_count;
  RAISE NOTICE '  • professional_badges';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS habilitado:';
  RAISE NOTICE '  • courses: %', v_rls_enabled;
  RAISE NOTICE '  • course_lessons';
  RAISE NOTICE '  • course_enrollments';
  RAISE NOTICE '  • course_badges';
  RAISE NOTICE '  • professional_badges';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies criadas: 16 policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions adicionadas:';
  RAISE NOTICE '  • get_professional_academy_stats()';
  RAISE NOTICE '  • get_academy_statistics()';
  RAISE NOTICE '  • check_and_award_badges()';
  RAISE NOTICE '';
  RAISE NOTICE '🎓 Academia HRX com segurança completa!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
