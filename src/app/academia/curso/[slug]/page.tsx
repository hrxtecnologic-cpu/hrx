'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Users,
  Award,
  BookOpen,
  PlayCircle,
  CheckCircle,
  Lock,
  Loader2,
  TrendingUp,
  BarChart,
} from 'lucide-react';
import type { Course, CourseLesson } from '@/types/academy';

interface CourseDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch course data
  useEffect(() => {
    if (!slug) return;

    const fetchCourseData = async () => {
      try {
        // Fetch all courses and find by slug
        const coursesRes = await fetch('/api/academy/courses');
        const coursesData = await coursesRes.json();

        if (coursesData.success) {
          const foundCourse = coursesData.data.find((c: Course) => c.slug === slug);

          if (!foundCourse) {
            router.push('/academia');
            return;
          }

          setCourse(foundCourse);

          // Fetch lessons
          const lessonsRes = await fetch(`/api/academy/courses/${foundCourse.id}/lessons`);
          const lessonsData = await lessonsRes.json();

          if (lessonsData.success) {
            setLessons(lessonsData.data);
          }

          // Check enrollment if user is logged in
          if (user) {
            const enrollmentRes = await fetch('/api/academy/my-courses');
            const enrollmentData = await enrollmentRes.json();

            if (enrollmentData.success) {
              const userEnrollment = enrollmentData.data.enrollments.find(
                (e: any) => e.course_id === foundCourse.id
              );
              setEnrollment(userEnrollment);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar curso:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [slug, user, router]);

  const handleEnroll = async () => {
    if (!isLoaded || !user) {
      router.push('/entrar');
      return;
    }

    if (!course) return;

    setEnrolling(true);

    try {
      const res = await fetch(`/api/academy/courses/${course.id}/enroll`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to first lesson
        if (lessons.length > 0) {
          router.push(`/academia/aula/${lessons[0].id}`);
        } else {
          // Refresh page to show enrollment
          window.location.reload();
        }
      } else {
        alert(data.error || 'Erro ao fazer matrícula');
      }
    } catch (error) {
      console.error('Erro ao matricular:', error);
      alert('Erro ao fazer matrícula. Tente novamente.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    if (!enrollment || lessons.length === 0) return;

    // Find first incomplete lesson or first lesson
    const incompleLesson = lessons.find((lesson) => {
      const progress = enrollment.lesson_progress?.find((p: any) => p.lesson_id === lesson.id);
      return !progress?.completed;
    });

    const nextLesson = incompleLesson || lessons[0];
    router.push(`/academia/aula/${nextLesson.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Curso não encontrado</p>
      </div>
    );
  }

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const difficultyLabels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  const completedLessons = enrollment?.lesson_progress?.filter((p: any) => p.completed).length || 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-b from-blue-900/20 to-black">
        {course.cover_image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${course.cover_image})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${difficultyColors[course.difficulty_level]} border`}>
                {difficultyLabels[course.difficulty_level]}
              </Badge>
              <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                {course.category}
              </Badge>
              {course.is_free && (
                <Badge className="bg-green-500/10 text-green-500 border border-green-500/20">
                  Gratuito
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>

            <p className="text-lg text-zinc-300 mb-6 max-w-3xl">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{course.workload_hours}h de conteúdo</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{course.enrolled_count || 0} alunos</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{lessons.length} aulas</span>
              </div>
              {course.certificate_on_completion && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span>Com certificado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.learning_objectives && course.learning_objectives.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    O que você vai aprender
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learning_objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-zinc-300">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Course Content / Syllabus */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Conteúdo do Curso
                </CardTitle>
                <p className="text-sm text-zinc-400">
                  {lessons.length} aulas • {course.workload_hours}h total
                  {enrollment && ` • ${completedLessons}/${lessons.length} completas`}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => {
                    const isCompleted = enrollment?.lesson_progress?.find(
                      (p: any) => p.lesson_id === lesson.id && p.completed
                    );

                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCompleted
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-zinc-800/50 border-zinc-800'
                        } ${enrollment ? 'hover:bg-zinc-800 cursor-pointer transition' : ''}`}
                        onClick={() => {
                          if (enrollment) {
                            router.push(`/academia/aula/${lesson.id}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : enrollment
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : enrollment ? (
                              <PlayCircle className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {idx + 1}. {lesson.title}
                            </p>
                            {lesson.description && (
                              <p className="text-xs text-zinc-500">{lesson.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          {lesson.content_type === 'video' && (
                            <Badge variant="outline" className="border-zinc-700">
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Vídeo
                            </Badge>
                          )}
                          {lesson.content_type === 'quiz' && (
                            <Badge variant="outline" className="border-zinc-700">
                              <BarChart className="h-3 w-3 mr-1" />
                              Quiz
                            </Badge>
                          )}
                          {lesson.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.duration_minutes}min
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
              <CardContent className="p-6 space-y-6">
                {/* Enrollment Status */}
                {enrollment ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-400 mb-2">Seu Progresso</p>
                      <div className="flex items-end justify-between mb-2">
                        <p className="text-3xl font-bold text-white">
                          {enrollment.progress_percentage}%
                        </p>
                        <p className="text-xs text-zinc-400">
                          {completedLessons}/{lessons.length} aulas
                        </p>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    <Button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continuar Curso
                    </Button>

                    {enrollment.status === 'completed' && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-green-500 mb-2">
                          <Award className="h-5 w-5" />
                          <p className="font-semibold">Curso Concluído!</p>
                        </div>
                        <Button
                          onClick={() => router.push('/academia/certificados')}
                          variant="outline"
                          className="w-full mt-2"
                        >
                          Ver Certificado
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!course.is_free && course.price && (
                      <div className="text-center pb-4 border-b border-zinc-800">
                        <p className="text-sm text-zinc-400 mb-1">Investimento</p>
                        <p className="text-3xl font-bold text-white">
                          R$ {course.price.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Matriculando...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-5 w-5 mr-2" />
                          {course.is_free ? 'Matricular Grátis' : 'Matricular Agora'}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-zinc-500">
                      {course.is_free
                        ? 'Acesso completo e vitalício ao curso'
                        : '30 dias de garantia de satisfação'}
                    </p>
                  </div>
                )}

                {/* Course Info */}
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <h3 className="font-semibold text-white">Este curso inclui:</h3>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      {course.workload_hours}h de vídeo sob demanda
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      {lessons.length} aulas
                    </li>
                    {course.certificate_on_completion && (
                      <li className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        Certificado de conclusão
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Acesso vitalício
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
