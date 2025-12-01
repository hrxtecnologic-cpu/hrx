/**
 * ====================================
 * API: /api/admin/academy/lessons/[id]
 * ====================================
 * GET    - Obter detalhes da aula
 * PUT    - Atualizar aula
 * DELETE - Deletar aula
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { CourseLesson, AcademyAPIResponse } from '@/types/academy';

// Helper para verificar se usuário é admin
async function checkAdmin(userId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('clerk_id', userId)
    .single();

  return user?.is_admin === true;
}

// ============================================================================
// GET - Obter detalhes da aula
// ============================================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);

    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: lesson, error } = await supabase
      .from('course_lessons')
      .select('*, courses(title, slug)')
      .eq('id', id)
      .single();

    if (error || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Aula não encontrada' },
        { status: 404 }
      );
    }

    const response: AcademyAPIResponse<CourseLesson> = {
      success: true,
      data: lesson,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao buscar aula:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar aula' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Atualizar aula
// ============================================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);

    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const supabase = await createClient();

    // Verificar se aula existe
    const { data: existingLesson, error: checkError } = await supabase
      .from('course_lessons')
      .select('id, course_id')
      .eq('id', id)
      .single();

    if (checkError || !existingLesson) {
      return NextResponse.json(
        { success: false, error: 'Aula não encontrada' },
        { status: 404 }
      );
    }

    // Montar objeto de atualização apenas com campos fornecidos
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.order_index !== undefined) updateData.order_index = body.order_index;
    if (body.content_type !== undefined) updateData.content_type = body.content_type;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.video_duration_seconds !== undefined) updateData.video_duration_seconds = body.video_duration_seconds;
    if (body.video_provider !== undefined) updateData.video_provider = body.video_provider;
    if (body.text_content !== undefined) updateData.text_content = body.text_content;
    if (body.quiz_data !== undefined) updateData.quiz_data = body.quiz_data;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes;
    if (body.is_preview !== undefined) updateData.is_preview = body.is_preview;
    if (body.is_mandatory !== undefined) updateData.is_mandatory = body.is_mandatory;

    const { data: updatedLesson, error: updateError } = await supabase
      .from('course_lessons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Já existe outra aula com essa posição. Escolha outra ordem.' },
          { status: 400 }
        );
      }
      throw updateError;
    }

    const response: AcademyAPIResponse<CourseLesson> = {
      success: true,
      data: updatedLesson,
      message: 'Aula atualizada com sucesso!'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao atualizar aula:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar aula' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Deletar aula
// ============================================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);

    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Buscar aula para pegar informações
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('title, course_id')
      .eq('id', id)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Aula não encontrada' },
        { status: 404 }
      );
    }

    // Deletar aula
    const { error: deleteError } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    const response: AcademyAPIResponse = {
      success: true,
      message: `Aula "${lesson.title}" deletada com sucesso!`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao deletar aula:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar aula' },
      { status: 500 }
    );
  }
}
