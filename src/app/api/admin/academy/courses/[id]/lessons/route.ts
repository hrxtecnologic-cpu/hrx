/**
 * ====================================
 * API: /api/admin/academy/courses/[id]/lessons
 * ====================================
 * POST - Criar nova aula no curso
 * GET  - Listar aulas do curso (admin, com todas as aulas incluindo não-preview)
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { CourseLesson, CreateLessonDTO, AcademyAPIResponse } from '@/types/academy';

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
// GET - Listar aulas do curso
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

    const { id: courseId } = await params;
    const supabase = await createClient();

    // ========== Buscar Aulas ==========
    const { data: lessons, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    // ========== Resposta ==========
    const response: AcademyAPIResponse<CourseLesson[]> = {
      success: true,
      data: lessons || [],
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao listar aulas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar aulas' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Criar aula
// ============================================================================
export async function POST(
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

    const { id: courseId } = await params;
    const body: CreateLessonDTO = await req.json();
    const supabase = await createClient();

    // ========== Validar Body ==========
    const { title, content_type, order_index } = body;

    if (!title || !content_type || order_index === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: title, content_type, order_index'
        },
        { status: 400 }
      );
    }

    // ========== Verificar se curso existe ==========
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    // ========== Criar Aula ==========
    const { data: lesson, error: insertError } = await supabase
      .from('course_lessons')
      .insert({
        course_id: courseId,
        title,
        description: body.description || null,
        order_index,
        content_type,
        video_url: body.video_url || null,
        video_duration_seconds: body.video_duration_seconds || null,
        video_provider: body.video_provider || null,
        text_content: body.text_content || null,
        quiz_data: body.quiz_data || null,
        attachments: body.attachments || [],
        duration_minutes: body.duration_minutes || 0,
        is_preview: body.is_preview ?? false,
        is_mandatory: body.is_mandatory ?? true,
      })
      .select()
      .single();

    if (insertError) {
      // Se erro de constraint UNIQUE (order_index duplicado)
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: `Já existe uma aula com a posição ${order_index}. Escolha outra posição ou reordene as aulas.`
          },
          { status: 400 }
        );
      }
      throw insertError;
    }

    // ========== Resposta ==========
    const response: AcademyAPIResponse<CourseLesson> = {
      success: true,
      data: lesson,
      message: `Aula "${title}" criada com sucesso!`
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[API] Erro ao criar aula:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar aula' },
      { status: 500 }
    );
  }
}
