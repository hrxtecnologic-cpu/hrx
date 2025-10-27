import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { EmailTemplateConfigUpdate } from '@/types/email-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/emails/config
 *
 * Busca a configuração ativa de templates de email
 */
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

    const { data, error } = await supabase
      .from('email_template_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar configuração', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/emails/config
 *
 * Atualiza a configuração ativa de templates de email
 */
export async function PUT(req: NextRequest) {
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

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const updates: EmailTemplateConfigUpdate = await req.json();

    // Buscar configuração ativa atual
    const { data: currentConfig, error: fetchError } = await supabase
      .from('email_template_config')
      .select('id')
      .eq('is_active', true)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar configuração atual' },
        { status: 500 }
      );
    }

    // Atualizar configuração
    const { data, error } = await supabase
      .from('email_template_config')
      .update(updates)
      .eq('id', currentConfig.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar configuração', details: error },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      config: data,
      message: 'Configuração atualizada com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/emails/config/reset
 *
 * Reseta a configuração para os valores padrão
 */
export async function POST(req: NextRequest) {
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

    // ========== Autenticação ==========
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action !== 'reset') {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Buscar configuração ativa atual
    const { data: currentConfig, error: fetchError } = await supabase
      .from('email_template_config')
      .select('id')
      .eq('is_active', true)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar configuração atual' },
        { status: 500 }
      );
    }

    // Resetar para valores padrão
    const { data, error } = await supabase
      .from('email_template_config')
      .update({
        company_name: 'HRX Tecnologia',
        company_logo_url: null,
        primary_color: '#DC2626',
        secondary_color: '#EF4444',
        background_color: '#f9fafb',
        text_color: '#1a1a1a',
        contact_email: 'contato@hrxeventos.com.br',
        contact_phone: '(11) 99999-9999',
        contact_whatsapp: '5511999999999',
        contact_website: 'https://hrxeventos.com.br',
        contact_address: null,
        social_instagram: null,
        social_facebook: null,
        social_linkedin: null,
        footer_text: 'HRX Tecnologia - Conectando profissionais a eventos',
        show_social_links: true,
        show_contact_info: true,
        template_texts: {},
      })
      .eq('id', currentConfig.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao resetar configuração' },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      config: data,
      message: 'Configuração resetada com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
