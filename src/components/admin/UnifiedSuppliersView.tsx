/**
 * Unified Suppliers View
 *
 * Componente unificado que mostra TODOS os dados de fornecedores em um só lugar:
 * - Dados cadastrais (company_name, equipment_types, equipment_catalog)
 * - Estatísticas de orçamentos
 * - Histórico de emails
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  AlertCircle,
  Building2,
  Package,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface UnifiedSupplier {
  id: string;
  clerk_id: string;
  clerk_role: string | null;
  email: string;

  // Dados cadastrais
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  service_radius_km: number | null;

  // Equipment
  equipment_types: string[] | null;
  equipment_catalog: any | null;

  // Status
  status: 'active' | 'inactive';
  created_at: string;

  // Emails
  total_emails_sent: number;
  last_email_sent_at: string | null;
  last_email_subject: string | null;

  // Orçamentos
  totalQuotations?: number;
  acceptedQuotations?: number;
  avgTicket?: number;
}

interface UnifiedSuppliersViewProps {
  initialStats: {
    total: number;
    pending: number;
    active: number;
    inactive: number;
  };
}

type FilterStatus = 'all' | 'pending' | 'active' | 'inactive';

export function UnifiedSuppliersView({ initialStats }: UnifiedSuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<UnifiedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Row expansion
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/suppliers');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar fornecedores');
      }

      const data = await response.json();

      // A API retorna um array diretamente
      if (Array.isArray(data)) {
        setSuppliers(data);
        console.log(`✅ ${data.length} fornecedores carregados`);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar fornecedores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar fornecedores
  const filteredSuppliers = suppliers.filter(supplier => {
    // Filtro por tab
    if (activeTab === 'pending' && (!supplier.totalQuotations || supplier.totalQuotations === 0)) return false;
    if (activeTab === 'active' && supplier.status !== 'active') return false;
    if (activeTab === 'inactive' && supplier.status !== 'inactive') return false;

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        supplier.company_name?.toLowerCase().includes(term) ||
        supplier.contact_name?.toLowerCase().includes(term) ||
        supplier.email?.toLowerCase().includes(term) ||
        supplier.cnpj?.includes(term) ||
        supplier.city?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Toggle row expansion
  function toggleRow(id: string) {
    setExpandedRow(expandedRow === id ? null : id);
  }

  // Deletar fornecedor
  async function handleDelete(supplier: UnifiedSupplier) {
    if (!confirm(`Tem certeza que deseja deletar o fornecedor ${supplier.company_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar fornecedor');
      }

      alert('✅ Fornecedor deletado com sucesso!');
      loadSuppliers();
    } catch (err: any) {
      console.error('Erro ao deletar fornecedor:', err);
      alert(`❌ Erro: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-zinc-900 border-red-500/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Erro ao carregar fornecedores: {error}</p>
          </div>
          <Button
            onClick={loadSuppliers}
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 border-b border-zinc-800">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 md:px-4 py-2 font-medium transition whitespace-nowrap text-sm ${
              activeTab === 'all'
                ? 'text-white border-b-2 border-red-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({initialStats.total})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 md:px-4 py-2 font-medium transition whitespace-nowrap text-sm ${
              activeTab === 'pending'
                ? 'text-yellow-500 border-b-2 border-yellow-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Com Orçamentos Pendentes</span>
            <span className="sm:hidden">Pend.</span> ({initialStats.pending})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 md:px-4 py-2 font-medium transition whitespace-nowrap text-sm ${
              activeTab === 'active'
                ? 'text-green-500 border-b-2 border-green-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ativos ({initialStats.active})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-3 md:px-4 py-2 font-medium transition whitespace-nowrap text-sm ${
              activeTab === 'inactive'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Inativos ({initialStats.inactive})
          </button>
        </div>
      </div>

      {/* Busca e Ações */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por empresa, contato, email, CNPJ ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        {/* Botão "Novo Fornecedor" removido - todos os cadastros devem ser feitos via /admin/cadastros-manuais */}
      </div>

      {/* Tabela */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '800px' }}>
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400 w-8"></th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Fornecedor</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Equipamentos</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Localização</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Emails</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Orçamentos</th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <React.Fragment key={supplier.id}>
                      {/* Main Row */}
                      <tr
                        className="hover:bg-zinc-800/50 transition cursor-pointer"
                        onClick={() => toggleRow(supplier.id)}
                      >
                        {/* Expand Icon */}
                        <td className="p-4">
                          {expandedRow === supplier.id ? (
                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          )}
                        </td>

                        {/* Fornecedor */}
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-zinc-400" />
                              {supplier.company_name || 'Sem nome'}
                            </p>
                            <p className="text-sm text-zinc-400">{supplier.contact_name}</p>
                            <p className="text-sm text-zinc-500">{supplier.email}</p>
                            {supplier.clerk_role && (
                              <span className="text-xs text-red-500">
                                {supplier.clerk_role === 'admin' ? '👑 Admin' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Equipamentos */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {supplier.equipment_types?.slice(0, 2).map((type: string) => (
                              <span
                                key={type}
                                className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 flex items-center gap-1"
                              >
                                <Package className="h-3 w-3" />
                                {type}
                              </span>
                            ))}
                            {supplier.equipment_types && supplier.equipment_types.length > 2 && (
                              <span className="text-xs text-zinc-500">
                                +{supplier.equipment_types.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Localização */}
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-zinc-400">
                            <MapPin className="h-3 w-3" />
                            <span>{supplier.city || '-'}, {supplier.state || '-'}</span>
                          </div>
                          {supplier.service_radius_km && (
                            <p className="text-xs text-zinc-500 mt-1">
                              Raio: {supplier.service_radius_km}km
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {supplier.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                              <XCircle className="h-3 w-3" />
                              Inativo
                            </span>
                          )}
                        </td>

                        {/* Emails */}
                        <td className="p-4">
                          <div className="text-sm text-zinc-400">
                            <p>{supplier.total_emails_sent} enviados</p>
                            {supplier.last_email_sent_at && (
                              <p className="text-xs text-zinc-500 mt-1">
                                Último: {new Date(supplier.last_email_sent_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Orçamentos */}
                        <td className="p-4">
                          <div className="text-sm text-zinc-400">
                            {supplier.totalQuotations !== undefined ? (
                              <>
                                <p>{supplier.totalQuotations} total</p>
                                {supplier.acceptedQuotations !== undefined && supplier.acceptedQuotations > 0 && (
                                  <p className="text-xs text-green-500 mt-1">
                                    {supplier.acceptedQuotations} aceitos
                                  </p>
                                )}
                                {supplier.avgTicket !== undefined && (
                                  <p className="text-xs text-blue-500 mt-1">
                                    Ticket: R$ {supplier.avgTicket.toFixed(2)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>-</p>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/fornecedores/${supplier.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-zinc-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(supplier);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === supplier.id && (
                        <tr className="bg-zinc-800/30">
                          <td colSpan={8} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Coluna 1: Dados Básicos & Equipamentos */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">Dados Básicos</h4>
                                <dl className="space-y-2 text-sm">
                                  <div>
                                    <dt className="text-zinc-500">CNPJ</dt>
                                    <dd className="text-white">{supplier.cnpj || '-'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-zinc-500">Contato</dt>
                                    <dd className="text-white">{supplier.contact_name || '-'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-zinc-500">Telefone</dt>
                                    <dd className="text-white">{supplier.phone || '-'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-zinc-500">Cadastrado em</dt>
                                    <dd className="text-white">
                                      {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                                    </dd>
                                  </div>
                                </dl>

                                {/* Equipamentos */}
                                {supplier.equipment_types && supplier.equipment_types.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-medium text-white mb-2">Tipos de Equipamentos</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {supplier.equipment_types.map((type: string) => (
                                        <span
                                          key={type}
                                          className="text-xs bg-zinc-700 text-zinc-200 px-2 py-1 rounded"
                                        >
                                          {type}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Coluna 2: Comunicação & Orçamentos */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">Comunicação</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <dt className="text-zinc-500">Emails enviados:</dt>
                                    <dd className="text-white">{supplier.total_emails_sent}</dd>
                                  </div>
                                  {supplier.last_email_subject && (
                                    <div>
                                      <dt className="text-zinc-500">Último assunto:</dt>
                                      <dd className="text-white text-xs">{supplier.last_email_subject}</dd>
                                    </div>
                                  )}
                                </div>

                                {/* Estatísticas de Orçamentos */}
                                {supplier.totalQuotations !== undefined && (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-medium text-white mb-2">Orçamentos</h5>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-zinc-500">Total:</span>
                                        <span className="text-white">{supplier.totalQuotations}</span>
                                      </div>
                                      {supplier.acceptedQuotations !== undefined && (
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Aceitos:</span>
                                          <span className="text-green-500">{supplier.acceptedQuotations}</span>
                                        </div>
                                      )}
                                      {supplier.avgTicket !== undefined && (
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Ticket Médio:</span>
                                          <span className="text-blue-500">R$ {supplier.avgTicket.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ações Rápidas */}
                            <div className="mt-6">
                              <Link href={`/admin/fornecedores/${supplier.id}`}>
                                <Button size="sm" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-700 hover:text-white">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-zinc-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhum fornecedor encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer com total */}
      <div className="text-sm text-zinc-400 text-center">
        Mostrando {filteredSuppliers.length} de {suppliers.length} fornecedores
      </div>

      {/* Dialog de Cadastro removido - todos os cadastros devem ser feitos via /admin/cadastros-manuais */}
    </div>
  );
}
