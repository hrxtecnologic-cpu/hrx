/**
 * Unified Professionals View
 *
 * Componente unificado que mostra TODOS os dados de profissionais em um só lugar:
 * - Dados do Clerk (role, email)
 * - Dados cadastrais (categorias, endereço)
 * - Documentos (validados, pendentes, órfãos)
 * - Histórico de emails
 * - Alocações em projetos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { UnifiedProfessional } from '@/app/api/admin/professionals/unified/route';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface UnifiedProfessionalsViewProps {
  initialStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    orphan: number;
  };
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'orphan';

export function UnifiedProfessionalsView({ initialStats }: UnifiedProfessionalsViewProps) {
  const { getToken } = useAuth();

  const [professionals, setProfessionals] = useState<UnifiedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Row expansion
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Email sending
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    loadProfessionals();
  }, []);

  async function loadProfessionals() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/professionals/unified');

      if (!response.ok) {
        throw new Error('Erro ao carregar profissionais');
      }

      const data = await response.json();

      if (data.success) {
        setProfessionals(data.professionals);
        console.log(`✅ ${data.professionals.length} profissionais carregados em ${data.performance.duration_seconds}s`);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar profissionais:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar profissionais
  const filteredProfessionals = professionals.filter(prof => {
    // Filtro por tab
    if (activeTab === 'pending' && prof.status !== 'pending') return false;
    if (activeTab === 'approved' && prof.status !== 'approved') return false;
    if (activeTab === 'rejected' && prof.status !== 'rejected') return false;
    if (activeTab === 'orphan' && !prof.has_orphan_documents) return false;

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        prof.full_name?.toLowerCase().includes(term) ||
        prof.email?.toLowerCase().includes(term) ||
        prof.cpf?.includes(term) ||
        prof.city?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Toggle row expansion
  function toggleRow(id: string) {
    setExpandedRow(expandedRow === id ? null : id);
  }

  // Enviar email de lembrete
  async function handleSendEmail(prof: UnifiedProfessional) {
    const message = prof.status === 'pending'
      ? `Enviar lembrete para ${prof.full_name} (${prof.email}) completar o cadastro?`
      : `Enviar email para ${prof.full_name} (${prof.email})?`;

    if (!confirm(message)) {
      return;
    }

    setSendingEmail(prof.clerk_id);

    try {
      const token = await getToken();

      // Usar clerk_id ao invés de ID do Supabase
      const response = await fetch(`/api/admin/users/${prof.clerk_id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ E-mail enviado com sucesso!');
        // Recarregar dados para atualizar último email
        loadProfessionals();
      } else {
        const error = await response.json();
        alert(`❌ Erro ao enviar e-mail: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      alert(`❌ Erro ao enviar e-mail: ${err.message}`);
    } finally {
      setSendingEmail(null);
    }
  }

  // Deletar profissional
  async function handleDelete(prof: UnifiedProfessional) {
    if (!confirm(`Tem certeza que deseja deletar o profissional ${prof.full_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/professionals/${prof.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar profissional');
      }

      alert('✅ Profissional deletado com sucesso!');
      loadProfessionals();
    } catch (err: any) {
      console.error('Erro ao deletar profissional:', err);
      alert(`❌ Erro: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando profissionais...</p>
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
            <p className="font-medium">Erro ao carregar profissionais: {error}</p>
          </div>
          <Button
            onClick={loadProfessionals}
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
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'all'
              ? 'text-white border-b-2 border-red-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({initialStats.total})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'pending'
              ? 'text-yellow-500 border-b-2 border-yellow-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Pendentes ({initialStats.pending})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'approved'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Aprovados ({initialStats.approved})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'rejected'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Rejeitados ({initialStats.rejected})
        </button>
        <button
          onClick={() => setActiveTab('orphan')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'orphan'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Docs Órfãos ({initialStats.orphan})
        </button>
      </div>

      {/* Busca */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar por nome, email, CPF ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
      </div>

      {/* Tabela */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400 w-8"></th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Profissional</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Categorias</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Localização</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Docs</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Emails</th>
                  <th className="text-left p-4 text-sm font-medium text-zinc-400">Projetos</th>
                  <th className="text-right p-4 text-sm font-medium text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredProfessionals.length > 0 ? (
                  filteredProfessionals.map((prof) => (
                    <React.Fragment key={prof.id}>
                      {/* Main Row */}
                      <tr
                        className="hover:bg-zinc-800/50 transition cursor-pointer"
                        onClick={() => toggleRow(prof.id)}
                      >
                        {/* Expand Icon */}
                        <td className="p-4">
                          {expandedRow === prof.id ? (
                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          )}
                        </td>

                        {/* Profissional */}
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-white">{prof.full_name}</p>
                            <p className="text-sm text-zinc-500">{prof.email}</p>
                            {prof.clerk_role && (
                              <span className="text-xs text-red-500">
                                {prof.clerk_role === 'admin' ? '👑 Admin' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categorias */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {prof.categories?.slice(0, 2).map((cat: string) => (
                              <span
                                key={cat}
                                className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20"
                              >
                                {cat}
                              </span>
                            ))}
                            {prof.categories && prof.categories.length > 2 && (
                              <span className="text-xs text-zinc-500">
                                +{prof.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Localização */}
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-zinc-400">
                            <MapPin className="h-3 w-3" />
                            <span>{prof.city || '-'}, {prof.state || '-'}</span>
                          </div>
                          {prof.service_radius_km && (
                            <p className="text-xs text-zinc-500 mt-1">
                              Raio: {prof.service_radius_km}km
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {prof.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              <CheckCircle className="h-3 w-3" />
                              Aprovado
                            </span>
                          ) : prof.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                              <Clock className="h-3 w-3" />
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                              <XCircle className="h-3 w-3" />
                              Rejeitado
                            </span>
                          )}
                        </td>

                        {/* Documentos */}
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="text-white">
                              {prof.total_documents} docs
                            </p>
                            <div className="flex gap-2 text-xs mt-1">
                              <span className="text-green-500">✓ {prof.validated_documents}</span>
                              <span className="text-yellow-500">⏳ {prof.pending_documents}</span>
                              {prof.has_orphan_documents && (
                                <span className="text-orange-500">⚠️ {prof.orphan_documents_count}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Emails */}
                        <td className="p-4">
                          <div className="text-sm text-zinc-400">
                            <p>{prof.total_emails_sent} enviados</p>
                            {prof.last_email_sent_at && (
                              <p className="text-xs text-zinc-500 mt-1">
                                Último: {new Date(prof.last_email_sent_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Projetos */}
                        <td className="p-4">
                          <div className="text-sm text-zinc-400">
                            <p>{prof.total_allocations} total</p>
                            {prof.active_allocations > 0 && (
                              <p className="text-xs text-green-500 mt-1">
                                {prof.active_allocations} ativos
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/profissionais/${prof.id}`}>
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
                                handleDelete(prof);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === prof.id && (
                        <tr className="bg-zinc-800/30">
                          <td colSpan={9} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Coluna 1: Dados Básicos */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">Dados Básicos</h4>
                                <dl className="space-y-2 text-sm">
                                  <div>
                                    <dt className="text-zinc-500">CPF</dt>
                                    <dd className="text-white">{prof.cpf}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-zinc-500">Telefone</dt>
                                    <dd className="text-white">{prof.phone || '-'}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-zinc-500">Cadastrado em</dt>
                                    <dd className="text-white">
                                      {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                                    </dd>
                                  </div>
                                  {prof.approved_at && (
                                    <div>
                                      <dt className="text-zinc-500">Aprovado em</dt>
                                      <dd className="text-green-500">
                                        {new Date(prof.approved_at).toLocaleDateString('pt-BR')}
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>

                              {/* Coluna 2: Documentos */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">Documentos</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Total:</span>
                                    <span className="text-white">{prof.total_documents}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Validados:</span>
                                    <span className="text-green-500">{prof.validated_documents}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Pendentes:</span>
                                    <span className="text-yellow-500">{prof.pending_documents}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Rejeitados:</span>
                                    <span className="text-red-500">{prof.rejected_documents}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Coluna 3: Último Email */}
                              <div>
                                <h4 className="text-sm font-medium text-white mb-3">Comunicação</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <dt className="text-zinc-500">Emails enviados:</dt>
                                    <dd className="text-white">{prof.total_emails_sent}</dd>
                                  </div>
                                  {prof.last_email_subject && (
                                    <div>
                                      <dt className="text-zinc-500">Último assunto:</dt>
                                      <dd className="text-white text-xs">{prof.last_email_subject}</dd>
                                    </div>
                                  )}
                                  {prof.last_project_name && (
                                    <div>
                                      <dt className="text-zinc-500">Último projeto:</dt>
                                      <dd className="text-white text-xs">{prof.last_project_name}</dd>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Ações Rápidas */}
                            <div className="mt-6 flex gap-3">
                              {prof.status === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 text-white hover:bg-blue-500/10 hover:border-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendEmail(prof);
                                }}
                                disabled={sendingEmail === prof.clerk_id}
                              >
                                {sendingEmail === prof.clerk_id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Enviar Email
                                  </>
                                )}
                              </Button>
                              <Link href={`/admin/profissionais/${prof.id}`}>
                                <Button size="sm" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-700">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver Documentos
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
                    <td colSpan={9} className="p-12 text-center text-zinc-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhum profissional encontrado</p>
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
        Mostrando {filteredProfessionals.length} de {professionals.length} profissionais
      </div>
    </div>
  );
}
