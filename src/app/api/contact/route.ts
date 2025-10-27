import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations/contact';
import { sendContactEmails } from '@/lib/resend/emails';
import { z } from 'zod';
import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting - Proteção contra abuse (20 req/min)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);

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

    // 2. Parse e valida o body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = contactFormSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }


    // 3. Enviar emails (confirmação + notificação admin)
    try {
      const emailResult = await sendContactEmails({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
      });

      if (emailResult.errors.length > 0) {
      } else {
      }

      // Log do resultado
    } catch (emailError) {
      // Log o erro mas não falha a requisição
    }

    // 4. Retorna sucesso
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso! Responderemos em breve.',
    });

  } catch (error) {

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao processar contato',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
