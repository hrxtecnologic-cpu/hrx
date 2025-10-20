'use client';

import { CheckCircle2, ArrowRight, FileText, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CadastroContratanteSucessoPage() {

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Cadastro Realizado! 🎉
        </h1>
        <div className="w-20 h-1 bg-green-500 mx-auto rounded-full mb-6" />

        {/* Message */}
        <p className="text-xl text-zinc-300 mb-8">
          Sua empresa foi cadastrada com sucesso na plataforma HRX
        </p>

        {/* Info Box */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Próximos Passos:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-zinc-300">
              <span className="text-green-500 mt-1">1.</span>
              <span>Preencha o formulário de solicitação de equipe</span>
            </li>
            <li className="flex items-start gap-3 text-zinc-300">
              <span className="text-green-500 mt-1">2.</span>
              <span>Nossa equipe analisará sua solicitação</span>
            </li>
            <li className="flex items-start gap-3 text-zinc-300">
              <span className="text-green-500 mt-1">3.</span>
              <span>Você receberá uma proposta personalizada por email</span>
            </li>
            <li className="flex items-start gap-3 text-zinc-300">
              <span className="text-green-500 mt-1">4.</span>
              <span>Após aprovação, montaremos a equipe ideal para seu evento</span>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/contratante">
            <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-6 text-lg">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Acessar Meu Dashboard
            </Button>
          </Link>

          <Link href="/solicitar-equipe">
            <Button className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-8 py-6 text-lg">
              <FileText className="h-5 w-5 mr-2" />
              Solicitar Equipe
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-700 text-white hover:bg-zinc-900 px-8 py-6 text-lg">
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
