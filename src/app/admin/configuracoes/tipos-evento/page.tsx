'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EventType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function TiposEventoPage() {
  const router = useRouter();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const response = await fetch('/api/admin/event-types');
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingEventType
        ? `/api/admin/event-types/${editingEventType.id}`
        : '/api/admin/event-types';

      const method = editingEventType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchEventTypes();
        setIsDialogOpen(false);
        setFormData({ name: '', description: '' });
        setEditingEventType(null);
      } else {
        alert('Erro ao salvar tipo de evento');
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de evento:', error);
      alert('Erro ao salvar tipo de evento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType);
    setFormData({ name: eventType.name, description: eventType.description || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de evento?')) return;

    try {
      const response = await fetch(`/api/admin/event-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEventTypes();
      } else {
        alert('Erro ao excluir tipo de evento');
      }
    } catch (error) {
      console.error('Erro ao excluir tipo de evento:', error);
      alert('Erro ao excluir tipo de evento');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEventType(null);
    setFormData({ name: '', description: '' });
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
          <h1 className="text-3xl font-bold text-white mb-2">Tipos de Evento</h1>
          <p className="text-zinc-400">Configurar tipos de eventos disponíveis</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingEventType ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Nome do Tipo *</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Casamento, Festa Corporativa, Show..."
                  required
                />
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Descrição (opcional)</Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white h-11"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do tipo de evento"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  className="flex-1 border-zinc-700"
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : editingEventType ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Types List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Tipos Cadastrados ({eventTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-zinc-500 text-center py-8">Carregando tipos de evento...</p>
          ) : eventTypes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum tipo de evento cadastrado
              </h3>
              <p className="text-zinc-400 mb-6">
                Comece criando seu primeiro tipo de evento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventTypes.map((eventType) => (
                <div
                  key={eventType.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                >
                  <div>
                    <h4 className="font-medium text-white mb-1">{eventType.name}</h4>
                    {eventType.description && (
                      <p className="text-sm text-zinc-400">{eventType.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(eventType)}
                      className="border-zinc-700"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(eventType.id)}
                      className="border-zinc-700 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
