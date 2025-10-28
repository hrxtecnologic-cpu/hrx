import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { withAdmin } from '@/lib/api';
import { logger } from '@/lib/logger';

// GET - List all event types
export const GET = withAdmin(async (userId: string, req: Request) => {
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

    const supabase = await createClient();

    const { data: eventTypes, error } = await supabase
      .from('event_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(eventTypes || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar tipos de evento' },
      { status: 500 }
    );
  }
});

// POST - Create new event type
export const POST = withAdmin(async (userId: string, req: Request) => {
  try {
    // ========== Rate Limiting ==========
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.API_WRITE);
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

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se tipo de evento já existe
    const { data: existing } = await supabase
      .from('event_types')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Tipo de evento já existe' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('event_types')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar tipo de evento', error, { userId, name });
      throw error;
    }

    logger.info('Tipo de evento criado', { userId, eventTypeId: data.id, name });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erro ao criar tipo de evento', error instanceof Error ? error : undefined, { userId });
    return NextResponse.json(
      { error: 'Erro ao criar tipo de evento' },
      { status: 500 }
    );
  }
});
