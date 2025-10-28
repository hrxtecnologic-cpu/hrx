'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, CheckCircle, AlertTriangle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: 'profissionais' | 'clientes' | 'fornecedores';
}

export function BulkImportModal({ open, onOpenChange, importType }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const getTemplateUrl = () => {
    switch (importType) {
      case 'profissionais':
        return '/templates/profissionais-template.csv';
      case 'clientes':
        return '/templates/clientes-template.csv';
      case 'fornecedores':
        return '/templates/fornecedores-template.csv';
      default:
        return '';
    }
  };

  const getInstructions = () => {
    switch (importType) {
      case 'profissionais':
        return {
          title: 'Importar Profissionais',
          fields: [
            'nome_completo',
            'cpf',
            'email',
            'telefone',
            'cep',
            'rua',
            'numero',
            'bairro',
            'cidade',
            'estado',
            'categorias (separadas por vírgula)',
          ],
        };
      case 'clientes':
        return {
          title: 'Importar Clientes e Projetos',
          fields: [
            'nome_cliente',
            'email_cliente',
            'telefone_cliente',
            'nome_evento',
            'tipo_evento',
            'descricao_evento',
            'data_evento',
            'endereco_evento',
            'cidade_evento',
            'estado_evento',
          ],
        };
      case 'fornecedores':
        return {
          title: 'Importar Fornecedores',
          fields: [
            'nome_empresa',
            'nome_contato',
            'email',
            'telefone',
            'cnpj',
            'cidade',
            'estado',
            'tipos_equipamento (separados por vírgula)',
          ],
        };
      default:
        return { title: '', fields: [] };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Apenas arquivos CSV são aceitos');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar arquivo');
      }

      setResults(data);

      if (data.success > 0) {
        toast.success(`✅ ${data.success} registro(s) importado(s) com sucesso!`);
      }

      if (data.failed > 0) {
        toast.warning(`⚠️ ${data.failed} registro(s) com erro`);
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast.error(error.message || 'Erro ao importar arquivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onOpenChange(false);
  };

  const instructions = getInstructions();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Upload className="h-5 w-5 text-blue-500" />
            {instructions.title}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Importe múltiplos registros de uma vez usando um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Template */}
          <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-400 mb-1">
                  Baixe o modelo CSV
                </h3>
                <p className="text-sm text-blue-300 mb-3">
                  Use nosso modelo para garantir que todos os campos estejam corretos
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-700 text-blue-400 hover:bg-blue-950/50"
                  onClick={() => window.open(getTemplateUrl(), '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Campos Necessários */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Campos obrigatórios:</h3>
            <div className="grid grid-cols-2 gap-2">
              {instructions.fields.map((field, index) => (
                <div
                  key={index}
                  className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
                >
                  <FileText className="h-3 w-3 inline mr-1 text-zinc-500" />
                  {field}
                </div>
              ))}
            </div>
          </div>

          {/* Upload File */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Selecione o arquivo CSV:</Label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-600 transition"
              >
                <Upload className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-300">
                  {file ? file.name : 'Clique para selecionar arquivo'}
                </span>
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Botão de Importar */}
          <Button
            onClick={handleImport}
            disabled={!file || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando arquivo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados
              </>
            )}
          </Button>

          {/* Resultados */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {results.success > 0 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      {results.success} importado(s) com sucesso
                    </span>
                  </div>
                )}
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm font-semibold">{results.failed} com erro</span>
                  </div>
                )}
              </div>

              {results.errors.length > 0 && (
                <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg max-h-40 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Erros encontrados:</h4>
                  <ul className="space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index} className="text-xs text-red-300">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
