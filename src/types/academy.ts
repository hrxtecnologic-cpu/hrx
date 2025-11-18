/**
 * ============================================================================
 * TYPES: Academia HRX - Sistema de Cursos e Certificação
 * ============================================================================
 * Tipos TypeScript para o sistema de cursos profissionalizantes
 */

// ============================================================================
// ENUMS
// ============================================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type CourseStatus = 'draft' | 'published' | 'archived';

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'free';

export type LessonContentType = 'video' | 'text' | 'quiz' | 'assignment';

export type VideoProvider = 'youtube' | 'vimeo' | 'supabase' | 'other';

export type CertificateStatus = 'active' | 'revoked' | 'expired';

// ============================================================================
// SYLLABUS (Conteúdo Programático)
// ============================================================================

export interface CourseModule {
  module: string;
  description: string;
  order: number;
  lessons?: string[]; // IDs das aulas (opcional)
}

// ============================================================================
// QUIZ
// ============================================================================

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // Index da resposta correta (0-3)
  explanation?: string;
}

export interface QuizAnswer {
  question_index: number;
  selected_option: number;
  is_correct: boolean;
}

export interface QuizResult {
  total_questions: number;
  correct_answers: number;
  score: number; // Porcentagem (0-100)
  passed: boolean;
  answers: QuizAnswer[];
}

// ============================================================================
// ATTACHMENT (Recursos Adicionais)
// ============================================================================

export interface LessonAttachment {
  name: string;
  url: string;
  type?: string; // 'pdf', 'doc', 'image', etc
  size?: number; // bytes
}

// ============================================================================
// COURSE (Curso)
// ============================================================================

export interface Course {
  id: string;

  // Identificação
  title: string;
  slug: string;
  description: string;

  // Categorização
  category: string;

  // Detalhes
  workload_hours: number;
  difficulty_level: DifficultyLevel;

  // Pricing
  is_free: boolean;
  price: number;

  // Conteúdo
  syllabus: CourseModule[];
  learning_objectives: string[];
  prerequisites?: string | null;

  // Status
  status: CourseStatus;

  // Estatísticas
  enrolled_count: number;
  completed_count: number;
  average_rating: number;

  // Certificação
  certificate_enabled: boolean;
  minimum_score: number;

  // Metadata
  cover_image_url?: string | null;
  instructor_name: string;
  instructor_bio?: string | null;

  // SEO
  meta_title?: string | null;
  meta_description?: string | null;

  // Timestamps
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

// DTO para criação de curso
export interface CreateCourseDTO {
  title: string;
  slug: string;
  description: string;
  category: string;
  workload_hours: number;
  difficulty_level: DifficultyLevel;
  is_free: boolean;
  price?: number;
  syllabus?: CourseModule[];
  learning_objectives?: string[];
  prerequisites?: string;
  minimum_score?: number;
  cover_image_url?: string;
  instructor_name?: string;
  instructor_bio?: string;
  meta_title?: string;
  meta_description?: string;
}

// DTO para atualização de curso
export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {
  status?: CourseStatus;
}

// ============================================================================
// COURSE LESSON (Aula)
// ============================================================================

export interface CourseLesson {
  id: string;
  course_id: string;

  // Identificação
  title: string;
  description?: string | null;
  order_index: number;

  // Tipo de conteúdo
  content_type: LessonContentType;

  // Vídeo
  video_url?: string | null;
  video_duration_seconds?: number | null;
  video_provider?: VideoProvider | null;

  // Texto (Markdown)
  text_content?: string | null;

  // Quiz
  quiz_data?: QuizQuestion[] | null;

  // Recursos
  attachments?: LessonAttachment[];

  // Configurações
  duration_minutes: number;
  is_preview: boolean;
  is_mandatory: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// DTO para criação de aula
export interface CreateLessonDTO {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  content_type: LessonContentType;
  video_url?: string;
  video_duration_seconds?: number;
  video_provider?: VideoProvider;
  text_content?: string;
  quiz_data?: QuizQuestion[];
  attachments?: LessonAttachment[];
  duration_minutes?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
}

// ============================================================================
// COURSE ENROLLMENT (Matrícula)
// ============================================================================

export interface CourseEnrollment {
  id: string;

  // Relacionamentos
  course_id: string;
  professional_id: string;

  // Status
  status: EnrollmentStatus;

  // Progresso
  progress_percentage: number;
  completed_lessons: string[]; // IDs das aulas completadas

  // Avaliação
  quiz_scores: Record<string, number>; // { lesson_id: score }
  final_score?: number | null;
  passed: boolean;

  // Certificado
  certificate_code?: string | null;
  certificate_issued_at?: string | null;

