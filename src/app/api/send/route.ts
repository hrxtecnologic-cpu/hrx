import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await resend.emails.send({
    from: 'HRX <onboarding@resend.dev>',
    to: ['hrxtecnologic@gmail.com'],
    subject: 'Teste HRX',
    html: '<p>Email de teste funcionando!</p>'
  });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data);
}
