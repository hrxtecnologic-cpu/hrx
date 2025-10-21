'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Shield, ShieldCheck, ShieldX, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  publicMetadata: {
    role?: 'admin' | 'professional' | 'contractor';
  };
  createdAt: number;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ClerkUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => {
        const email = user.emailAddresses[0]?.emailAddress.toLowerCase() || '';
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return email.includes(search) || fullName.includes(search);
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
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

  const openDialog = (user: ClerkUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const getRoleBadge = (role?: string) => {
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

      {/* Search */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              className="bg-zinc-800 border-zinc-700 text-white h-11 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por email ou nome..."
            />
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
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-white truncate">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.emailAddresses[0]?.emailAddress || 'Sem nome'}
                      </h4>
                      {getRoleBadge(user.publicMetadata?.role)}
                    </div>
                    <p className="text-sm text-zinc-400 truncate">
                      {user.emailAddresses[0]?.emailAddress || 'Sem email'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Cadastrado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
              Alterar permissões de {selectedUser?.emailAddresses[0]?.emailAddress}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-300 mb-3">Role Atual: {getRoleBadge(selectedUser?.publicMetadata?.role)}</p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'admin')}
                  disabled={submitting || selectedUser?.publicMetadata?.role === 'admin'}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Button>
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'professional')}
                  disabled={submitting || selectedUser?.publicMetadata?.role === 'professional'}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Profissional
                </Button>
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, 'contractor')}
                  disabled={submitting || selectedUser?.publicMetadata?.role === 'contractor'}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Contratante
                </Button>
                <Button
                  onClick={() => selectedUser && handleUpdateRole(selectedUser.id, null)}
                  disabled={submitting || !selectedUser?.publicMetadata?.role}
                  variant="outline"
                  className="border-white text-white hover:bg-red-600 hover:border-red-600"
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
                className="flex-1 border-white text-white hover:bg-red-600 hover:border-red-600"
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
