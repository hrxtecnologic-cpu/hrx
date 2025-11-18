'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/academy/VideoPlayer';
import { QuizComponent } from '@/components/academy/QuizComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  Loader2,
  BookOpen,
  Home,
} from 'lucide-react';
import type { CourseLesson, Course } from '@/types/academy';

interface LessonPlayerPageProps {
  params: Promise<{ id: string }>;
}

export default function LessonPlayerPage({ params }: LessonPlayerPageProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string>('');
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<unknown>(null);
  const [allLessons, setAllLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setLessonId(p.id));
  }, [params]);

  // Fetch lesson data
  useEffect(() => {
    if (!lessonId || !isLoaded) return;

    if (!user) {
      router.push('/entrar');
      return;
    }

    const fetchLessonData = async () => {
      try {
        // Fetch lesson
        const lessonRes = await fetch(`/api/academy/lessons/${lessonId}`);
        const lessonData = await lessonRes.json();

        if (!lessonData.success) {
          router.push('/academia');
          return;
        }

        const lessonInfo = lessonData.data;
        setLesson(lessonInfo);

        // Fetch course
        const courseRes = await fetch(`/api/academy/courses/${lessonInfo.course_id}`);
        const courseData = await courseRes.json();

        if (courseData.success) {
          setCourse(courseData.data);
        }

        // Fetch all lessons for navigation
        const lessonsRes = await fetch(`/api/academy/courses/${lessonInfo.course_id}/lessons`);
        const lessonsData = await lessonsRes.json();

        if (lessonsData.success) {
          setAllLessons(lessonsData.data);
        }

        // Check enrollment
        const enrollmentRes = await fetch('/api/academy/my-courses');
        const enrollmentData = await enrollmentRes.json();

        if (enrollmentData.success) {
          const userEnrollment = enrollmentData.data.enrollments.find(
            (e: Record<string, unknown>) => e.course_id === lessonInfo.course_id
          );

          if (!userEnrollment) {
            // Not enrolled, redirect to course page
            router.push(`/academia/curso/${courseData.data?.slug || ''}`);
            return;
          }

          setEnrollment(userEnrollment);

          // Check if lesson is completed
          const lessonProgress = userEnrollment.lesson_progress?.find(
            (p: Record<string, unknown>) => p.lesson_id === lessonId
          );
          setLessonCompleted(lessonProgress?.completed || false);
        }
      } catch (error) {
        console.error('Erro ao buscar aula:', error);
        router.push('/academia');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, user, isLoaded, router]);

  const handleLessonComplete = async () => {
    if (!enrollment || !lesson) return;

    try {
      const res = await fetch(`/api/academy/enrollments/${enrollment.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lesson.id,
          action: 'complete',
        }),
      });

      if (res.ok) {
        setLessonCompleted(true);

        // Refresh enrollment data
        const enrollmentRes = await fetch('/api/academy/my-courses');
        const enrollmentData = await enrollmentRes.json();

        if (enrollmentData.success) {
          const updated = enrollmentData.data.enrollments.find(
            (e: Record<string, unknown>) => e.id === enrollment.id
          );
          setEnrollment(updated);
        }
      }
    } catch (error) {
      console.error('Erro ao marcar aula como completa:', error);
    }
  };

  const navigateToLesson = (targetLessonId: string) => {
    router.push(`/academia/aula/${targetLessonId}`);
  };

  const currentLessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const completedLessonsCount =
    enrollment?.lesson_progress?.filter((p: Record<string, unknown>) => p.completed).length || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">Aula não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-400">
          <button onClick={() => router.push('/academia')} className="hover:text-white transition">
            <Home className="h-4 w-4" />
          </button>
          <span>/</span>
          <button
            onClick={() => router.push('/academia/meus-cursos')}
            className="hover:text-white transition"
          >
            Meus Cursos
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/academia/curso/${course.slug}`)}
            className="hover:text-white transition"
          >
            {course.title}
          </button>
          <span>/</span>
          <span className="text-white">{lesson.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Video or Quiz */}
          <div className="lg:col-span-3 space-y-6">
            {/* Player */}
            {lesson.content_type === 'video' && lesson.video_url && (
              <VideoPlayer
                videoUrl={lesson.video_url}
                videoProvider={lesson.video_provider || 'youtube'}
                lessonId={lesson.id}
                enrollmentId={enrollment?.id}
                onComplete={handleLessonComplete}
                autoMarkComplete={true}
              />
            )}

            {lesson.content_type === 'quiz' && lesson.quiz_data && (
              <QuizComponent
                lessonId={lesson.id}
                enrollmentId={enrollment?.id}
                questions={lesson.quiz_data}
                onComplete={handleLessonComplete}
                minimumScore={lesson.minimum_score || 70}
              />
            )}

            {/* Lesson Info */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl mb-2">{lesson.title}</CardTitle>
                    {lesson.description && (
                      <p className="text-zinc-400">{lesson.description}</p>
                    )}
                  </div>
                  {lessonCompleted && (
                    <Badge className="bg-green-500/10 text-green-500 border border-green-500/20">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluída
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {lesson.text_content && (
                  <div className="prose prose-invert max-w-none">
                    <div
                      className="text-zinc-300"
                      dangerouslySetInnerHTML={{ __html: lesson.text_content }}
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800">
                  <Button
                    onClick={() => prevLesson && navigateToLesson(prevLesson.id)}
                    disabled={!prevLesson}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  {!lessonCompleted && lesson.content_type !== 'quiz' && (
                    <Button
                      onClick={handleLessonComplete}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Concluída
                    </Button>
                  )}

                  <Button
                    onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
                    disabled={!nextLesson}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Course Progress & Lessons */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">{course.title}</CardTitle>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-zinc-400 mb-2">
                    <span>Progresso do Curso</span>
                    <span>{enrollment?.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${enrollment?.progress_percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {completedLessonsCount}/{allLessons.length} aulas concluídas
                  </p>
                </div>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                <div className="space-y-2">
                  {allLessons.map((l, idx) => {
                    const isCompleted = enrollment?.lesson_progress?.find(
                      (p: Record<string, unknown>) => p.lesson_id === l.id && p.completed
                    );
                    const isCurrent = l.id === lessonId;

                    return (
                      <button
                        key={l.id}
                        onClick={() => navigateToLesson(l.id)}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          isCurrent
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : isCompleted
                              ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                              : 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs">{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isCurrent ? 'text-blue-400' : 'text-white'
                              }`}
                            >
                              {l.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {l.content_type === 'video' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-zinc-700 text-zinc-500"
                                >
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  {l.duration_minutes}min
                                </Badge>
                              )}
                              {l.content_type === 'quiz' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-zinc-700 text-zinc-500"
                                >
                                  Quiz
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Course Complete Check */}
                {enrollment?.progress_percentage === 100 && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-500 mb-3">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-semibold">Curso 100% Completo!</p>
                    </div>
                    <Button
                      onClick={() => router.push('/academia/certificados')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ver Certificado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
