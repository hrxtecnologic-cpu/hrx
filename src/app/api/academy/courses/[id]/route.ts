/**
 * ====================================
 * API: /api/academy/courses/[id]
 * ====================================
 * GET - Obter detalhes completos de um curso
 *
 * Retorna:
 *  - Dados do curso
 *  - Lista de aulas (lessons)
 *  - Estatísticas
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { Course, CourseLesson, CourseDetailsResponse } from '@/types/academy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // ========== Buscar Curso ==========
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle();

    if (courseError) {
      console.error('Erro ao buscar curso:', courseError);
      throw courseError;
    }

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso não encontrado ou não está disponível',
        },
        { status: 404 }
      );
    }

    // ========== Buscar Aulas do Curso ==========
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error('Erro ao buscar aulas:', lessonsError);
      throw lessonsError;
    }

    // ========== Resposta ==========
    const response: CourseDetailsResponse = {
      success: true,
      data: {
        ...(course as Course),
        lessons: (lessons as CourseLesson[]) || [],
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao buscar detalhes do curso:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar informações do curso',
      },
      { status: 500 }
    );
  }
}
