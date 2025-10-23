/**
 * Tipos para configuração de templates de email
 */

export interface TemplateText {
  subject?: string;
  greeting?: string;
  cta_text?: string;
  confirmation_text?: string;
  accept_button?: string;
  reject_button?: string;
  [key: string]: string | undefined;
}

export interface EmailTemplateConfig {
  id: string;
  created_at: string;
  updated_at: string;

  // Branding
  company_name: string;
  company_logo_url?: string;

  // Cores
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;

  // Contato
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_website: string;
  contact_address?: string;

  // Redes sociais
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;

  // Textos por template
  template_texts: {
    [templateId: string]: TemplateText;
  };

  // Configurações adicionais
  footer_text: string;
  show_social_links: boolean;
  show_contact_info: boolean;
  is_active: boolean;
}

export interface EmailTemplateConfigUpdate {
  company_name?: string;
  company_logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_website?: string;
  contact_address?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
  template_texts?: {
    [templateId: string]: TemplateText;
  };
  footer_text?: string;
  show_social_links?: boolean;
  show_contact_info?: boolean;
}

// Configuração padrão
export const DEFAULT_EMAIL_CONFIG: Omit<EmailTemplateConfig, 'id' | 'created_at' | 'updated_at' | 'is_active'> = {
  company_name: 'HRX Tecnologia',
  company_logo_url: undefined,
  primary_color: '#DC2626',
  secondary_color: '#EF4444',
  background_color: '#f9fafb',
  text_color: '#1a1a1a',
  contact_email: 'contato@hrxeventos.com.br',
  contact_phone: '(11) 99999-9999',
  contact_whatsapp: '5511999999999',
  contact_website: 'https://hrxeventos.com.br',
  contact_address: undefined,
  social_instagram: undefined,
  social_facebook: undefined,
  social_linkedin: undefined,
  template_texts: {},
  footer_text: 'HRX Tecnologia - Conectando profissionais a eventos',
  show_social_links: true,
  show_contact_info: true,
};
