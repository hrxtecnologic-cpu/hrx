'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Star, Award, Target, Zap, Crown, Lock } from 'lucide-react';

interface CourseBadge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_category: string;
  requirement_type: string;
  requirement_value: number;
}

interface ProfessionalBadge {
  id: string;
  earned_at: string;
  course_badges?: CourseBadge;
}

export default function BadgesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [earnedBadges, setEarnedBadges] = useState<ProfessionalBadge[]>([]);
  const [allBadges, setAllBadges] = useState<CourseBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/entrar');
      return;
    }

    const fetchBadges = async () => {
      try {
        // Fetch professional stats which includes badges
        const statsRes = await fetch('/api/academy/my-stats');
        const statsData = await statsRes.json();

        if (statsData.success) {
          setEarnedBadges(statsData.data.badges || []);
        }

        // Fetch all available badges
        const badgesRes = await fetch('/api/academy/badges');
        if (badgesRes.ok) {
          const badgesData = await badgesRes.json();
          if (badgesData.success) {
            setAllBadges(badgesData.data);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user, isLoaded, router]);

  const getBadgeIcon = (iconName: string) => {
    const icons: any = {
      trophy: Trophy,
      star: Star,
      award: Award,
      target: Target,
      zap: Zap,
      crown: Crown,
    };
    return icons[iconName] || Trophy;
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      completion: 'bg-green-500/10 text-green-500 border-green-500/20',
      streak: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      milestone: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      achievement: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      excellence: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[category] || 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const isEarned = (badgeId: string) => {
    return earnedBadges.some((eb) => eb.course_badges?.id === badgeId);
  };

  const getEarnedDate = (badgeId: string) => {
    const earned = earnedBadges.find((eb) => eb.course_badges?.id === badgeId);
    return earned ? new Date(earned.earned_at).toLocaleDateString('pt-BR') : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Conquistas e Badges</h1>
          </div>
          <p className="text-zinc-400">
            Ganhe badges completando cursos e atingindo marcos importantes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Badges Conquistados</p>
                  <p className="text-2xl font-bold text-white">
                    {earnedBadges.length} / {allBadges.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-white">
                    {allBadges.length > 0
                      ? Math.round((earnedBadges.length / allBadges.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Star className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Próximo Badge</p>
                  <p className="text-sm font-medium text-white">
                    {allBadges.length - earnedBadges.length > 0
                      ? `${allBadges.length - earnedBadges.length} restantes`
                      : 'Todos conquistados!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">Progresso Geral</p>
              <p className="text-sm font-semibold text-white">
                {earnedBadges.length} / {allBadges.length}
              </p>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{
                  width: `${allBadges.length > 0 ? (earnedBadges.length / allBadges.length) * 100 : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Todos os Badges</h2>

          {allBadges.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-12 text-center">
                <div className="inline-block p-6 bg-zinc-800/50 rounded-full mb-4">
                  <Trophy className="h-12 w-12 text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Nenhum badge disponível
                </h3>
                <p className="text-zinc-400">
                  Os badges aparecerão aqui quando forem criados pelos administradores
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allBadges.map((badge) => {
                const earned = isEarned(badge.id);
                const earnedDate = getEarnedDate(badge.id);
                const Icon = getBadgeIcon(badge.badge_icon);

                return (
                  <Card
                    key={badge.id}
                    className={`border transition-all ${
                      earned
                        ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
                        : 'bg-zinc-900/50 border-zinc-800 opacity-60'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        {/* Badge Icon */}
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                            earned
                              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                              : 'bg-zinc-800'
                          }`}
                        >
                          {earned ? (
                            <Icon className="h-10 w-10 text-white" />
                          ) : (
                            <Lock className="h-10 w-10 text-zinc-600" />
                          )}
                        </div>

                        {/* Badge Info */}
                        <Badge
                          className={`${getCategoryColor(badge.badge_category)} border mb-3`}
                        >
                          {badge.badge_category}
                        </Badge>

                        <h3 className="text-lg font-semibold text-white mb-2">
                          {badge.badge_name}
                        </h3>

                        <p className="text-sm text-zinc-400 mb-4">{badge.badge_description}</p>

                        {/* Requirement */}
                        <div className="w-full p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                          <p className="text-xs text-zinc-500 mb-1">Requisito</p>
                          <p className="text-sm text-zinc-300">
                            {badge.requirement_type === 'courses_completed' &&
                              `Completar ${badge.requirement_value} curso(s)`}
                            {badge.requirement_type === 'total_hours' &&
                              `${badge.requirement_value} horas de estudo`}
                            {badge.requirement_type === 'certificates' &&
                              `${badge.requirement_value} certificado(s)`}
                            {badge.requirement_type === 'streak_days' &&
                              `${badge.requirement_value} dias consecutivos`}
                            {badge.requirement_type === 'perfect_score' &&
                              'Nota perfeita em um curso'}
                          </p>
                        </div>

                        {/* Earned Status */}
                        {earned && earnedDate && (
                          <div className="w-full mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center justify-center gap-2 text-green-500">
                              <Trophy className="h-4 w-4" />
                              <p className="text-xs font-semibold">
                                Conquistado em {earnedDate}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <Card className="bg-blue-500/10 border-blue-500/20 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Star className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Como ganhar badges?</h3>
                <p className="text-sm text-zinc-300">
                  Os badges são conquistados automaticamente quando você atinge os requisitos
                  especificados. Complete cursos, estude consistentemente e mantenha excelência
                  para desbloquear todos os badges!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
