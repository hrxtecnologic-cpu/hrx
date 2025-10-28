import { z } from 'zod';

/**
 * =====================================================
 * Schemas de Validação para APIs de Admin
 * =====================================================
 */

// ========== Categories ==========
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
});

// ========== Email Config ==========
export const emailConfigSchema = z.object({
  template_id: z.string().min(1, 'Template ID é obrigatório'),
  subject: z.string().min(1, 'Assunto é obrigatório').max(200),
  from_name: z.string().min(1, 'Nome do remetente é obrigatório').max(100),
  from_email: z.string().email('Email inválido'),
  enabled: z.boolean().default(true),
  variables: z.record(z.string()).optional(),
});

// ========== Quotations ==========
export const acceptQuotationSchema = z.object({
  quotation_id: z.string().uuid('ID de cotação inválido'),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateQuotationSchema = z.object({
  status: z.enum(['pending', 'submitted', 'accepted', 'rejected'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  notes: z.string().max(1000).optional().nullable(),
});

// ========== Team Members ==========
export const inviteTeamMemberSchema = z.object({
  professional_id: z.string().uuid('ID de profissional inválido'),
  role: z.string().min(1, 'Função é obrigatória').max(100),
  daily_rate: z.number().min(0, 'Diária deve ser positiva').optional(),
  duration_days: z.number().int().min(1, 'Duração mínima é 1 dia').optional(),
  message: z.string().max(1000).optional().nullable(),
});

export const updateTeamMemberSchema = z.object({
  role: z.string().min(1).max(100).optional(),
  daily_rate: z.number().min(0).optional(),
  duration_days: z.number().int().min(1).optional(),
  status: z.enum(['invited', 'confirmed', 'rejected', 'cancelled']).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

// ========== Equipment ==========
export const createEquipmentSchema = z.object({
  equipment_type: z.string().min(1, 'Tipo é obrigatório').max(100),
  category: z.string().min(1, 'Categoria é obrigatória').max(100),
  subcategory: z.string().max(100).optional().nullable(),
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().min(1, 'Quantidade mínima é 1'),
  duration_days: z.number().int().min(1, 'Duração mínima é 1 dia'),
  specifications: z.record(z.any()).optional(),
});

export const updateEquipmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  duration_days: z.number().int().min(1).optional(),
  daily_rate: z.number().min(0).optional(),
  status: z.enum(['pending', 'quoted', 'confirmed', 'cancelled']).optional(),
  selected_supplier_id: z.string().uuid().optional().nullable(),
  specifications: z.record(z.any()).optional(),
});

// ========== Send Proposal ==========
export const sendProposalSchema = z.object({
  recipient_email: z.string().email('Email inválido').optional(),
  include_team: z.boolean().default(true),
  include_equipment: z.boolean().default(true),
  include_pricing: z.boolean().default(true),
  custom_message: z.string().max(2000).optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
export type AcceptQuotationInput = z.infer<typeof acceptQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type SendProposalInput = z.infer<typeof sendProposalSchema>;
