import { NextResponse } from 'next/server';
import { PendingDocumentsEmail } from '@/lib/resend/templates/PendingDocumentsEmail';
import { render } from '@react-email/render';

export async function GET() {
  // Dados de exemplo para preview
  const html = render(
    <PendingDocumentsEmail
      professionalName="João da Silva"
      professionalEmail="joao.silva@exemplo.com"
      pendingDocuments={[
        'RG (Frente)',
        'RG (Verso)',
        'Comprovante de Residência',
      ]}
      rejectedDocuments={[
        {
          name: 'CPF',
          reason: 'Imagem está desfocada, não é possível ler os números claramente',
        },
        {
          name: 'CNH (Foto)',
          reason: 'CNH está vencida. Por favor, envie uma CNH válida',
        },
      ]}
      profileUrl="https://www.hrxeventos.com.br/cadastro-profissional"
    />
  );

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