  // Pagamento
  payment_status?: PaymentStatus | null;
  payment_amount?: number | null;
  payment_date?: string | null;

  // Timestamps
  enrolled_at: string;
  completed_at?: string | null;
  expires_at?: string | null;
  last_accessed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// DTO para matrícula
export interface EnrollCourseDTO {
  course_id: string;
  professional_id: string;
}

// DTO para atualizar progresso
export interface UpdateProgressDTO {
  lesson_id: string;
  action: 'complete' | 'uncomplete';
}

// DTO para enviar quiz
export interface SubmitQuizDTO {
  lesson_id: string;
  answers: QuizAnswer[];
}

// DTO para finalizar curso
export interface CompleteCourseDTO {
  final_score: number;
}

// ============================================================================
// CERTIFICATE (Certificado)
// ============================================================================

export interface Certificate {
  id: string;
  course_id: string;
  course_title: string;
  completion_date: string;
  certificate_code: string;
  certificate_url: string;
  qr_code_url: string;
  status: CertificateStatus;
  hours: number;
  score: number;

  // Dados do aluno
  student_name?: string;
  student_cpf?: string;
}

// DTO para gerar certificado
export interface GenerateCertificateDTO {
  studentName: string;
  studentCPF: string;
  courseTitle: string;
  workloadHours: number;
  completionDate: Date;
  finalScore: number;
  certificateCode: string;
}

// Resultado da geração de certificado
export interface CertificateGenerationResult {
  pdfUrl: string;
  qrCodeUrl: string;
  certificateCode: string;
}

// ============================================================================
// PROFESSIONAL CERTIFICATIONS (JSONB em professionals)
// ============================================================================

export interface ProfessionalCertifications {
  certificates: Certificate[];
  active_courses?: ActiveCourse[];
}

export interface ActiveCourse {
  course_id: string;
  enrolled_at: string;
  progress: number;
  last_lesson: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

// Response padrão
export interface AcademyAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Response de lista de cursos
export interface CoursesListResponse extends AcademyAPIResponse {
  data: Course[];
}

// Response de detalhes do curso
export interface CourseDetailsResponse extends AcademyAPIResponse {
  data: Course & {
    lessons: CourseLesson[];
  };
}

// Response de matrículas
export interface EnrollmentsListResponse extends AcademyAPIResponse {
  data: (CourseEnrollment & {
    course: Course;
  })[];
}

// Response de progresso
export interface ProgressUpdateResponse extends AcademyAPIResponse {
  data: CourseEnrollment;
}

// Response de conclusão
export interface CourseCompletionResponse extends AcademyAPIResponse {
  data: CourseEnrollment;
  certificate: CertificateGenerationResult;
}

// Response de certificados
export interface CertificatesListResponse extends AcademyAPIResponse {
  data: Certificate[];
}

// Response de validação de certificado
export interface CertificateValidationResponse extends AcademyAPIResponse {
  data: {
    valid: boolean;
    certificate?: Certificate;
    message: string;
  };
}

// ============================================================================
// FILTERS (Filtros de busca)
// ============================================================================

export interface CourseFilters {
  category?: string;
  difficulty?: DifficultyLevel;
  is_free?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// STATISTICS (Estatísticas)
// ============================================================================

export interface CourseStatistics {
  total_courses: number;
  total_enrollments: number;
  total_completions: number;
  completion_rate: number; // Porcentagem
  average_rating: number;
  most_popular_courses: Course[];
}

export interface ProfessionalAcademyStats {
  active_courses: number;
  completed_courses: number;
  certificates_earned: number;
  total_hours_studied: number;
  average_score: number;
}

// ============================================================================
// HELPERS
// ============================================================================

// Helper para verificar se profissional está certificado em uma categoria
export function isCertifiedInCategory(
  certifications: ProfessionalCertifications | null,
  category: string
): boolean {
  if (!certifications?.certificates) return false;

  return certifications.certificates.some(
    cert => cert.status === 'active' &&
            cert.course_title.toLowerCase().includes(category.toLowerCase())
  );
}

// Helper para calcular progresso de um curso
export function calculateCourseProgress(
  completedLessons: string[],
  totalLessons: number
): number {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons.length / totalLessons) * 100);
}

// Helper para verificar se aula está completa
export function isLessonCompleted(
  lessonId: string,
  enrollment: CourseEnrollment
): boolean {
  return enrollment.completed_lessons.includes(lessonId);
}

// Helper para formatar duração
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Helper para gerar código de certificado
export function generateCertificateCode(
  year: number,
  category: string
): string {
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `HRX-${year}-${category.toUpperCase()}-${random}`;
}
