'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DocumentViewer({
  label,
  url,
  required = false,
}: {
  label: string;
  url?: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!url) {
    return (
      <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-red-500">Não enviado</p>
          </div>
        </div>
        {required && (
          <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
            Obrigatório
          </span>
        )}
      </div>
    );
  }

  const isPDF = url.toLowerCase().includes('.pdf');

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition">
      <div className="flex items-center gap-3 flex-1">
        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-green-500">Documento enviado</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300">
              <FileText className="h-4 w-4 mr-1" />
              Visualizar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh] bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">{label}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {isPDF ? (
                <iframe
                  src={url}
                  className="w-full h-full min-h-[600px] rounded-lg"
                  title={label}
                />
              ) : (
                <div className="relative w-full min-h-[600px]">
                  <Image
                    src={url}
                    alt={label}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em nova aba
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="ghost" asChild className="text-zinc-400">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
