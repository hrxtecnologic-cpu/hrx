import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="mb-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Solicitação Enviada com Sucesso!
              </h1>
              <p className="text-lg text-zinc-400 mb-8">
                Recebemos sua solicitação de evento e nossa equipe já está analisando os detalhes.
              </p>
            </div>

            <div className="bg-zinc-950/50 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-white font-semibold mb-4">Próximos Passos:</h2>
              <ol className="space-y-3 text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span>
                    Nossa equipe irá analisar sua solicitação e preparar uma proposta personalizada
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span>
                    Entraremos em contato em até 24 horas úteis através do email ou telefone
                    fornecido
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span>
                    Você receberá uma proposta detalhada com valores e condições para aprovação
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-zinc-950/50 rounded-lg p-6 mb-8">
              <h3 className="text-white font-semibold mb-3">Precisa de ajuda imediata?</h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:contato@hrx.com"
                  className="flex items-center gap-2 text-red-500 hover:text-red-400 transition"
                >
                  <Mail className="h-4 w-4" />
                  <span>contato@hrx.com</span>
                </a>
                <a
                  href="tel:+5511999999999"
                  className="flex items-center gap-2 text-red-500 hover:text-red-400 transition"
                >
                  <Phone className="h-4 w-4" />
                  <span>(11) 99999-9999</span>
                </a>
              </div>
            </div>

            <Link href="/">
              <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white">
                <Home className="h-4 w-4 mr-2" />
                Voltar para o Início
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
