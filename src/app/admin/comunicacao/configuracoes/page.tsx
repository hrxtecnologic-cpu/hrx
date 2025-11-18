'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Palette,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { EmailTemplateConfig } from '@/types/email-config';

export default function ConfiguracoesEmailPage() {
  const [config, setConfig] = useState<EmailTemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/emails/config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      setMessage('❌ Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setMessage('');

      const response = await fetch('/api/admin/emails/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage('❌ Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as configurações para o padrão?')) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response = await fetch('/api/admin/emails/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        setMessage('✅ Configurações resetadas para o padrão!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Erro ao resetar configurações');
      }
    } catch (error) {
      console.error('Erro ao resetar:', error);
      setMessage('❌ Erro ao resetar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof EmailTemplateConfig, value: string | number | boolean) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Erro ao carregar configurações</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/comunicacao">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white">Configurações de Email</h1>
          <p className="text-zinc-400">Personalize cores, textos e informações dos templates</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            disabled={saving}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <Card className={message.includes('✅') ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}>
          <CardContent className="p-4">
            <p className={message.includes('✅') ? 'text-green-500' : 'text-red-500'}>{message}</p>
          </CardContent>
        </Card>
      )}

      {/* Branding */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company_name" className="text-zinc-300">Nome da Empresa</Label>
            <Input
              id="company_name"
              value={config.company_name}
              onChange={(e) => updateConfig('company_name', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="HRX Tecnologia"
            />
          </div>
          <div>
            <Label htmlFor="company_logo_url" className="text-zinc-300">URL do Logo</Label>
            <Input
              id="company_logo_url"
              value={config.company_logo_url || ''}
              onChange={(e) => updateConfig('company_logo_url', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-zinc-500 mt-1">Deixe vazio para usar o nome da empresa</p>
          </div>
        </CardContent>
      </Card>

      {/* Cores do Tema */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores do Tema
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary_color" className="text-zinc-300">Cor Primária</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={config.primary_color}
                onChange={(e) => updateConfig('primary_color', e.target.value)}
                className="w-20 h-10 bg-zinc-800 border-zinc-700"
              />
              <Input
                value={config.primary_color}
                onChange={(e) => updateConfig('primary_color', e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                placeholder="#DC2626"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondary_color" className="text-zinc-300">Cor Secundária</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                value={config.secondary_color}
                onChange={(e) => updateConfig('secondary_color', e.target.value)}
                className="w-20 h-10 bg-zinc-800 border-zinc-700"
              />
              <Input
                value={config.secondary_color}
                onChange={(e) => updateConfig('secondary_color', e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                placeholder="#EF4444"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="background_color" className="text-zinc-300">Cor de Fundo</Label>
            <div className="flex gap-2">
              <Input
                id="background_color"
                type="color"
                value={config.background_color}
                onChange={(e) => updateConfig('background_color', e.target.value)}
                className="w-20 h-10 bg-zinc-800 border-zinc-700"
              />
              <Input
                value={config.background_color}
                onChange={(e) => updateConfig('background_color', e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                placeholder="#f9fafb"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="text_color" className="text-zinc-300">Cor do Texto</Label>
            <div className="flex gap-2">
              <Input
                id="text_color"
                type="color"
                value={config.text_color}
                onChange={(e) => updateConfig('text_color', e.target.value)}
                className="w-20 h-10 bg-zinc-800 border-zinc-700"
              />
              <Input
                value={config.text_color}
                onChange={(e) => updateConfig('text_color', e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                placeholder="#1a1a1a"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_email" className="text-zinc-300 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de Contato
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={config.contact_email}
              onChange={(e) => updateConfig('contact_email', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="contato@hrxeventos.com.br"
            />
          </div>
          <div>
            <Label htmlFor="contact_phone" className="text-zinc-300">Telefone</Label>
            <Input
              id="contact_phone"
              value={config.contact_phone}
              onChange={(e) => updateConfig('contact_phone', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="contact_whatsapp" className="text-zinc-300">WhatsApp (com DDI)</Label>
            <Input
              id="contact_whatsapp"
              value={config.contact_whatsapp}
              onChange={(e) => updateConfig('contact_whatsapp', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="5511999999999"
            />
          </div>
          <div>
            <Label htmlFor="contact_website" className="text-zinc-300 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="contact_website"
              type="url"
              value={config.contact_website}
              onChange={(e) => updateConfig('contact_website', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="https://hrxeventos.com.br"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="contact_address" className="text-zinc-300">Endereço</Label>
            <Input
              id="contact_address"
              value={config.contact_address || ''}
              onChange={(e) => updateConfig('contact_address', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Av. Paulista, 1000 - São Paulo/SP"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rodapé */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Rodapé dos Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="footer_text" className="text-zinc-300">Texto do Rodapé</Label>
            <Textarea
              id="footer_text"
              value={config.footer_text}
              onChange={(e) => updateConfig('footer_text', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="HRX Tecnologia - Conectando profissionais a eventos"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <p className="text-sm text-blue-500">
            💡 As alterações serão aplicadas a todos os novos emails enviados. Os templates existentes não serão afetados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
