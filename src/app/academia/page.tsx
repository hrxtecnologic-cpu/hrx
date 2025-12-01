'use client';

import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/academy/CourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, GraduationCap, BookOpen, Award, TrendingUp } from 'lucide-react';
import type { Course } from '@/types/academy';
import Link from 'next/link';

export default function AcademiaPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const url = new URL('/api/academy/courses', window.location.origin);

        if (categoryFilter !== 'all') {
          url.searchParams.set('category', categoryFilter);
        }

        if (difficultyFilter !== 'all') {
          url.searchParams.set('difficulty', difficultyFilter);
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
  }, [categoryFilter, difficultyFilter]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description.toLowerCase().includes(search.toLowerCase())
  );

  // Extrair categorias únicas
  const categories = Array.from(new Set(courses.map(c => c.category)));

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Academia HRX
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Aprimore suas habilidades com cursos profissionalizantes gratuitos.
              Aprenda com especialistas e receba certificado reconhecido.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{courses.length}</p>
                <p className="text-sm text-white/80">Cursos Disponíveis</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {courses.reduce((acc, c) => acc + c.enrolled_count, 0)}
                </p>
                <p className="text-sm text-white/80">Alunos Matriculados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {courses.reduce((acc, c) => acc + c.completed_count, 0)}
                </p>
                <p className="text-sm text-white/80">Certificados Emitidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/academia/meus-cursos">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition cursor-pointer">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">Meus Cursos</h3>
                <p className="text-sm text-zinc-400">Continue de onde parou</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/academia/certificados">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition cursor-pointer">
              <CardContent className="p-6 text-center">
                <Award className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">Certificados</h3>
                <p className="text-sm text-zinc-400">Seus certificados conquistados</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/academia/badges">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 transition cursor-pointer">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">Badges</h3>
                <p className="text-sm text-zinc-400">Conquistas e ranking</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter('all')}
                  size="sm"
                  className={categoryFilter === 'all' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
                >
                  Todas
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter(category)}
                    size="sm"
                    className={categoryFilter === category ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Difficulty Filter */}
              <div className="flex gap-2">
                <Button
                  variant={difficultyFilter === 'beginner' ? 'default' : 'outline'}
                  onClick={() => setDifficultyFilter(difficultyFilter === 'beginner' ? 'all' : 'beginner')}
                  size="sm"
                  className={difficultyFilter === 'beginner' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
                >
                  Iniciante
                </Button>
                <Button
                  variant={difficultyFilter === 'intermediate' ? 'default' : 'outline'}
                  onClick={() => setDifficultyFilter(difficultyFilter === 'intermediate' ? 'all' : 'intermediate')}
                  size="sm"
                  className={difficultyFilter === 'intermediate' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
                >
                  Intermediário
                </Button>
                <Button
                  variant={difficultyFilter === 'advanced' ? 'default' : 'outline'}
                  onClick={() => setDifficultyFilter(difficultyFilter === 'advanced' ? 'all' : 'advanced')}
                  size="sm"
                  className={difficultyFilter === 'advanced' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
                >
                  Avançado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
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
              <p className="text-zinc-400">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
