'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

// Componente que usa useSearchParams
function SucessoContent() {
  const searchParams = useSearchParams();
  const requestNumber = searchParams?.get('request') || 'N/A';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Ícone de sucesso */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
            <CheckCircle2 className="relative w-24 h-24 text-green-500" />
          </div>
        </div>

        {/* Mensagem principal */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Solicitação enviada com sucesso! 🎉
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          {/* Número da solicitação */}
          <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-400 mb-1">Número da Solicitação</p>
            <p className="text-3xl font-mono font-bold text-red-500">{requestNumber}</p>
          </div>

          <p className="text-xl text-zinc-300 mb-6">
            Sua solicitação de equipe está em análise
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400">
                  Você receberá um <strong className="text-white">email de confirmação</strong> com os
                  detalhes da sua solicitação
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400">
                  Nossa equipe entrará em contato via{' '}
                  <strong className="text-white">WhatsApp ou telefone</strong> em até 2 horas (horário comercial)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400">
                  Você receberá uma{' '}
                  <strong className="text-white">proposta detalhada</strong> com valores e perfis dos
                  profissionais
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Avisos importantes */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mb-8">
          <h3 className="text-yellow-500 font-semibold mb-2 flex items-center justify-center gap-2">
            <span className="text-xl">⏰</span>
            Horário de Atendimento
          </h3>
          <p className="text-zinc-400 text-sm">
            <strong>Segunda a Sexta, 9h às 18h</strong>
            <br />
            Solicitações fora do horário comercial serão respondidas no próximo dia útil
          </p>
        </div>

        {/* Informações de contato */}
        <div className="mb-8">
          <p className="text-zinc-500 mb-4">
            Precisa de ajuda? Entre em contato:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:comercial@hrx.com.br"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
            >
              📧 comercial@hrx.com.br
            </a>
            <a
              href="https://wa.me/5521999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
            >
              💬 WhatsApp: (21) 99999-9999
            </a>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/contratante">
            <Button className="bg-red-600 hover:bg-red-500 text-white px-8 py-6 text-lg w-full sm:w-auto">
              Acessar Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg w-full sm:w-auto"
            >
              Voltar para Home
            </Button>
          </Link>
        </div>

        {/* Mensagem extra */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Guarde o número da sua solicitação:{' '}
            <span className="font-mono font-bold text-white">{requestNumber}</span>
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Obrigado por confiar na <strong className="text-red-500">HRX</strong>! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrapper com Suspense
export default function SucessoSolicitacaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Carregando...</div></div>}>
      <SucessoContent />
    </Suspense>
  );
}
