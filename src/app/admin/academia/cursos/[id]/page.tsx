'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  Edit,
  PlayCircle,
  Eye,
  Archive,
  Send,
  GripVertical,
  BarChart,
} from 'lucide-react';
import type { Course, CourseLesson } from '@/types/academy';

const courseSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  workload_hours: z.number().min(1, 'Carga horária deve ser maior que 0'),
  is_free: z.boolean(),
  price: z.number().min(0, 'Preço não pode ser negativo').optional(),
  cover_image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  instructor_name: z.string().optional(),
  certificate_enabled: z.boolean(),
  minimum_score: z.number().min(0).max(100).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>('');
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const isFree = watch('is_free');

  // Unwrap params
  useEffect(() => {
    params.then((p) => setCourseId(p.id));
  }, [params]);

  // Fetch course data
  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        // Fetch course
        const courseRes = await fetch(`/api/admin/academy/courses/${courseId}`);
        const courseData = await courseRes.json();

        if (!courseData.success) {
          router.push('/admin/academia/cursos');
          return;
        }

        const courseInfo = courseData.data;
        setCourse(courseInfo);

        // Set form values
        reset({
          title: courseInfo.title,
          slug: courseInfo.slug,
          description: courseInfo.description,
          category: courseInfo.category,
          difficulty_level: courseInfo.difficulty_level,
          workload_hours: courseInfo.workload_hours,
          is_free: courseInfo.is_free,
          price: courseInfo.price || 0,
          cover_image_url: courseInfo.cover_image_url || '',
          instructor_name: courseInfo.instructor_name || '',
          certificate_enabled: courseInfo.certificate_enabled ?? true,
          minimum_score: courseInfo.minimum_score || 70,
        });

        setLearningObjectives(courseInfo.learning_objectives || ['']);
        setRequirements(courseInfo.prerequisites ? [courseInfo.prerequisites] : ['']);

        // Fetch lessons
        const lessonsRes = await fetch(`/api/admin/academy/courses/${courseId}/lessons`);
        const lessonsData = await lessonsRes.json();

        if (lessonsData.success) {
          setLessons(lessonsData.data);
        }
      } catch (error) {
        console.error('Erro ao buscar curso:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, router, reset]);

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true);

    try {
      const payload = {
        ...data,
        learning_objectives: learningObjectives.filter((obj) => obj.trim() !== ''),
        prerequisites: requirements.filter((req) => req.trim() !== '').join('\n'),
      };

      const res = await fetch(`/api/admin/academy/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert('Curso atualizado com sucesso!');
        setCourse(result.data);
      } else {
        alert(result.error || 'Erro ao atualizar curso');
      }
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      alert('Erro ao atualizar curso. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (lessons.length === 0) {
      alert('Adicione pelo menos uma aula antes de publicar o curso.');
      return;
    }

    if (!confirm('Tem certeza que deseja publicar este curso?')) return;

    try {
      const res = await fetch(`/api/admin/academy/courses/${courseId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });

      const result = await res.json();

      if (result.success) {
        alert('Curso publicado com sucesso!');
        setCourse(result.data);
      } else {
        alert(result.error || 'Erro ao publicar curso');
      }
    } catch (error) {
      console.error('Erro ao publicar curso:', error);
      alert('Erro ao publicar curso. Tente novamente.');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Tem certeza que deseja arquivar este curso?')) return;

    try {
      const res = await fetch(`/api/admin/academy/courses/${courseId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });

      const result = await res.json();

      if (result.success) {
        alert('Curso arquivado com sucesso!');
        setCourse(result.data);
      } else {
        alert(result.error || 'Erro ao arquivar curso');
      }
    } catch (error) {
      console.error('Erro ao arquivar curso:', error);
      alert('Erro ao arquivar curso. Tente novamente.');
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm('ATENÇÃO: Esta ação é irreversível. Deseja deletar este curso?')) return;

    try {
      const res = await fetch(`/api/admin/academy/courses/${courseId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (result.success) {
        alert('Curso deletado com sucesso!');
        router.push('/admin/academia/cursos');
      } else {
        alert(result.error || 'Erro ao deletar curso');
      }
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      alert('Erro ao deletar curso. Tente novamente.');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return;

    try {
      const res = await fetch(`/api/admin/academy/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (result.success) {
        setLessons(lessons.filter((l) => l.id !== lessonId));
        alert('Aula deletada com sucesso!');
      } else {
        alert(result.error || 'Erro ao deletar aula');
      }
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      alert('Erro ao deletar aula. Tente novamente.');
    }
  };

  const addObjective = () => setLearningObjectives([...learningObjectives, '']);
  const removeObjective = (index: number) =>
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  const updateObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const addRequirement = () => setRequirements([...requirements, '']);
  const removeRequirement = (index: number) =>
    setRequirements(requirements.filter((_, i) => i !== index));
  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
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

  const statusColors = {
    draft: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    published: 'bg-green-500/10 text-green-500 border-green-500/20',
    archived: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  const statusLabels = {
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Editar Curso</h1>
            <Badge className={`${statusColors[course.status]} border`}>
              {statusLabels[course.status]}
            </Badge>
          </div>
          <p className="text-zinc-400">{course.title}</p>
        </div>
        <div className="flex gap-2">
          {course.status === 'draft' && (
            <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700 text-white">
              <Send className="h-4 w-4 mr-2" />
              Publicar Curso
            </Button>
          )}
          {course.status === 'published' && (
            <Button onClick={handleArchive} variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.open(`/academia/curso/${course.slug}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Alunos Matriculados</p>
            <p className="text-2xl font-bold text-white">{course.enrolled_count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Aulas</p>
            <p className="text-2xl font-bold text-white">{lessons.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Conclusões</p>
            <p className="text-2xl font-bold text-white">{course.completed_count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Taxa de Conclusão</p>
            <p className="text-2xl font-bold text-white">
              {course.enrolled_count && course.enrolled_count > 0
                ? Math.round(((course.completed_count || 0) / course.enrolled_count) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Course Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Informações do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Título do Curso *
                  </Label>
                  <Input
                    id="title"
                    {...register('title')}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug" className="text-white">
                    Slug (URL) *
                  </Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>}
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Descrição *
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-white">
                      Categoria *
                    </Label>
                    <Input
                      id="category"
                      {...register('category')}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="difficulty_level" className="text-white">
                      Nível *
                    </Label>
                    <Select
                      onValueChange={(value: string | number | boolean) => setValue('difficulty_level', value)}
                      value={watch('difficulty_level')}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructor_name" className="text-white">
                    Instrutor
                  </Label>
                  <Input
                    id="instructor_name"
                    {...register('instructor_name')}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="cover_image_url" className="text-white">
                    URL da Imagem de Capa
                  </Label>
                  <Input
                    id="cover_image_url"
                    {...register('cover_image_url')}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {/* Learning Objectives */}
                <div className="pt-4 border-t border-zinc-800">
                  <Label className="text-white mb-3 block">Objetivos de Aprendizagem</Label>
                  {learningObjectives.map((objective, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeObjective(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addObjective} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {/* Requirements */}
                <div className="pt-4 border-t border-zinc-800">
                  <Label className="text-white mb-3 block">Requisitos</Label>
                  {requirements.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addRequirement} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="destructive" onClick={handleDeleteCourse}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar Curso
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-white text-black hover:bg-red-500 hover:text-white transition-colors">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Lessons */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Aulas ({lessons.length})</CardTitle>
                <Button
                  onClick={() => router.push(`/admin/academia/cursos/${courseId}/aulas/nova`)}
                  className="bg-white text-black hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 mb-4">Nenhuma aula criada ainda</p>
                  <Button
                    onClick={() => router.push(`/admin/academia/cursos/${courseId}/aulas/nova`)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Aula
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-4 w-4 text-zinc-600 cursor-move" />
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {lesson.content_type === 'video' && (
                              <Badge variant="outline" className="text-xs border-zinc-700">
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Vídeo • {lesson.duration_minutes}min
                              </Badge>
                            )}
                            {lesson.content_type === 'quiz' && (
                              <Badge variant="outline" className="text-xs border-zinc-700">
                                <BarChart className="h-3 w-3 mr-1" />
                                Quiz
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/admin/academia/cursos/${courseId}/aulas/${lesson.id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workload_hours" className="text-white">
                  Carga Horária (horas)
                </Label>
                <Input
                  id="workload_hours"
                  type="number"
                  {...register('workload_hours', { valueAsNumber: true })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_free" {...register('is_free')} className="w-4 h-4" />
                <Label htmlFor="is_free" className="text-white cursor-pointer">
                  Curso Gratuito
                </Label>
              </div>

              {!isFree && (
                <div>
                  <Label htmlFor="price" className="text-white">
                    Preço (R$)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="certificate_enabled"
                  {...register('certificate_enabled')}
                  className="w-4 h-4"
                />
                <Label htmlFor="certificate_enabled" className="text-white cursor-pointer">
                  Emitir Certificado
                </Label>
              </div>

              <div>
                <Label htmlFor="minimum_score" className="text-white">
                  Nota Mínima (%)
                </Label>
                <Input
                  id="minimum_score"
                  type="number"
                  {...register('minimum_score', { valueAsNumber: true })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
