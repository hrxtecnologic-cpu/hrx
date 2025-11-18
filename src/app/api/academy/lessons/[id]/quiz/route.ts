/**
 * ====================================
 * API: /api/academy/lessons/[id]/quiz
 * ====================================
 * POST - Submeter respostas do quiz e receber correção
 *
 * Body: {
 *   enrollment_id: string,
 *   answers: [
 *     { question_index: 0, selected_option: 2 },
 *     { question_index: 1, selected_option: 0 },
 *     ...
 *   ]
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { QuizResult, QuizAnswer, AcademyAPIResponse } from '@/types/academy';

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

    const { id: lessonId } = await params;
    const body = await req.json();
    const { enrollment_id, answers } = body;

    if (!enrollment_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Body inválido. Forneça enrollment_id e array answers'
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

    // ========== Buscar Aula com Quiz ==========
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id, title, course_id, content_type, quiz_data')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { success: false, error: 'Aula não encontrada' },
        { status: 404 }
      );
    }

    if (lesson.content_type !== 'quiz' || !lesson.quiz_data) {
      return NextResponse.json(
        { success: false, error: 'Esta aula não contém um quiz' },
        { status: 400 }
      );
    }

    // ========== Verificar Matrícula ==========
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id, course_id, professional_id, quiz_scores')
      .eq('id', enrollment_id)
      .eq('professional_id', professional.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Matrícula não encontrada ou não pertence a você' },
        { status: 404 }
      );
    }

    if (enrollment.course_id !== lesson.course_id) {
      return NextResponse.json(
        { success: false, error: 'Esta aula não pertence ao curso matriculado' },
        { status: 400 }
      );
    }

    // ========== Corrigir Quiz ==========
    const questions = Array.isArray(lesson.quiz_data) ? lesson.quiz_data : [];
    let correctCount = 0;
    const correctedAnswers: QuizAnswer[] = [];

    answers.forEach((answer: { question_index: number; selected_option: number }) => {
      const question = questions[answer.question_index];

      if (!question) {
        correctedAnswers.push({
          question_index: answer.question_index,
          selected_option: answer.selected_option,
          is_correct: false,
        });
        return;
      }

      const isCorrect = answer.selected_option === question.correct;

      correctedAnswers.push({
        question_index: answer.question_index,
        selected_option: answer.selected_option,
        is_correct: isCorrect,
      });

      if (isCorrect) correctCount++;
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 70; // Mínimo 70% para aprovar

    const quizResult: QuizResult = {
      total_questions: totalQuestions,
      correct_answers: correctCount,
      score,
      passed,
      answers: correctedAnswers,
    };

    // ========== Salvar Score no Enrollment ==========
    const currentScores = enrollment.quiz_scores || {};
    const updatedScores = {
      ...currentScores,
      [lessonId]: score,
    };

    await supabase
      .from('course_enrollments')
      .update({ quiz_scores: updatedScores })
      .eq('id', enrollment_id);

    // ========== Resposta ==========
    const response: AcademyAPIResponse<QuizResult> = {
      success: true,
      data: quizResult,
      message: passed
        ? `🎉 Parabéns! Você acertou ${correctCount} de ${totalQuestions} questões (${score}%)`
        : `📝 Você acertou ${correctCount} de ${totalQuestions} questões (${score}%). Continue estudando!`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao submeter quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar quiz' },
      { status: 500 }
    );
  }
}
