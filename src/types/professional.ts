/**
 * Professional Types
 *
 * Tipos TypeScript para profissionais
 * IMPORTANTE: Sempre use estes types em vez de 'any'
 */

// =====================================================
// Status Types
// =====================================================

export type ProfessionalStatus = 'pending' | 'approved' | 'rejected' | 'incomplete';

export type DocumentValidationStatus = 'pending' | 'approved' | 'rejected';

// =====================================================
// Category Types
// =====================================================

export type ProfessionalCategory =
  | 'Motorista'
  | 'Técnico de Iluminação'
  | 'Técnico de Som'
  | 'Técnico de Palco'
  | 'Operador de Empilhadeira'
  | 'Rigger'
  | 'Eletricista'
  | 'Segurança'
  | 'Produtor'
  | 'Assistente de Produção'
  | 'Runner'
  | 'Montador'
  | 'Técnico de Vídeo';

export const PROFESSIONAL_CATEGORIES: readonly ProfessionalCategory[] = [
  'Motorista',
  'Técnico de Iluminação',
  'Técnico de Som',
  'Técnico de Palco',
  'Operador de Empilhadeira',
  'Rigger',
  'Eletricista',
  'Segurança',
  'Produtor',
  'Assistente de Produção',
  'Runner',
  'Montador',
  'Técnico de Vídeo',
] as const;

// =====================================================
// Document Types
// =====================================================

export type DocumentType =
  | 'rg_front'
  | 'rg_back'
  | 'cpf'
  | 'proof_of_address'
  | 'cnh_photo'
  | 'cnh_back'
  | 'cnv_photo'
  | 'nr10_certificate'
  | 'nr35_certificate'
  | 'drt_photo'
  | 'profile_photo';

export interface DocumentValidation {
  status: DocumentValidationStatus;
  message?: string;
  rejectionReason?: string;
  validatedBy?: string;
  validatedAt?: string;
}

export type DocumentValidations = Partial<Record<DocumentType, DocumentValidation>>;

// =====================================================
// Availability Types
// =====================================================

export interface DayAvailability {
  available: boolean;
  periods?: ('morning' | 'afternoon' | 'night')[];
}

export interface Availability {
  monday?: DayAvailability;
  tuesday?: DayAvailability;
  wednesday?: DayAvailability;
  thursday?: DayAvailability;
  friday?: DayAvailability;
  saturday?: DayAvailability;
  sunday?: DayAvailability;
}

// =====================================================
// Professional Interface
// =====================================================

export interface Professional {
  // IDs
  id: string;
  userId: string;
  clerkId: string;

  // Dados Pessoais
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;

  // Endereço
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;

  // Geolocalização
  latitude?: number;
  longitude?: number;

  // Profissional
  categories: ProfessionalCategory[];
  hasExperience: boolean;
  yearsExperience?: number;

  // Documentos (URLs armazenadas em JSONB)
  documents: Partial<Record<DocumentType, string>>;
  portfolio?: string | null;

  // Validação de Documentos
  validationNotes?: DocumentValidations | null;

  // Campos de Validade de Documentos Especiais
  cnhNumber?: string | null;
  cnhValidity?: string | null;
  cnvValidity?: string | null;
  nr10Validity?: string | null;
  nr35Validity?: string | null;
  drtValidity?: string | null;

  // Disponibilidade
  availability?: Availability;

  // Status e Aprovação
  status: ProfessionalStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;

  // Preferências
  acceptsNotifications: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Partial Types (para Forms e Updates)
// =====================================================

export type ProfessionalCreateInput = Omit<
  Professional,
  'id' | 'userId' | 'status' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt' | 'createdAt' | 'updatedAt'
>;

export type ProfessionalUpdateInput = Partial<
  Omit<Professional, 'id' | 'userId' | 'clerkId' | 'createdAt'>
>;

// =====================================================
// Search and Filter Types
// =====================================================

export interface ProfessionalSearchFilters {
  query?: string;
  status?: ProfessionalStatus[];
  categories?: ProfessionalCategory[];
  hasExperience?: boolean;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface ProfessionalSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'distance' | 'createdAt' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

export interface ProfessionalSearchResult {
  professionals: Professional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// =====================================================
// Helper Types
// =====================================================

export interface ProfessionalWithDistance extends Professional {
  distance_km: number;
}

export interface ProfessionalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  incomplete: number;
}
