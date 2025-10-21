'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProfessionalActions({
  professionalId,
  currentStatus,
}: {
  professionalId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  async function handleApprove() {
    if (!confirm('Tem certeza que deseja aprovar este profissional?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao aprovar profissional');
      }

      alert('Profissional aprovado com sucesso!');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Erro ao aprovar profissional. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error('Erro ao rejeitar profissional');
      }

      alert('Profissional rejeitado.');
      setShowRejectDialog(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Erro ao rejeitar profissional. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  if (currentStatus === 'approved') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle className="h-4 w-4" />
        Profissional aprovado
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleApprove}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-500 text-white"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        Aprovar
      </Button>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeitar Profissional</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Informe o motivo da rejeição. O profissional será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Documentos ilegíveis, informações inconsistentes..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                className="border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isLoading || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
