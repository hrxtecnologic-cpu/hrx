/**
 * ====================================
 * API: /api/admin/academy/courses
 * ====================================
 * GET  - Listar todos os cursos (admin)
 * POST - Criar novo curso
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { Course, CreateCourseDTO, AcademyAPIResponse } from '@/types/academy';

// ============================================================================
// GET - Listar cursos (incluindo drafts)
// ============================================================================
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
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.is_admin !== true) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // ========== Query Params ==========
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ========== Buscar Cursos ==========
    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    query = query.range(offset, offset + limit - 1);

    const { data: courses, error, count } = await query;

    if (error) throw error;

    // ========== Resposta ==========
    const response: AcademyAPIResponse<Course[]> = {
      success: true,
      data: courses || [],
    };

    return NextResponse.json(response, {
      headers: {
        'X-Total-Count': count?.toString() || '0',
      }
    });

  } catch (error) {
    console.error('[API] Erro ao listar cursos (admin):', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar cursos' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Criar curso
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);

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
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.is_admin !== true) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // ========== Validar Body ==========
    const body: CreateCourseDTO = await req.json();

    const { title, slug, description, category, workload_hours, difficulty_level, is_free, price } = body;

    if (!title || !slug || !description || !category || !workload_hours || !difficulty_level) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: title, slug, description, category, workload_hours, difficulty_level'
        },
        { status: 400 }
      );
    }

    // ========== Verificar se slug já existe ==========
    const { data: existingCourse, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingCourse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Já existe um curso com este slug. Escolha outro.'
        },
        { status: 400 }
      );
    }

    // ========== Criar Curso ==========
    const { data: course, error: insertError } = await supabase
      .from('courses')
      .insert({
        title,
        slug,
        description,
        category,
        workload_hours,
        difficulty_level,
        is_free: is_free ?? true,
        price: is_free ? 0 : (price || 0),
        syllabus: body.syllabus || [],
        learning_objectives: body.learning_objectives || [],
        prerequisites: body.prerequisites || null,
        minimum_score: body.minimum_score || 70,
        cover_image_url: body.cover_image_url || null,
        instructor_name: body.instructor_name || 'Equipe HRX',
        instructor_bio: body.instructor_bio || null,
        meta_title: body.meta_title || title,
        meta_description: body.meta_description || description,
        status: 'draft', // Sempre começa como draft
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // ========== Resposta ==========
    const response: AcademyAPIResponse<Course> = {
      success: true,
      data: course,
      message: `Curso "${title}" criado com sucesso!`
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[API] Erro ao criar curso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar curso' },
      { status: 500 }
    );
  }
}
