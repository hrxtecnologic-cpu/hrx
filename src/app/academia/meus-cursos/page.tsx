'use client';

import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/academy/CourseCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, TrendingUp, Clock, Target } from 'lucide-react';
import Link from 'next/link';

interface Enrollment {
  id: string;
  status: string;
  progress_percentage: number;
  completed_at: string | null;
  certificate_code: string | null;
  courses: Array<Record<string, unknown>>;
}

interface Stats {
  active_courses: number;
  completed_courses: number;
  certificates_earned: number;
  total_hours_studied: number;
  average_score: number;
  badges_count: number;
}

export default function MeusCursosPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  async function fetchMyCourses() {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/my-courses');
      const data = await res.json();

      if (data.success) {
        setEnrollments(data.data.enrollments);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'active') return enrollment.status === 'active';
    if (filter === 'completed') return enrollment.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Carregando seus cursos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Meus Cursos</h1>
              <p className="text-white/90">Continue sua jornada de aprendizado</p>
            </div>
            <Link href="/academia">
              <Button variant="outline" className="border-white text-white hover:bg-red-500 hover:border-red-500 transition-colors">
                <BookOpen className="h-4 w-4 mr-2" />
                Explorar Cursos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Cursos Ativos</p>
                    <p className="text-3xl font-bold text-white">{stats.active_courses}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <BookOpen className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Concluídos</p>
                    <p className="text-3xl font-bold text-white">{stats.completed_courses}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Target className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Certificados</p>
                    <p className="text-3xl font-bold text-white">{stats.certificates_earned}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Award className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Horas Estudadas</p>
                    <p className="text-3xl font-bold text-white">{stats.total_hours_studied}h</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
          >
            Todos ({enrollments.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
          >
            Em Andamento ({enrollments.filter(e => e.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'text-white hover:bg-red-500 hover:border-red-500 hover:text-white'}
          >
            Concluídos ({enrollments.filter(e => e.status === 'completed').length})
          </Button>
        </div>

        {/* Courses Grid */}
        {filteredEnrollments.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {filter === 'all' && 'Você ainda não está matriculado em nenhum curso'}
                {filter === 'active' && 'Nenhum curso em andamento'}
                {filter === 'completed' && 'Nenhum curso concluído ainda'}
              </h3>
              <p className="text-zinc-400 mb-6">
                Explore o catálogo e comece a aprender hoje mesmo!
              </p>
              <Link href="/academia">
                <Button className="bg-white text-black hover:bg-red-500 hover:text-white transition-colors">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Cursos Disponíveis
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                course={enrollment.courses}
                showProgress
                progress={enrollment.progress_percentage}
                enrolled
              />
            ))}
          </div>
        )}

        {/* Performance Card */}
        {stats && stats.average_score > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Seu Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500 mb-1">
                    {stats.average_score.toFixed(1)}%
                  </p>
                  <p className="text-sm text-zinc-400">Média Geral</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-500 mb-1">
                    {stats.badges_count}
                  </p>
                  <p className="text-sm text-zinc-400">Badges Conquistados</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-500 mb-1">
                    {stats.certificates_earned}
                  </p>
                  <p className="text-sm text-zinc-400">Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
