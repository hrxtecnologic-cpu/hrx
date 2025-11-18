-- ============================================================================
-- Migration 056: Academia HRX - Tabelas de Cursos e Certificação
-- ============================================================================
-- Data: 2025-10-30
-- Objetivo: Criar sistema de cursos profissionalizantes com certificação
--
-- Estratégia:
--   - Reutilizar campos JSONB em professionals.certifications
--   - Apenas 3 tabelas novas (mínimo necessário)
--   - Integração natural com marketplace existente
-- ============================================================================

-- ============================================================================
-- TABELA 1: courses (Cursos Disponíveis)
-- ============================================================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,

  -- Categorização (reutiliza categories existentes)
  category TEXT NOT NULL,

  -- Detalhes do curso
  workload_hours INTEGER NOT NULL CHECK (workload_hours > 0),
  difficulty_level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Pricing
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC(10, 2) DEFAULT 0 CHECK (price >= 0),

  -- Conteúdo programático (JSONB para flexibilidade)
  syllabus JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "module": "Introdução",
  --     "description": "Conceitos básicos",
  --     "order": 1,
  --     "lessons": ["lesson_id_1", "lesson_id_2"]
  --   }
  -- ]

  learning_objectives JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["Operar mesa de som", "Identificar problemas"]

  prerequisites TEXT,

  -- Status de publicação
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  -- Estatísticas
  enrolled_count INTEGER DEFAULT 0 CHECK (enrolled_count >= 0),
  completed_count INTEGER DEFAULT 0 CHECK (completed_count >= 0),
  average_rating NUMERIC(3, 2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),

  -- Configurações de certificação
  certificate_enabled BOOLEAN DEFAULT true,
  minimum_score INTEGER DEFAULT 70 CHECK (minimum_score >= 0 AND minimum_score <= 100),

  -- Metadata
  cover_image_url TEXT,
  instructor_name TEXT DEFAULT 'Equipe HRX',
  instructor_bio TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_is_free ON public.courses(is_free);
CREATE INDEX idx_courses_difficulty ON public.courses(difficulty_level);

-- Comments
COMMENT ON TABLE public.courses IS
  'Cursos profissionalizantes da Academia HRX. Integra com professionals.certifications.';
COMMENT ON COLUMN public.courses.syllabus IS
  'Conteúdo programático em JSONB com módulos e aulas';
COMMENT ON COLUMN public.courses.minimum_score IS
  'Nota mínima para aprovação e emissão de certificado (padrão: 70%)';


-- ============================================================================
-- TABELA 2: course_lessons (Aulas dos Cursos)
-- ============================================================================
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  -- Identificação
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),

  -- Tipo de conteúdo
  content_type TEXT NOT NULL
    CHECK (content_type IN ('video', 'text', 'quiz', 'assignment')),

  -- Conteúdo de vídeo
  video_url TEXT,
  video_duration_seconds INTEGER CHECK (video_duration_seconds >= 0),
  video_provider TEXT CHECK (video_provider IN ('youtube', 'vimeo', 'supabase', 'other')),

  -- Conteúdo de texto (Markdown)
  text_content TEXT,

  -- Conteúdo de quiz
  quiz_data JSONB,
  -- Estrutura:
  -- [
  --   {
  --     "question": "O que é um copeiro profissional?",
  --     "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
  --     "correct": 0,
  --     "explanation": "Explicação da resposta correta"
  --   }
  -- ]

  -- Recursos adicionais
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [{"name": "Apostila.pdf", "url": "https://..."}]

  -- Configurações
  duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
  is_preview BOOLEAN DEFAULT false,  -- Pode ver sem matrícula
  is_mandatory BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: Cada aula tem posição única dentro do curso
  UNIQUE(course_id, order_index)
);

-- Indexes
CREATE INDEX idx_course_lessons_course ON public.course_lessons(course_id);
CREATE INDEX idx_course_lessons_order ON public.course_lessons(course_id, order_index);
CREATE INDEX idx_course_lessons_type ON public.course_lessons(content_type);

