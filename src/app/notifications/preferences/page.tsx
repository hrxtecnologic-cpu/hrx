/**
 * =====================================================
 * PAGE: Preferencias de Notificacoes
 * =====================================================
 * Configuracoes de notificacoes por tipo e canal
 * =====================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Bell, Mail, Smartphone, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { NotificationPreferences } from '@/types/notification';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);

      const response = await fetch('/api/notifications/preferences');

      if (response.ok) {
        const result = await response.json();
        setPreferences(result.data);
      } else {
        toast.error('Erro ao carregar preferencias');
      }
    } catch (error) {
      console.error('Erro ao carregar preferencias:', error);
      toast.error('Erro ao carregar preferencias');
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    if (!preferences) return;

    try {
      setSaving(true);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Preferencias salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar preferencias');
      }
    } catch (error) {
      console.error('Erro ao salvar preferencias:', error);
      toast.error('Erro ao salvar preferencias');
    } finally {
      setSaving(false);
    }
  }

  function updatePreference<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) {
    setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando preferencias...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Erro ao carregar preferencias</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/notifications">
              <Button variant="ghost" className="mb-4 text-zinc-400 hover:text-white -ml-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Notificacoes
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              Preferencias de Notificacoes
            </h1>
            <p className="text-zinc-400">
              Configure como voce deseja receber notificacoes
            </p>
          </div>

          <Button
            onClick={savePreferences}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alteracoes
              </>
            )}
          </Button>
        </div>

        {/* Canais de Notificacao */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600" />
              Canais de Notificacao
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Escolha como voce deseja receber as notificacoes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="text-white">Notificacoes por Email</Label>
                  <p className="text-xs text-zinc-500">
                    Receba notificacoes importantes por email
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
              />
            </div>

            {/* Push */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="text-white">Notificacoes Push (No Navegador)</Label>
                  <p className="text-xs text-zinc-500">
                    Receba alertas em tempo real no navegador
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
              />
            </div>

            {/* Frequencia */}
            <div className="border-t border-zinc-800 pt-6">
              <Label className="text-white mb-2 block">Frequencia de Notificacoes</Label>
              <Select
                value={preferences.digest_frequency}
                onValueChange={(value: any) => updatePreference('digest_frequency', value)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="instant" className="text-white">
                    Instantaneas (Receber imediatamente)
                  </SelectItem>
                  <SelectItem value="hourly" className="text-white">
                    A cada hora (Resumo horario)
                  </SelectItem>
                  <SelectItem value="daily" className="text-white">
                    Diarias (Resumo diario)
                  </SelectItem>
                  <SelectItem value="weekly" className="text-white">
                    Semanais (Resumo semanal)
                  </SelectItem>
                  <SelectItem value="never" className="text-white">
                    Nunca (Desativar todas)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 mt-2">
                Escolha com que frequencia voce deseja receber notificacoes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Notificacao */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Tipos de Notificacao</CardTitle>
            <CardDescription className="text-zinc-400">
              Escolha quais tipos de notificacoes voce deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Atualizacoes de Projeto */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <Label className="text-white">Atualizacoes de Projetos</Label>
                <p className="text-xs text-zinc-500">
                  Status de projeto mudou, etapas concluidas, etc
                </p>
              </div>
              <Switch
                checked={preferences.notify_project_updates}
                onCheckedChange={(checked) => updatePreference('notify_project_updates', checked)}
              />
            </div>

            {/* Convites */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <Label className="text-white">Convites para Projetos</Label>
                <p className="text-xs text-zinc-500">
                  Quando voce for convidado ou responderem seu convite
                </p>
              </div>
              <Switch
                checked={preferences.notify_invitations}
                onCheckedChange={(checked) => updatePreference('notify_invitations', checked)}
              />
            </div>

            {/* Cotacoes */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <Label className="text-white">Cotacoes</Label>
                <p className="text-xs text-zinc-500">
                  Novas cotacoes recebidas ou aceitas
                </p>
              </div>
              <Switch
                checked={preferences.notify_quotations}
                onCheckedChange={(checked) => updatePreference('notify_quotations', checked)}
              />
            </div>

            {/* Documentos */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <Label className="text-white">Documentos</Label>
                <p className="text-xs text-zinc-500">
                  Documentos aprovados, rejeitados ou vencendo
                </p>
              </div>
              <Switch
                checked={preferences.notify_documents}
                onCheckedChange={(checked) => updatePreference('notify_documents', checked)}
              />
            </div>

            {/* Pagamentos */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <Label className="text-white">Pagamentos</Label>
                <p className="text-xs text-zinc-500">
                  Pagamentos recebidos ou pendentes
                </p>
              </div>
              <Switch
                checked={preferences.notify_payments}
                onCheckedChange={(checked) => updatePreference('notify_payments', checked)}
              />
            </div>

            {/* Lembretes */}
            <div className="flex items-center justify-between py-3">
              <div>
                <Label className="text-white">Lembretes</Label>
                <p className="text-xs text-zinc-500">
                  Lembretes de eventos e prazos importantes
                </p>
              </div>
              <Switch
                checked={preferences.notify_reminders}
                onCheckedChange={(checked) => updatePreference('notify_reminders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Salvar novamente no rodape */}
        <div className="flex justify-end gap-3">
          <Link href="/notifications">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={savePreferences}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alteracoes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
