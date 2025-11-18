/**
 * ====================================
 * API: /api/academy/certificates/[code]/validate
 * ====================================
 * GET - Validar certificado publicamente (sem autenticação)
 *
 * Permite que qualquer pessoa verifique a autenticidade de um certificado HRX
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { AcademyAPIResponse } from '@/types/academy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // ========== Rate Limiting (mais permissivo para validação pública) ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        { status: 429 }
      );
    }

    const { code } = await params;

    // Validar formato do código (HRX-YYYY-XXXX-NNNNNN)
    const codeRegex = /^HRX-\d{4}-[A-Z]{4}-\d{6}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Código de certificado inválido. Formato esperado: HRX-YYYY-XXXX-NNNNNN'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========== Buscar Certificado ==========
    const { data: enrollment, error } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        certificate_code,
        certificate_issued_at,
        completed_at,
        final_score,
        status,
        professionals!inner(
          full_name,
          cpf,
          email,
          profile_photo_url
        ),
        courses!inner(
          id,
          title,
          slug,
          category,
          workload_hours,
          cover_image_url,
          instructor_name
        )
      `)
      .eq('certificate_code', code)
      .maybeSingle();

    if (error) throw error;

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificado não encontrado. Verifique o código e tente novamente.',
          data: {
            valid: false,
            message: 'Certificado não existe ou foi revogado'
          }
        },
        { status: 404 }
      );
    }

    // ========== Verificar Status ==========
    if (enrollment.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Este certificado não é válido.',
          data: {
            valid: false,
            message: 'Curso não foi completado ou certificado foi revogado'
          }
        },
        { status: 400 }
      );
    }

    // ========== Certificado Válido ==========
    const professional = enrollment.professionals;
    const course = enrollment.courses;

    // Mascarar CPF para privacidade (XXX.XXX.XXX-12)
    const maskedCPF = professional.cpf
      ? `***.***.***-${professional.cpf.slice(-2)}`
      : null;

    const response: AcademyAPIResponse = {
      success: true,
      data: {
        valid: true,
        message: '✅ Certificado válido e autêntico',
        certificate: {
          code: enrollment.certificate_code,
          issued_at: enrollment.certificate_issued_at,
          completion_date: enrollment.completed_at,
          score: enrollment.final_score,
          student: {
            name: professional.full_name,
            cpf: maskedCPF, // CPF mascarado
            photo_url: professional.profile_photo_url,
          },
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            category: course.category,
            workload_hours: course.workload_hours,
            cover_image_url: course.cover_image_url,
            instructor: course.instructor_name,
          }
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao validar certificado:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar certificado' },
      { status: 500 }
    );
  }
}
