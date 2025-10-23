'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUpload } from '@/components/DocumentUpload';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { uploadDocument } from '@/lib/supabase/storage';

interface BasicDocument {
  type: 'rg_front' | 'rg_back' | 'cpf' | 'proof_of_address';
  label: string;
  description: string;
  acceptsPDF?: boolean;
}

const BASIC_DOCUMENTS: BasicDocument[] = [
  {
    type: 'rg_front',
    label: 'RG - Frente',
    description: 'Foto da frente do documento de identidade (RG)',
  },
  {
    type: 'rg_back',
    label: 'RG - Verso',
    description: 'Foto do verso do documento de identidade (RG)',
  },
  {
    type: 'cpf',
    label: 'CPF',
    description: 'Foto do documento de CPF ou página do RG com CPF',
  },
  {
    type: 'proof_of_address',
    label: 'Comprovante de Residência',
    description: 'Conta de água, luz, telefone ou contrato de aluguel (últimos 3 meses)',
    acceptsPDF: true,
  },
];

interface BasicDocumentsUploadProps {
  userId: string;
  uploadedDocuments: Record<string, string>;
  onDocumentUploaded: (type: string, url: string) => void;
  disabled?: boolean;
}

export function BasicDocumentsUpload({
  userId,
  uploadedDocuments,
  onDocumentUploaded,
  disabled = false,
}: BasicDocumentsUploadProps) {
  const handleUpload = async (docType: string, file: File) => {
    const { url, error } = await uploadDocument(file, userId, docType as any);

    if (error) {
      throw new Error(error);
    }

    if (url) {
      onDocumentUploaded(docType, url);
      console.log(`✅ Documento ${docType} enviado com sucesso`);
    }
  };

  const allDocumentsUploaded = BASIC_DOCUMENTS.every(doc => uploadedDocuments[doc.type]);
  const uploadedCount = BASIC_DOCUMENTS.filter(doc => uploadedDocuments[doc.type]).length;

  return (
    <Card className="border-red-900/20 bg-zinc-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Documentos Pessoais Obrigatórios
            </CardTitle>
            <CardDescription className="mt-1">
              Envie os documentos básicos para validação do seu cadastro
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-zinc-400">
              {uploadedCount} de {BASIC_DOCUMENTS.length}
            </div>
            {allDocumentsUploaded && (
              <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                <CheckCircle2 className="h-3 w-3" />
                Completo
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {BASIC_DOCUMENTS.map((doc) => (
          <div key={doc.type}>
            <DocumentUpload
              label={doc.label}
              description={doc.description}
              documentType={doc.type}
              accept={doc.acceptsPDF ? '.pdf,.jpg,.jpeg,.png,.webp' : '.jpg,.jpeg,.png,.webp'}
              onUpload={(file) => handleUpload(doc.type, file)}
              currentUrl={uploadedDocuments[doc.type]}
              required={true}
            />
          </div>
        ))}

        {/* Aviso se faltam documentos */}
        {!allDocumentsUploaded && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-950/20 border border-yellow-900/40 mt-4">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">
                Documentos obrigatórios pendentes
              </p>
              <p className="text-yellow-600 text-xs mt-1">
                Todos os 4 documentos são obrigatórios para prosseguir com o cadastro.
                Faltam {BASIC_DOCUMENTS.length - uploadedCount} documento(s).
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
