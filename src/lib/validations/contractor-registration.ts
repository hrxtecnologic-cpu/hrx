import { z } from 'zod';

// Regex para validação de CNPJ
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

// Regex para telefone
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

/**
 * Schema de validação para cadastro inicial de contratante
 * (Dados básicos da empresa)
 */
export const contractorRegistrationSchema = z.object({
  // Dados da empresa
  companyName: z
    .string()
    .min(3, 'Nome da empresa deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo'),

  cnpj: z
    .string()
    .regex(cnpjRegex, 'CNPJ inválido. Use o formato: 00.000.000/0000-00'),

  // Responsável
  responsibleName: z
    .string()
    .min(3, 'Nome do responsável deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo'),

  responsibleRole: z
    .string()
    .min(2, 'Cargo deve ter no mínimo 2 caracteres')
    .max(100, 'Cargo muito longo')
    .optional(),

  // Contato
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),

  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Use o formato: (00) 00000-0000'),

  // Endereço (opcional)
  companyAddress: z
    .string()
    .min(10, 'Endereço deve ter no mínimo 10 caracteres')
    .max(500, 'Endereço muito longo')
    .optional(),

  website: z
    .string()
    .url('URL inválida')
    .max(255, 'URL muito longa')
    .optional()
    .or(z.literal('')),

  // Aceite de termos
  acceptsTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
});

export type ContractorRegistrationData = z.infer<typeof contractorRegistrationSchema>;
