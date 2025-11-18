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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react';
import type { CourseLesson } from '@/types/academy';

const lessonSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  order_index: z.number().min(1, 'Ordem deve ser maior que 0'),
  content_type: z.enum(['video', 'quiz', 'text']),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  video_provider: z.enum(['youtube', 'vimeo', 'other']).optional(),
  duration_minutes: z.number().min(0).optional(),
  text_content: z.string().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface EditLessonPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default function EditLessonPage({ params }: EditLessonPageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correct: 0, explanation: '' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  });

  const contentType = watch('content_type');

  // Unwrap params
  useEffect(() => {
    params.then((p) => {
      setCourseId(p.id);
      setLessonId(p.lessonId);
    });
  }, [params]);

  // Fetch lesson data
  useEffect(() => {
    if (!lessonId) return;

    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/admin/academy/lessons/${lessonId}`);
        const data = await res.json();

        if (!data.success) {
          router.push(`/admin/academia/cursos/${courseId}`);
          return;
        }

        const lessonData = data.data;
        setLesson(lessonData);

        reset({
          title: lessonData.title,
          description: lessonData.description || '',
          order_index: lessonData.order_index,
          content_type: lessonData.content_type,
          video_url: lessonData.video_url || '',
          video_provider: lessonData.video_provider || 'youtube',
          duration_minutes: lessonData.duration_minutes || 0,
          text_content: lessonData.text_content || '',
        });

        if (lessonData.content_type === 'quiz' && lessonData.quiz_data) {
          setQuizQuestions(lessonData.quiz_data);
        }
      } catch (error) {
        console.error('Erro ao buscar aula:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, courseId, router, reset]);

  const onSubmit = async (data: LessonFormData) => {
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = { ...data };

      if (data.content_type === 'quiz') {
        const validQuestions = quizQuestions.filter(
          (q) => q.question.trim() !== '' && q.options.every((opt) => opt.trim() !== '')
        );

        if (validQuestions.length === 0) {
          alert('Adicione pelo menos uma questão válida ao quiz.');
          setSubmitting(false);
          return;
        }

        payload.quiz_data = validQuestions;
      }

      const res = await fetch(`/api/admin/academy/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert('Aula atualizada com sucesso!');
        router.push(`/admin/academia/cursos/${courseId}`);
      } else {
        alert(result.error || 'Erro ao atualizar aula');
      }
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      alert('Erro ao atualizar aula. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return;

    try {
      const res = await fetch(`/api/admin/academy/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (result.success) {
        alert('Aula deletada com sucesso!');
        router.push(`/admin/academia/cursos/${courseId}`);
      } else {
        alert(result.error || 'Erro ao deletar aula');
      }
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
      alert('Erro ao deletar aula. Tente novamente.');
    }
  };

  const addQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      { question: '', options: ['', '', '', ''], correct: 0, explanation: '' },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number | string[]) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...quizQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setQuizQuestions(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Aula não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Editar Aula</h1>
          <p className="text-zinc-400">{lesson.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar Aula
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin/academia/cursos/${courseId}`)}>
            Voltar ao Curso
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Título da Aula *
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
                  <Label htmlFor="description" className="text-white">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="content_type" className="text-white">
                      Tipo de Conteúdo *
                    </Label>
                    <Select
                      onValueChange={(value: string | number | boolean) => setValue('content_type', value)}
                      value={watch('content_type')}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="text">Texto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="order_index" className="text-white">
                      Ordem *
                    </Label>
                    <Input
                      id="order_index"
                      type="number"
                      {...register('order_index', { valueAsNumber: true })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Content */}
            {contentType === 'video' && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Configuração do Vídeo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="video_provider" className="text-white">
                      Provedor do Vídeo *
                    </Label>
                    <Select
                      onValueChange={(value: string | number | boolean) => setValue('video_provider', value)}
                      value={watch('video_provider')}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="vimeo">Vimeo</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="video_url" className="text-white">
                      URL do Vídeo *
                    </Label>
                    <Input
                      id="video_url"
                      {...register('video_url')}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {errors.video_url && (
                      <p className="text-sm text-red-500 mt-1">{errors.video_url.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="duration_minutes" className="text-white">
                      Duração (minutos)
                    </Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      {...register('duration_minutes', { valueAsNumber: true })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Content */}
            {contentType === 'quiz' && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Questões do Quiz</CardTitle>
                    <Button type="button" variant="outline" onClick={addQuestion} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Questão
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {quizQuestions.map((question, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 bg-zinc-800/50 border border-zinc-800 rounded-lg space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Questão {qIdx + 1}</Label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(qIdx)}
                          disabled={quizQuestions.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="Digite a pergunta..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-zinc-400">Opções de Resposta</Label>
                        {question.options.map((option, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={question.correct === oIdx}
                              onChange={() => updateQuestion(qIdx, 'correct', oIdx)}
                              className="w-4 h-4"
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              className="bg-zinc-800 border-zinc-700 text-white"
                              placeholder={`Opção ${oIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label className="text-sm text-zinc-400">Explicação (opcional)</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Text Content */}
            {contentType === 'text' && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Conteúdo de Texto</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...register('text_content')}
                    className="bg-zinc-800 border-zinc-700 text-white min-h-[300px]"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/academia/cursos/${courseId}`)}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
