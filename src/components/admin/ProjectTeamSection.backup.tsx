/**
 * Project Team Section - Nova UX
 *
 * Exibe profissionais no projeto + lista de profissionais disponíveis
 * Com advanced search integrado + Sugestões Inteligentes
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Phone,
  Mail,
  Star,
  Search,
  Calendar,
  MapPin,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  Target
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
  score_breakdown: {
    distance_km: number;
    categories_match: number;
    categories_required: number;
    has_availability: boolean;
    weights: {
      distance: string;
      category: string;
      experience: string;
      availability: string;
      performance: string;
    };
  };
  has_experience: boolean;
  years_of_experience: string;
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
  status?: 'planned' | 'invited' | 'confirmed' | 'rejected' | 'allocated' | 'working' | 'completed' | 'cancelled';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [addingProfessional, setAddingProfessional] = useState<string | null>(null);
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);

  // Sugestões Inteligentes
  const [suggestedProfessionals, setSuggestedProfessionals] = useState<SuggestedProfessional[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Dados do formulário inline
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

  // Extrair categorias únicas
  const allCategories = Array.from(
    new Set(availableProfessionals.flatMap((p) => p.categories))
  ).sort();

  // Extrair estados únicos
  const allStates = Array.from(
    new Set(availableProfessionals.map((p) => p.state).filter(Boolean))
  ).sort();

  // DEBUG: Log para verificar dados
  console.log('[ProjectTeamSection] availableProfessionals:', availableProfessionals?.length);
  console.log('[ProjectTeamSection] teamMembers:', teamMembers?.length);

  // Carregar sugestões inteligentes
  useEffect(() => {
    loadSuggestions();
  }, [projectId]);

  async function loadSuggestions() {
    try {
      setLoadingSuggestions(true);

      // Extrair categorias da demanda do cliente
      const requiredCategories = professionalsNeeded?.map(need => need.category).filter(Boolean) || [];

      const params = new URLSearchParams();
      if (requiredCategories.length > 0) {
        params.append('categories', requiredCategories.join(','));
      }
      params.append('max_distance', '100'); // 100km
      params.append('min_score', '40'); // Score mínimo 40
      params.append('limit', '10'); // Top 10

      const response = await fetch(`/api/admin/event-projects/${projectId}/suggested-professionals?${params}`);

      if (response.ok) {
        const result = await response.json();
        setSuggestedProfessionals(result.data?.professionals || []);
      } else {
        // Não é erro crítico, apenas não mostra sugestões
        console.warn('Sugestões não disponíveis:', await response.text());
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Filtrar profissionais
  const filteredProfessionals = availableProfessionals.filter((prof) => {
    const matchesSearch =
      prof.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || prof.categories.includes(selectedCategory);

    const matchesState =
      selectedState === 'all' || prof.state === selectedState;

    // Não mostrar profissionais já no projeto
    const alreadyInProject = teamMembers.some(
      (member) => member.professional?.id === prof.id
    );

    return matchesSearch && matchesCategory && matchesState && !alreadyInProject;
  });

  console.log('[ProjectTeamSection] filteredProfessionals:', filteredProfessionals?.length);

  // Adicionar profissional ao projeto
  const handleAddToProject = async (professionalId: string) => {
    // Encontrar o profissional selecionado
    const professional = availableProfessionals.find(p => p.id === professionalId);
    if (!professional) {
      toast.error('Profissional não encontrado');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/team`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_id: professionalId,
            role: professional.categories[0], // Usa a primeira categoria como função
            category: professional.categories[0],
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

      // Resetar form
      setAddingProfessional(null);
      setRole('');
      setQuantity(1);
      setDays(1);
      setDailyRate(0);

      // Reload page
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar profissional');
      console.error('Erro:', error);
    }
  };

  // Remover profissional do projeto
  const handleRemove = async (memberId: string) => {
    if (!confirm('Deseja remover este profissional do projeto?')) return;

    try {
      const response = await fetch(
        `/api/admin/event-projects/${projectId}/team/${memberId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Erro ao remover profissional');

      toast.success('Profissional removido do projeto');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao remover profissional');
      console.error('Erro:', error);
    }
  };

  // Enviar convite para profissional
  const handleSendInvitation = async (memberId: string) => {
    try {
      setSendingInvitation(memberId);

      const response = await fetch(
        `/api/admin/event-projects/${projectId}/team/${memberId}/invite`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar convite');
      }

      const result = await response.json();

      toast.success(`Convite enviado com sucesso para ${result.professionalEmail || 'o profissional'}!`);

      // Reload to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
      console.error('Erro:', error);
    } finally {
      setSendingInvitation(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Demanda do Cliente */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-red-600" />
            Demanda do Cliente ({professionalsNeeded?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {professionalsNeeded && professionalsNeeded.length > 0 ? (
            <div className="space-y-3">
              {professionalsNeeded.map((need, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-semibold text-white">{need.category}</p>
                      {need.subcategory && (
                        <span className="text-xs bg-red-600/10 text-red-500 px-2 py-1 rounded">
                          {need.subcategory}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 ml-6 text-xs text-zinc-500">
                      <span>Quantidade: {need.quantity}</span>
                      {need.notes && <span>Obs: {need.notes}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Nenhuma demanda específica registrada pelo cliente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 2: Equipe Selecionada por HRX */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Equipe Selecionada por HRX ({teamMembers.length})
            </div>
            {teamMembers.length > 0 && (
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  toast.info('Funcionalidade em desenvolvimento: Enviar emails de confirmação');
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Confirmação
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
                  className="flex items-start justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-red-600" />
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
                    <p className="text-sm text-zinc-300 ml-6 mb-2">
                      {member.professional
                        ? member.professional.full_name
                        : member.external_name || 'Não alocado'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 ml-6 text-xs text-zinc-500">
                      <span>
                        Qtd: {member.quantity} × {member.duration_days} dias
                      </span>
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
                  <div className="flex gap-2 ml-4">
                    {/* Send Invitation Button */}
                    {member.professional && member.status !== 'confirmed' && member.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendInvitation(member.id)}
                        disabled={sendingInvitation === member.id}
                        className="h-8 px-3 text-xs border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white"
                      >
                        {sendingInvitation === member.id ? (
                          <Clock className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            Enviar Convite
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(member.id)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total da equipe */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
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
                Selecione profissionais disponíveis abaixo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 3: Sugestões Inteligentes */}
      {showSuggestions && suggestedProfessionals.length > 0 && (
        <Card className="bg-gradient-to-br from-red-950/20 to-zinc-900 border-red-900/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-500" />
                Sugestões Inteligentes ({suggestedProfessionals.length})
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSuggestions(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Ocultar
              </Button>
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              Profissionais mais compatíveis baseado em distância, categoria, experiência e disponibilidade
            </p>
          </CardHeader>
          <CardContent>
            {loadingSuggestions ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-red-500 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-zinc-400">Calculando sugestões...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {suggestedProfessionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-4 bg-zinc-950/50 border border-red-900/20 rounded-lg hover:border-red-800/40 transition-colors relative overflow-hidden"
                  >
                    {/* Score Badge - Top Right */}
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 bg-red-600/20 border border-red-600/40 px-3 py-1 rounded-full">
                        <Award className="h-3 w-3 text-red-500" />
                        <span className="text-xs font-bold text-red-500">
                          {Math.round(prof.total_score)}
                        </span>
                      </div>
                    </div>

                    {/* Header do card */}
                    <div className="mb-3 pr-16">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {prof.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <MapPin className="h-3 w-3" />
                        <span>{prof.city}/{prof.state}</span>
                        <span className="text-red-500">• {prof.distance_km.toFixed(1)}km</span>
                      </div>
                    </div>

                    {/* Score Breakdown - Mini Bars */}
                    <div className="space-y-2 mb-3">
                      {[
                        { label: 'Distância', value: prof.distance_score, max: 25, icon: MapPin },
                        { label: 'Categoria', value: prof.category_score, max: 30, icon: Target },
                        { label: 'Experiência', value: prof.experience_score, max: 20, icon: Briefcase },
                        { label: 'Disponibilidade', value: prof.availability_score, max: 15, icon: Calendar },
                        { label: 'Avaliações', value: prof.performance_score, max: 10, icon: Star },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <item.icon className="h-3 w-3 text-zinc-600" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-zinc-500">{item.label}</span>
                              <span className="text-xs text-zinc-400 font-medium">
                                {Math.round(item.value)}/{item.max}
                              </span>
                            </div>
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all"
                                style={{ width: `${(item.value / item.max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Categorias */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {prof.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-red-600/10 text-red-500 border border-red-600/20 px-2 py-1 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                      {prof.categories.length > 2 && (
                        <span className="text-xs text-zinc-600">
                          +{prof.categories.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Contato */}
                    <div className="space-y-1 mb-3 text-xs">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{prof.email}</span>
                      </div>
                      {prof.phone && (
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Phone className="h-3 w-3" />
                          <span>{prof.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Formulário inline (quando expandido) */}
                    {addingProfessional === prof.id ? (
                      <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                        <div className="text-xs text-zinc-400 mb-2">
                          Categoria: <span className="text-white font-medium">{prof.categories[0]}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Qtd</label>
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className="bg-zinc-900 border-zinc-700 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Dias</label>
                            <Input
                              type="number"
                              min="1"
                              value={days}
                              onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                              className="bg-zinc-900 border-zinc-700 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Diária</label>
                            <Input
                              type="number"
                              min="0"
                              step="50"
                              value={dailyRate}
                              onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                              className="bg-zinc-900 border-zinc-700 text-white text-sm"
                            />
                          </div>
                        </div>
                        {dailyRate > 0 && (
                          <div className="text-xs text-zinc-500">
                            Total: {formatCurrency(quantity * days * dailyRate)}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddToProject(prof.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingProfessional(null);
                              setRole('');
                              setQuantity(1);
                              setDays(1);
                              setDailyRate(0);
                            }}
                            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setAddingProfessional(prof.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar ao Projeto
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção 4: Busca e Filtros */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-red-600" />
            Buscar Profissionais Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search bar */}
            <div className="relative md:col-span-2 lg:col-span-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-red-600 focus:ring-red-600/20"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none"
            >
              <option value="all">Todas as categorias</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Subcategory filter - Placeholder for future implementation */}
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-600 text-sm cursor-not-allowed opacity-50"
              disabled
            >
              <option value="all">Subcategoria (em breve)</option>
            </select>

            {/* State filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none md:col-span-2 lg:col-span-2"
            >
              <option value="all">Todos os estados</option>
              {allStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <Calendar className="h-3 w-3" />
            <span>Mostrando profissionais disponíveis para: {new Date(projectDate).toLocaleDateString('pt-BR')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Seção 5: Lista de Profissionais Disponíveis */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Profissionais Disponíveis ({filteredProfessionals.length})
            </div>
            {selectedCategory !== 'all' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Limpar filtros
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfessionals.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProfessionals.map((prof) => (
                <div
                  key={prof.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {prof.full_name}
                      </h3>
                    </div>
                  </div>

                  {/* Categorias */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {prof.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                    {prof.categories.length > 3 && (
                      <span className="text-xs text-zinc-600">
                        +{prof.categories.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Contato */}
                  <div className="space-y-1 mb-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{prof.email}</span>
                    </div>
                    {prof.phone && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Phone className="h-3 w-3" />
                        <span>{prof.phone}</span>
                      </div>
                    )}
                    {prof.city && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <MapPin className="h-3 w-3" />
                        <span>{prof.city}/{prof.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Formulário inline (quando expandido) */}
                  {addingProfessional === prof.id ? (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                      <div className="text-xs text-zinc-400 mb-2">
                        Categoria: <span className="text-white font-medium">{prof.categories[0]}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Qtd</label>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="bg-zinc-900 border-zinc-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Dias</label>
                          <Input
                            type="number"
                            min="1"
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                            className="bg-zinc-900 border-zinc-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Diária</label>
                          <Input
                            type="number"
                            min="0"
                            step="50"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                            className="bg-zinc-900 border-zinc-700 text-white text-sm"
                          />
                        </div>
                      </div>
                      {dailyRate > 0 && (
                        <div className="text-xs text-zinc-500">
                          Total: {formatCurrency(quantity * days * dailyRate)}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddToProject(prof.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAddingProfessional(null);
                            setRole('');
                            setQuantity(1);
                            setDays(1);
                            setDailyRate(0);
                          }}
                          className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setAddingProfessional(prof.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar ao Projeto
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Nenhum profissional encontrado com esses filtros'
                  : 'Nenhum profissional disponível'}
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="mt-3 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
