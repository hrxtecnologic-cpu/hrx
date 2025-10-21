'use client';

import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotifyPendingDocsButtonProps {
  professionalId: string;
}

export function NotifyPendingDocsButton({ professionalId }: NotifyPendingDocsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNotify = async () => {
    if (isLoading) return;

    const confirmed = confirm(
      'Deseja enviar um email para o profissional avisando sobre documentos pendentes?'
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}/notify-pending`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar notificação');
      }

      alert(
        `✅ Email enviado com sucesso!\n\n` +
        `📄 Documentos pendentes: ${data.pendingCount}\n` +
        `❌ Documentos rejeitados: ${data.rejectedCount}`
      );

      router.refresh();
    } catch (error) {
      console.error('Erro ao notificar:', error);
      alert(
        error instanceof Error
          ? `❌ Erro: ${error.message}`
          : '❌ Erro ao enviar notificação'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleNotify}
      disabled={isLoading}
      variant="outline"
      className="w-full sm:w-auto border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
    >
      <Mail className="h-4 w-4 mr-2" />
      {isLoading ? 'Enviando...' : 'Avisar Docs Pendentes'}
    </Button>
  );
}
