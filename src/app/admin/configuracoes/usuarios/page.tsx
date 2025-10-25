'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Shield, ShieldCheck, ShieldX, Search, Loader2, FileCheck, FileX, AlertCircle, CheckCircle2, XCircle, Briefcase, Building2, Package, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface DetailedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  role: 'admin' | 'professional' | 'contractor' | null;
  userType: 'professional' | 'contractor' | 'supplier' | null;
  clerkCreatedAt: number;
  hasProfessionalProfile: boolean;
  professionalId: string | null;
  professionalStatus: string | null;
  professionalCreatedAt: string | null;
  professionalUpdatedAt: string | null;
  professionalApprovedAt: string | null;
  professionalRejectionReason: string | null;
  hasContractorProfile: boolean;
  contractorId: string | null;
  contractorCompanyName: string | null;
  hasSupplierProfile: boolean;
  supplierId: string | null;
  supplierCompanyName: string | null;
  hasDocuments: boolean;
  documentsCount: number;
  hasOrphanDocuments: boolean;
  orphanDocumentsCount: number;
  orphanDocumentsFiles: string[];
  lastEmailSent: string | null;
  lastEmailSubject: string | null;
  userState: 'clerk_only' | 'profile_incomplete' | 'pending_review' | 'approved' | 'rejected' | 'documents_orphan';
}

