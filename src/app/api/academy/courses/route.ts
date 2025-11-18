/**
 * ====================================
 * API: /api/academy/courses
 * ====================================
 * GET - Listar cursos públicos disponíveis
 *
 * Query params:
 *  - category?: string
 *  - difficulty?: 'beginner' | 'intermediate' | 'advanced'
 *  - is_free?: 'true' | 'false'
 *  - search?: string
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { Course, CoursesListResponse, CourseFilters } from '@/types/academy';

export async function GET(req: NextRequest) {
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

    // ========== Parse Query Params ==========
    const { searchParams } = new URL(req.url);
    const filters: CourseFilters = {
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') as CourseFilters['difficulty'],
      is_free: searchParams.get('is_free') === 'true' ? true :
               searchParams.get('is_free') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // ========== Buscar Cursos ==========
    const supabase = await createClient();

    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        slug,
        description,
        category,
        workload_hours,
        difficulty_level,
        is_free,
        price,
        syllabus,
        learning_objectives,
        status,
        enrolled_count,
        completed_count,
        average_rating,
        certificate_enabled,
        minimum_score,
        cover_image_url,
        instructor_name,
        instructor_bio,
        published_at,
        created_at,
        updated_at
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }

    if (filters.is_free !== undefined) {
      query = query.eq('is_free', filters.is_free);
    }

    // Busca textual (título ou descrição)
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Paginação
    if (filters.limit) {
      query = query.range(
        filters.offset || 0,
        (filters.offset || 0) + filters.limit - 1
      );
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Erro ao buscar cursos:', error);
      throw error;
    }

    // Buscar total count (sem paginação)
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // ========== Resposta ==========
    const response: CoursesListResponse = {
      success: true,
      data: (courses as Course[]) || [],
    };

    return NextResponse.json(response, {
      headers: {
        'X-Total-Count': count?.toString() || '0',
      }
    });

  } catch (error) {
    console.error('Erro na API de cursos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar cursos disponíveis',
      },
      { status: 500 }
    );
  }
}
