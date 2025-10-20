import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations/contact';
import { sendContactEmails } from '@/lib/resend/emails';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    // 1. Parse e valida o body
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

    console.log('📬 Novo contato recebido de:', validatedData.email);

    // 2. Enviar emails (confirmação + notificação admin)
    try {
      const emailResult = await sendContactEmails({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
      });

      if (emailResult.errors.length > 0) {
        console.warn('⚠️ Alguns emails de contato falharam:', emailResult.errors);
      } else {
        console.log('✅ Todos os emails de contato foram enviados com sucesso');
      }

      // Log do resultado
      console.log('Email confirmação enviado:', emailResult.confirmationEmailSent);
      console.log('Email admin enviado:', emailResult.adminEmailSent);
    } catch (emailError) {
      // Log o erro mas não falha a requisição
      console.error('❌ Erro ao enviar emails de contato:', emailError);
    }

    // 3. Retorna sucesso
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso! Responderemos em breve.',
    });

  } catch (error) {
    console.error('Erro ao processar contato:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao processar contato',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
