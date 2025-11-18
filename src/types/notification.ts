/**
 * =====================================================
 * TYPES: Sistema de Notificações
 * =====================================================
 */

// =====================================================
// Notification Types
// =====================================================

export type NotificationType =
  | 'project_created'
  | 'project_status_changed'
  | 'invitation_received'
  | 'invitation_accepted'
  | 'invitation_rejected'
  | 'quotation_received'
  | 'quotation_accepted'
  | 'document_approved'
  | 'document_rejected'
  | 'document_expiring'
  | 'team_incomplete'
  | 'proposal_sent'
  | 'payment_received'
  | 'event_reminder'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type UserType = 'admin' | 'professional' | 'supplier' | 'client';

// Notification metadata - flexible structure for additional data
export interface NotificationMetadata {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export interface Notification {
  id: string;
  user_id: string;
  user_type: UserType;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  project_id?: string;
  professional_id?: string;
  supplier_id?: string;
  is_read: boolean;
  read_at?: string;
  priority: NotificationPriority;
  created_at: string;
  expires_at?: string;
  metadata: NotificationMetadata;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  notify_project_updates: boolean;
  notify_invitations: boolean;
  notify_quotations: boolean;
  notify_documents: boolean;
  notify_payments: boolean;
  notify_reminders: boolean;
  digest_frequency: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never';
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  user_id: string;
  user_type: UserType;
  total_notifications: number;
  unread_count: number;
  urgent_count: number;
  high_count: number;
  last_notification_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  user_type: UserType;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  project_id?: string;
  professional_id?: string;
  supplier_id?: string;
  priority?: NotificationPriority;
  metadata?: NotificationMetadata;
}

// =====================================================
// Helper Constants
// =====================================================

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  project_created: 'Novo Projeto',
  project_status_changed: 'Status Alterado',
  invitation_received: 'Convite Recebido',
  invitation_accepted: 'Convite Aceito',
  invitation_rejected: 'Convite Recusado',
  quotation_received: 'Cotação Recebida',
  quotation_accepted: 'Cotação Aceita',
  document_approved: 'Documento Aprovado',
  document_rejected: 'Documento Rejeitado',
  document_expiring: 'Documento Vencendo',
  team_incomplete: 'Equipe Incompleta',
  proposal_sent: 'Proposta Enviada',
  payment_received: 'Pagamento Recebido',
  event_reminder: 'Lembrete de Evento',
  system_alert: 'Alerta do Sistema',
};

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};

// =====================================================
// Helper Functions
// =====================================================

export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    project_created: '📋',
    project_status_changed: '🔄',
    invitation_received: '✉️',
    invitation_accepted: '✅',
    invitation_rejected: '❌',
    quotation_received: '💰',
    quotation_accepted: '💸',
    document_approved: '📄',
    document_rejected: '🚫',
    document_expiring: '⚠️',
    team_incomplete: '👥',
    proposal_sent: '📤',
    payment_received: '💵',
    event_reminder: '🔔',
    system_alert: '⚡',
  };
  return icons[type] || '🔔';
}

export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(created);
}
