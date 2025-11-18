'use client';

import { useState } from 'react';
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
import { Loader2, Save, X, Plus, ArrowLeft, Info } from 'lucide-react';

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
  cover_image: z.string().url('URL inválida').optional().or(z.literal('')),
  instructor_name: z.string().optional(),
  certificate_on_completion: z.boolean(),
  minimum_score: z.number().min(0).max(100).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function NovoCursoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      difficulty_level: 'beginner',
      is_free: true,
      certificate_on_completion: true,
      workload_hours: 1,
      price: 0,
      minimum_score: 70,
    },
  });

  const isFree = watch('is_free');
  const difficulty = watch('difficulty_level');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true);

    try {
      const payload = {
        ...data,
        learning_objectives: learningObjectives.filter((obj) => obj.trim() !== ''),
        requirements: requirements.filter((req) => req.trim() !== ''),
      };

      const res = await fetch('/api/admin/academy/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert('Curso criado com sucesso!');
        router.push(`/admin/academia/cursos/${result.data.id}`);
      } else {
        alert(result.error || 'Erro ao criar curso');
      }
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      alert('Erro ao criar curso. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const addObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const removeObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  return (
    <div className="min-h-screen bg-black pb-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/admin/academia/cursos')}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Criar Novo Curso</h1>
                <p className="text-zinc-400 mt-1">
                  Preencha as informações para criar um novo curso na Academia HRX
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Col 2 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Informações Básicas */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="text-xl text-white">Informações Básicas</CardTitle>
                  <CardDescription className="text-zinc-400 mt-2">
                    Dados essenciais do curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Título */}
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-medium text-white">
                      Título do Curso <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...register('title')}
                      onChange={(e) => {
                        register('title').onChange(e);
                        setValue('slug', generateSlug(e.target.value));
                      }}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                      placeholder="Ex: Bartender Profissional"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="space-y-3">
                    <Label htmlFor="slug" className="text-sm font-medium text-white">
                      URL do Curso (Slug) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slug"
                      {...register('slug')}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11 font-mono"
                      placeholder="bartender-profissional"
                    />
                    {errors.slug ? (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {errors.slug.message}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        URL: /academia/curso/{watch('slug') || 'slug-do-curso'}
                      </p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-medium text-white">
                      Descrição do Curso <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[140px] resize-none"
                      placeholder="Descreva o curso, seus benefícios e o que o aluno vai aprender..."
                    />
                    {errors.description && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {errors.description.message}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">{watch('description')?.length || 0} caracteres</p>
                  </div>

                  {/* Categoria e Dificuldade */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="category" className="text-sm font-medium text-white">
                        Categoria <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="category"
                        {...register('category')}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                        placeholder="Ex: bar, cozinha, garçom"
                      />
                      {errors.category && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white">
                        Nível de Dificuldade <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        onValueChange={(value: any) => setValue('difficulty_level', value)}
                        defaultValue="beginner"
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="beginner" className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                            Iniciante
                          </SelectItem>
                          <SelectItem value="intermediate" className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                            Intermediário
                          </SelectItem>
                          <SelectItem value="advanced" className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                            Avançado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Instrutor e Imagem */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="instructor_name" className="text-sm font-medium text-white">
                        Nome do Instrutor
                      </Label>
                      <Input
                        id="instructor_name"
                        {...register('instructor_name')}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                        placeholder="Ex: João Silva"
                      />
                      <p className="text-xs text-zinc-500">Deixe em branco para usar "Equipe HRX"</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cover_image" className="text-sm font-medium text-white">
                        URL da Imagem de Capa
                      </Label>
                      <Input
                        id="cover_image"
                        {...register('cover_image')}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                        placeholder="https://..."
                      />
                      {errors.cover_image && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {errors.cover_image.message}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500">Recomendado: 1200x630px</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Objetivos de Aprendizagem */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="text-xl text-white">Objetivos de Aprendizagem</CardTitle>
                  <CardDescription className="text-zinc-400 mt-2">
                    O que os alunos vão aprender neste curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {learningObjectives.map((objective, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11 flex-1"
                        placeholder={`Objetivo ${index + 1}: Ex: Preparar coquetéis clássicos`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeObjective(index)}
                        disabled={learningObjectives.length === 1}
                        className="border-zinc-700 hover:bg-zinc-800 h-11 w-11"
                      >
                        <X className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addObjective}
                    className="w-full border-zinc-700 hover:bg-zinc-800 text-white h-11"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Objetivo
                  </Button>
                </CardContent>
              </Card>

              {/* Requisitos */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="text-xl text-white">Requisitos</CardTitle>
                  <CardDescription className="text-zinc-400 mt-2">
                    O que os alunos precisam saber antes de começar
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11 flex-1"
                        placeholder={`Requisito ${index + 1}: Ex: Conhecimento básico de inglês`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        disabled={requirements.length === 1}
                        className="border-zinc-700 hover:bg-zinc-800 h-11 w-11"
                      >
                        <X className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRequirement}
                    className="w-full border-zinc-700 hover:bg-zinc-800 text-white h-11"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Requisito
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Col 1 */}
            <div className="lg:col-span-1 space-y-6">
              {/* Configurações do Curso */}
              <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="text-xl text-white">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Carga Horária */}
                  <div className="space-y-3">
                    <Label htmlFor="workload_hours" className="text-sm font-medium text-white">
                      Carga Horária (horas) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="workload_hours"
                      type="number"
                      {...register('workload_hours', { valueAsNumber: true })}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                      min="1"
                    />
                    {errors.workload_hours && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {errors.workload_hours.message}
                      </p>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                      <input
                        type="checkbox"
                        id="is_free"
                        {...register('is_free')}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-zinc-900"
                      />
                      <Label htmlFor="is_free" className="text-sm font-medium text-white cursor-pointer">
                        Curso Gratuito
                      </Label>
                    </div>

                    {!isFree && (
                      <div className="space-y-3">
                        <Label htmlFor="price" className="text-sm font-medium text-white">
                          Preço (R$)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          {...register('price', { valueAsNumber: true })}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                          min="0"
                          placeholder="0.00"
                        />
                        {errors.price && (
                          <p className="text-sm text-red-400 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {errors.price.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Certificação */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                      <input
                        type="checkbox"
                        id="certificate_on_completion"
                        {...register('certificate_on_completion')}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-zinc-900"
                      />
                      <Label htmlFor="certificate_on_completion" className="text-sm font-medium text-white cursor-pointer">
                        Emitir Certificado
                      </Label>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="minimum_score" className="text-sm font-medium text-white">
                        Nota Mínima para Aprovação (%)
                      </Label>
                      <Input
                        id="minimum_score"
                        type="number"
                        {...register('minimum_score', { valueAsNumber: true })}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                        min="0"
                        max="100"
                        placeholder="70"
                      />
                      {errors.minimum_score && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {errors.minimum_score.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-medium"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando Curso...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Criar Curso
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/admin/academia/cursos')}
                      className="w-full border-zinc-700 hover:bg-zinc-800 text-white h-11"
                    >
                      Cancelar
                    </Button>

                    <p className="text-xs text-zinc-500 text-center pt-2">
                      O curso será criado como rascunho. Adicione aulas antes de publicar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
