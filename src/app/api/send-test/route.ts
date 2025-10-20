import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// IMPORTANTE: Força Node.js runtime (não Edge)
export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: 'HRX <onboarding@resend.dev>',
      to: ['hrxtecnologic@gmail.com'],
      subject: '🎉 Teste HRX - Funcionou!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #DC2626;">HRX - Email de Teste</h1>
          <p>Este email foi enviado com sucesso!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Sistema de emails HRX está funcionando corretamente ✅
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
