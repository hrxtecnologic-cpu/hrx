'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Phone,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export function RequestActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpdateStatus(newStatus: string) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  if (currentStatus === 'completed') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle className="h-4 w-4" />
        Solicitação concluída
      </div>
    );
  }

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <XCircle className="h-4 w-4" />
        Solicitação cancelada
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
      {currentStatus === 'pending' && (
        <Button
          onClick={() => handleUpdateStatus('in_progress')}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          <span className="hidden sm:inline">Marcar como Contatado</span>
          <span className="sm:hidden">Contatado</span>
        </Button>
      )}

      {currentStatus === 'in_progress' && (
        <>
          <Button
            onClick={() => alert('Funcionalidade em desenvolvimento')}
            variant="outline"
            className="border-white text-white hover:bg-red-600 hover:border-red-600 w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Criar Proposta
          </Button>

          <Button
            onClick={() => alert('Funcionalidade em desenvolvimento')}
            variant="outline"
            className="border-white text-white hover:bg-red-600 hover:border-red-600 w-full sm:w-auto"
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Alocar Profissionais</span>
            <span className="md:hidden">Alocar</span>
          </Button>

          <Button
            onClick={() => handleUpdateStatus('completed')}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-500 text-white w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Concluir
          </Button>
        </>
      )}

      <Button
        onClick={() => {
          if (confirm('Tem certeza que deseja cancelar esta solicitação?')) {
            handleUpdateStatus('cancelled');
          }
        }}
        disabled={isLoading}
        variant="outline"
        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full sm:w-auto"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Cancelar
      </Button>
    </div>
  );
}
