/**
 * ====================================
 * API: /api/academy/my-courses
 * ====================================
 * GET - Listar cursos do profissional autenticado
 *
 * Query params:
 *  - status?: 'active' | 'completed' | 'cancelled'
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

    const supabase = await createClient();

    // ========== Buscar Profissional ==========
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, full_name, status')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (profError) throw profError;

    if (!professional) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa completar seu cadastro como profissional primeiro',
          redirect: '/onboarding?type=professional',
        },
        { status: 403 }
      );
    }

    // ========== Query Params ==========
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    // ========== Buscar Matrículas ==========
    let query = supabase
      .from('course_enrollments')
      .select(`
        id,
        status,
        progress_percentage,
        completed_lessons,
        quiz_scores,
        final_score,
        passed,
        certificate_code,
        certificate_issued_at,
        enrolled_at,
        completed_at,
        last_accessed_at,
        courses!inner(
          id,
          title,
          slug,
          description,
          category,
          workload_hours,
          difficulty_level,
          cover_image_url,
          instructor_name,
          minimum_score
        )
      `)
      .eq('professional_id', professional.id)
      .order('enrolled_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: enrollments, error } = await query;

    if (error) throw error;

    // ========== Buscar Estatísticas do Profissional ==========
    const { data: stats, error: statsError } = await supabase
      .rpc('get_professional_academy_stats', { p_professional_id: professional.id })
      .single();

    if (statsError) {
      console.error('Erro ao buscar stats:', statsError);
    }

    // ========== Resposta ==========
    const response: AcademyAPIResponse = {
      success: true,
      data: {
        enrollments: enrollments || [],
        stats: stats || {
          active_courses: 0,
          completed_courses: 0,
          certificates_earned: 0,
          total_hours_studied: 0,
          average_score: 0,
          badges_count: 0,
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao buscar meus cursos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar seus cursos' },
      { status: 500 }
    );
  }
}
