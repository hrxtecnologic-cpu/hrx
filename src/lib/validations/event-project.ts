import { z } from 'zod';

/**
 * Schema para criar/editar projeto de evento
 */
export const createEventProjectSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente é obrigatório'),
  client_email: z.string().email('Email inválido').optional(),
  client_phone: z.string().min(10, 'Telefone inválido').optional(),
  client_company: z.string().optional(),
  client_cnpj: z.string().optional(),
  event_name: z.string().min(2, 'Nome do evento é obrigatório'),
  event_type: z.string().min(1, 'Tipo de evento é obrigatório'),
  event_date: z.string().optional(),
  venue_address: z.string().optional(),
  venue_city: z.string().optional(),
  is_urgent: z.boolean().optional(),
  budget_range: z.string().optional(),
  client_budget: z.number().positive('Orçamento deve ser positivo').optional(),
  professionals_needed: z.array(z.object({
    category: z.string(),
    quantity: z.number().int().positive(),
  })).optional(),
  equipment_needed: z.array(z.object({
    type: z.string(),
    quantity: z.number().int().positive(),
  })).optional(),
});

/**
 * Schema para adicionar membro da equipe
 */
export const addTeamMemberSchema = z.object({
  professional_id: z.string().uuid().optional(),
  external_name: z.string().optional(),
  role: z.string().min(1, 'Função é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  quantity: z.number().int().positive('Quantidade deve ser maior que 0'),
  duration_days: z.number().int().positive('Duração deve ser maior que 0'),
  daily_rate: z.number().positive('Valor diário deve ser maior que 0'),
});

/**
 * Schema para adicionar equipamento
 */
export const addEquipmentSchema = z.object({
  name: z.string().min(1, 'Nome do equipamento é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  quantity: z.number().int().positive('Quantidade deve ser maior que 0'),
  duration_days: z.number().int().positive('Duração deve ser maior que 0'),
  specifications: z.string().optional(),
});

/**
 * Schema para solicitação pública de evento
 * Usa discriminated union baseado em request_type
 */
export const publicEventRequestSchema = z.discriminatedUnion('request_type', [
  // Schema para CLIENTE
  z.object({
    request_type: z.literal('client'),
    client_name: z.string().min(2, 'Nome é obrigatório'),
    client_email: z.string().email('Email inválido'),
    client_phone: z.string().min(10, 'Telefone inválido'),
    event_type: z.string().min(1, 'Tipo de evento é obrigatório'),
    event_date: z.string().optional(),
    event_location: z.string().optional(),
    professionals: z.array(z.object({
      category: z.string(),
      quantity: z.number().int().positive(),
    })).optional(),
    equipment: z.array(z.object({
      type: z.string(),
      quantity: z.number().int().positive(),
    })).optional(),
    is_urgent: z.boolean().optional().default(false),
  }),
  // Schema para FORNECEDOR
  z.object({
    request_type: z.literal('supplier'),
    company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
    contact_name: z.string().min(2, 'Nome do contato é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    equipment_types: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de equipamento'),
    equipment_catalog: z.array(z.any()).optional(),
    pricing: z.object({
      daily: z.number().optional(),
      weekly: z.number().optional(),
      monthly: z.number().optional(),
      discount_notes: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
  }),
]);

/**
 * Schema para atualizar metadata de usuário
 */
export const updateUserMetadataSchema = z.object({
  onboarding_completed: z.boolean().optional(),
  role: z.enum(['admin', 'professional', 'contractor', 'supplier']).optional(),
  professional_id: z.string().uuid().optional(),
  contractor_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
});
