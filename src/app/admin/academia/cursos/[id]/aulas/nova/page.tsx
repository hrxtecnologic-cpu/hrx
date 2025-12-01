'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, Save, X, Plus, Video, FileText, HelpCircle, ArrowLeft } from 'lucide-react';
import { RichTextEditor } from '@/components/academy/RichTextEditor';
import { toast } from 'sonner';

const lessonSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  order_index: z.number().min(1, 'Ordem deve ser maior que 0'),
  content_type: z.enum(['video', 'quiz', 'text']),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  video_provider: z.enum(['youtube', 'vimeo', 'other']).optional(),
  duration_minutes: z.number().min(0).optional(),
  text_content: z.string().optional(),
  is_preview: z.boolean().optional(),
  is_mandatory: z.boolean().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface NewLessonPageProps {
  params: Promise<{ id: string }>;
}

export default function NewLessonPage({ params }: NewLessonPageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string>('');
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
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      content_type: 'video',
      video_provider: 'youtube',
      order_index: 1,
      duration_minutes: 0,
      is_preview: false,
      is_mandatory: true,
    },
  });

  const contentType = watch('content_type');

  // Unwrap params
  useEffect(() => {
    params.then((p) => setCourseId(p.id));
  }, [params]);

  const onSubmit = async (data: LessonFormData) => {
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = { ...data };

      // Add quiz data if content type is quiz
      if (data.content_type === 'quiz') {
        const validQuestions = quizQuestions.filter(
          (q) => q.question.trim() !== '' && q.options.every((opt) => opt.trim() !== '')
        );

        if (validQuestions.length === 0) {
          toast.error('Quiz inválido', {
            description: 'Adicione pelo menos uma questão válida com todas as opções preenchidas.'
          });
          setSubmitting(false);
          return;
        }

        payload.quiz_data = validQuestions;
      }

      const res = await fetch(`/api/admin/academy/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('Aula criada com sucesso!', {
          description: 'Redirecionando para a página do curso...'
        });
        router.push(`/admin/academia/cursos/${courseId}`);
      } else {
        toast.error('Erro ao criar aula', {
          description: result.error || 'Verifique os dados e tente novamente.'
        });
      }
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast.error('Erro ao criar aula', {
        description: 'Verifique sua conexão e tente novamente.'
      });
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Criar Nova Aula</h1>
          <p className="text-zinc-400">Preencha as informações da aula</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/admin/academia/cursos/${courseId}`)}>
          Voltar ao Curso
        </Button>
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
                    placeholder="Ex: Introdução ao Bartending"
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
                    placeholder="Descreva o conteúdo da aula..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="content_type" className="text-white">
                      Tipo de Conteúdo *
                    </Label>
                    <Select
                      onValueChange={(value: string | number | boolean) => setValue('content_type', value)}
                      defaultValue="video"
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
                    {errors.order_index && (
                      <p className="text-sm text-red-500 mt-1">{errors.order_index.message}</p>
                    )}
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
                      defaultValue="youtube"
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
                    <p className="text-xs text-zinc-500 mt-1">
                      Cole a URL completa do vídeo do YouTube ou Vimeo
                    </p>
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
                        <p className="text-xs text-zinc-500">Selecione a resposta correta</p>
                      </div>

                      <div>
                        <Label className="text-sm text-zinc-400">Explicação (opcional)</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="Explique por que essa é a resposta correta..."
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
                  <CardDescription className="text-zinc-400">
                    Use o editor para formatar seu conteúdo com negrito, itálico, listas e mais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={watch('text_content') || ''}
                    onChange={(value) => setValue('text_content', value)}
                    placeholder="Digite o conteúdo da aula aqui..."
                    maxLength={50000}
                    minHeight="400px"
                  />
                </CardContent>
              </Card>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Configurações da Aula */}
            <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Opções de Exibição */}
                <div className="space-y-4">
                  <Label className="text-white text-sm">Opções de Exibição</Label>

                  <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                    <input
                      type="checkbox"
                      id="is_preview"
                      {...register('is_preview')}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600"
                    />
                    <div>
                      <Label htmlFor="is_preview" className="text-sm font-medium text-white cursor-pointer">
                        Aula Preview (Gratuita)
                      </Label>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Visível para não matriculados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                    <input
                      type="checkbox"
                      id="is_mandatory"
                      {...register('is_mandatory')}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600"
                    />
                    <div>
                      <Label htmlFor="is_mandatory" className="text-sm font-medium text-white cursor-pointer">
                        Aula Obrigatória
                      </Label>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Necessária para conclusão do curso
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-black hover:bg-red-500 hover:text-white transition-colors h-12"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Criar Aula
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/academia/cursos/${courseId}`)}
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Curso
                  </Button>
                </div>

                {/* Dicas */}
                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <p className="text-sm font-medium text-white">Dicas</p>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Video className="h-3.5 w-3.5 mt-0.5 text-red-500" />
                      <span>Use URLs do YouTube ou Vimeo para vídeos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HelpCircle className="h-3.5 w-3.5 mt-0.5 text-purple-500" />
                      <span>Quiz: mínimo 1 questão com 4 opções</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
                      <span>Textos suportam formatação rica</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
