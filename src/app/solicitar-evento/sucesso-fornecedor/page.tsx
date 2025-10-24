import Link from 'next/link';
import { CheckCircle2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SucessoFornecedorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
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
          Cadastro enviado com sucesso! 🎉
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Truck className="h-6 w-6 text-red-500" />
            <p className="text-xl text-zinc-300">
              Seu cadastro como fornecedor foi recebido
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400">
                  Nossa equipe irá <strong className="text-white">analisar seu cadastro</strong> em
                  até 48 horas úteis
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400">
                  Você receberá um <strong className="text-white">email de confirmação</strong> com
                  os próximos passos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400">
                  Após aprovado, você começará a receber{' '}
                  <strong className="text-white">solicitações de orçamentos</strong> de eventos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Avisos importantes */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mb-8">
          <h3 className="text-yellow-500 font-semibold mb-2 flex items-center justify-center gap-2">
            <span className="text-xl">⚡</span>
            Fique atento!
          </h3>
          <p className="text-zinc-400 text-sm">
            Verifique sua caixa de entrada e <strong>WhatsApp</strong> regularmente.
            <br />
            Às vezes os emails podem cair na pasta de spam.
          </p>
        </div>

        {/* Informações de contato */}
        <div className="mb-8">
          <p className="text-zinc-500 mb-4">
            Precisa de ajuda? Entre em contato:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:fornecedores@hrx.com.br"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
            >
              📧 fornecedores@hrx.com.br
            </a>
            <a
              href="https://wa.me/5521999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/supplier/dashboard">
            <Button className="bg-red-600 hover:bg-red-500 text-white px-8 py-6 text-lg w-full sm:w-auto">
              Acessar Meu Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8 py-6 text-lg w-full sm:w-auto"
            >
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
