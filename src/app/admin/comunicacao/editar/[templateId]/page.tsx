'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Mail,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import { EmailTemplateConfig } from '@/types/email-config';

// Definição dos campos editáveis por template
const TEMPLATE_FIELDS: Record<string, { label: string; key: string; type: 'text' | 'textarea'; placeholder: string }[]> = {
  'professional-welcome': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Bem-vindo à HRX!' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Texto do Botão', key: 'cta_text', type: 'text', placeholder: 'Acessar Plataforma' },
  ],
  'simple-welcome': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Bem-vindo!' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Mensagem Principal', key: 'main_message', type: 'textarea', placeholder: 'Estamos felizes em ter você conosco!' },
  ],
  'contractor-confirmation': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Solicitação Recebida - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Texto de Confirmação', key: 'confirmation_text', type: 'textarea', placeholder: 'Recebemos sua solicitação de evento' },
  ],
  'contact-confirmation': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Contato Recebido - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Mensagem de Agradecimento', key: 'thank_you_message', type: 'textarea', placeholder: 'Obrigado por entrar em contato!' },
  ],
  'pending-documents': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Documentos Pendentes - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Mensagem de Alerta', key: 'alert_message', type: 'textarea', placeholder: 'Identificamos que você possui documentos pendentes' },
    { label: 'Texto do Botão', key: 'cta_text', type: 'text', placeholder: 'Enviar Documentos' },
  ],
  'quote-request': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Nova Solicitação de Orçamento - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Texto do Botão', key: 'cta_text', type: 'text', placeholder: 'Enviar Orçamento' },
  ],
  'quote-accepted': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Orçamento Aceito - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Parabéns' },
    { label: 'Mensagem de Confirmação', key: 'confirmation_message', type: 'textarea', placeholder: 'Seu orçamento foi aceito!' },
  ],
  'quote-rejected': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Orçamento Rejeitado - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Mensagem', key: 'message', type: 'textarea', placeholder: 'Infelizmente seu orçamento não foi aceito desta vez' },
  ],
  'admin-notification': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Notificação - HRX Admin' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá Admin' },
  ],
  'admin-request-notification': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Nova Solicitação - HRX Admin' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá Admin' },
  ],
  'urgent-quote-admin': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: '🚨 Cotação Urgente - HRX Admin' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Atenção Admin' },
    { label: 'Mensagem de Urgência', key: 'urgency_message', type: 'textarea', placeholder: 'Uma cotação urgente precisa de atenção imediata' },
  ],
  'contact-notification': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Novo Contato Recebido - HRX Admin' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá Admin' },
  ],
  'final-proposal': [
    { label: 'Assunto do Email', key: 'subject', type: 'text', placeholder: 'Proposta Final - HRX' },
    { label: 'Saudação', key: 'greeting', type: 'text', placeholder: 'Olá' },
    { label: 'Texto Botão Aceitar', key: 'accept_button', type: 'text', placeholder: 'Aceitar Proposta' },
    { label: 'Texto Botão Recusar', key: 'reject_button', type: 'text', placeholder: 'Recusar Proposta' },
  ],
};

const TEMPLATE_NAMES: Record<string, string> = {
  'professional-welcome': 'Boas-vindas Profissional',
  'simple-welcome': 'Boas-vindas Simples',
  'contractor-confirmation': 'Confirmação Contratante',
  'contact-confirmation': 'Confirmação de Contato',
  'pending-documents': 'Documentos Pendentes',
  'quote-request': 'Solicitação de Orçamento',
  'quote-accepted': 'Orçamento Aceito',
  'quote-rejected': 'Orçamento Rejeitado',
  'admin-notification': 'Notificação Admin',
  'admin-request-notification': 'Notificação de Solicitação',
  'urgent-quote-admin': 'Cotação Urgente',
  'contact-notification': 'Notificação de Contato',
  'final-proposal': 'Proposta Final',
};

export default function EditarTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [config, setConfig] = useState<EmailTemplateConfig | null>(null);
  const [templateTexts, setTemplateTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const templateName = TEMPLATE_NAMES[templateId] || templateId;
  const fields = TEMPLATE_FIELDS[templateId] || [];

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/emails/config');
        const data = await response.json();

        if (data.success) {
          setConfig(data.config);
          setTemplateTexts(data.config.template_texts?.[templateId] || {});
        }
      } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        setMessage('❌ Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [templateId]);

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setMessage('');

      // Atualizar apenas os textos deste template
      const updatedTemplateTexts = {
        ...config.template_texts,
        [templateId]: templateTexts,
      };

      const response = await fetch('/api/admin/emails/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_texts: updatedTemplateTexts,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Template atualizado com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Erro ao salvar template');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage('❌ Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setTemplateTexts({ ...templateTexts, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!fields.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/comunicacao">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Template não encontrado
            </h3>
            <p className="text-zinc-400">
              O template &quot;{templateId}&quot; não possui campos editáveis configurados.
            </p>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold text-white">Editar Template</h1>
          <p className="text-zinc-400">{templateName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              window.open(`/api/admin/emails/preview?template=${templateId}`, '_blank', 'width=800,height=600');
            }}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
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

      {/* Formulário de Edição */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Type className="h-5 w-5" />
            Textos do Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key} className="text-zinc-300">
                {field.label}
              </Label>
              {field.type === 'text' ? (
                <Input
                  id={field.key}
                  value={templateTexts[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder={field.placeholder}
                />
              ) : (
                <Textarea
                  id={field.key}
                  value={templateTexts[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder={field.placeholder}
                  rows={3}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <p className="text-sm text-blue-500">
            💡 Deixe os campos vazios para usar os textos padrão do template. As cores e informações de contato são configuradas globalmente em <strong>Configurações</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
