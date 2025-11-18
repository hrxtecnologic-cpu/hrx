'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Eye,
  Archive,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty_level: string;
  status: 'draft' | 'published' | 'archived';
  workload_hours: number;
  enrolled_count: number;
  completed_count: number;
  is_free: boolean;
  price: number;
  created_at: string;
}

export default function CursosAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const url = new URL('/api/admin/academy/courses', window.location.origin);

        if (statusFilter !== 'all') {
          url.searchParams.set('status', statusFilter);
        }

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.success) {
          setCourses(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [statusFilter]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.category.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    draft: 'bg-yellow-500/10 text-yellow-500',
    published: 'bg-green-500/10 text-green-500',
    archived: 'bg-gray-500/10 text-gray-500',
  };

  const difficultyColors = {
    beginner: 'bg-blue-500/10 text-blue-500',
    intermediate: 'bg-orange-500/10 text-orange-500',
    advanced: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cursos</h1>
          <p className="text-zinc-400">Gerencie todos os cursos da Academia HRX</p>
        </div>
        <Link href="/admin/academia/cursos/novo">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar cursos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-blue-600' : ''}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('published')}
                className={statusFilter === 'published' ? 'bg-green-600' : ''}
              >
                Publicados
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                className={statusFilter === 'draft' ? 'bg-yellow-600' : ''}
              >
                Rascunhos
              </Button>
              <Button
                variant={statusFilter === 'archived' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('archived')}
                className={statusFilter === 'archived' ? 'bg-gray-600' : ''}
              >
                Arquivados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">Carregando cursos...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-zinc-400 mb-6">
              Comece criando seu primeiro curso!
            </p>
            <Link href="/admin/academia/cursos/novo">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Curso
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {course.title}
                      </h3>
                      <Badge className={statusColors[course.status]}>
                        {course.status === 'draft' && 'Rascunho'}
                        {course.status === 'published' && 'Publicado'}
                        {course.status === 'archived' && 'Arquivado'}
                      </Badge>
                      <Badge className={difficultyColors[course.difficulty_level as keyof typeof difficultyColors]}>
                        {course.difficulty_level === 'beginner' && 'Iniciante'}
                        {course.difficulty_level === 'intermediate' && 'Intermediário'}
                        {course.difficulty_level === 'advanced' && 'Avançado'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-zinc-400 mb-3">
                      <span>📚 {course.category}</span>
                      <span>⏱️ {course.workload_hours}h</span>
                      <span>👥 {course.enrolled_count} alunos</span>
                      <span>✅ {course.completed_count} concluídos</span>
                      {course.is_free ? (
                        <span className="text-green-500 font-medium">Gratuito</span>
                      ) : (
                        <span className="text-blue-500 font-medium">
                          R$ {course.price?.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500">
                      Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/academia/curso/${course.slug}`} target="_blank">
                      <Button variant="outline" size="sm" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Link href={`/admin/academia/cursos/${course.id}`}>
                      <Button variant="outline" size="sm" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>

                    {course.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Arquivar"
                        className="text-yellow-500 hover:text-yellow-400"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}

                    {course.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        title="Publicar"
                        className="text-green-500 hover:text-green-400"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
