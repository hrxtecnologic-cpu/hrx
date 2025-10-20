import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HRX <onboarding@resend.dev>',
      to: ['hrxtecnologic@gmail.com'],
      subject: '🧪 Teste Simples HRX',
      html: '<h1>Olá!</h1><p>Este é um teste simples de email.</p>',
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
