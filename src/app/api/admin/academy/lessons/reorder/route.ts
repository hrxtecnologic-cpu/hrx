/**
 * ====================================
 * API: /api/admin/academy/lessons/reorder
 * ====================================
 * POST - Reordenar aulas de um curso
 *
 * Body: {
 *   course_id: string,
 *   lessons: [
 *     { id: string, order_index: number },
 *     { id: string, order_index: number },
 *     ...
 *   ]
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import type { AcademyAPIResponse } from '@/types/academy';

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

export async function POST(req: NextRequest) {
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

    // ========== Validar Body ==========
    const body = await req.json();
    const { course_id, lessons } = body;

    if (!course_id || !lessons || !Array.isArray(lessons) || lessons.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Body inválido. Forneça course_id e array lessons com id e order_index'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========== Verificar se curso existe ==========
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    // ========== Atualizar order_index de cada aula ==========
    const updatePromises = lessons.map(async (lesson: { id: string; order_index: number }) => {
      if (!lesson.id || lesson.order_index === undefined) {
        throw new Error('Cada aula precisa de id e order_index');
      }

      return supabase
        .from('course_lessons')
        .update({ order_index: lesson.order_index })
        .eq('id', lesson.id)
        .eq('course_id', course_id); // Garantir que pertence ao curso
    });

    await Promise.all(updatePromises);

    // ========== Verificar resultado ==========
    const { data: updatedLessons, error: fetchError } = await supabase
      .from('course_lessons')
      .select('id, title, order_index')
      .eq('course_id', course_id)
      .order('order_index', { ascending: true });

    if (fetchError) throw fetchError;

    // ========== Resposta ==========
    const response: AcademyAPIResponse = {
      success: true,
      data: updatedLessons,
      message: `${lessons.length} aula(s) reordenada(s) com sucesso!`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao reordenar aulas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao reordenar aulas' },
      { status: 500 }
    );
  }
}
