import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default async function AcademiaAdminPage() {
  // Buscar estatísticas da academia
  let stats = {};
  let weeklyActivity = {};
  let popularCourses = [];
  let recentEnrollments = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/academy/statistics`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const { data } = await response.json();
      stats = data?.overview || {};
      weeklyActivity = data?.weekly_activity || {};
      popularCourses = data?.popular_courses || [];
      recentEnrollments = data?.recent_enrollments || [];
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
  }

  const statsCards = [
    {
      title: 'Total de Cursos',
      value: stats.total_courses || 0,
      subtitle: `${stats.published_courses || 0} publicados`,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Matrículas Ativas',
      value: stats.active_enrollments || 0,
      subtitle: `${stats.total_enrollments || 0} no total`,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Cursos Concluídos',
      value: stats.total_completions || 0,
      subtitle: `${stats.completion_rate || 0}% taxa de conclusão`,
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Certificados Emitidos',
      value: stats.total_certificates || 0,
      subtitle: `${weeklyActivity.completed_courses || 0} esta semana`,
      icon: GraduationCap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Academia HRX</h1>
          <p className="text-zinc-400">Gerencie cursos, alunos e certificações</p>
        </div>
        <Link
          href="/admin/academia/cursos/novo"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Novo Curso
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Atividade Semanal */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Atividade dos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">Novas Matrículas</p>
              <p className="text-2xl font-bold text-green-500">
                {weeklyActivity.new_enrollments || 0}
              </p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">Cursos Concluídos</p>
              <p className="text-2xl font-bold text-blue-500">
                {weeklyActivity.completed_courses || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos Populares */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Cursos Mais Populares</CardTitle>
            <CardDescription className="text-zinc-400">
              Por número de matrículas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularCourses.length > 0 ? (
                popularCourses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/admin/academia/cursos/${course.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{course.title}</p>
                      <p className="text-xs text-zinc-500">{course.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-500">
                        {course.enrolled_count} alunos
                      </p>
                      <p className="text-xs text-zinc-500">
                        {course.completed_count} concluíram
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Nenhum curso publicado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Matrículas Recentes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Matrículas Recentes</CardTitle>
            <CardDescription className="text-zinc-400">
              Últimas atividades de alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEnrollments.length > 0 ? (
                recentEnrollments.slice(0, 5).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {enrollment.professionals?.full_name || 'Aluno'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {enrollment.courses?.title || 'Curso'}
                      </p>
                    </div>
                    <div className="text-right">
                      {enrollment.status === 'completed' ? (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                          Concluído
                        </span>
                      ) : (
                        <div>
                          <p className="text-xs text-zinc-400">
                            {enrollment.progress_percentage}%
                          </p>
                          <div className="w-16 h-1 bg-zinc-700 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Nenhuma matrícula ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/academia/cursos"
              className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition"
            >
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-white">Gerenciar Cursos</p>
                <p className="text-xs text-zinc-400">{stats.total_courses || 0} cursos</p>
              </div>
            </Link>

            <Link
              href="/admin/academia/alunos"
              className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition"
            >
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-semibold text-white">Ver Alunos</p>
                <p className="text-xs text-zinc-400">{stats.active_enrollments || 0} ativos</p>
              </div>
            </Link>

            <Link
              href="/admin/academia/certificados"
              className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition"
            >
              <Award className="h-8 w-8 text-purple-500" />
              <div>
                <p className="font-semibold text-white">Certificados</p>
                <p className="text-xs text-zinc-400">{stats.total_certificates || 0} emitidos</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
