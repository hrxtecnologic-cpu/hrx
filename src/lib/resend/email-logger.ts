import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LogEmailParams {
  recipientEmail: string;
  recipientType: 'professional' | 'contractor' | 'hrx' | 'admin' | 'supplier';
  subject: string;
  templateUsed: string;
  relatedId?: string;
  relatedType?: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  externalId?: string;
  sentAt?: string;
}

/**
 * Registra o envio de email na tabela email_logs
 */
export async function logEmail(params: LogEmailParams) {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: params.recipientEmail,
        recipient_type: params.recipientType,
        subject: params.subject,
        template_used: params.templateUsed,
        related_id: params.relatedId,
        related_type: params.relatedType,
        status: params.status,
        error_message: params.errorMessage,
        external_id: params.externalId,
        sent_at: params.sentAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao registrar email no log:', error);
      return { success: false, error };
    }

    console.log(`📧 Email registrado no log: ${params.templateUsed} → ${params.recipientEmail}`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro ao registrar email no log:', error);
    return { success: false, error };
  }
}

/**
 * Busca histórico de emails com filtros
 */
export async function getEmailHistory(filters?: {
  recipientEmail?: string;
  recipientType?: string;
  templateUsed?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false });

    if (filters?.recipientEmail) {
      query = query.ilike('recipient_email', `%${filters.recipientEmail}%`);
    }

    if (filters?.recipientType) {
      query = query.eq('recipient_type', filters.recipientType);
    }

    if (filters?.templateUsed) {
      query = query.eq('template_used', filters.templateUsed);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Erro ao buscar histórico de emails:', error);
      return { success: false, error };
    }

    return { success: true, data, count };
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de emails:', error);
    return { success: false, error };
  }
}

/**
 * Busca estatísticas de emails
 */
export async function getEmailStats() {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('status, template_used, recipient_type');

    if (error) {
      console.error('❌ Erro ao buscar estatísticas de emails:', error);
      return { success: false, error };
    }

    const stats = {
      total: data.length,
      sent: data.filter(e => e.status === 'sent').length,
      failed: data.filter(e => e.status === 'failed').length,
      pending: data.filter(e => e.status === 'pending').length,
      byTemplate: data.reduce((acc, email) => {
        acc[email.template_used] = (acc[email.template_used] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byRecipientType: data.reduce((acc, email) => {
        acc[email.recipient_type] = (acc[email.recipient_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return { success: true, stats };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de emails:', error);
    return { success: false, error };
  }
}
