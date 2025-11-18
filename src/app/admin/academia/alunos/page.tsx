'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Award,
  BookOpen,
  TrendingUp,
  Loader2,
  Eye,
  Mail,
  Calendar,
} from 'lucide-react';

interface Enrollment {
  id: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
  professionals?: {
    id: string;
    full_name: string;
    email: string;
  };
  courses?: {
    id: string;
    title: string;
    category: string;
  };
}

export default function AlunosAdminPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch('/api/admin/academy/enrollments');
      const data = await res.json();

      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique courses for filter
  const uniqueCourses = Array.from(
    new Set(enrollments.map((e) => e.courses?.title))
  ).filter(Boolean);

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.professionals?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.professionals?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;

    const matchesCourse =
      courseFilter === 'all' || enrollment.courses?.title === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  // Calculate stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === 'active').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
    averageProgress:
      enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length
          )
        : 0,
  };

  const statusColors: Record<string, string> = {
    active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    dropped: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    completed: 'Concluído',
    dropped: 'Desistente',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Alunos da Academia</h1>
        <p className="text-zinc-400">Visualize e gerencie todos os alunos matriculados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total de Matrículas</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Alunos Ativos</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Award className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Concluídos</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Progresso Médio</p>
                <p className="text-2xl font-bold text-white">{stats.averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email ou curso..."
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="dropped">Desistentes</SelectItem>
              </SelectContent>
            </Select>

            {/* Course Filter */}
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Cursos</SelectItem>
                {uniqueCourses.map((course) => (
                  <SelectItem key={course} value={course || ''}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            Matrículas ({filteredEnrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">
                {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                  ? 'Nenhuma matrícula encontrada com os filtros selecionados'
                  : 'Nenhuma matrícula ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-semibold">
                          {enrollment.professionals?.full_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {enrollment.professionals?.full_name || 'Aluno'}
                          </p>
                          <p className="text-sm text-zinc-500 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {enrollment.professionals?.email || 'Sem email'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <BookOpen className="h-4 w-4" />
                          <span>{enrollment.courses?.title || 'Curso'}</span>
                        </div>
                        <Badge className="text-xs border-zinc-700" variant="outline">
                          {enrollment.courses?.category}
                        </Badge>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-zinc-400 mb-1">Progresso</p>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-white w-12 text-right">
                            {enrollment.progress_percentage}%
                          </span>
                        </div>
                      </div>

                      <Badge className={`${statusColors[enrollment.status]} border`}>
                        {statusLabels[enrollment.status]}
                      </Badge>

                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {enrollment.completed_at && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-xs text-green-500 flex items-center gap-2">
                        <Award className="h-3 w-3" />
                        Concluído em {new Date(enrollment.completed_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
