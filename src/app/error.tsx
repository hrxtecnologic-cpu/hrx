'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Algo deu errado
        </h1>

        <p className="text-zinc-400 mb-8">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left">
            <p className="text-xs text-zinc-500 font-mono break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Tentar novamente
          </Button>

          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-zinc-700 text-white hover:bg-zinc-900"
          >
            Voltar para Home
          </Button>
        </div>
      </div>
    </div>
  );
}
