/**
 * ====================================
 * API: /api/academy/enrollments/[id]/complete
 * ====================================
 * POST - Completar curso e gerar certificado
 *
 * Body: {}  (vazio - calcula nota final automaticamente)
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
    const supabase = await createClient();

    // ========== Buscar Profissional ==========
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, full_name, cpf')
      .eq('clerk_id', userId)
      .single();

    if (profError || !professional) {
      return NextResponse.json(
        { success: false, error: 'Profissional não encontrado' },
        { status: 403 }
      );
    }

    // ========== Buscar Matrícula com Curso ==========
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        course_id,
        professional_id,
        status,
        progress_percentage,
        completed_lessons,
        quiz_scores,
        courses!inner(
          id,
          title,
          category,
          workload_hours,
          minimum_score,
          certificate_enabled
        )
      `)
      .eq('id', enrollmentId)
      .eq('professional_id', professional.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Matrícula não encontrada' },
        { status: 404 }
      );
    }

    if (enrollment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Você já completou este curso!' },
        { status: 400 }
      );
    }

    const course = enrollment.courses;

    // ========== Validar Progresso 100% ==========
    if (enrollment.progress_percentage < 100) {
      return NextResponse.json(
        {
          success: false,
          error: `Você precisa completar todas as aulas antes de finalizar o curso. Progresso atual: ${enrollment.progress_percentage}%`
        },
        { status: 400 }
      );
    }

    // ========== Calcular Nota Final (média dos quizzes) ==========
    const quizScores = enrollment.quiz_scores || {};
    const scores = Object.values(quizScores) as number[];

    let finalScore = 0;

    if (scores.length > 0) {
      const sum = scores.reduce((acc: number, score: number) => acc + score, 0);
      finalScore = Math.round(sum / scores.length);
    } else {
      // Se não tem quiz, considera 100%
      finalScore = 100;
    }

    const passed = finalScore >= (course.minimum_score || 70);

    if (!passed) {
      return NextResponse.json(
        {
          success: false,
          error: `Nota insuficiente. Você precisa de no mínimo ${course.minimum_score}% mas obteve ${finalScore}%. Refaça os quizzes.`
        },
        { status: 400 }
      );
    }

    // ========== Gerar Código do Certificado ==========
    const year = new Date().getFullYear();
    const categorySlug = course.category.toUpperCase().substring(0, 4);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const certificateCode = `HRX-${year}-${categorySlug}-${random}`;

    // ========== Atualizar Enrollment ==========
    const { data: completedEnrollment, error: updateError } = await supabase
      .from('course_enrollments')
      .update({
        status: 'completed',
        final_score: finalScore,
        passed: true,
        certificate_code: certificateCode,
        certificate_issued_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // ========== Incrementar Contador do Curso ==========
    const { error: incrementError } = await supabase
      .rpc('increment_course_completed_count', { p_course_id: course.id });

    if (incrementError) {
      console.error('Erro ao incrementar completed_count:', incrementError);
    }

    // ========== Verificar e Atribuir Badges ==========
    const { data: newBadges, error: badgesError } = await supabase
      .rpc('check_and_award_badges', { p_professional_id: professional.id });

    if (badgesError) {
      console.error('Erro ao verificar badges:', badgesError);
    }

    // ========== Criar Notificação ==========
    await supabase.from('notifications').insert({
      user_id: null, // Será identificado via professional_id
      user_type: 'professional',
      professional_id: professional.id,
      notification_type: 'document_approved', // Usar tipo existente ou criar novo
      title: '🎓 Certificado emitido!',
      message: `Parabéns! Você completou o curso "${course.title}" com ${finalScore}% de aproveitamento.`,
      action_url: '/academia/certificados',
      priority: 'high',
    });

    // ========== Resposta ==========
    const response: AcademyAPIResponse<CourseEnrollment & { certificate_code: string; new_badges?: Array<Record<string, unknown>> }> = {
      success: true,
      data: {
        ...completedEnrollment,
        certificate_code: certificateCode,
        new_badges: newBadges || [],
      },
      message: `🎉 Parabéns ${professional.full_name}! Você completou o curso "${course.title}" com nota ${finalScore}%! Seu certificado está pronto.`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao completar curso:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao completar curso' },
      { status: 500 }
    );
  }
}
