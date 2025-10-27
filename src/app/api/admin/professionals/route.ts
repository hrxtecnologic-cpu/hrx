import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

// GET - List professionals with filters
export async function GET(req: NextRequest) {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_READ);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const supabase = await createClient();
    let query = supabase
      .from('professionals')
      .select('id, full_name, email, phone, categories, subcategories, status')
      .order('full_name', { ascending: true });

    // Filtrar por status se fornecido
    if (status) {
      query = query.eq('status', status);
    }

    const { data: professionals, error } = await query;

    if (error) {
      throw error;
    }

    // Filtrar por categoria no lado do cliente (já que categories é um array JSON)
    let filtered = professionals || [];
    if (category) {
      filtered = filtered.filter(p =>
        p.categories && Array.isArray(p.categories) && p.categories.includes(category)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar profissionais' },
      { status: 500 }
    );
  }
}
