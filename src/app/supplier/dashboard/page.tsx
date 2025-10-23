'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

interface QuotationRequest {
  id: string;
  project_id: string;
  equipment_id: string;
  status: 'pending' | 'sent' | 'received' | 'accepted' | 'rejected' | 'expired';
  supplier_price?: number;
  supplier_notes?: string;
  hrx_price?: number;
  created_at: string;
  updated_at: string;
  event_projects: {
    project_number: string;
    event_name: string;
    event_date: string;
    client_name: string;
  };
  project_equipment: {
    equipment_type: string;
    quantity: number;
    duration_days: number;
    specific_requirements?: string;
  };
}

interface SupplierData {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  equipment_types: string[];
  status: 'active' | 'inactive';
}

interface SupplierStats {
  pending_quotations: number;
  total_quotations: number;
  accepted_quotations: number;
  total_value: number;
}

export default function SupplierDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [quotations, setQuotations] = useState<QuotationRequest[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    pending_quotations: 0,
    total_quotations: 0,
    accepted_quotations: 0,
    total_value: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const response = await fetch('/api/supplier/dashboard');

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const data = await response.json();
      setSupplier(data.supplier || null);
      setQuotations(data.quotations || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: { label: 'Aguardando', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      sent: { label: 'Enviado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      received: { label: 'Recebido', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
      accepted: { label: 'Aceito', color: 'bg-green-600/10 text-green-600 border-green-600/20' },
      rejected: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
      expired: { label: 'Expirado', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingQuotations = quotations.filter((q) => q.status === 'pending' || q.status === 'sent');
  const historyQuotations = quotations.filter((q) => q.status !== 'pending' && q.status !== 'sent');

  return (
    <div className="min-h-screen bg-zinc-950 p-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meu Dashboard</h1>
            <p className="text-zinc-400">
              Olá, {supplier?.company_name || 'Fornecedor'}!
            </p>
          </div>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0">
              <Building2 className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cotações Pendentes */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Cotações Pendentes</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.pending_quotations}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-600/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Cotações */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Total de Cotações</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.total_quotations}</p>
                </div>
                <div className="h-12 w-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cotações Aceitas */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Cotações Aceitas</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.accepted_quotations}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Valor Total</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {formatCurrency(stats.total_value)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-600/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid: Conteúdo Principal + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cotações Pendentes */}
            {pendingQuotations.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Cotações Aguardando Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingQuotations.map((quotation) => (
                      <Card key={quotation.id} className="bg-zinc-800 border-zinc-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-zinc-400" />
                                <div>
                                  <h3 className="text-lg font-semibold text-white">
                                    {quotation.project_equipment.equipment_type}
                                  </h3>
                                  <p className="text-sm text-zinc-400">
                                    Projeto #{quotation.event_projects.project_number} - {quotation.event_projects.event_name}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-zinc-500">Cliente</p>
                                  <p className="text-sm text-white">{quotation.event_projects.client_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-500">Data do Evento</p>
                                  <p className="text-sm text-white">
                                    {formatDate(quotation.event_projects.event_date)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-500">Quantidade</p>
                                  <p className="text-sm text-white">{quotation.project_equipment.quantity}x</p>
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-500">Duração</p>
                                  <p className="text-sm text-white">
                                    {quotation.project_equipment.duration_days} dia(s)
                                  </p>
                                </div>
                              </div>

                              {quotation.project_equipment.specific_requirements && (
                                <div className="mt-3">
                                  <p className="text-xs text-zinc-500">Requisitos Específicos</p>
                                  <p className="text-sm text-zinc-300">
                                    {quotation.project_equipment.specific_requirements}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              {getStatusBadge(quotation.status)}
                              <Link href={`/supplier/quotations/${quotation.id}`}>
                                <Button className="bg-red-600 hover:bg-red-700 text-white">
                                  Responder Cotação
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico de Cotações */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Histórico de Cotações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyQuotations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400">Nenhuma cotação no histórico</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyQuotations.map((quotation) => (
                      <Card key={quotation.id} className="bg-zinc-800 border-zinc-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Package className="h-5 w-5 text-zinc-400" />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {quotation.project_equipment.equipment_type}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  Projeto #{quotation.event_projects.project_number}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {quotation.supplier_price && (
                                <p className="text-sm text-white font-medium">
                                  {formatCurrency(quotation.supplier_price)}
                                </p>
                              )}
                              {getStatusBadge(quotation.status)}
                              <Link href={`/supplier/quotations/${quotation.id}`}>
                                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
                                  Ver Detalhes
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações da Empresa */}
            {supplier && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Informações da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Empresa</p>
                    <p className="text-sm text-white font-medium">{supplier.company_name}</p>
                  </div>

                  {supplier.contact_name && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Contato</p>
                      <p className="text-sm text-white">{supplier.contact_name}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="text-sm text-white">{supplier.email}</p>
                  </div>

                  {supplier.phone && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefone
                      </p>
                      <p className="text-sm text-white">{supplier.phone}</p>
                    </div>
                  )}

                  {supplier.equipment_types && supplier.equipment_types.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Equipamentos Fornecidos</p>
                      <div className="flex flex-wrap gap-2">
                        {supplier.equipment_types.map((type, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-600/10 text-red-500 text-xs rounded border border-red-600/20"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ações Rápidas */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <a
                  href="mailto:atendimento@hrxeventos.com.br"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition text-sm"
                >
                  📧 Enviar Email
                </a>
                <a
                  href="https://wa.me/5521999952457"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm"
                >
                  💬 WhatsApp
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
