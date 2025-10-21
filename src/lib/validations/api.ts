/**
 * Validações Zod para APIs
 *
 * Centraliza todas as validações de input para garantir type safety e segurança
 */

import { z } from 'zod';

/**
 * Schema para upload de documentos
 */
export const uploadDocumentSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Arquivo muito grande (máx 10MB)')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Tipo de arquivo não permitido'
    ),
  documentType: z.enum([
    'rg_front',
    'rg_back',
    'cpf',
    'proof_of_address',
    'cnh_photo',
    'nr10',
    'nr35',
    'drt',
    'cnv',
    'portfolio'
  ]),
});

/**
 * Schema para atualização de role de usuário
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'professional', 'contractor']).nullable(),
});

/**
 * Schema para validação de documento individual
 */
export const documentValidationSchema = z.object({
  document_type: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']),
  rejection_reason: z.string().optional(),
});

/**
 * Schema para edição de dados do profissional pelo admin
 */
export const editProfessionalSchema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  cep: z.string().optional(),
});

/**
 * Schema para criação de solicitação de contratante
 */
export const contractorRequestSchema = z.object({
  company_name: z.string().min(3, 'Nome da empresa muito curto'),
  cnpj: z.string().optional(),
  responsible_name: z.string().min(3, 'Nome do responsável muito curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  event_name: z.string().min(3, 'Nome do evento muito curto'),
  event_type: z.string().min(1, 'Tipo de evento obrigatório'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  venue_address: z.string().min(5, 'Endereço muito curto'),
  venue_city: z.string().min(2, 'Cidade inválida'),
  venue_state: z.string().length(2, 'Estado inválido'),
  professionals_needed: z.record(z.number().int().positive()).optional(),
});

/**
 * Helper para validação segura de dados
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Dados inválidos',
      };
    }
    return { success: false, error: 'Erro na validação' };
  }
}
