import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Ícone */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
            <ShieldAlert className="h-24 w-24 text-red-600 relative" strokeWidth={1.5} />
          </div>
        </div>

        {/* Código de erro */}
        <h1 className="text-8xl font-bold text-red-600 mb-4">403</h1>

        {/* Mensagem */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Acesso Negado
        </h2>
        <p className="text-lg text-zinc-400 mb-2">
          Você não tem permissão para acessar esta área.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          Esta página é restrita apenas para administradores do sistema.
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
          >
            Voltar para Home
          </Link>
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all"
          >
            Ir para Meu Painel
          </Link>
        </div>

        {/* Nota */}
        <p className="text-xs text-zinc-600 mt-8">
          Se você acredita que deveria ter acesso, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}
