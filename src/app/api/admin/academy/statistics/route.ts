/**
 * ====================================
 * API: /api/admin/academy/statistics
 * ====================================
 * GET - Estatísticas gerais da Academia HRX (Admin)
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { AcademyAPIResponse } from '@/types/academy';

export async function GET(req: NextRequest) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    // ========== Autenticação ==========
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // ========== Verificar se é Admin ==========
    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // ========== Buscar Estatísticas via RPC ==========
    const { data: stats, error: statsError } = await supabase
      .rpc('get_academy_statistics')
      .single();

    if (statsError) {
      console.error('Erro ao buscar estatísticas RPC:', statsError);
      throw statsError;
    }

    // ========== Buscar Cursos Mais Populares ==========
    const { data: popularCourses, error: popularError } = await supabase
      .from('courses')
      .select('id, title, slug, category, enrolled_count, completed_count, average_rating, cover_image_url')
      .eq('status', 'published')
      .order('enrolled_count', { ascending: false })
      .limit(5);

    if (popularError) throw popularError;

    // ========== Buscar Matrículas Recentes ==========
    const { data: recentEnrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        enrolled_at,
        status,
        progress_percentage,
        professional_id,
        professionals!inner(full_name, email, profile_photo_url),
        courses!inner(title, slug)
      `)
      .order('enrolled_at', { ascending: false })
      .limit(10);

    if (enrollmentsError) throw enrollmentsError;

    // ========== Buscar Atividade dos Últimos 7 Dias ==========
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: newEnrollmentsWeek } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('enrolled_at', sevenDaysAgo.toISOString());

    const { count: completedWeek } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', sevenDaysAgo.toISOString());

    // ========== Badges Conquistados Recentemente ==========
    const { data: recentBadges, error: badgesError } = await supabase
      .from('professional_badges')
      .select(`
        id,
        earned_at,
        professionals!inner(full_name, profile_photo_url),
        course_badges!inner(name, icon, color)
      `)
      .order('earned_at', { ascending: false })
      .limit(10);

    if (badgesError) throw badgesError;

    // ========== Resposta ==========
    const response: AcademyAPIResponse = {
      success: true,
      data: {
        // Estatísticas gerais
        overview: stats,

        // Métricas semanais
        weekly_activity: {
          new_enrollments: newEnrollmentsWeek || 0,
          completed_courses: completedWeek || 0,
        },

        // Cursos populares
        popular_courses: popularCourses || [],

        // Atividade recente
        recent_enrollments: recentEnrollments || [],

        // Badges recentes
        recent_badges: recentBadges || [],
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao buscar estatísticas da academia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
