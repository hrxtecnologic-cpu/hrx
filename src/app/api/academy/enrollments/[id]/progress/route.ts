/**
 * ====================================
 * API: /api/academy/enrollments/[id]/progress
 * ====================================
 * POST - Atualizar progresso do curso (marcar aula como completa/incompleta)
 *
 * Body: {
 *   lesson_id: string,
 *   action: 'complete' | 'uncomplete'
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { CourseEnrollment, AcademyAPIResponse } from '@/types/academy';

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

    const { id: enrollmentId } = await params;
    const body = await req.json();
    const { lesson_id, action } = body;

    if (!lesson_id || !action || !['complete', 'uncomplete'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Body inválido. Forneça lesson_id e action (complete ou uncomplete)'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========== Buscar Profissional ==========
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profError || !professional) {
      return NextResponse.json(
        { success: false, error: 'Profissional não encontrado' },
        { status: 403 }
      );
    }

    // ========== Buscar Matrícula ==========
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id, course_id, professional_id, status, completed_lessons')
      .eq('id', enrollmentId)
      .eq('professional_id', professional.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Matrícula não encontrada ou não pertence a você' },
        { status: 404 }
      );
    }

    if (enrollment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Você já completou este curso!' },
        { status: 400 }
      );
    }

    // ========== Verificar se aula existe no curso ==========
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id, title')
      .eq('id', lesson_id)
      .eq('course_id', enrollment.course_id)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Aula não encontrada neste curso' },
        { status: 404 }
      );
    }

    // ========== Atualizar Array de Aulas Completadas ==========
    const completedLessons = Array.isArray(enrollment.completed_lessons)
      ? enrollment.completed_lessons
      : [];

    let newCompletedLessons;

    if (action === 'complete') {
      // Adicionar aula se não estiver presente
      if (!completedLessons.includes(lesson_id)) {
        newCompletedLessons = [...completedLessons, lesson_id];
      } else {
        newCompletedLessons = completedLessons; // Já estava completa
      }
    } else {
      // Remover aula
      newCompletedLessons = completedLessons.filter((id: string) => id !== lesson_id);
    }

    // ========== Atualizar Enrollment ==========
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('course_enrollments')
      .update({
        completed_lessons: newCompletedLessons,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // ========== Recalcular Progresso ==========
    const { data: newProgress, error: progressError } = await supabase
      .rpc('calculate_course_progress', { p_enrollment_id: enrollmentId })
      .single();

    if (progressError) {
      console.error('Erro ao calcular progresso:', progressError);
    }

    // ========== Buscar enrollment atualizado com progresso ==========
    const { data: finalEnrollment } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single();

    // ========== Resposta ==========
    const response: AcademyAPIResponse<CourseEnrollment> = {
      success: true,
      data: finalEnrollment || updatedEnrollment,
      message: action === 'complete'
        ? `✅ Aula "${lesson.title}" marcada como completa!`
        : `↩️ Aula "${lesson.title}" desmarcada.`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao atualizar progresso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar progresso' },
      { status: 500 }
    );
  }
}
