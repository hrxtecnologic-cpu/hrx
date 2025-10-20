import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { SimpleWelcomeEmail } from '@/lib/resend/templates/SimpleWelcomeEmail';

// Conforme documentação: https://resend.com/docs/send-with-nextjs
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HRX <onboarding@resend.dev>',
      to: ['hrxtecnologic@gmail.com'],
      subject: '🧪 Teste HRX - Bem-vindo!',
      react: <SimpleWelcomeEmail
        professionalName="João da Silva"
        professionalEmail="hrxtecnologic@gmail.com"
      />,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