-- Comments
COMMENT ON TABLE public.course_lessons IS
  'Aulas individuais de cada curso. Suporta vídeo, texto, quiz e assignments.';
COMMENT ON COLUMN public.course_lessons.is_preview IS
  'Se true, pode ser visualizada sem matrícula (preview grátis)';


-- ============================================================================
-- TABELA 3: course_enrollments (Matrículas em Cursos)
-- ============================================================================
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,

  -- Status da matrícula
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),

  -- Progresso
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: ["lesson_id_1", "lesson_id_2", "lesson_id_3"]

  -- Avaliação
  quiz_scores JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: {"lesson_id_1": 85, "lesson_id_2": 92}

  final_score NUMERIC(5, 2),
  passed BOOLEAN DEFAULT false,

  -- Certificado
  certificate_code TEXT UNIQUE,
  certificate_issued_at TIMESTAMPTZ,

  -- Pagamento (para cursos pagos - futuro)
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'free')),
  payment_amount NUMERIC(10, 2),
  payment_date TIMESTAMPTZ,

  -- Timestamps
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: Um profissional só pode ter uma matrícula ativa por curso
  UNIQUE(course_id, professional_id)
);

-- Indexes
CREATE INDEX idx_course_enrollments_professional ON public.course_enrollments(professional_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_status ON public.course_enrollments(status);
CREATE INDEX idx_course_enrollments_certificate ON public.course_enrollments(certificate_code) WHERE certificate_code IS NOT NULL;

-- Comments
COMMENT ON TABLE public.course_enrollments IS
  'Matrículas de profissionais em cursos. Rastreia progresso e emissão de certificados.';
COMMENT ON COLUMN public.course_enrollments.certificate_code IS
  'Código único do certificado gerado (ex: HRX-2025-AUDIO-001234)';
COMMENT ON COLUMN public.course_enrollments.completed_lessons IS
  'Array JSON com IDs das aulas completadas';


-- ============================================================================
-- FUNCTIONS AUXILIARES
-- ============================================================================

-- Function: Incrementar contador de matriculados
CREATE OR REPLACE FUNCTION public.increment_course_enrolled_count(p_course_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses
  SET enrolled_count = enrolled_count + 1,
      updated_at = now()
  WHERE id = p_course_id;
END;
$$;

COMMENT ON FUNCTION public.increment_course_enrolled_count IS
  'Incrementa contador de alunos matriculados no curso';


-- Function: Incrementar contador de concluídos
CREATE OR REPLACE FUNCTION public.increment_course_completed_count(p_course_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses
  SET completed_count = completed_count + 1,
      updated_at = now()
  WHERE id = p_course_id;
END;
$$;

COMMENT ON FUNCTION public.increment_course_completed_count IS
  'Incrementa contador de alunos que concluíram o curso';


-- Function: Calcular progresso do curso
CREATE OR REPLACE FUNCTION public.calculate_course_progress(
  p_enrollment_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress INTEGER;
  v_course_id UUID;
BEGIN
  -- Buscar course_id e contar aulas completas
  SELECT
    e.course_id,
    jsonb_array_length(COALESCE(e.completed_lessons, '[]'::jsonb))
  INTO v_course_id, v_completed_lessons
  FROM public.course_enrollments e
  WHERE e.id = p_enrollment_id;

  -- Contar total de aulas do curso
  SELECT COUNT(*)
  INTO v_total_lessons
  FROM public.course_lessons
  WHERE course_id = v_course_id;

  -- Calcular porcentagem
  IF v_total_lessons > 0 THEN
    v_progress := ROUND((v_completed_lessons::NUMERIC / v_total_lessons::NUMERIC) * 100);
  ELSE
    v_progress := 0;
  END IF;

  -- Atualizar registro
  UPDATE public.course_enrollments
  SET progress_percentage = v_progress,
      updated_at = now()
  WHERE id = p_enrollment_id;

  RETURN v_progress;
END;
$$;

COMMENT ON FUNCTION public.calculate_course_progress IS
  'Calcula e atualiza progresso do curso baseado em aulas completadas';


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Atualizar updated_at em courses
CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_courses_updated_at();


-- Trigger: Atualizar updated_at em course_lessons
CREATE OR REPLACE FUNCTION public.update_course_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_lessons_updated_at();


-- Trigger: Atualizar updated_at em course_enrollments
CREATE OR REPLACE FUNCTION public.update_course_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_course_enrollments_updated_at
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_enrollments_updated_at();


-- Trigger: Atualizar last_accessed_at ao marcar aula como completa
CREATE OR REPLACE FUNCTION public.update_enrollment_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_lessons IS DISTINCT FROM OLD.completed_lessons THEN
    NEW.last_accessed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_last_accessed
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_enrollment_last_accessed();


-- ============================================================================
-- DADOS INICIAIS (Exemplo de Curso)
-- ============================================================================

-- Nota: Não usamos a tabela categories para cursos.
-- O campo 'category' em courses é apenas TEXT livre para flexibilidade.


-- Inserir curso exemplo: "Copeiro Profissional Básico"
INSERT INTO public.courses (
  title,
  slug,
  description,
  category,
  workload_hours,
  difficulty_level,
  is_free,
  price,
  syllabus,
  learning_objectives,
  status,
  minimum_score,
  cover_image_url,
  instructor_name,
  meta_title,
  meta_description,
  published_at
)
VALUES (
  'Copeiro Profissional Básico',
  'copeiro-profissional-basico',
  'Aprenda as técnicas essenciais para ser um copeiro profissional de eventos. Curso completo com certificado HRX.',
  'catering',
  4,
  'beginner',
  true,
  0,
  '[
    {
      "module": "Módulo 1: Introdução",
      "description": "Conceitos básicos e equipamentos",
      "order": 1
    },
    {
      "module": "Módulo 2: Técnicas de Serviço",
      "description": "Como servir corretamente",
      "order": 2
    },
    {
      "module": "Módulo 3: Certificação",
      "description": "Prova final",
      "order": 3
    }
  ]'::jsonb,
  '["Servir bebidas corretamente", "Conhecer equipamentos essenciais", "Aplicar etiqueta profissional", "Manter higiene e segurança"]'::jsonb,
  'published',
  70,
  NULL,
  'Equipe HRX',
  'Curso de Copeiro Profissional - Certificado HRX',
  'Torne-se um copeiro profissional certificado. Curso gratuito com 4 horas de conteúdo.',
  now()
);


-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_courses_count INTEGER;
  v_lessons_count INTEGER;
  v_enrollments_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_courses_count FROM public.courses;
  SELECT COUNT(*) INTO v_lessons_count FROM public.course_lessons;
  SELECT COUNT(*) INTO v_enrollments_count FROM public.course_enrollments;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION 056 - ACADEMIA HRX';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  • courses (% registros)', v_courses_count;
  RAISE NOTICE '  • course_lessons (% registros)', v_lessons_count;
  RAISE NOTICE '  • course_enrollments (% registros)', v_enrollments_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Functions criadas:';
  RAISE NOTICE '  • increment_course_enrolled_count()';
  RAISE NOTICE '  • increment_course_completed_count()';
  RAISE NOTICE '  • calculate_course_progress()';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers criados:';
  RAISE NOTICE '  • update_courses_updated_at';
  RAISE NOTICE '  • update_course_lessons_updated_at';
  RAISE NOTICE '  • update_course_enrollments_updated_at';
  RAISE NOTICE '  • update_enrollment_last_accessed';
  RAISE NOTICE '';
  RAISE NOTICE '🎓 Academia HRX pronta para uso!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
