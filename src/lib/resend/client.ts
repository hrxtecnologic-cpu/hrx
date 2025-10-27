import { Resend } from 'resend';

// Inicializar Resend conforme documentação oficial
export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
export const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL || 'atendimento@hrxeventos.com.br';
