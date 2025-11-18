/**
 * Professional Data Mappers
 *
 * Helpers para converter dados entre camelCase (frontend) e snake_case (database)
 *
 * IMPORTANTE: Sempre use estes mappers ao:
 * - Buscar dados do banco → converter para camelCase com professionalFromDatabase()
 * - Salvar dados no banco → converter para snake_case com professionalToDatabase()
 */

// =====================================================
// Types
// =====================================================

/**
 * Professional data no formato do frontend (camelCase)
 */
export interface ProfessionalFrontend {
  id?: string;
  userId?: string;
  clerkId?: string;
  fullName: string;
  email?: string;
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

  // Localização geográfica
  latitude?: number;
  longitude?: number;

  // Profissional
  categories: string[];
  hasExperience: boolean;
  yearsExperience?: number;

  // Documentos principais (JSONB)
  documents?: Record<string, string>;
  portfolio?: string | null;

  // Campos de validade de documentos
  cnhNumber?: string | null;
  cnhValidity?: string | null;
  cnvValidity?: string | null;
  nr10Validity?: string | null;
  nr35Validity?: string | null;
  drtValidity?: string | null;

  // Disponibilidade (JSONB)
  availability?: { monday?: boolean; tuesday?: boolean; wednesday?: boolean; thursday?: boolean; friday?: boolean; saturday?: boolean; sunday?: boolean };

  // Status e metadados
  status?: 'pending' | 'approved' | 'rejected' | 'incomplete';
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  validationNotes?: Record<string, string> | null;
  acceptsNotifications?: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Professional data no formato do database (snake_case)
 */
export interface ProfessionalDatabase {
  id?: string;
  user_id?: string;
  clerk_id?: string;
  full_name: string;
  email?: string;
  phone: string;
  cpf: string;
  birth_date: string;

  // Endereço
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;

  // Localização geográfica
  latitude?: number;
  longitude?: number;

  // Profissional
  categories: string[];
  has_experience: boolean;
  years_experience?: number;

  // Documentos principais (JSONB)
  documents?: Record<string, string>;
  portfolio?: string | null;

  // Campos de validade de documentos
  cnh_number?: string | null;
  cnh_validity?: string | null;
  cnv_validity?: string | null;
  nr10_validity?: string | null;
  nr35_validity?: string | null;
  drt_validity?: string | null;

  // Disponibilidade (JSONB)
  availability?: { monday?: boolean; tuesday?: boolean; wednesday?: boolean; thursday?: boolean; friday?: boolean; saturday?: boolean; sunday?: boolean };

