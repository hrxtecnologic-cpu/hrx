'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { RequestQuotesModal } from './RequestQuotesModal';
import { QuotationsComparison } from './QuotationsComparison';

interface ProjectQuotationsSectionProps {
  projectId: string;
  projectName: string;
  equipmentItems: Array<{
    name: string;
    category: string;
    quantity: number;
    duration_days: number;
    specifications?: string;
  }>;
}

export function ProjectQuotationsSection({
  projectId,
  projectName,
  equipmentItems,
}: ProjectQuotationsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Botão para solicitar orçamentos */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white"
          disabled={equipmentItems.length === 0}
        >
          <Package className="h-4 w-4 mr-2" />
          Solicitar Orçamentos
        </Button>
      </div>

      {/* Comparação de orçamentos */}
      <QuotationsComparison projectId={projectId} />

      {/* Modal de solicitação */}
      <RequestQuotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
        equipmentItems={equipmentItems}
      />
    </div>
  );
}
