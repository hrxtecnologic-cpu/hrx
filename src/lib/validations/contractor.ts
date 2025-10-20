import { z } from 'zod';

// Validações customizadas
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

// Tipos de eventos
export const EVENT_TYPES = [
  'Feira',
  'Convenção',
  'Congresso',
  'Show/Festival',
  'Evento Corporativo',
  'Formatura',
  'Casamento',
  'Esportivo',
  'Outro',
] as const;

// Categorias de profissionais (mesmas do cadastro)
export const PROFESSIONAL_CATEGORIES = [
  'Segurança',
  'Bombeiro/Brigadista',
  'Socorrista',
  'Enfermagem',
  'Logística/Staff',
  'Limpeza',
  'Barman',
  'Barback',
  'Hospitalidade',
  'Técnico/Audiovisual',
  'Motorista',
  'Operador de Empilhadeira',
  'Eletricista',
  'Cozinheiro',
  'Garçom',
] as const;

// Equipamentos disponíveis
export const EQUIPMENT_OPTIONS = [
  'Ambulância',
  'Ambulatório',
  'Gerador',
  'Extintores',
  'Grades/Barreiras',
  'Tendas',
  'Rádios de Comunicação',
  'Outros',
] as const;

// Faixas de orçamento
export const BUDGET_RANGES = [
  'Até R$ 5.000',
  'R$ 5.000 - R$ 10.000',
  'R$ 10.000 - R$ 20.000',
  'R$ 20.000 - R$ 50.000',
  'Acima de R$ 50.000',
] as const;

// Níveis de urgência
export const URGENCY_LEVELS = ['normal', 'urgent', 'very_urgent'] as const;

// Schema para categoria de profissional solicitada
export const professionalNeedSchema = z.object({
  category: z.enum(PROFESSIONAL_CATEGORIES, {
    required_error: 'Selecione uma categoria',
  }),
  quantity: z.coerce
    .number()
    .min(1, 'Quantidade deve ser no mínimo 1')
    .max(1000, 'Quantidade muito alta'),
  shift: z.string().min(3, 'Informe o turno/horário'),
  requirements: z.string().optional(),
});

// Schema principal de solicitação de equipe
export const requestSchema = z.object({
  // Dados da Empresa
  companyName: z
    .string()
    .min(3, 'Nome da empresa deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo'),

  cnpj: z
    .string()
    .regex(cnpjRegex, 'CNPJ inválido. Formato: 00.000.000/0000-00'),

  responsibleName: z
    .string()
    .min(3, 'Nome do responsável é obrigatório')
    .max(255, 'Nome muito longo'),

  responsibleRole: z
    .string()
    .max(100, 'Cargo muito longo')
    .optional(),

  email: z
    .string()
    .email('Email inválido'),

  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Formato: (00) 00000-0000'),

  companyAddress: z
    .string()
    .max(500, 'Endereço muito longo')
    .optional(),

  website: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),

  // Dados do Evento
  eventName: z
    .string()
    .min(3, 'Nome do evento deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo'),

  eventType: z.enum(EVENT_TYPES, {
    required_error: 'Selecione o tipo de evento',
  }),

  eventTypeOther: z
    .string()
    .max(100)
    .optional(),

  eventDescription: z
    .string()
    .max(2000, 'Descrição muito longa')
    .optional(),

  // Local do Evento
  venueName: z
    .string()
    .max(255, 'Nome do local muito longo')
    .optional(),

  venueAddress: z
    .string()
    .min(10, 'Endereço do local é obrigatório')
    .max(500, 'Endereço muito longo'),

  venueCity: z
    .string()
    .min(2, 'Cidade é obrigatória')
    .max(100, 'Nome da cidade muito longo'),

  venueState: z
    .string()
    .length(2, 'Estado deve ter 2 letras (ex: RJ)'),

  // Datas e Horários
  startDate: z
    .string()
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Data de início não pode ser no passado'),

  endDate: z
    .string()
    .refine((date) => {
      return new Date(date) >= new Date();
    }, 'Data de término não pode ser no passado'),

  startTime: z.string().optional(),
  endTime: z.string().optional(),

  expectedAttendance: z.coerce
    .number()
    .min(1, 'Público esperado deve ser no mínimo 1')
    .max(1000000, 'Número muito alto')
    .optional(),

  // Profissionais Necessários
  professionalsNeeded: z
    .array(professionalNeedSchema)
    .min(1, 'Adicione pelo menos uma categoria de profissional'),

  // Equipamentos
  needsEquipment: z.boolean().default(false),

  equipmentList: z
    .array(z.enum(EQUIPMENT_OPTIONS))
    .optional(),

  equipmentOther: z
    .string()
    .max(500)
    .optional(),

  equipmentNotes: z
    .string()
    .max(1000)
    .optional(),

  // Orçamento e Urgência
  budgetRange: z
    .enum(BUDGET_RANGES)
    .optional(),

  urgency: z
    .enum(URGENCY_LEVELS)
    .default('normal'),

  additionalNotes: z
    .string()
    .max(2000, 'Observações muito longas')
    .optional(),

  // Termos
  acceptsTerms: z
    .boolean()
    .refine((val) => val === true, 'Você deve aceitar os termos de serviço'),

  acceptsWhatsApp: z.boolean().default(true),
}).refine((data) => {
  // Validação: data de término >= data de início
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: 'Data de término deve ser igual ou posterior à data de início',
  path: ['endDate'],
});

// Type inference
export type RequestFormData = z.infer<typeof requestSchema>;
export type ProfessionalNeed = z.infer<typeof professionalNeedSchema>;
