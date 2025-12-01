'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CourseCard } from '@/components/academy/CourseCard';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award, BookOpen } from 'lucide-react';
import type { Course } from '@/types/academy';
import type { Lesson } from './LessonBuilder';

interface CoursePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseData: Partial<Course>;
  lessons: Lesson[];
}

export function CoursePreview({
  open,
  onOpenChange,
  courseData,
  lessons
}: CoursePreviewProps) {
  // Create a mock course object for preview
  const previewCourse: Course = {
    id: 'preview',
    title: courseData.title || 'Título do Curso',
    slug: courseData.slug || 'slug-do-curso',
    description: courseData.description || 'Descrição do curso',
    category: courseData.category || 'Categoria',
    workload_hours: courseData.workload_hours || 0,
    difficulty_level: courseData.difficulty_level || 'beginner',
    is_free: courseData.is_free ?? true,
    price: courseData.price || 0,
    syllabus: [],
    learning_objectives: courseData.learning_objectives || [],
    prerequisites: courseData.prerequisites || null,
    status: 'draft',
    enrolled_count: 0,
    completed_count: 0,
    average_rating: 0,
    certificate_enabled: courseData.certificate_enabled ?? true,
    minimum_score: courseData.minimum_score || 70,
    cover_image_url: courseData.cover_image_url || null,
    instructor_name: courseData.instructor_name || 'Equipe HRX',
    instructor_bio: courseData.instructor_bio || null,
    meta_title: courseData.meta_title || null,
    meta_description: courseData.meta_description || null,
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const difficultyLabels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado'
  };

  const totalDuration = lessons.reduce(
    (sum, lesson) => sum + (lesson.durationMinutes || 0),
    0
  );

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Pré-visualização do Curso</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Card Preview */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Como aparecerá na listagem:</h3>
            <CourseCard course={previewCourse} />
          </div>

          {/* Detailed Preview */}
          <div className="space-y-6 border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-medium text-zinc-400">Página de Detalhes:</h3>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {courseData.category || 'Categoria'}
                </Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {difficultyLabels[courseData.difficulty_level || 'beginner']}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold mb-3">{courseData.title || 'Título do Curso'}</h1>

              <p className="text-zinc-400 text-lg mb-4">
                {courseData.description || 'Descrição do curso aparecerá aqui...'}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-6 text-sm text-zinc-400">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {courseData.workload_hours || 0}h de carga horária
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDuration(totalDuration)} de vídeos
                  </span>
                )}
              </div>
            </div>

            {/* Learning Objectives */}
            {Array.isArray(courseData.learning_objectives) && courseData.learning_objectives.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">O que você vai aprender</h3>
                <ul className="space-y-2">
                  {courseData.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2 text-zinc-300">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lessons */}
            {lessons.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Conteúdo do Curso</h3>
                <div className="space-y-2">
                  {lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {index + 1}. {lesson.title || 'Aula sem título'}
                          </p>
                          {lesson.description && (
                            <p className="text-xs text-zinc-500 mt-1">{lesson.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          {lesson.isPreview && (
                            <Badge variant="outline" className="text-xs border-zinc-700 text-green-500">
                              Preview
                            </Badge>
                          )}
                          {lesson.durationMinutes > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(lesson.durationMinutes)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Certificate */}
            {courseData.certificate_enabled && (
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Award className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Certificado de Conclusão</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Você receberá um certificado ao concluir o curso com nota mínima de {courseData.minimum_score || 70}%
                  </p>
                </div>
              </div>
            )}

            {/* Instructor */}
            <div className="border-t border-zinc-800 pt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Instrutor</h3>
              <p className="text-white font-medium">{courseData.instructor_name || 'Equipe HRX'}</p>
              {courseData.instructor_bio && (
                <p className="text-sm text-zinc-400 mt-1">{courseData.instructor_bio}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
