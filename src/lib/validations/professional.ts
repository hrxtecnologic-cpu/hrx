import { z } from 'zod';
import { getAllCategoryNames } from '@/lib/categories-subcategories';

// Validações customizadas
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const cepRegex = /^\d{5}-\d{3}$/;

// Categorias disponíveis (importadas do sistema completo)
export const CATEGORIES = getAllCategoryNames();

// Disponibilidade
export const availabilitySchema = z.object({
  weekdays: z.boolean().default(false),
  weekends: z.boolean().default(false),
  holidays: z.boolean().default(false),
  night: z.boolean().default(false),
  travel: z.boolean().default(false),
});

// Schema principal de cadastro profissional
export const professionalSchema = z.object({
  // Dados Pessoais
  fullName: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo'),

  cpf: z
    .string()
    .regex(cpfRegex, 'CPF inválido. Formato: 000.000.000-00'),

  birthDate: z
    .string()
    .refine((date) => {
      const age = new Date().getFullYear() - new Date(date).getFullYear();
      return age >= 18;
    }, 'Você deve ter no mínimo 18 anos'),

  email: z
    .string()
    .email('Email inválido'),

  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Formato: (00) 00000-0000'),

  // Endereço
  cep: z
    .string()
    .regex(cepRegex, 'CEP inválido. Formato: 00000-000'),

  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),

  // Experiência Profissional
  categories: z
    .array(z.string())
    .min(1, 'Selecione pelo menos uma categoria'),

  // Subcategorias (novo)
  subcategories: z.record(z.array(z.string())).optional(),

  // Certificações (novo)
  certifications: z.record(z.object({
    number: z.string().optional(),
    validity: z.string().optional(),
    category: z.string().optional(),
    document_url: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  })).optional(),

  hasExperience: z.boolean(),

  experienceDescription: z.string().min(10, 'Descreva sua experiência (mínimo 10 caracteres)').optional().or(z.literal('')),

  yearsOfExperience: z.enum(['<1', '1-3', '3-5', '5-10', '10+']).optional(),

  // Disponibilidade
  availability: availabilitySchema.refine(
    (data) => Object.values(data).some((v) => v === true),
    'Selecione pelo menos uma opção de disponibilidade'
  ),

  // Dados Bancários (opcional)
  bankName: z.string().optional(),
  accountType: z.enum(['Corrente', 'Poupança']).optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  pixKey: z.string().optional(),

  // Raio de Atuação
  serviceRadiusKm: z
    .number()
    .min(5, 'Raio mínimo é 5km')
    .max(500, 'Raio máximo é 500km')
    .optional()
    .default(50),

  // Termos
  acceptsTerms: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos de uso'),
  acceptsNotifications: z.boolean().optional().default(true),
});

export type ProfessionalFormData = z.infer<typeof professionalSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
