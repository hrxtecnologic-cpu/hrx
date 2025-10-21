'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, CheckCircle, XCircle, Upload, Edit, UserPlus, Clock } from 'lucide-react';

interface HistoryEntry {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  action_by_user?: {
    email: string;
    full_name: string;
  };
}

interface ProfessionalHistoryProps {
  professionalId: string;
}

const ACTION_ICONS: Record<string, any> = {
  created: UserPlus,
  updated: Edit,
  approved: CheckCircle,
  rejected: XCircle,
  document_approved: CheckCircle,
  document_rejected: XCircle,
  document_uploaded: Upload,
};

const ACTION_COLORS: Record<string, string> = {
  created: 'text-blue-500 bg-blue-500/10',
  updated: 'text-yellow-500 bg-yellow-500/10',
  approved: 'text-green-500 bg-green-500/10',
  rejected: 'text-red-500 bg-red-500/10',
  document_approved: 'text-green-500 bg-green-500/10',
  document_rejected: 'text-red-500 bg-red-500/10',
  document_uploaded: 'text-blue-500 bg-blue-500/10',
};

export function ProfessionalHistory({ professionalId }: ProfessionalHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`/api/admin/professionals/${professionalId}/history`);
        if (!response.ok) throw new Error('Erro ao carregar histórico');

        const data = await response.json();
        setHistory(data.history || []);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [professionalId]);

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-600 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base flex-wrap">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <span>Histórico de Alterações</span>
          </div>
          <span className="ml-auto text-xs sm:text-sm font-normal text-zinc-500">
            {history.length} {history.length === 1 ? 'evento' : 'eventos'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {history.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <History className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-700 mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-zinc-400">Nenhum evento registrado</p>
          </div>
        ) : (
          <div className="space-y-0">
            {history.map((entry, index) => {
              const Icon = ACTION_ICONS[entry.action_type] || Edit;
              const colorClass = ACTION_COLORS[entry.action_type] || 'text-zinc-500 bg-zinc-800';
              const isLast = index === history.length - 1;

              return (
                <div key={entry.id} className="flex gap-3 sm:gap-4 relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-3 sm:left-4 top-8 sm:top-10 bottom-0 w-px bg-zinc-800" />
                  )}

                  {/* Icon */}
                  <div className={`relative z-10 p-1.5 sm:p-2 rounded-lg ${colorClass} h-fit flex-shrink-0`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                    <p className="text-xs sm:text-sm text-white font-medium mb-1 break-words">
                      {entry.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-zinc-500">
                      <span className="whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {entry.action_by_user && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">
                            por {entry.action_by_user.full_name || entry.action_by_user.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
