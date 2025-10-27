'use client';

import { useSearchParams } from 'next/navigation';
import { SuccessPage } from '@/components/SuccessPage';
import { Suspense } from 'react';

// Componente que usa useSearchParams
function SucessoContent() {
  const searchParams = useSearchParams();
  const requestNumber = searchParams?.get('request') || 'N/A';

  return (
    <SuccessPage
      title="Solicitação Enviada com Sucesso!"
      description={`Sua solicitação de equipe #${requestNumber} foi recebida e está em análise.`}
      steps={[
        {
          number: 1,
          text: 'Você receberá um email de confirmação com os detalhes da sua solicitação',
        },
        {
          number: 2,
          text: 'Nossa equipe entrará em contato via WhatsApp ou telefone em até 2 horas (horário comercial)',
        },
        {
          number: 3,
          text: 'Você receberá uma proposta detalhada com valores e perfis dos profissionais',
        },
      ]}
      primaryButtonText="Acessar Dashboard"
      primaryButtonHref="/dashboard/contratante"
      showContactInfo={true}
      contactEmail="hrxtecnologic@gmail.com"
      contactPhone="(21) 99876-8572"
    />
  );
}

// Wrapper com Suspense
export default function SucessoSolicitacaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center"><div className="text-white">Carregando...</div></div>}>
      <SucessoContent />
    </Suspense>
  );
}
