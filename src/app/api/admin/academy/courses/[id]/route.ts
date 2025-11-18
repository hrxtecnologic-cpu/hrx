/**
 * ====================================
 * API: /api/admin/academy/courses/[id]
 * ====================================
 * GET    - Obter detalhes do curso
 * PUT    - Atualizar curso
 * DELETE - Deletar curso
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { Course, UpdateCourseDTO, AcademyAPIResponse } from '@/types/academy';

// Helper para verificar se usuário é admin
async function checkAdmin(userId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', userId)
    .single();

  return user?.role === 'admin';
}

// ============================================================================
// GET - Obter detalhes do curso (com aulas)
// ============================================================================
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
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // ========== Buscar Curso ==========
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseError) throw courseError;

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    // ========== Buscar Aulas ==========
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (lessonsError) throw lessonsError;

    // ========== Resposta ==========
    const response: AcademyAPIResponse = {
      success: true,
      data: {
        ...course,
        lessons: lessons || [],
        lessons_count: lessons?.length || 0,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao buscar curso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar curso' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Atualizar curso
// ============================================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body: UpdateCourseDTO = await req.json();

    const supabase = await createClient();

    // ========== Verificar se curso existe ==========
    const { data: existingCourse, error: checkError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', id)
      .single();

    if (checkError || !existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    // ========== Se slug mudou, verificar se já existe ==========
    if (body.slug && body.slug !== existingCourse.title) {
      const { data: duplicateSlug } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .maybeSingle();

      if (duplicateSlug) {
        return NextResponse.json(
          { success: false, error: 'Já existe outro curso com este slug' },
          { status: 400 }
        );
      }
    }

    // ========== Atualizar Curso ==========
    const updateData: Record<string, unknown> = {};

    // Só atualiza campos que foram enviados
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.workload_hours !== undefined) updateData.workload_hours = body.workload_hours;
    if (body.difficulty_level !== undefined) updateData.difficulty_level = body.difficulty_level;
    if (body.is_free !== undefined) {
      updateData.is_free = body.is_free;
      if (body.is_free) {
        updateData.price = 0;
      }
    }
    if (body.price !== undefined && !body.is_free) updateData.price = body.price;
    if (body.syllabus !== undefined) updateData.syllabus = body.syllabus;
    if (body.learning_objectives !== undefined) updateData.learning_objectives = body.learning_objectives;
    if (body.prerequisites !== undefined) updateData.prerequisites = body.prerequisites;
    if (body.minimum_score !== undefined) updateData.minimum_score = body.minimum_score;
    if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url;
    if (body.instructor_name !== undefined) updateData.instructor_name = body.instructor_name;
    if (body.instructor_bio !== undefined) updateData.instructor_bio = body.instructor_bio;
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description;

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ========== Resposta ==========
    const response: AcademyAPIResponse<Course> = {
      success: true,
      data: updatedCourse,
      message: 'Curso atualizado com sucesso!'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao atualizar curso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar curso' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Deletar curso
// ============================================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // ========== Verificar se curso tem matrículas ==========
    const { count: enrollmentsCount } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', id);

    if (enrollmentsCount && enrollmentsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Este curso tem ${enrollmentsCount} matrícula(s). Não é possível deletá-lo. Considere arquivá-lo.`
        },
        { status: 400 }
      );
    }

    // ========== Deletar Curso (CASCADE deleta aulas também) ==========
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // ========== Resposta ==========
    const response: AcademyAPIResponse = {
      success: true,
      message: 'Curso deletado com sucesso!'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao deletar curso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar curso' },
      { status: 500 }
    );
  }
}
