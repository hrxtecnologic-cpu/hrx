/**
 * ====================================
 * API: /api/academy/courses/[id]/enroll
 * ====================================
 * POST - Matricular profissional em um curso
 *
 * Requisitos:
 *  - Usuário autenticado
 *  - Ser profissional cadastrado
 *  - Curso disponível (published)
 *  - Não estar já matriculado
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { AcademyAPIResponse, CourseEnrollment } from '@/types/academy';

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

    // ========== Autenticação ==========
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa estar autenticado para se matricular',
        },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;
    const supabase = await createClient();

    // ========== Buscar Profissional ==========
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, full_name, status')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (profError) {
      console.error('Erro ao buscar profissional:', profError);
      throw profError;
    }

    if (!professional) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa completar seu cadastro como profissional primeiro',
          redirect: '/onboarding?type=professional',
        },
        { status: 403 }
      );
    }

    // Nota: Permitimos profissionais com status 'pending' fazerem cursos
    // Isso os ajuda a se qualificar enquanto aguardam aprovação

    // ========== Verificar Se Curso Existe ==========
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, is_free, price, status')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      console.error('Erro ao buscar curso:', courseError);
      throw courseError;
    }

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso não encontrado',
        },
        { status: 404 }
      );
    }

    if (course.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: 'Este curso não está disponível no momento',
        },
        { status: 400 }
      );
    }

    // ========== Verificar Se Já Está Matriculado ==========
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('course_enrollments')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (enrollmentCheckError) {
      console.error('Erro ao verificar matrícula:', enrollmentCheckError);
      throw enrollmentCheckError;
    }

    if (existingEnrollment) {
      if (existingEnrollment.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: 'Você já concluiu este curso!',
            message: 'Você pode ver seu certificado na área "Meus Certificados"',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Você já está matriculado neste curso',
          message: 'Continue de onde parou na área "Meus Cursos"',
          enrollment_id: existingEnrollment.id,
        },
        { status: 400 }
      );
    }

    // ========== Criar Matrícula ==========
    const { data: enrollment, error: insertError } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        professional_id: professional.id,
        status: 'active',
        progress_percentage: 0,
        completed_lessons: [],
        quiz_scores: {},
        passed: false,
        payment_status: course.is_free ? 'free' : 'pending',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar matrícula:', insertError);
      throw insertError;
    }

    // ========== Incrementar Contador de Matriculados ==========
    const { error: incrementError } = await supabase
      .rpc('increment_course_enrolled_count', { p_course_id: courseId });

    if (incrementError) {
      console.error('Erro ao incrementar contador:', incrementError);
      // Não falhar a requisição por isso
    }

    // ========== Resposta de Sucesso ==========
    const response: AcademyAPIResponse<CourseEnrollment> = {
      success: true,
      data: enrollment as CourseEnrollment,
      message: `🎉 Parabéns! Você foi matriculado em "${course.title}"`,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Erro ao matricular profissional:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar matrícula. Tente novamente.',
      },
      { status: 500 }
    );
  }
}