  // Status e metadados
  status?: 'pending' | 'approved' | 'rejected' | 'incomplete';
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  validation_notes?: Record<string, string> | null;
  accepts_notifications?: boolean;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// Database → Frontend (snake_case → camelCase)
// =====================================================

/**
 * Converte dados do banco (snake_case) para o frontend (camelCase)
 *
 * @param dbData - Dados do banco de dados
 * @returns Dados no formato do frontend
 */
export function professionalFromDatabase(
  dbData: ProfessionalDatabase
): ProfessionalFrontend {
  return {
    id: dbData.id,
    userId: dbData.user_id,
    clerkId: dbData.clerk_id,
    fullName: dbData.full_name,
    email: dbData.email,
    phone: dbData.phone,
    cpf: dbData.cpf,
    birthDate: dbData.birth_date,

    // Endereço
    street: dbData.street,
    number: dbData.number,
    complement: dbData.complement,
    neighborhood: dbData.neighborhood,
    city: dbData.city,
    state: dbData.state,
    cep: dbData.cep,

    // Localização geográfica
    latitude: dbData.latitude,
    longitude: dbData.longitude,

    // Profissional
    categories: dbData.categories,
    hasExperience: dbData.has_experience,
    yearsExperience: dbData.years_experience,

    // Documentos
    documents: dbData.documents,
    portfolio: dbData.portfolio,

    // Campos de validade
    cnhNumber: dbData.cnh_number,
    cnhValidity: dbData.cnh_validity,
    cnvValidity: dbData.cnv_validity,
    nr10Validity: dbData.nr10_validity,
    nr35Validity: dbData.nr35_validity,
    drtValidity: dbData.drt_validity,

    // Disponibilidade
    availability: dbData.availability,

    // Status e metadados
    status: dbData.status,
    approvedBy: dbData.approved_by,
    approvedAt: dbData.approved_at,
    rejectedBy: dbData.rejected_by,
    rejectedAt: dbData.rejected_at,
    rejectionReason: dbData.rejection_reason,
    validationNotes: dbData.validation_notes,
    acceptsNotifications: dbData.accepts_notifications,

    // Timestamps
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
  };
}

// =====================================================
// Frontend → Database (camelCase → snake_case)
// =====================================================

/**
 * Converte dados do frontend (camelCase) para o banco (snake_case)
 *
 * @param frontendData - Dados do frontend
 * @returns Dados no formato do banco de dados
 */
export function professionalToDatabase(
  frontendData: ProfessionalFrontend
): ProfessionalDatabase {
  return {
    id: frontendData.id,
    user_id: frontendData.userId,
    clerk_id: frontendData.clerkId,
    full_name: frontendData.fullName,
    email: frontendData.email,
    phone: frontendData.phone,
    cpf: frontendData.cpf,
    birth_date: frontendData.birthDate,

    // Endereço
    street: frontendData.street,
    number: frontendData.number,
    complement: frontendData.complement,
    neighborhood: frontendData.neighborhood,
    city: frontendData.city,
    state: frontendData.state,
    cep: frontendData.cep,

    // Localização geográfica
    latitude: frontendData.latitude,
    longitude: frontendData.longitude,

    // Profissional
    categories: frontendData.categories,
    has_experience: frontendData.hasExperience,
    years_experience: frontendData.yearsExperience,

    // Documentos
    documents: frontendData.documents,
    portfolio: frontendData.portfolio,

    // Campos de validade
    cnh_number: frontendData.cnhNumber,
    cnh_validity: frontendData.cnhValidity,
    cnv_validity: frontendData.cnvValidity,
    nr10_validity: frontendData.nr10Validity,
    nr35_validity: frontendData.nr35Validity,
    drt_validity: frontendData.drtValidity,

    // Disponibilidade
    availability: frontendData.availability,

    // Status e metadados
    status: frontendData.status,
    approved_by: frontendData.approvedBy,
    approved_at: frontendData.approvedAt,
    rejected_by: frontendData.rejectedBy,
    rejected_at: frontendData.rejectedAt,
    rejection_reason: frontendData.rejectionReason,
    validation_notes: frontendData.validationNotes,
    accepts_notifications: frontendData.acceptsNotifications,

    // Timestamps
    created_at: frontendData.createdAt,
    updated_at: frontendData.updatedAt,
  };
}

// =====================================================
// Helpers para Campos Específicos
// =====================================================

/**
 * Converte apenas campos de validade de documentos
 * Útil quando precisa converter apenas esses campos sem converter objeto inteiro
 */
export function mapValidityFieldsToDatabase(data: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  const validityFields = {
    cnhNumber: 'cnh_number',
    cnhValidity: 'cnh_validity',
    cnvValidity: 'cnv_validity',
    nr10Validity: 'nr10_validity',
    nr35Validity: 'nr35_validity',
    drtValidity: 'drt_validity',
  };

  Object.entries(data).forEach(([key, value]) => {
    if (key in validityFields) {
      mapped[validityFields[key as keyof typeof validityFields]] = value;
    } else {
      mapped[key] = value;
    }
  });

  return mapped;
}

/**
 * Converte apenas campos de validade de documentos (database → frontend)
 */
export function mapValidityFieldsFromDatabase(data: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  const validityFields = {
    cnh_number: 'cnhNumber',
    cnh_validity: 'cnhValidity',
    cnv_validity: 'cnvValidity',
    nr10_validity: 'nr10Validity',
    nr35_validity: 'nr35Validity',
    drt_validity: 'drtValidity',
  };

  Object.entries(data).forEach(([key, value]) => {
    if (key in validityFields) {
      mapped[validityFields[key as keyof typeof validityFields]] = value;
    } else {
      mapped[key] = value;
    }
  });

  return mapped;
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Valida se data de validade é futura
 */
export function isValidityDateValid(validityDate: string | null | undefined): boolean {
  if (!validityDate) return false;

  const validity = new Date(validityDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return validity >= today;
}

/**
 * Verifica quais documentos de validade estão vencidos
 */
export function getExpiredValidities(professional: ProfessionalFrontend): string[] {
  const expired: string[] = [];

  const validities = {
    'CNH': professional.cnhValidity,
    'CNV': professional.cnvValidity,
    'NR10': professional.nr10Validity,
    'NR35': professional.nr35Validity,
    'DRT': professional.drtValidity,
  };

  Object.entries(validities).forEach(([name, date]) => {
    if (date && !isValidityDateValid(date)) {
      expired.push(name);
    }
  });

  return expired;
}
