import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full mb-6">
          <FileQuestion className="h-10 w-10 text-zinc-500" />
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-white mb-4">
          Página não encontrada
        </h2>

        <p className="text-zinc-400 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        <Link href="/">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            Voltar para Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
