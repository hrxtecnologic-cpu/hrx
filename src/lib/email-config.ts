import { createClient } from '@supabase/supabase-js';
import { EmailTemplateConfig, DEFAULT_EMAIL_CONFIG } from '@/types/email-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Busca a configuração ativa de templates de email
 * Retorna configuração padrão se nenhuma estiver ativa
 */
export async function getActiveEmailConfig(): Promise<EmailTemplateConfig> {
  try {
    const { data, error } = await supabase
      .from('email_template_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn('⚠️ Nenhuma configuração ativa encontrada, usando padrão');
      return {
        ...DEFAULT_EMAIL_CONFIG,
        id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };
    }

    return data as EmailTemplateConfig;
  } catch (error) {
    console.error('❌ Erro ao buscar configuração de email:', error);
    return {
      ...DEFAULT_EMAIL_CONFIG,
      id: 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };
  }
}

/**
 * Busca textos customizados para um template específico
 */
export async function getTemplateTexts(templateId: string) {
  const config = await getActiveEmailConfig();
  return config.template_texts[templateId] || {};
}

/**
 * Busca informações de contato da configuração ativa
 */
export async function getContactInfo() {
  const config = await getActiveEmailConfig();
  return {
    email: config.contact_email,
    phone: config.contact_phone,
    whatsapp: config.contact_whatsapp,
    website: config.contact_website,
    address: config.contact_address,
  };
}

/**
 * Busca cores do tema da configuração ativa
 */
export async function getThemeColors() {
  const config = await getActiveEmailConfig();
  return {
    primary: config.primary_color,
    secondary: config.secondary_color,
    background: config.background_color,
    text: config.text_color,
  };
}