export default function UsuariosPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [users, setUsers] = useState<DetailedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DetailedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterState, setFilterState] = useState<string>('all');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filtrar por estado
    if (filterState !== 'all') {
      filtered = filtered.filter(user => user.userState === filterState);
    }

    // Filtrar por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const email = user.email?.toLowerCase() || '';
        const fullName = user.fullName?.toLowerCase() || '';
        return email.includes(search) || fullName.includes(search);
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterState, users]);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/users/detailed', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        console.error('Erro ao buscar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'professional' | 'contractor' | null) => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchUsers();
        setIsDialogOpen(false);
        setSelectedUser(null);
      } else {
        alert('Erro ao atualizar role');
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      alert('Erro ao atualizar role');
    } finally {
      setSubmitting(false);
    }
  };

  const openDialog = (user: DetailedUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleSendReminder = async (userId: string, userEmail: string) => {
    if (!confirm(`Enviar lembrete para finalizar cadastro para ${userEmail}?`)) {
      return;
    }

    setSendingEmail(userId);
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/users/${userId}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ E-mail de lembrete enviado com sucesso!');
      } else {
        const error = await response.json();
        alert(`❌ Erro ao enviar e-mail: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      alert('❌ Erro ao enviar e-mail');
    } finally {
      setSendingEmail(null);
    }
  };

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-600/20 text-red-500 border border-red-600/30">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        );
      case 'professional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-600/20 text-blue-500 border border-blue-600/30">
            <Shield className="h-3 w-3" />
            Profissional
          </span>
        );
      case 'contractor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-600/20 text-green-500 border border-green-600/30">
            <Shield className="h-3 w-3" />
            Contratante
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-700">
            <ShieldX className="h-3 w-3" />
            Sem role
          </span>
        );
    }
  };

  const getUserTypeBadge = (type?: string | null) => {
    switch (type) {
      case 'professional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-600/20 text-blue-500 border border-blue-600/30">
            <Briefcase className="h-3 w-3" />
            Profissional
          </span>
        );
      case 'contractor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-600/20 text-purple-500 border border-purple-600/30">
            <Building2 className="h-3 w-3" />
            Contratante
          </span>
        );
      case 'supplier':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-600/20 text-emerald-500 border border-emerald-600/30">
            <Package className="h-3 w-3" />
            Fornecedor
          </span>
        );
      default:
        return null;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-600/20 text-green-500 border border-green-600/30">
            <CheckCircle2 className="h-3 w-3" />
            Aprovado
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-600/20 text-yellow-500 border border-yellow-600/30">
            <AlertCircle className="h-3 w-3" />
            Aguardando Aprovação
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-600/20 text-red-500 border border-red-600/30">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </span>
        );
      case 'profile_incomplete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-600/20 text-orange-500 border border-orange-600/30">
            <FileX className="h-3 w-3" />
            Sem Documentos
          </span>
        );
      case 'documents_orphan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-600/20 text-amber-500 border border-amber-600/30">
            <FileCheck className="h-3 w-3" />
            Docs Pendentes
          </span>
        );
      case 'clerk_only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-700">
            <Users className="h-3 w-3" />
            Apenas Clerk
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/configuracoes')}
            className="mb-4 text-zinc-400 hover:text-white -ml-2"
          >
            ← Voltar para Configurações
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-zinc-400">Configurar roles e permissões de usuários</p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              className="bg-zinc-800 border-zinc-700 text-white h-11 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por email ou nome..."
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterState === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterState('all')}
              className={filterState === 'all' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              Todos ({users.length})
            </Button>
            <Button
              size="sm"
              variant={filterState === 'clerk_only' ? 'default' : 'outline'}
              onClick={() => setFilterState('clerk_only')}
              className={filterState === 'clerk_only' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              <Users className="h-3 w-3 mr-1" />
              Apenas Clerk ({users.filter(u => u.userState === 'clerk_only').length})
            </Button>
            <Button
              size="sm"
              variant={filterState === 'documents_orphan' ? 'default' : 'outline'}
              onClick={() => setFilterState('documents_orphan')}
              className={filterState === 'documents_orphan' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              <FileCheck className="h-3 w-3 mr-1" />
              Docs Pendentes ({users.filter(u => u.userState === 'documents_orphan').length})
            </Button>
            <Button
              size="sm"
              variant={filterState === 'profile_incomplete' ? 'default' : 'outline'}
              onClick={() => setFilterState('profile_incomplete')}
              className={filterState === 'profile_incomplete' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              <FileX className="h-3 w-3 mr-1" />
              Sem Docs ({users.filter(u => u.userState === 'profile_incomplete').length})
            </Button>
            <Button
              size="sm"
              variant={filterState === 'pending_review' ? 'default' : 'outline'}
              onClick={() => setFilterState('pending_review')}
              className={filterState === 'pending_review' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Aguardando ({users.filter(u => u.userState === 'pending_review').length})
            </Button>
            <Button
              size="sm"
              variant={filterState === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilterState('approved')}
              className={filterState === 'approved' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aprovados ({users.filter(u => u.userState === 'approved').length})
            </Button>
            <Button
              size="sm"
              variant={filterState === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilterState('rejected')}
              className={filterState === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400 hover:text-white'}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Rejeitados ({users.filter(u => u.userState === 'rejected').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Usuários Cadastrados ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-zinc-500 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="text-zinc-400">
                {searchTerm ? 'Tente ajustar sua busca' : 'Aguardando cadastros de usuários'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Nome e Email */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-medium text-white truncate">
                          {user.fullName || user.email || 'Sem nome'}
                        </h4>
                        {getUserTypeBadge(user.userType)}
                        {getStateBadge(user.userState)}
                      </div>

                      {user.email && user.fullName && (
                        <p className="text-sm text-zinc-400 truncate mb-2">
                          {user.email}
                        </p>
                      )}

                      {/* Informações do Profissional */}
                      {user.hasProfessionalProfile && (
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-2">
                          <span className="flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />
                            {user.documentsCount} {user.documentsCount === 1 ? 'documento' : 'documentos'}
                          </span>
                          {user.professionalStatus && (
                            <span>Status Supabase: {user.professionalStatus}</span>
                          )}
                          {user.professionalApprovedAt && (
                            <span>Aprovado: {new Date(user.professionalApprovedAt).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      )}

                      {/* Documentos Órfãos (no storage mas sem cadastro) */}
                      {user.hasOrphanDocuments && (
                        <div className="p-2 bg-amber-600/10 border border-amber-600/30 rounded mb-2">
                          <div className="flex items-center gap-2 text-xs text-amber-500 mb-1">
                            <AlertCircle className="h-3 w-3" />
                            <span className="font-medium">Documentos no storage ({user.orphanDocumentsCount})</span>
                          </div>
                          <p className="text-xs text-amber-400/70">
                            Usuário enviou documentos mas não completou o cadastro
                          </p>
                        </div>
                      )}

                      {/* Último email enviado */}
                      {user.lastEmailSent && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                          <Mail className="h-3 w-3" />
                          <span>Último email: {new Date(user.lastEmailSent).toLocaleString('pt-BR')}</span>
                          {user.lastEmailSubject && (
                            <span className="text-zinc-600">• {user.lastEmailSubject}</span>
                          )}
                        </div>
                      )}

                      {/* Motivo de rejeição */}
                      {user.professionalRejectionReason && (
                        <p className="text-xs text-red-400 mb-2">
                          Motivo: {user.professionalRejectionReason}
                        </p>
                      )}

                      <p className="text-xs text-zinc-500">
                        Cadastrado em {new Date(user.clerkCreatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:ml-4">
                      {/* Botão de Lembrete - para cadastros incompletos e documentos órfãos */}
                      {(user.userState === 'profile_incomplete' || user.userState === 'clerk_only' || user.userState === 'documents_orphan') && user.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(user.id, user.email!)}
                          disabled={sendingEmail === user.id}
                          className={user.userState === 'documents_orphan' ?
                            "border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-white hover:border-amber-600" :
                            "border-orange-600 text-orange-500 hover:bg-orange-600 hover:text-white hover:border-orange-600"}
                        >
                          {sendingEmail === user.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Mail className="h-3 w-3 mr-1" />
                          )}
                          {sendingEmail === user.id ? 'Enviando...' : (user.userState === 'documents_orphan' ? 'Completar Cadastro' : 'Enviar Lembrete')}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(user)}
                        className="border-white text-white hover:bg-red-600 hover:border-red-600"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Gerenciar Role
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Gerenciar Role</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Alterar permissões de {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-300 mb-3">Tipo de Usuário: {getUserTypeBadge(selectedUser?.userType)}</p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'admin')}
                  disabled={submitting || selectedUser?.userType === 'admin'}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Button>
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'professional')}
                  disabled={submitting || selectedUser?.userType === 'professional'}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Profissional
                </Button>
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'contractor')}
                  disabled={submitting || selectedUser?.userType === 'contractor'}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Contratante
                </Button>
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, null)}
                  disabled={submitting || !selectedUser?.userType}
                  variant="outline"
                  className="bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-white"
                >
                  <ShieldX className="h-4 w-4 mr-2" />
                  Remover Role
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-white"
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
