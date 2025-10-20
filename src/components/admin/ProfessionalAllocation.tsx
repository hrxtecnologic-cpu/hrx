'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Check, X, Send } from 'lucide-react';

interface Professional {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  categories: string[];
  status: string;
}

interface ProfessionalNeeded {
  category: string;
  quantity: number;
  shift: string;
  requirements?: string;
}

interface Allocation {
  category: string;
  shift: string;
  selectedProfessionals: string[];
}

interface Conflict {
  eventName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface Props {
  requestId: string;
  professionalsNeeded: ProfessionalNeeded[];
  currentStatus: string;
}

export function ProfessionalAllocation({ requestId, professionalsNeeded, currentStatus }: Props) {
  const [professionals, setProfessionals] = useState<Record<string, Professional[]>>({});
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingAllocations, setExistingAllocations] = useState<any>(null);
  const [conflicts, setConflicts] = useState<Record<string, Conflict>>({});

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Buscar em paralelo: alocações existentes, profissionais e conflitos
      const existingResponse = fetch(`/api/admin/requests/${requestId}/allocations`);
      const conflictsResponse = fetch(`/api/admin/requests/${requestId}/conflicts`);

      let existingData = null;
      let conflictsData = null;

      const [existingRes, conflictsRes] = await Promise.all([existingResponse, conflictsResponse]);

      if (existingRes.ok) {
        existingData = await existingRes.json();
        if (existingData && existingData.allocations) {
          setExistingAllocations(existingData);
        }
      }

      if (conflictsRes.ok) {
        conflictsData = await conflictsRes.json();
        if (conflictsData && conflictsData.conflicts) {
          console.log('🔍 Conflitos detectados:', conflictsData.conflicts);
          setConflicts(conflictsData.conflicts);
        }
      }

      // Buscar profissionais
      const categories = [...new Set(professionalsNeeded.map(p => p.category))];
      const promises = categories.map(category =>
        fetch(`/api/admin/professionals?category=${encodeURIComponent(category)}&status=approved`)
          .then(res => res.json())
      );

      const results = await Promise.all(promises);
      const profsByCategory: Record<string, Professional[]> = {};

      categories.forEach((category, index) => {
        profsByCategory[category] = results[index] || [];
      });

      setProfessionals(profsByCategory);

