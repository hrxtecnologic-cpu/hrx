import { z } from 'zod';

/**
 * Schema de validação para formulário de contato
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo'),

  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),

  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .max(20, 'Telefone inválido'),

  subject: z
    .string()
    .min(3, 'Assunto deve ter no mínimo 3 caracteres')
    .max(200, 'Assunto muito longo'),

  message: z
    .string()
    .min(10, 'Mensagem deve ter no mínimo 10 caracteres')
    .max(2000, 'Mensagem muito longa'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
