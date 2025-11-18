import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import type { Course } from '@/types/academy';

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
  progress?: number;
  enrolled?: boolean;
}

export function CourseCard({ course, showProgress = false, progress = 0, enrolled = false }: CourseCardProps) {
  const difficultyColors = {
    beginner: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    intermediate: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const difficultyLabels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  return (
    <Link href={enrolled ? `/academia/aula/${course.id}` : `/academia/curso/${course.slug}`}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all hover:scale-[1.02] cursor-pointer overflow-hidden">
        {/* Cover Image */}
        {course.cover_image_url ? (
          <div className="relative h-48 bg-zinc-800 overflow-hidden">
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            {enrolled && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Matriculado
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <Award className="h-16 w-16 text-zinc-700" />
            {enrolled && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Matriculado
              </div>
            )}
          </div>
        )}

        <CardContent className="p-5">
          {/* Category + Difficulty */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {course.category}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${difficultyColors[course.difficulty_level]}`}
            >
              {difficultyLabels[course.difficulty_level]}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Progress Bar (if enrolled) */}
          {showProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Progresso</span>
                <span className="text-xs font-medium text-blue-500">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.workload_hours}h
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.enrolled_count}
              </span>
            </div>

            {course.is_free ? (
              <span className="text-green-500 font-semibold">Gratuito</span>
            ) : (
              <span className="text-blue-500 font-semibold">
                R$ {course.price?.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
