/**
 * =====================================================
 * ADMIN: Cadastros Manuais
 * =====================================================
 * Permite ao admin cadastrar manualmente:
 * - Profissionais
 * - Clientes (projetos)
 * - Fornecedores
 *
 * Enquanto o sistema não é 100% adotado pelos usuários
 * =====================================================
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, Package, Upload, Plus, AlertTriangle } from 'lucide-react';
import { ManualProfessionalForm } from '@/components/admin/ManualProfessionalForm';
import { ManualClientForm } from '@/components/admin/ManualClientForm';
import { ManualSupplierForm } from '@/components/admin/ManualSupplierForm';
import { BulkImportModal } from '@/components/admin/BulkImportModal';

export default function CadastrosManuaisPage() {
  const [activeTab, setActiveTab] = useState<'profissionais' | 'clientes' | 'fornecedores'>('profissionais');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'profissionais' | 'clientes' | 'fornecedores'>('profissionais');

  const handleOpenImport = (type: 'profissionais' | 'clientes' | 'fornecedores') => {
    setImportType(type);
    setShowImportModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cadastros Manuais</h1>
        <p className="text-zinc-400">
          Cadastre profissionais, clientes e fornecedores manualmente enquanto o sistema não é 100% adotado
        </p>
      </div>

      {/* Alerta de Transição */}
      <Card className="bg-blue-950/20 border-blue-900/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-400 mb-1">
                Período de Transição
              </h3>
              <p className="text-sm text-blue-300">
                Esta área permite cadastrar dados manualmente durante a migração para o sistema HRX.
                Verifique sempre se já não existe um cadastro duplicado antes de adicionar novos registros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="profissionais"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Profissionais
          </TabsTrigger>
          <TabsTrigger
            value="clientes"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger
            value="fornecedores"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Fornecedores
          </TabsTrigger>
        </TabsList>

        {/* TAB: Profissionais */}
        <TabsContent value="profissionais" className="mt-6">
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleOpenImport('profissionais')}
                variant="outline"
                className="border-blue-700 text-blue-400 hover:bg-blue-950/50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Planilha (CSV)
              </Button>
            </div>

            {/* Formulário */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-500" />
                      Cadastrar Profissional Manualmente
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Preencha os dados do profissional abaixo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ManualProfessionalForm />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Clientes */}
        <TabsContent value="clientes" className="mt-6">
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleOpenImport('clientes')}
                variant="outline"
                className="border-green-700 text-green-400 hover:bg-green-950/50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Planilha (CSV)
              </Button>
            </div>

            {/* Formulário */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-500" />
                      Cadastrar Cliente e Projeto Manualmente
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Preencha os dados do cliente e do evento que ele solicitou
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ManualClientForm />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Fornecedores */}
        <TabsContent value="fornecedores" className="mt-6">
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleOpenImport('fornecedores')}
                variant="outline"
                className="border-purple-700 text-purple-400 hover:bg-purple-950/50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Planilha (CSV)
              </Button>
            </div>

            {/* Formulário */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plus className="h-5 w-5 text-purple-500" />
                      Cadastrar Fornecedor Manualmente
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Preencha os dados do fornecedor de equipamentos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ManualSupplierForm />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Importação */}
      <BulkImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        importType={importType}
      />
    </div>
  );
}
