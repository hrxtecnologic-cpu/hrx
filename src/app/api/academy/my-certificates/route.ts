/**
 * ====================================
 * API: /api/academy/my-certificates
 * ====================================
 * GET - Listar certificados do profissional autenticado
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { AcademyAPIResponse, Certificate } from '@/types/academy';

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

    // ========== Buscar Certificados ==========
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        certificate_code,
        certificate_issued_at,
        final_score,
        completed_at,
        courses!inner(
          id,
          title,
          slug,
          category,
          workload_hours,
          cover_image_url
        )
      `)
      .eq('professional_id', professional.id)
      .eq('status', 'completed')
      .not('certificate_code', 'is', null)
      .order('certificate_issued_at', { ascending: false });

    if (error) throw error;

    // ========== Formatar Certificados ==========
    const certificates: Certificate[] = (enrollments || []).map((enrollment: any) => ({
      id: enrollment.id,
      course_id: enrollment.courses.id,
      course_title: enrollment.courses.title,
      completion_date: enrollment.completed_at,
      certificate_code: enrollment.certificate_code,
      certificate_url: `/academia/certificados/${enrollment.certificate_code}`, // URL para visualizar
      qr_code_url: `/api/academy/certificates/${enrollment.certificate_code}/qr`, // API do QR Code
      status: 'active' as const,
      hours: enrollment.courses.workload_hours,
      score: enrollment.final_score,
      student_name: professional.full_name,
      student_cpf: professional.cpf,
    }));

    // ========== Resposta ==========
    const response: AcademyAPIResponse<Certificate[]> = {
      success: true,
      data: certificates,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao buscar certificados:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar certificados' },
      { status: 500 }
    );
  }
}
