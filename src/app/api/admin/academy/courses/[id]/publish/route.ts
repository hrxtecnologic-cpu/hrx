/**
 * ====================================
 * API: /api/admin/academy/courses/[id]/publish
 * ====================================
 * PATCH - Publicar ou arquivar curso
 *
 * Body: { action: 'publish' | 'archive' | 'draft' }
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { Course, AcademyAPIResponse } from '@/types/academy';

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

export async function PATCH(
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
    const body = await req.json();
    const { action } = body;

    if (!action || !['publish', 'archive', 'draft'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ação inválida. Use: publish, archive ou draft'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========== Verificar se curso existe ==========
    const { data: course, error: checkError } = await supabase
      .from('courses')
      .select('*, course_lessons(count)')
      .eq('id', id)
      .single();

    if (checkError || !course) {
      return NextResponse.json(
        { success: false, error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    // ========== Validações antes de publicar ==========
    if (action === 'publish') {
      // Verificar se tem ao menos 1 aula
      const lessonsCount = course.course_lessons?.[0]?.count || 0;

      if (lessonsCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não é possível publicar um curso sem aulas. Adicione ao menos 1 aula.'
          },
          { status: 400 }
        );
      }

      // Verificar campos obrigatórios
      if (!course.title || !course.description || !course.category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Preencha todos os campos obrigatórios antes de publicar'
          },
          { status: 400 }
        );
      }
    }

    // ========== Atualizar Status ==========
    const newStatus = action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft';
    const updateData: Record<string, unknown> = { status: newStatus };

    // Se publicar pela primeira vez, registrar published_at
    if (action === 'publish' && !course.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ========== Resposta ==========
    const messages = {
      publish: `🎉 Curso "${course.title}" publicado com sucesso!`,
      archive: `📦 Curso "${course.title}" arquivado.`,
      draft: `📝 Curso "${course.title}" voltou para rascunho.`
    };

    const response: AcademyAPIResponse<Course> = {
      success: true,
      data: updatedCourse,
      message: messages[action as keyof typeof messages]
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao mudar status do curso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar status do curso' },
      { status: 500 }
    );
  }
}