      // Inicializar alocações - usar existentes ou criar vazias
      if (existingData && existingData.allocations) {
        console.log('✅ Carregando alocações existentes:', existingData.allocations);
        setAllocations(existingData.allocations);
      } else {
        console.log('📝 Inicializando alocações vazias');
        const initialAllocations = professionalsNeeded.map(pn => ({
          category: pn.category,
          shift: pn.shift,
          selectedProfessionals: []
        }));
        setAllocations(initialAllocations);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar dados:', error);
      // Em caso de erro, inicializar com alocações vazias
      const initialAllocations = professionalsNeeded.map(pn => ({
        category: pn.category,
        shift: pn.shift,
        selectedProfessionals: []
      }));
      setAllocations(initialAllocations);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAllocations = async () => {
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/allocations`);
      if (response.ok) {
        const data = await response.json();
        if (data.allocations) {
          setExistingAllocations(data);
          setAllocations(data.allocations);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar alocações:', error);
    }
  };

  const toggleProfessional = (category: string, shift: string, professionalId: string, maxQuantity: number) => {
    console.log('🔄 Toggling professional:', { category, shift, professionalId, maxQuantity });

    setAllocations(prev => {
      const updated = [...prev];
      const allocationIndex = updated.findIndex(a => a.category === category && a.shift === shift);

      console.log('  Current allocations:', prev);
      console.log('  Found allocation at index:', allocationIndex);

      if (allocationIndex === -1) {
        console.log('  ❌ Allocation not found!');
        return prev;
      }

      // IMPORTANTE: Criar novo objeto allocation para o React detectar mudança
      const allocation = { ...updated[allocationIndex] };
      const isSelected = allocation.selectedProfessionals.includes(professionalId);

      console.log('  Is selected:', isSelected);
      console.log('  Current count:', allocation.selectedProfessionals.length, '/', maxQuantity);

      if (isSelected) {
        // Remover - criar novo array
        allocation.selectedProfessionals = allocation.selectedProfessionals.filter(id => id !== professionalId);
        console.log('  ✅ Professional removed');
      } else {
        // Adicionar (se não exceder o limite) - criar novo array
        if (allocation.selectedProfessionals.length < maxQuantity) {
          allocation.selectedProfessionals = [...allocation.selectedProfessionals, professionalId];
          console.log('  ✅ Professional added');
        } else {
          console.log('  ⚠️ Cannot add - limit reached');
        }
      }

      // Substituir a alocação modificada no array
      updated[allocationIndex] = allocation;

      console.log('  New allocations:', updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      });

      if (response.ok) {
        const data = await response.json();
        const message = data.allPositionsFilled
          ? '✅ Profissionais alocados com sucesso!\n\n🎉 Todas as posições foram preenchidas!\nO contratante receberá um email de confirmação.'
          : '✅ Profissionais alocados com sucesso!\n\nAgora você pode notificar os profissionais selecionados.';

        alert(message);
        await fetchExistingAllocations();
      } else {
        const errorData = await response.json();
        alert(`❌ Erro ao salvar alocações\n\n${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar alocações:', error);
      alert('❌ Erro ao salvar alocações. Verifique o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotify = async () => {
    if (!confirm('Enviar notificação para todos os profissionais selecionados?')) return;

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/notify`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Notificações enviadas com sucesso!\n\n${data.notified} profissionais notificados\n${data.emailsSent} emails enviados`);
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error}\n\n${errorData.hint || ''}`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      alert('❌ Erro ao enviar notificações. Verifique o console para mais detalhes.');
    }
  };

  if (currentStatus === 'pending') {
    return (
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500 mb-1">
                Alocação Indisponível
              </p>
              <p className="text-sm text-blue-500/70">
                Aprove esta solicitação para poder alocar profissionais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-12 text-center">
          <p className="text-zinc-500">Carregando profissionais disponíveis...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-red-600" />
            Alocar Profissionais
          </CardTitle>
          {allocations.some(a => a.selectedProfessionals.length > 0) && (
            <div className="flex gap-2">
              <Button
                onClick={handleNotify}
                size="sm"
                variant="outline"
                className="border-zinc-700"
                disabled={saving}
              >
                <Send className="h-4 w-4 mr-2" />
                Notificar Selecionados
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-red-600 hover:bg-red-500"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alocações'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {professionalsNeeded.map((needed, index) => {
          const allocation = allocations.find(a => a.category === needed.category && a.shift === needed.shift);
          const availableProfessionals = professionals[needed.category] || [];
          const selectedCount = allocation?.selectedProfessionals.length || 0;
          const isComplete = selectedCount === needed.quantity;

          return (
            <div key={index} className="border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white mb-1">{needed.category}</h3>
                  <p className="text-sm text-zinc-400">
                    Turno: {needed.shift} | Necessário: {needed.quantity}
                  </p>
                  {needed.requirements && (
                    <p className="text-xs text-zinc-500 mt-1">Requisitos: {needed.requirements}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    isComplete
                      ? 'bg-green-500/10 text-green-500'
                      : selectedCount > 0
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {selectedCount}/{needed.quantity} selecionados
                  </span>
                  {isComplete && <Check className="h-5 w-5 text-green-500" />}
                </div>
              </div>

              {availableProfessionals.length === 0 ? (
                <div className="text-center py-8 bg-zinc-800/50 rounded-lg">
                  <p className="text-sm text-zinc-500">
                    Nenhum profissional aprovado disponível nesta categoria
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableProfessionals.map(professional => {
                    const isSelected = allocation?.selectedProfessionals.includes(professional.id);
                    const hasConflict = conflicts[professional.id] !== undefined;
                    const canSelect = !hasConflict && (selectedCount < needed.quantity || isSelected);

                    return (
                      <div
                        key={professional.id}
                        className={`p-3 rounded-lg border transition ${
                          hasConflict
                            ? 'bg-orange-900/10 border-orange-600/30 cursor-not-allowed'
                            : isSelected
                            ? 'bg-red-600/10 border-red-600 cursor-pointer'
                            : canSelect
                            ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 cursor-pointer'
                            : 'bg-zinc-800/20 border-zinc-800 opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => canSelect && toggleProfessional(needed.category, needed.shift, professional.id, needed.quantity)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{professional.full_name}</p>
                            <p className="text-xs text-zinc-400">{professional.email}</p>
                            <p className="text-xs text-zinc-400">{professional.phone}</p>

                            {hasConflict && (
                              <div className="mt-2 pt-2 border-t border-orange-600/20">
                                <p className="text-xs text-orange-400 font-medium flex items-center gap-1">
                                  <X className="h-3 w-3" />
                                  Já alocado em:
                                </p>
                                <p className="text-xs text-orange-300 mt-0.5">{conflicts[professional.id].eventName}</p>
                                <p className="text-xs text-orange-400/70 mt-0.5">
                                  {new Date(conflicts[professional.id].startDate).toLocaleDateString('pt-BR')} - {conflicts[professional.id].startTime}
                                </p>
                              </div>
                            )}
                          </div>
                          {!hasConflict && (
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-red-600 border-red-600'
                                : 'border-zinc-600'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {existingAllocations && (
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Última atualização: {new Date(existingAllocations.updated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
