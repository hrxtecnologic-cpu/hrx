/**
 * Project Team Section - SIMPLIFICADO
 *
 * UX Melhorada:
 * - Demanda do cliente (o que foi pedido)
 * - Equipe montada (quem já foi selecionado)
 * - Adicionar profissionais via TABS (Sugestões vs Todos)
 * - SEM limite de distância, mostra TODOS mas ordena por score
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Briefcase,
  Plus,
  Trash2,
  Phone,
  Mail,
  Star,
  Search,
  MapPin,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  Target,
  Calendar,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Professional {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  categories: string[];
  city?: string;
  state?: string;
}

interface SuggestedProfessional extends Professional {
  distance_km: number;
  total_score: number;
  distance_score: number;
  category_score: number;
  experience_score: number;
  availability_score: number;
  performance_score: number;
}

interface TeamMember {
  id: string;
  role: string;
  category: string;
  quantity: number;
  duration_days: number;
  daily_rate?: number;
  total_cost?: number;
  professional?: Professional;
  external_name?: string;
  status?: 'planned' | 'invited' | 'confirmed' | 'rejected' | 'allocated';
  invited_at?: string;
  confirmed_at?: string;
}

interface ProfessionalNeeded {
  category: string;
  subcategory?: string;
  quantity: number;
  notes?: string;
}

interface ProjectTeamSectionProps {
  projectId: string;
  projectDate: string;
  teamMembers: TeamMember[];
  availableProfessionals: Professional[];
  professionalsNeeded: ProfessionalNeeded[];
}

export function ProjectTeamSection({
  projectId,
  projectDate,
  teamMembers,
  availableProfessionals,
  professionalsNeeded,
}: ProjectTeamSectionProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [addingProfessional, setAddingProfessional] = useState<string | null>(null);

  // Sugestões
  const [suggestedProfessionals, setSuggestedProfessionals] = useState<SuggestedProfessional[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Modal de adicionar
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [role, setRole] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [days, setDays] = useState(1);
  const [dailyRate, setDailyRate] = useState(0);

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Extrair categorias e estados
  const allCategories = Array.from(
    new Set(availableProfessionals.flatMap((p) => p.categories))
  ).sort();

  const allStates = Array.from(
    new Set(availableProfessionals.map((p) => p.state).filter(Boolean))
  ).sort();

  // Carregar sugestões (SEM LIMITE DE DISTÂNCIA)
  useEffect(() => {
    loadSuggestions();
  }, [projectId]);

  async function loadSuggestions() {
    try {
      setLoadingSuggestions(true);

      const requiredCategories = professionalsNeeded?.map(need => need.category).filter(Boolean) || [];

      const params = new URLSearchParams();
      if (requiredCategories.length > 0) {
        params.append('categories', requiredCategories.join(','));
      }
      // REMOVIDO: max_distance - Agora mostra TODOS
      params.append('min_score', '0'); // Score mínimo 0 para mostrar todos
      params.append('limit', '100'); // Aumentado para 100

      const response = await fetch(`/api/admin/event-projects/${projectId}/suggested-professionals?${params}`);

      if (response.ok) {
        const result = await response.json();
        setSuggestedProfessionals(result.data?.professionals || []);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Filtrar profissionais disponíveis
  const filteredProfessionals = availableProfessionals.filter((prof) => {
    const matchesSearch =
      prof.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || prof.categories.includes(selectedCategory);

    const matchesState =
      selectedState === 'all' || prof.state === selectedState;

    const alreadyInProject = teamMembers.some(
      (member) => member.professional?.id === prof.id
    );

    return matchesSearch && matchesCategory && matchesState && !alreadyInProject;
  });

  // Abrir modal para adicionar profissional
  const openAddModal = (professional: Professional) => {
    setSelectedProfessional(professional);
    setRole(professional.categories[0] || '');
    setShowAddModal(true);
  };

  // Adicionar profissional ao projeto
  const handleAddToProject = async () => {
    if (!selectedProfessional) return;

    try {
      setAddingProfessional(selectedProfessional.id);

      const response = await fetch(
        `/api/admin/event-projects/${projectId}/team`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_id: selectedProfessional.id,
            role,
            category: selectedProfessional.categories[0],
            quantity,
            duration_days: days,
            daily_rate: dailyRate,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar profissional');
      }

      toast.success('Profissional adicionado ao projeto!');
      setShowAddModal(false);
      setSelectedProfessional(null);

      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar profissional');
    } finally {
      setAddingProfessional(null);
    }
  };

  // Remover profissional
  const handleRemove = async (memberId: string) => {
    if (!confirm('Deseja remover este profissional do projeto?')) return;

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/team/${memberId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Erro ao remover profissional');

      toast.success('Profissional removido do projeto');

      // ProjectTabsManager vai manter a aba ativa automaticamente
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao remover profissional');
    }
  };

  // Enviar convite individual
  const handleSendInvitation = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/team/${memberId}/invite`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar convite');
      }

      const result = await response.json();
      toast.success(`Convite enviado para ${result.professionalEmail}!`);

      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    }
  };

  // Enviar TODOS os convites de uma vez
  const handleSendAllInvitations = async () => {
    const pendingMembers = teamMembers.filter(
      m => m.professional && m.status !== 'confirmed' && m.status !== 'rejected' && m.status !== 'invited'
    );

    if (pendingMembers.length === 0) {
      toast.info('Não há convites pendentes para enviar');
      return;
    }

    if (!confirm(`Enviar convites para ${pendingMembers.length} profissionais?`)) return;

    try {
      setSendingInvitations(true);

      for (const member of pendingMembers) {
        await handleSendInvitation(member.id);
      }

      toast.success(`${pendingMembers.length} convites enviados com sucesso!`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Erro ao enviar alguns convites');
    } finally {
      setSendingInvitations(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DEMANDA DO CLIENTE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-red-600" />
            Demanda do Cliente ({professionalsNeeded?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {professionalsNeeded && professionalsNeeded.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {professionalsNeeded.map((need, index) => (
                <div
                  key={index}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-semibold text-white">{need.category}</p>
                  </div>
                  {need.subcategory && (
                    <p className="text-xs text-zinc-400 ml-6 mb-1">{need.subcategory}</p>
                  )}
                  <p className="text-xs text-zinc-500 ml-6">
                    Quantidade: {need.quantity}
                  </p>
                  {need.notes && (
                    <p className="text-xs text-zinc-600 ml-6 mt-1">{need.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhuma demanda específica registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. EQUIPE MONTADA */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Equipe Montada ({teamMembers.length})
            </div>
            {teamMembers.length > 0 && (
              <Button
                size="sm"
                onClick={handleSendAllInvitations}
                disabled={sendingInvitations}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sendingInvitations ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Todos os Convites
                  </>
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-white">{member.role}</p>
                      <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded">
                        {member.category}
                      </span>
                      {/* Status Badge */}
                      {member.status === 'confirmed' && (
                        <span className="text-xs bg-green-600/10 text-green-500 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmado
                        </span>
                      )}
                      {member.status === 'invited' && (
                        <span className="text-xs bg-blue-600/10 text-blue-500 px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Convite Enviado
                        </span>
                      )}
                      {member.status === 'rejected' && (
                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Recusou
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 mb-2">
                      {member.professional
                        ? member.professional.full_name
                        : member.external_name || 'Não alocado'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span>Qtd: {member.quantity} × {member.duration_days} dias</span>
                      {member.daily_rate && (
                        <span>Diária: {formatCurrency(member.daily_rate)}</span>
                      )}
                      {member.total_cost && (
                        <span className="text-green-500 font-medium">
                          Total: {formatCurrency(member.total_cost)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(member.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Total */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">
                    Total da Equipe
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    {formatCurrency(
                      teamMembers.reduce((sum, m) => sum + (m.total_cost || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhum profissional selecionado ainda
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Adicione profissionais usando as abas abaixo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. ADICIONAR PROFISSIONAIS - COM TABS */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-600" />
            Adicionar Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sugestoes" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-950 mb-6">
              <TabsTrigger
                value="sugestoes"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Sugestões ({suggestedProfessionals.length})
              </TabsTrigger>
              <TabsTrigger
                value="todos"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Todos ({filteredProfessionals.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: SUGESTÕES */}
            <TabsContent value="sugestoes" className="space-y-4">
              <p className="text-xs text-zinc-400 mb-4">
                Profissionais ordenados por compatibilidade (distância + skills + experiência)
              </p>

              {loadingSuggestions ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-red-500 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-zinc-400">Calculando sugestões...</p>
                </div>
              ) : suggestedProfessionals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {suggestedProfessionals.slice(0, 10).map((prof) => (
                    <div
                      key={prof.id}
                      className="p-4 bg-zinc-950 border border-red-900/20 rounded-lg hover:border-red-800/40 transition-all"
                    >
                      {/* Score Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          {prof.full_name}
                        </h3>
                        <div className="flex items-center gap-1 bg-red-600/20 border border-red-600/40 px-2 py-1 rounded-full">
                          <Award className="h-3 w-3 text-red-500" />
                          <span className="text-xs font-bold text-red-500">
                            {Math.round(prof.total_score)}
                          </span>
                        </div>
                      </div>

                      {/* Localização */}
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{prof.city}/{prof.state}</span>
                        <span className="text-red-500">• {prof.distance_km.toFixed(1)}km</span>
                      </div>

                      {/* Categorias */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {prof.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-xs bg-red-600/10 text-red-500 border border-red-600/20 px-2 py-0.5 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Contato */}
                      <div className="space-y-1 mb-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{prof.email}</span>
                        </div>
                        {prof.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{prof.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Botão Adicionar */}
                      <Button
                        size="sm"
                        onClick={() => openAddModal(prof)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar ao Projeto
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhuma sugestão disponível no momento
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: TODOS */}
            <TabsContent value="todos" className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nome ou email..."
                      className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm"
                  >
                    <option value="all">Todas</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Estado</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm"
                  >
                    <option value="all">Todos</option>
                    {allStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista */}
              {filteredProfessionals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredProfessionals.map((prof) => (
                    <div
                      key={prof.id}
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-white mb-2">
                        {prof.full_name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{prof.city}/{prof.state}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {prof.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-1 mb-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{prof.email}</span>
                        </div>
                        {prof.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{prof.phone}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => openAddModal(prof)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar ao Projeto
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Filter className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhum profissional encontrado com esses filtros
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* MODAL: Adicionar Profissional */}
      {showAddModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Adicionar ao Projeto
            </h3>

            <div className="mb-4">
              <p className="text-sm text-white font-medium mb-1">
                {selectedProfessional.full_name}
              </p>
              <p className="text-xs text-zinc-400">{selectedProfessional.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Função</label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Fotógrafo"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Dias</label>
                  <Input
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Diária (R$)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(parseFloat(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </div>

              {dailyRate > 0 && (
                <div className="p-3 bg-green-950/20 border border-green-900/30 rounded">
                  <p className="text-sm text-green-500 font-medium">
                    Total: {formatCurrency(quantity * days * dailyRate)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProfessional(null);
                }}
                className="flex-1 bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddToProject}
                disabled={!!addingProfessional}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {addingProfessional ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
